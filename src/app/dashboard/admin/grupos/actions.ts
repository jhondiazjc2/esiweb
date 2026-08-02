"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import type { ActionState } from "@/app/dashboard/admin/grupos/types";
import {
  extractFacilitadorNombre,
  isAdminPersonaName,
  normalizeIdentificacion,
  normalizeNombre,
} from "@/lib/grupos/normalize";
import { createClient } from "@/lib/supabase/server";
import type { GrupoMiembroRol } from "@/lib/types";

function revalidateGrupos(grupoId?: string) {
  revalidatePath("/dashboard/admin/grupos");
  revalidatePath("/dashboard");
  if (grupoId) revalidatePath(`/dashboard/admin/grupos/${grupoId}`);
}

function parseDate(value: FormDataEntryValue | null): string | null {
  const raw = value?.toString().trim();
  if (!raw) return null;
  return raw;
}

function parseModuloId(value: FormDataEntryValue | null): number | null {
  const raw = value?.toString().trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const IGLESIA_PLACEHOLDER = "Mi iglesia Local";
const ID_FICTICIO_INICIO = 11_111_111;

async function listPersonasLite(): Promise<
  { id: string; identificacion: string | null; nombre_completo: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("personas")
    .select("id, identificacion, nombre_completo")
    .limit(2000);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    identificacion: row.identificacion ? String(row.identificacion) : null,
    nombre_completo: String(row.nombre_completo),
  }));
}

async function nextIdentificacionFicticia(
  existing: { identificacion: string | null }[],
): Promise<string> {
  let max = ID_FICTICIO_INICIO - 1;
  for (const row of existing) {
    const raw = row.identificacion?.trim() ?? "";
    if (!/^\d+$/.test(raw)) continue;
    const n = Number(raw);
    if (n >= ID_FICTICIO_INICIO && n > max) max = n;
  }
  return String(max + 1);
}

function findPersonaIdByIdentificacionIn(
  rows: { id: string; identificacion: string | null }[],
  identificacion: string,
): string | null {
  const target = normalizeIdentificacion(identificacion);
  if (!target) return null;
  const match = rows.find(
    (row) =>
      row.identificacion &&
      normalizeIdentificacion(row.identificacion) === target,
  );
  return match?.id ?? null;
}

function findPersonaIdByNombreIn(
  rows: { id: string; nombre_completo: string }[],
  nombre: string,
): string | null {
  const target = normalizeNombre(nombre);
  if (!target) return null;
  const match = rows.find(
    (row) => normalizeNombre(row.nombre_completo) === target,
  );
  return match?.id ?? null;
}

/**
 * Crea o reutiliza persona.
 * - Con identificación: busca por cédula.
 * - Sin identificación + assignFictitiousId: cédula 11111111… y reutiliza por nombre.
 * - Iglesia por defecto: "Mi iglesia Local"
 */
