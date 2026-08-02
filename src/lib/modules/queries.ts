import "server-only";
import {
  materialesModulo1,
  modulos as modulosEstaticos,
} from "@/lib/data/modulos";
import {
  carpetaNombreForCategoria,
  defaultCarpetasForModulo,
  DEFAULT_CARPETA_NOMBRES,
  FOLDER_EXTRA_PREFIX,
  FOLDER_LABEL_PREFIX,
  groupRecursosByCarpetas,
} from "@/lib/modules/defaults";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  MaterialCategory,
  Modulo,
  ModuloCarpeta,
  Recurso,
  RecursoTipo,
} from "@/lib/types";

export {
  categoryLabels,
  categoriaOptions,
  extractYoutubeId,
  groupRecursosBySeccion,
  seccionOrder,
  tipoLabels,
} from "@/lib/modules/constants";

export {
  DEFAULT_CARPETA_NOMBRES,
  groupRecursosByCarpetas,
} from "@/lib/modules/defaults";

function staticRecursoFromMaterial(m: (typeof materialesModulo1)[number]): Recurso {
  const archivoNombre = m.archivo.includes("/")
    ? m.archivo.slice(m.archivo.lastIndexOf("/") + 1)
    : m.archivo;
  const carpetaNombre = carpetaNombreForCategoria(m.categoria);
  const carpeta = defaultCarpetasForModulo(m.modulo_id).find(
    (c) => c.nombre === carpetaNombre,
  );

  return {
    id: m.id,
    modulo_id: m.modulo_id,
    titulo: m.titulo,
    descripcion: m.descripcion,
    tipo: "documento",
    categoria: m.categoria,
    carpeta_id: carpeta?.id ?? null,
    url: null,
    storage_path: `local:${m.archivo}`,
    archivo_nombre: archivoNombre,
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
    categoria: (row.categoria as MaterialCategory) ?? "recurso",
    carpeta_id: row.carpeta_id ? String(row.carpeta_id) : null,
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

function mapCarpeta(row: Record<string, unknown>): ModuloCarpeta {
  return {
    id: String(row.id),
    modulo_id: Number(row.modulo_id),
    nombre: String(row.nombre),
    orden: Number(row.orden ?? 0),
  };
}

export async function seedDefaultCarpetas(moduloId: number) {
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  const rows = DEFAULT_CARPETA_NOMBRES.map((nombre, index) => ({
    modulo_id: moduloId,
    nombre,
    orden: index + 1,
  }));

  await supabase.from("modulo_carpetas").upsert(rows, {
    onConflict: "modulo_id,nombre",
    ignoreDuplicates: true,
  });
}

async function getFolderMetaFromMateriales(moduloId: number) {
  const supabase = await createClient();
  const [labels, extras] = await Promise.all([
    supabase
      .from("materiales")
      .select("id, titulo, orden, storage_path")
      .eq("modulo_id", moduloId)
      .like("storage_path", `${FOLDER_LABEL_PREFIX}%`),
    supabase
      .from("materiales")
      .select("id, titulo, orden, storage_path")
      .eq("modulo_id", moduloId)
      .like("storage_path", `${FOLDER_EXTRA_PREFIX}%`),
  ]);

  return [...(labels.data ?? []), ...(extras.data ?? [])];
}

export async function getCarpetasByModulo(
  moduloId: number,
): Promise<ModuloCarpeta[]> {
  if (!isSupabaseConfigured()) {
    return defaultCarpetasForModulo(moduloId);
  }

  const supabase = await createClient();
  const meta = await getFolderMetaFromMateriales(moduloId);
  const labels = new Map(
    meta
      .filter((row) => row.storage_path?.startsWith(FOLDER_LABEL_PREFIX))
      .map((row) => [
        String(row.storage_path).slice(FOLDER_LABEL_PREFIX.length),
        { nombre: String(row.titulo), orden: Number(row.orden ?? 0) },
      ]),
  );

  // Promover carpetas virtuales a filas reales para poder vincular recursos
  const extrasMeta = meta.filter((row) =>
    row.storage_path?.startsWith(FOLDER_EXTRA_PREFIX),
  );
  for (const row of extrasMeta) {
    const nombre = String(row.titulo);
    const orden = Number(row.orden ?? 100);
    const { data: existing } = await supabase
      .from("modulo_carpetas")
      .select("id")
      .eq("modulo_id", moduloId)
      .eq("nombre", nombre)
      .maybeSingle();

    if (!existing?.id) {
      const { error: insertError } = await supabase
        .from("modulo_carpetas")
        .insert({ modulo_id: moduloId, nombre, orden });
      if (insertError) continue;
    }

    await supabase
      .from("materiales")
      .delete()
      .eq("modulo_id", moduloId)
      .eq("storage_path", String(row.storage_path));
  }

  const { data, error } = await supabase
    .from("modulo_carpetas")
    .select("*")
    .eq("modulo_id", moduloId)
    .order("orden", { ascending: true });

  let base: ModuloCarpeta[] = defaultCarpetasForModulo(moduloId);

  if (!error && data?.length) {
    base = data.map(mapCarpeta);
  } else if (!error && !data?.length) {
    await seedDefaultCarpetas(moduloId);
    const { data: seeded } = await supabase
      .from("modulo_carpetas")
      .select("*")
      .eq("modulo_id", moduloId)
      .order("orden", { ascending: true });
    if (seeded?.length) base = seeded.map(mapCarpeta);
  }

  const defaults = defaultCarpetasForModulo(moduloId);

  // Aplicar nombres visibles (solo UI; no cambian rutas físicas)
  base = base.map((carpeta) => {
    let label = labels.get(carpeta.id);
    if (!label) {
      const byOrden = defaults.find((d) => d.orden === carpeta.orden);
      if (byOrden) label = labels.get(byOrden.id);
    }
    if (!label) return carpeta;
    return {
      ...carpeta,
      nombre: label.nombre,
      orden: label.orden || carpeta.orden,
    };
  });

  // Si la promoción falló (tabla ausente), seguir mostrando extras virtuales
  const remainingExtras = await getFolderMetaFromMateriales(moduloId);
  const extras: ModuloCarpeta[] = remainingExtras
    .filter((row) => row.storage_path?.startsWith(FOLDER_EXTRA_PREFIX))
    .map((row) => ({
      id: String(row.storage_path),
      modulo_id: moduloId,
      nombre: String(row.titulo),
      orden: Number(row.orden ?? 100),
    }));

  return [...base, ...extras].sort((a, b) => a.orden - b.orden);
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

function mergeDbConCatalogoLocal(
  dbRecursos: Recurso[],
  deletedKeys: Set<string>,
): Recurso[] {
  const visibleDb = dbRecursos.filter(
    (r) => !r.storage_path?.startsWith("deleted:"),
  );
  const covered = new Set<string>();

  for (const material of materialesModulo1) {
    const archivoNombre = material.archivo.includes("/")
      ? material.archivo.slice(material.archivo.lastIndexOf("/") + 1)
      : material.archivo;
    const localPath = `local:${material.archivo}`;

    if (
      deletedKeys.has(`deleted:${material.id}`) ||
      deletedKeys.has(`deleted:${localPath}`)
    ) {
      covered.add(material.id);
      continue;
    }

    const match = visibleDb.find(
      (r) =>
        r.titulo === material.titulo ||
        r.storage_path === localPath ||
        r.archivo_nombre === archivoNombre,
    );
    if (match) covered.add(material.id);
  }

  const faltantes = materialesModulo1
    .filter((m) => !covered.has(m.id))
    .map(staticRecursoFromMaterial);

  return [...visibleDb, ...faltantes].sort((a, b) => a.orden - b.orden);
}

async function getDeletedCatalogKeys(moduloId: number): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiales")
    .select("storage_path")
    .eq("modulo_id", moduloId)
    .like("storage_path", "deleted:%");

  return new Set(
    (data ?? [])
      .map((row) => row.storage_path)
      .filter((path): path is string => Boolean(path)),
  );
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

  const raw = (data ?? []).map(mapRecurso);
  const deletedKeys = new Set(
    raw
      .map((r) => r.storage_path)
      .filter((path): path is string => Boolean(path?.startsWith("deleted:"))),
  );
  const fromDb = raw.filter(
    (r) =>
      !r.storage_path?.startsWith("deleted:") &&
      !r.storage_path?.startsWith(FOLDER_LABEL_PREFIX) &&
      !r.storage_path?.startsWith(FOLDER_EXTRA_PREFIX),
  );

  if (fallbackToStatic && moduloId === 1) {
    // Completar marcas de eliminación por si el filtro activo las ocultó
    const allDeleted = await getDeletedCatalogKeys(moduloId);
    for (const key of allDeleted) deletedKeys.add(key);
    return mergeDbConCatalogoLocal(fromDb, deletedKeys);
  }

  return fromDb;
}

export async function getRecursoById(id: string): Promise<Recurso | null> {
  if (!isSupabaseConfigured()) {
    const staticMatch = materialesModulo1.find((m) => m.id === id);
    return staticMatch ? staticRecursoFromMaterial(staticMatch) : null;
  }

  const supabase = await createClient();

  const staticMatch = materialesModulo1.find((m) => m.id === id);
  if (staticMatch) {
    const deletedKeys = await getDeletedCatalogKeys(staticMatch.modulo_id);
    if (
      deletedKeys.has(`deleted:${staticMatch.id}`) ||
      deletedKeys.has(`deleted:local:${staticMatch.archivo}`)
    ) {
      return null;
    }
    return staticRecursoFromMaterial(staticMatch);
  }

  const { data, error } = await supabase
    .from("materiales")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  if (String(data.storage_path ?? "").startsWith("deleted:")) return null;
  return mapRecurso(data);
}
