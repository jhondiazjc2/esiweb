import "server-only";
import {
  materialesModulo1,
  modulos as modulosEstaticos,
} from "@/lib/data/modulos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Modulo, Recurso, RecursoTipo } from "@/lib/types";

export { categoryLabels, categoriaOptions, extractYoutubeId, tipoLabels } from "@/lib/modules/constants";

function staticRecursoFromMaterial(m: (typeof materialesModulo1)[number]): Recurso {
  return {
    id: m.id,
    modulo_id: m.modulo_id,
    titulo: m.titulo,
    descripcion: m.descripcion,
    tipo: "documento",
    categoria: m.categoria,
    url: null,
    storage_path: `local:${m.archivo}`,
    archivo_nombre: m.archivo,
    semana: m.semana,
    orden: m.orden,
    activo: true,
  };
}

function mapRecurso(row: Record<string, unknown>): Recurso {
  return {
    id: String(row.id),
    modulo_id: Number(row.modulo_id),
    titulo: String(row.titulo),
    descripcion: row.descripcion ? String(row.descripcion) : null,
    tipo: row.tipo as RecursoTipo,
    categoria: row.categoria as MaterialCategory,
    url: row.url ? String(row.url) : null,
    storage_path: row.storage_path ? String(row.storage_path) : null,
    archivo_nombre: row.archivo_nombre ? String(row.archivo_nombre) : null,
    semana: row.semana != null ? Number(row.semana) : null,
    orden: Number(row.orden ?? 0),
    activo: row.activo !== false,
  };
}

function mapModulo(row: Record<string, unknown>): Modulo {
  return {
    id: Number(row.id),
    titulo: String(row.titulo),
    descripcion: String(row.descripcion),
    semanas: Number(row.semanas ?? 15),
    activo: row.activo !== false,
    orden: Number(row.orden ?? row.id),
  };
}

export async function getModulos(includeInactive = false): Promise<Modulo[]> {
  if (!isSupabaseConfigured()) {
    return modulosEstaticos;
  }

  const supabase = await createClient();
  let query = supabase.from("modulos").select("*").order("orden", { ascending: true });

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return modulosEstaticos;
  }

  return data.map(mapModulo);
}

export async function getModuloById(
  id: number,
  includeInactive = false,
): Promise<Modulo | null> {
  if (!isSupabaseConfigured()) {
    return modulosEstaticos.find((m) => m.id === id) ?? null;
  }

  const supabase = await createClient();
  let query = supabase.from("modulos").select("*").eq("id", id);

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return modulosEstaticos.find((m) => m.id === id) ?? null;
  }

  return mapModulo(data);
}

export async function getRecursosByModulo(
  moduloId: number,
  includeInactive = false,
  fallbackToStatic = true,
): Promise<Recurso[]> {
  if (!isSupabaseConfigured()) {
    if (fallbackToStatic && moduloId === 1) {
      return materialesModulo1.map(staticRecursoFromMaterial);
    }
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("materiales")
    .select("*")
    .eq("modulo_id", moduloId)
    .order("orden", { ascending: true });

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;

  if (error) {
    if (fallbackToStatic && moduloId === 1) {
      return materialesModulo1.map(staticRecursoFromMaterial);
    }
    return [];
  }

  if (!data?.length) {
    if (fallbackToStatic && moduloId === 1) {
      return materialesModulo1.map(staticRecursoFromMaterial);
    }
    return [];
  }

  return data.map(mapRecurso);
}

export async function getRecursoById(id: string): Promise<Recurso | null> {
  const staticMatch = materialesModulo1.find((m) => m.id === id);
  if (staticMatch) {
    return staticRecursoFromMaterial(staticMatch);
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materiales")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRecurso(data);
}