async function upsertPersona(input: {
  identificacion?: string | null;
  nombre_completo: string;
  iglesia_local?: string | null;
  email?: string | null;
  telefono?: string | null;
  assignFictitiousId?: boolean;
}): Promise<{ id?: string; error?: string; reused?: boolean }> {
  const nombre = input.nombre_completo.trim();
  if (!nombre) {
    return { error: "El nombre completo es obligatorio." };
  }

  const iglesia = input.iglesia_local?.trim() || IGLESIA_PLACEHOLDER;
  const email = input.email?.trim() || null;
  const telefono = input.telefono?.trim() || null;
  const idInput = input.identificacion
    ? normalizeIdentificacion(input.identificacion)
    : "";

  const supabase = await createClient();
  const existing = await listPersonasLite();

  let existingId = idInput
    ? findPersonaIdByIdentificacionIn(existing, idInput)
    : null;

  if (!existingId) {
    existingId = findPersonaIdByNombreIn(existing, nombre);
  }

  if (existingId) {
    const patch: Record<string, unknown> = {
      nombre_completo: nombre,
      iglesia_local: iglesia,
      updated_at: new Date().toISOString(),
    };
    if (idInput) patch.identificacion = idInput;
    if (email) patch.email = email;
    if (telefono) patch.telefono = telefono;

    const { error } = await supabase
      .from("personas")
      .update(patch)
      .eq("id", existingId);

    if (error) return { error: error.message };
    return { id: existingId, reused: true };
  }

  let identificacion = idInput;
  if (!identificacion && input.assignFictitiousId) {
    identificacion = await nextIdentificacionFicticia(existing);
  }
  if (!identificacion) {
    return { error: "La identificación es obligatoria." };
  }

  const { data, error } = await supabase
    .from("personas")
    .insert({
      identificacion,
      nombre_completo: nombre,
      iglesia_local: iglesia,
      email,
      telefono,
      activo: true,
      app_role: isAdminPersonaName(nombre) ? "admin" : "facilitador",
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return {
        error:
          "Ya existe una persona con esa identificación o email. Revisa los datos.",
      };
    }
    return { error: error.message };
  }

  return { id: String(data.id), reused: false };
}

async function ensureMiembro(
  grupoId: string,
  personaId: string,
  rol: GrupoMiembroRol,
): Promise<{ ok: boolean; created: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("grupo_miembros")
    .select("id, activo")
    .eq("grupo_id", grupoId)
    .eq("persona_id", personaId)
    .eq("rol", rol)
    .maybeSingle();

  if (existing?.id) {
    if (existing.activo) return { ok: true, created: false };
    const { error } = await supabase
      .from("grupo_miembros")
      .update({
        activo: true,
        fecha_ingreso: new Date().toISOString().slice(0, 10),
      })
      .eq("id", existing.id);
    if (error) return { ok: false, created: false, error: error.message };
    return { ok: true, created: true };
  }

  const { error } = await supabase.from("grupo_miembros").insert({
    grupo_id: grupoId,
    persona_id: personaId,
    rol,
    activo: true,
  });
  if (error) return { ok: false, created: false, error: error.message };
  return { ok: true, created: true };
}

export async function createGrupo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  const ciudad = formData.get("ciudad")?.toString().trim();
  const fechaInicio = parseDate(formData.get("fecha_inicio"));
  const fechaFin = parseDate(formData.get("fecha_fin"));
  const moduloId = parseModuloId(formData.get("modulo_id"));
  const notas = formData.get("notas")?.toString().trim() || null;
  const activo = formData.get("activo") === "on";

  if (!nombre || !ciudad) {
    return { error: "Nombre y ciudad son obligatorios." };
  }
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    return { error: "La fecha final no puede ser anterior a la de inicio." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupos_esi")
    .insert({
      nombre,
      ciudad,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      modulo_id: moduloId,
      notas,
      activo,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error:
        error.message.includes("grupos_esi") ||
        error.message.includes("schema cache")
          ? "Tabla grupos_esi no disponible. Ejecuta la migración 005."
          : error.message,
    };
  }

  revalidateGrupos(data?.id ? String(data.id) : undefined);
  return { success: "Grupo creado." };
}

