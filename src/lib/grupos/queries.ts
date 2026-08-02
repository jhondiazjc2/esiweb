import "server-only";
import { gruposDemo } from "@/lib/data/grupos-demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { GrupoEsi, GrupoMiembro, Persona } from "@/lib/types";

function mapPersona(row: Record<string, unknown>): Persona {
  return {
    id: String(row.id),
    identificacion: row.identificacion ? String(row.identificacion) : null,
    nombre_completo: String(row.nombre_completo),
    iglesia_local: row.iglesia_local ? String(row.iglesia_local) : null,
    email: row.email ? String(row.email) : null,
    telefono: row.telefono ? String(row.telefono) : null,
    activo: row.activo !== false,
    app_role: row.app_role
      ? (String(row.app_role) as Persona["app_role"])
      : undefined,
  };
}

function mapGrupo(row: Record<string, unknown>): GrupoEsi {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    ciudad: String(row.ciudad),
    fecha_inicio: row.fecha_inicio ? String(row.fecha_inicio) : null,
    fecha_fin: row.fecha_fin ? String(row.fecha_fin) : null,
    modulo_id: row.modulo_id != null ? Number(row.modulo_id) : null,
    activo: row.activo !== false,
    notas: row.notas ? String(row.notas) : null,
  };
}

export async function getGruposEsi(
  includeInactive = false,
): Promise<GrupoEsi[]> {
  if (!isSupabaseConfigured()) {
    return includeInactive
      ? gruposDemo
      : gruposDemo.filter((g) => g.activo);
  }

  const supabase = await createClient();
  let query = supabase
    .from("grupos_esi")
    .select("*")
    .order("ciudad", { ascending: true })
    .order("nombre", { ascending: true });

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    // Tabla aún no migrada o vacía → demo
    if (error) return gruposDemo;
    return [];
  }

  const grupos = data.map((row) => mapGrupo(row as Record<string, unknown>));

  const { data: miembros } = await supabase
    .from("grupo_miembros")
    .select("grupo_id, rol, activo, persona:personas(id, nombre_completo)")
    .in(
      "grupo_id",
      grupos.map((g) => g.id),
    )
    .eq("activo", true);

  type MiembroRow = {
    grupo_id: string;
    rol: string;
    activo: boolean;
    persona: { id: string; nombre_completo: string } | null;
  };

  const byGrupo = new Map<string, MiembroRow[]>();
  for (const row of (miembros ?? []) as unknown as MiembroRow[]) {
    const list = byGrupo.get(row.grupo_id) ?? [];
    list.push(row);
    byGrupo.set(row.grupo_id, list);
  }

  return grupos.map((grupo) => {
    const rows = byGrupo.get(grupo.id) ?? [];
    const facilitadores = rows
      .filter((m) => m.rol === "facilitador" && m.persona)
      .map((m) => ({
        id: m.persona!.id,
        nombre_completo: m.persona!.nombre_completo,
      }));
    return {
      ...grupo,
      facilitadores,
      facilitadores_count: facilitadores.length,
      estudiantes_count: rows.filter((m) => m.rol === "estudiante").length,
    };
  });
}

export async function getGrupoEsiById(id: string): Promise<GrupoEsi | null> {
  if (!isSupabaseConfigured()) {
    return gruposDemo.find((g) => g.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupos_esi")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return gruposDemo.find((g) => g.id === id) ?? null;
  }

  const grupo = mapGrupo(data as Record<string, unknown>);
  const miembros = await getMiembrosByGrupo(id, true);
  const activos = miembros.filter((m) => m.activo);
  const facilitadores = activos
    .filter((m) => m.rol === "facilitador" && m.persona)
    .map((m) => ({
      id: m.persona!.id,
      nombre_completo: m.persona!.nombre_completo,
    }));

  return {
    ...grupo,
    facilitadores,
    facilitadores_count: facilitadores.length,
    estudiantes_count: activos.filter((m) => m.rol === "estudiante").length,
  };
}

export async function getMiembrosByGrupo(
  grupoId: string,
  includeInactive = false,
): Promise<GrupoMiembro[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("grupo_miembros")
    .select(
      "*, persona:personas(id, identificacion, nombre_completo, iglesia_local, email, telefono, activo, app_role)",
    )
    .eq("grupo_id", grupoId)
    .order("rol", { ascending: true });

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const personaRaw = r.persona as Record<string, unknown> | null;
    return {
      id: String(r.id),
      grupo_id: String(r.grupo_id),
      persona_id: String(r.persona_id),
      rol: r.rol as GrupoMiembro["rol"],
      fecha_ingreso: r.fecha_ingreso ? String(r.fecha_ingreso) : null,
      activo: r.activo !== false,
      persona: personaRaw ? mapPersona(personaRaw) : undefined,
    };
  });
}