export async function updateGrupo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const nombre = formData.get("nombre")?.toString().trim();
  const ciudad = formData.get("ciudad")?.toString().trim();
  const fechaInicio = parseDate(formData.get("fecha_inicio"));
  const fechaFin = parseDate(formData.get("fecha_fin"));
  const moduloId = parseModuloId(formData.get("modulo_id"));
  const notas = formData.get("notas")?.toString().trim() || null;
  const activo = formData.get("activo") === "on";

  if (!id || !nombre || !ciudad) {
    return { error: "Datos incompletos." };
  }
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    return { error: "La fecha final no puede ser anterior a la de inicio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("grupos_esi")
    .update({
      nombre,
      ciudad,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      modulo_id: moduloId,
      notas,
      activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateGrupos(id);
  return { success: "Grupo actualizado." };
}

export async function setGrupoActivo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const activo = formData.get("activo") === "true";
  if (!id) return { error: "Grupo no válido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("grupos_esi")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateGrupos(id);
  return {
    success: activo ? "Grupo activado." : "Grupo inactivado.",
  };
}

export async function addMiembroGrupo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const grupoId = formData.get("grupo_id")?.toString();
  const rol = formData.get("rol")?.toString() as GrupoMiembroRol;
  const identificacion = formData.get("identificacion")?.toString() ?? "";
  const nombre = formData.get("nombre_completo")?.toString() ?? "";
  const iglesia =
    formData.get("iglesia_local")?.toString() || IGLESIA_PLACEHOLDER;
  const email = formData.get("email")?.toString() || null;
  const telefono = formData.get("telefono")?.toString() || null;

  if (!grupoId || (rol !== "facilitador" && rol !== "estudiante")) {
    return { error: "Grupo o rol no válido." };
  }

  const persona = await upsertPersona({
    identificacion: identificacion || null,
    nombre_completo: nombre,
    iglesia_local: iglesia,
    email,
    telefono,
    assignFictitiousId: !identificacion.trim(),
  });
  if (!persona.id) {
    return { error: persona.error ?? "No se pudo guardar la persona." };
  }

  const link = await ensureMiembro(grupoId, persona.id, rol);
  if (!link.ok) return { error: link.error ?? "No se pudo vincular al grupo." };
  if (!link.created && persona.reused) {
    return { error: `Esta persona ya es ${rol} en este grupo.` };
  }

  revalidateGrupos(grupoId);
  return {
    success: persona.reused
      ? `Persona reutilizada y agregada como ${rol}.`
      : `Agregado como ${rol}.`,
  };
}

/** Actualiza datos de una persona (cédula real, iglesia, etc. más adelante) */
export async function updatePersona(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const nombre = formData.get("nombre_completo")?.toString()?.trim();
  const identificacionRaw = formData.get("identificacion")?.toString() ?? "";
  const iglesia =
    formData.get("iglesia_local")?.toString()?.trim() || IGLESIA_PLACEHOLDER;
  const email = formData.get("email")?.toString()?.trim() || null;
  const telefono = formData.get("telefono")?.toString()?.trim() || null;
  const grupoId = formData.get("grupo_id")?.toString();

  if (!id || !nombre) return { error: "Datos incompletos." };

  const identificacion = identificacionRaw.trim()
    ? normalizeIdentificacion(identificacionRaw)
    : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("personas")
    .update({
      nombre_completo: nombre,
      identificacion,
      iglesia_local: iglesia,
      email,
      telefono,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { error: "Esa identificación o email ya está en uso." };
    }
    return { error: error.message };
  }

  revalidateGrupos(grupoId);
  return { success: "Datos de la persona actualizados." };
}

/**
 * Crea facilitadores desde los nombres de cada grupo (en lote).
 * Cédula ficticia 11111111… e iglesia "Mi iglesia Local".
 */
export async function syncFacilitadoresDesdeGrupos(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { getSessionProfile } = await import("@/lib/auth");
    const profile = await getSessionProfile();
    if (profile.role !== "admin" || profile.id === "demo") {
      return { error: "Solo administradores pueden ejecutar esta acción." };
    }

    const supabase = await createClient();

    const [gruposRes, personasRes, miembrosRes] = await Promise.all([
      supabase
        .from("grupos_esi")
        .select("id, nombre, notas")
        .eq("activo", true),
      supabase
        .from("personas")
        .select("id, identificacion, nombre_completo")
        .limit(2000),
      supabase
        .from("grupo_miembros")
        .select("id, grupo_id, persona_id, activo")
        .eq("rol", "facilitador"),
    ]);

    if (gruposRes.error) {
      return {
        error:
          gruposRes.error.message.includes("schema cache") ||
          gruposRes.error.message.includes("grupos_esi")
            ? "No se pudo leer grupos_esi. ¿Corriste la migración 005?"
            : gruposRes.error.message,
      };
    }
    if (personasRes.error) {
      return {
        error:
          personasRes.error.message.includes("personas") ||
          personasRes.error.message.includes("schema cache")
            ? "No se pudo leer personas. ¿Corriste las migraciones 005 y 008?"
            : personasRes.error.message,
      };
    }
    if (miembrosRes.error) {
      return { error: miembrosRes.error.message };
    }

    const grupos = gruposRes.data ?? [];
    if (!grupos.length) return { error: "No hay grupos activos." };

    type PersonaLite = {
      id: string;
      identificacion: string | null;
      nombre_completo: string;
    };

    const personas: PersonaLite[] = (personasRes.data ?? []).map((row) => ({
      id: String(row.id),
      identificacion: row.identificacion ? String(row.identificacion) : null,
      nombre_completo: String(row.nombre_completo),
    }));

    const byNombre = new Map<string, string>();
    for (const p of personas) {
      byNombre.set(normalizeNombre(p.nombre_completo), p.id);
    }

    let nextId = ID_FICTICIO_INICIO;
    for (const p of personas) {
      const raw = p.identificacion?.trim() ?? "";
      if (!/^\d+$/.test(raw)) continue;
      const n = Number(raw);
      if (n >= ID_FICTICIO_INICIO && n >= nextId) nextId = n + 1;
    }

    const memberKey = (grupoId: string, personaId: string) =>
      `${grupoId}|${personaId}`;
    const existingMembers = new Set(
      (miembrosRes.data ?? [])
        .filter((m) => m.activo !== false)
        .map((m) => memberKey(String(m.grupo_id), String(m.persona_id))),
    );

    const personasToInsert: {
      identificacion: string;
      nombre_completo: string;
      iglesia_local: string;
      activo: boolean;
      app_role: "admin" | "facilitador";
    }[] = [];
    const pendingNombreToIdent: Map<string, string> = new Map();

    // Primero resolver nombres únicos a crear
    for (const grupo of grupos) {
      const facNombre = extractFacilitadorNombre({
        nombre: String(grupo.nombre),
        notas: grupo.notas ? String(grupo.notas) : null,
      });
      if (!facNombre) continue;
      const key = normalizeNombre(facNombre);
      if (byNombre.has(key) || pendingNombreToIdent.has(key)) continue;

      const identificacion = String(nextId++);
      pendingNombreToIdent.set(key, identificacion);
      personasToInsert.push({
        identificacion,
        nombre_completo: facNombre,
        iglesia_local: IGLESIA_PLACEHOLDER,
        activo: true,
        app_role: isAdminPersonaName(facNombre) ? "admin" : "facilitador",
      });
    }

    let creados = 0;
    if (personasToInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("personas")
        .insert(personasToInsert)
        .select("id, identificacion, nombre_completo");

      if (insertErr) {
        return {
          error: `Error al crear personas: ${insertErr.message}. ¿Ejecutaste 008_personas_identificacion_opcional.sql?`,
        };
      }

      for (const row of inserted ?? []) {
        byNombre.set(
          normalizeNombre(String(row.nombre_completo)),
          String(row.id),
        );
        creados += 1;
      }
    }

    // Asegurar roles: facilitadores + admins nombrados (aunque ya existieran)
    const personaIds = [...byNombre.values()];
    if (personaIds.length > 0) {
      await supabase
        .from("personas")
        .update({ app_role: "facilitador" })
        .in("id", personaIds);

      const adminIds = [...byNombre.entries()]
        .filter(([nombreNorm]) => isAdminPersonaName(nombreNorm))
        .map(([, id]) => id);
      if (adminIds.length > 0) {
        await supabase
          .from("personas")
          .update({ app_role: "admin" })
          .in("id", adminIds);
      }
    }

    const miembrosToInsert: {
      grupo_id: string;
      persona_id: string;
      rol: "facilitador";
      activo: boolean;
    }[] = [];
    const fallos: string[] = [];

    for (const grupo of grupos) {
      const facNombre = extractFacilitadorNombre({
        nombre: String(grupo.nombre),
        notas: grupo.notas ? String(grupo.notas) : null,
      });
      if (!facNombre) {
        fallos.push(`${grupo.nombre}: sin nombre de facilitador`);
        continue;
      }

      const personaId = byNombre.get(normalizeNombre(facNombre));
      if (!personaId) {
        fallos.push(`${facNombre}: no se pudo resolver persona`);
        continue;
      }

      const key = memberKey(String(grupo.id), personaId);
      if (existingMembers.has(key)) continue;

      miembrosToInsert.push({
        grupo_id: String(grupo.id),
        persona_id: personaId,
        rol: "facilitador",
        activo: true,
      });
      existingMembers.add(key);
    }

    let vinculados = 0;
    if (miembrosToInsert.length > 0) {
      const { error: memErr } = await supabase
        .from("grupo_miembros")
        .insert(miembrosToInsert);

      if (memErr) {
        return { error: `Error al vincular facilitadores: ${memErr.message}` };
      }
      vinculados = miembrosToInsert.length;
    }

    revalidateGrupos();
    return {
      success: `Listo: ${creados} personas nuevas, ${vinculados} vínculos a grupos (${grupos.length} grupos). Iglesia: "${IGLESIA_PLACEHOLDER}".${
        fallos.length ? ` Avisos: ${fallos.slice(0, 3).join(" · ")}` : ""
      }`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return { error: msg };
  }
}

export async function removeMiembroGrupo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const grupoId = formData.get("grupo_id")?.toString();
  if (!id) return { error: "Miembro no válido." };

  const supabase = await createClient();
  // Soft-delete: conserva historial
  const { error } = await supabase
    .from("grupo_miembros")
    .update({ activo: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateGrupos(grupoId);
  return { success: "Miembro retirado del grupo." };
}

/** Parsea línea CSV simple con comillas opcionales */
function parseImportLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === "," || ch === ";" || ch === "|")) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

/**
 * Importa varios grupos.
 * Una línea por grupo: nombre,ciudad,modulo_id,fecha_inicio,fecha_fin[,notas]
 * Separador: coma, punto y coma o |. Fechas YYYY-MM-DD (opcionales).
 */
export async function importGrupos(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const raw = formData.get("lista")?.toString() ?? "";
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (lines.length === 0) {
    return { error: "Pega al menos una línea con datos del grupo." };
  }

  const supabase = await createClient();
  let created = 0;
  const errors: string[] = [];

  for (const [index, line] of lines.entries()) {
    // Soporta CSV con comillas: "nombre, con coma",ciudad,...
    const parts = parseImportLine(line);
    const [nombre, ciudad, moduloRaw, fechaInicio, fechaFin, notas] = parts;
    if (!nombre || !ciudad) {
      errors.push(`Línea ${index + 1}: faltan nombre o ciudad.`);
      continue;
    }
    const moduloId =
      moduloRaw && Number.isFinite(Number(moduloRaw))
        ? Number(moduloRaw)
        : null;

    const { error } = await supabase.from("grupos_esi").insert({
      nombre,
      ciudad,
      modulo_id: moduloId,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      notas: notas || null,
      activo: true,
    });

    if (error) {
      errors.push(`Línea ${index + 1}: ${error.message}`);
    } else {
      created += 1;
    }
  }

  revalidateGrupos();
  if (created === 0) {
    return {
      error: errors[0] ?? "No se pudo importar ningún grupo.",
    };
  }
  return {
    success: `Se importaron ${created} grupo(s).${
      errors.length ? ` Avisos: ${errors.slice(0, 3).join(" · ")}` : ""
    }`,
  };
}
