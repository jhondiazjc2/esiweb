"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import type { ActionState } from "@/app/dashboard/admin/modulos/types";
import { materialesModulo1 } from "@/lib/data/modulos";
import {
  DEFAULT_CARPETA_NOMBRES,
  defaultCarpetasForModulo,
  FOLDER_BIND_PREFIX,
  FOLDER_BIND_STORAGE_PREFIX,
  FOLDER_EXTRA_PREFIX,
  folderBindUrl,
  folderLabelKey,
  groupRecursosByCarpetas,
} from "@/lib/modules/defaults";
import {
  getCarpetasByModulo,
  getRecursosByModulo,
} from "@/lib/modules/queries";
import { ensureModuloFolderStructure } from "@/lib/modules/structure";
import { createClient } from "@/lib/supabase/server";
import type { MaterialCategory, RecursoTipo } from "@/lib/types";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/** Categorías seguras si la DB aún no tiene la migración 003 */
function categoriaCompatible(categoria: MaterialCategory): MaterialCategory {
  switch (categoria) {
    case "material_estudio":
      return "lectura";
    case "formato":
    case "documento_facilitador":
      return "guia";
    default:
      return categoria;
  }
}

async function insertMaterialRow(
  row: Record<string, unknown>,
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  const first = await supabase.from("materiales").insert(row).select("id").single();
  if (!first.error && first.data?.id) {
    return { id: String(first.data.id) };
  }

  const msg = first.error?.message ?? "";

  // Reintentar sin carpeta_id si la columna aún no existe
  if (
    "carpeta_id" in row &&
    (msg.toLowerCase().includes("carpeta_id") ||
      msg.toLowerCase().includes("schema cache"))
  ) {
    const { carpeta_id: _omit, ...withoutCarpeta } = row;
    const retryCarpeta = await supabase
      .from("materiales")
      .insert(withoutCarpeta)
      .select("id")
      .single();
    if (!retryCarpeta.error && retryCarpeta.data?.id) {
      return { id: String(retryCarpeta.data.id) };
    }
  }

  // Reintentar con categoría legacy si falla el CHECK de categoria
  if (msg.includes("categoria") || msg.includes("check")) {
    const retry = await supabase
      .from("materiales")
      .insert({
        ...row,
        categoria: categoriaCompatible(row.categoria as MaterialCategory),
      })
      .select("id")
      .single();
    if (!retry.error && retry.data?.id) {
      return { id: String(retry.data.id) };
    }
    return { error: retry.error?.message ?? msg };
  }

  return { error: msg || "No se pudo insertar el material." };
}

/** Promueve un ítem del catálogo local a una fila real en Supabase */
async function ensureStaticRecursoEnDb(
  staticId: string,
  moduloId: number,
): Promise<{ id?: string; error?: string }> {
  const material = materialesModulo1.find((m) => m.id === staticId);
  if (!material || material.modulo_id !== moduloId) {
    return { error: "Recurso local no encontrado." };
  }

  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase
    .from("materiales")
    .select("id")
    .eq("modulo_id", moduloId)
    .eq("titulo", material.titulo)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError.message };
  }
  if (existing?.id) {
    return { id: String(existing.id) };
  }

  const archivoNombre = material.archivo.includes("/")
    ? material.archivo.slice(material.archivo.lastIndexOf("/") + 1)
    : material.archivo;

  return insertMaterialRow({
    modulo_id: moduloId,
    titulo: material.titulo,
    descripcion: material.descripcion,
    tipo: "documento",
    categoria: material.categoria,
    storage_path: `local:${material.archivo}`,
    archivo_nombre: archivoNombre,
    semana: material.semana,
    orden: material.orden,
    activo: true,
  });
}

async function seedDefaultCarpetas(moduloId: number) {
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

/** Crea o reutiliza una fila real en modulo_carpetas (necesaria para carpeta_id). */
async function ensureDbCarpeta(
  moduloId: number,
  nombre: string,
  orden: number,
): Promise<{ id: string; nombre: string } | { error: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("modulo_carpetas")
    .select("id, nombre")
    .eq("modulo_id", moduloId)
    .eq("nombre", nombre)
    .maybeSingle();

  if (existing?.id) {
    return { id: String(existing.id), nombre: String(existing.nombre) };
  }

  const { data: created, error } = await supabase
    .from("modulo_carpetas")
    .insert({ modulo_id: moduloId, nombre, orden })
    .select("id, nombre")
    .single();

  if (error || !created?.id) {
    return { error: error?.message ?? "No se pudo crear la carpeta en la base de datos." };
  }

  return { id: String(created.id), nombre: String(created.nombre) };
}

/**
 * Promueve carpetas virtuales (folder-extra:*) a filas reales y elimina el metadato.
 */
async function promoteFolderExtra(
  moduloId: number,
  carpetaId: string,
): Promise<{ id: string; nombre: string } | { error: string }> {
  const supabase = await createClient();
  const { data: meta } = await supabase
    .from("materiales")
    .select("titulo, orden")
    .eq("modulo_id", moduloId)
    .eq("storage_path", carpetaId)
    .maybeSingle();

  if (!meta?.titulo) {
    return { error: "No se encontró la carpeta personalizada." };
  }

  const ensured = await ensureDbCarpeta(
    moduloId,
    String(meta.titulo),
    Number(meta.orden ?? 100),
  );
  if ("error" in ensured) return ensured;

  await supabase
    .from("materiales")
    .delete()
    .eq("modulo_id", moduloId)
    .eq("storage_path", carpetaId);

  return ensured;
}

/**
 * Resuelve carpeta para guardar recursos.
 * `pathNombre` es el nombre de carpeta para Storage/disco.
 * Las carpetas personalizadas se materializan en modulo_carpetas para poder guardar carpeta_id.
 */
async function resolveCarpeta(
  moduloId: number,
  carpetaId: string | null,
): Promise<{
  dbCarpetaId: string | null;
  pathNombre: string | null;
  categoria: MaterialCategory;
}> {
  if (!carpetaId || carpetaId.startsWith("orphan-")) {
    return { dbCarpetaId: null, pathNombre: null, categoria: "recurso" };
  }

  const defaults = defaultCarpetasForModulo(moduloId);
  const supabase = await createClient();

  if (carpetaId.startsWith("default-")) {
    const fallback = defaults.find((c) => c.id === carpetaId);
    // Preferir la fila real sembrada en modulo_carpetas (mismo nombre)
    if (fallback?.nombre) {
      const { data: row } = await supabase
        .from("modulo_carpetas")
        .select("id, nombre")
        .eq("modulo_id", moduloId)
        .eq("nombre", fallback.nombre)
        .maybeSingle();
      if (row?.id) {
        return {
          dbCarpetaId: String(row.id),
          pathNombre: fallback.nombre,
          categoria: categoriaFromCarpetaNombre(fallback.nombre),
        };
      }
    }
    return {
      dbCarpetaId: null,
      pathNombre: fallback?.nombre ?? null,
      categoria: categoriaFromCarpetaNombre(fallback?.nombre),
    };
  }

  if (carpetaId.startsWith(FOLDER_EXTRA_PREFIX)) {
    const promoted = await promoteFolderExtra(moduloId, carpetaId);
    if ("error" in promoted) {
      return { dbCarpetaId: null, pathNombre: null, categoria: "recurso" };
    }
    return {
      dbCarpetaId: promoted.id,
      pathNombre: promoted.nombre,
      categoria: "recurso",
    };
  }

  if (isUuid(carpetaId)) {
    const { data: carpeta } = await supabase
      .from("modulo_carpetas")
      .select("id, nombre, orden")
      .eq("id", carpetaId)
      .maybeSingle();

    if (carpeta) {
      // Plantilla por orden/nombre; si es personalizada, usar su propio nombre
      const canonical =
        defaults.find((d) => d.orden === Number(carpeta.orden))?.nombre ??
        defaults.find((d) => d.nombre === carpeta.nombre)?.nombre ??
        null;
      const pathNombre = canonical ?? String(carpeta.nombre);
      return {
        dbCarpetaId: String(carpeta.id),
        pathNombre,
        categoria: categoriaFromCarpetaNombre(canonical),
      };
    }
  }

  return { dbCarpetaId: null, pathNombre: null, categoria: "recurso" };
}

const BUCKET = "materiales";

/** Supabase Storage no acepta espacios/acentos en las keys */
function sanitizeStorageSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "archivo";
}

function buildStoragePath(
  moduloId: number,
  carpetaNombre: string | null,
  filename: string,
) {
  const safeName = sanitizeStorageSegment(filename);
  const unique = `${crypto.randomUUID()}-${safeName}`;
  if (!carpetaNombre) return `${moduloId}/${unique}`;
  return `${moduloId}/${sanitizeStorageSegment(carpetaNombre)}/${unique}`;
}

function storageUploadErrorMessage(message: string) {
  if (message.toLowerCase().includes("invalid key")) {
    return "No se pudo subir el archivo por un nombre o ruta no válida. Intenta de nuevo.";
  }
  if (
    message.toLowerCase().includes("bucket") ||
    message.toLowerCase().includes("not found")
  ) {
    return `No se pudo subir el archivo. Crea el bucket "${BUCKET}" en Supabase Storage. ${message}`;
  }
  return `No se pudo subir el archivo. ${message}`;
}

function revalidateModulo(moduloId: number) {
  revalidatePath("/dashboard/modulos");
  revalidatePath(`/dashboard/modulos/${moduloId}`);
  revalidatePath("/dashboard/admin/modulos");
  revalidatePath(`/dashboard/admin/modulos/${moduloId}`);
}

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (!value || value.toString().trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function categoriaFromCarpetaNombre(nombre: string | null | undefined): MaterialCategory {
  if (!nombre) return "recurso";
  if (nombre === "Material de estudio") return "material_estudio";
  if (nombre === "Formatos") return "formato";
  if (nombre === "Documentos facilitador") return "documento_facilitador";
  return "recurso";
}

function isExternalHttpUrl(url: string | null | undefined) {
  if (!url) return false;
  if (url.startsWith(FOLDER_BIND_PREFIX)) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Vincula recurso a carpeta de interfaz sin depender solo de carpeta_id/categoría */
function withFolderBinding(
  carpetaId: string | null,
  url: string | null,
  storagePath: string | null,
): { url: string | null; storagePath: string | null } {
  if (!carpetaId || carpetaId.startsWith("orphan-")) {
    return { url, storagePath };
  }

  // YouTube/enlaces: la URL real va en `url`; el vínculo de carpeta en storage_path
  if (isExternalHttpUrl(url)) {
    if (
      !storagePath ||
      storagePath.startsWith(FOLDER_BIND_STORAGE_PREFIX)
    ) {
      return {
        url,
        storagePath: `${FOLDER_BIND_STORAGE_PREFIX}${carpetaId}`,
      };
    }
    return { url, storagePath };
  }

  // Documentos u otros sin URL http: vínculo en url (no pisa archivo en storage)
  if (
    carpetaId.startsWith(FOLDER_EXTRA_PREFIX) ||
    carpetaId.startsWith("default-")
  ) {
    return {
      url: folderBindUrl(carpetaId),
      storagePath,
    };
  }

  return { url, storagePath };
}

export async function createModulo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const titulo = formData.get("titulo")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim();
  const semanas = Number(formData.get("semanas") ?? 15);
  const activo = formData.get("activo") === "on";

  if (!titulo || !descripcion) {
    return { error: "Título y descripción son obligatorios." };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("modulos")
    .select("id, orden")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextId = (last?.id ?? 0) + 1;
  const nextOrden = (last?.orden ?? 0) + 1;

  const { error } = await supabase.from("modulos").insert({
    id: nextId,
    titulo,
    descripcion,
    semanas,
    activo,
    orden: nextOrden,
  });

  if (error) {
    return { error: error.message };
  }

  await seedDefaultCarpetas(nextId);

  try {
    await ensureModuloFolderStructure(nextId);
  } catch {
    // En entornos sin disco local la UI igual usa las 3 secciones.
  }

  revalidatePath("/dashboard/admin/modulos");
  revalidatePath("/dashboard/modulos");
  return {
    success:
      "Módulo creado con las secciones Material de estudio, Formatos y Documentos facilitador.",
  };
}

export async function updateModulo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const titulo = formData.get("titulo")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim();
  const semanas = Number(formData.get("semanas") ?? 15);
  const activo = formData.get("activo") === "on";
  const orden = Number(formData.get("orden") ?? id);

  if (!id || !titulo || !descripcion) {
    return { error: "Datos incompletos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("modulos")
    .update({
      titulo,
      descripcion,
      semanas,
      activo,
      orden,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateModulo(id);
  return { success: "Módulo actualizado." };
}

export async function deleteModulo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) return { error: "Módulo no válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("modulos").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/modulos");
  revalidatePath("/dashboard/modulos");
  return { success: "Módulo eliminado." };
}

async function saveFolderLabel(
  moduloId: number,
  carpetaId: string,
  nombre: string,
  orden: number,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const marker = folderLabelKey(carpetaId);
  const { data: existing } = await supabase
    .from("materiales")
    .select("id")
    .eq("modulo_id", moduloId)
    .eq("storage_path", marker)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("materiales")
      .update({
        titulo: nombre,
        orden,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return error ? { error: error.message } : {};
  }

  const inserted = await insertMaterialRow({
    modulo_id: moduloId,
    titulo: nombre,
    descripcion: "Etiqueta de carpeta (solo interfaz)",
    tipo: "otro",
    categoria: "guia",
    storage_path: marker,
    archivo_nombre: null,
    semana: null,
    orden,
    activo: true,
  });
  return inserted.error ? { error: inserted.error } : {};
}

export async function createCarpeta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const moduloId = Number(formData.get("modulo_id"));
  const nombre = formData.get("nombre")?.toString().trim();
  const orden = parseOptionalInt(formData.get("orden"));

  if (!moduloId || !nombre) {
    return { error: "Indica el nombre de la carpeta." };
  }

  const nextOrden = orden ?? 100 + Math.floor(Math.random() * 10);
  const ensured = await ensureDbCarpeta(moduloId, nombre, nextOrden);

  if (!("error" in ensured)) {
    revalidateModulo(moduloId);
    return { success: "Carpeta creada." };
  }

  // Fallback solo si la tabla dedicada no está disponible
  const tableMissing =
    ensured.error.toLowerCase().includes("modulo_carpetas") ||
    ensured.error.toLowerCase().includes("does not exist") ||
    ensured.error.toLowerCase().includes("schema cache");

  if (!tableMissing) {
    return { error: ensured.error };
  }

  const marker = `${FOLDER_EXTRA_PREFIX}${moduloId}:${crypto.randomUUID()}`;
  const inserted = await insertMaterialRow({
    modulo_id: moduloId,
    titulo: nombre,
    descripcion: "Carpeta personalizada (solo interfaz)",
    tipo: "otro",
    categoria: "guia",
    storage_path: marker,
    archivo_nombre: null,
    semana: null,
    orden: nextOrden,
    activo: true,
  });

  if (inserted.error) {
    return { error: inserted.error };
  }

  revalidateModulo(moduloId);
  return { success: "Carpeta creada." };
}

export async function updateCarpeta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const moduloId = Number(formData.get("modulo_id"));
  const nombre = formData.get("nombre")?.toString().trim();
  const orden = parseOptionalInt(formData.get("orden"));

  if (!id || !moduloId || !nombre) {
    return { error: "Datos incompletos." };
  }

  if (id.startsWith("orphan-")) {
    return { error: "Esta sección no se puede renombrar." };
  }

  const supabase = await createClient();

  // Carpetas extra guardadas como metadato
  if (id.startsWith(FOLDER_EXTRA_PREFIX)) {
    const { error } = await supabase
      .from("materiales")
      .update({
        titulo: nombre,
        orden: orden ?? 100,
        updated_at: new Date().toISOString(),
      })
      .eq("modulo_id", moduloId)
      .eq("storage_path", id);

    if (error) return { error: error.message };
    revalidateModulo(moduloId);
    return { success: "Nombre actualizado solo en la interfaz." };
  }

  // Carpetas plantilla / default: SOLO etiqueta visible (nunca renombra disco/Storage)
  if (id.startsWith("default-") || isUuid(id)) {
    const defaults = defaultCarpetasForModulo(moduloId);
    let labelId = id;
    let labelOrden = orden ?? 0;

    if (id.startsWith("default-")) {
      const fallback = defaults.find((c) => c.id === id);
      labelOrden = orden ?? fallback?.orden ?? 0;
    } else {
      const { data: row } = await supabase
        .from("modulo_carpetas")
        .select("orden")
        .eq("id", id)
        .maybeSingle();
      const byOrden = defaults.find(
        (d) => d.orden === Number(row?.orden ?? orden ?? 0),
      );
      labelId = byOrden?.id ?? `uuid-${id}`;
      labelOrden = orden ?? byOrden?.orden ?? Number(row?.orden ?? 0);
    }

    const saved = await saveFolderLabel(moduloId, labelId, nombre, labelOrden);
    if (saved.error) {
      return { error: saved.error };
    }

    revalidateModulo(moduloId);
    return { success: "Nombre actualizado solo en la interfaz." };
  }

  return { error: "Carpeta no válida." };
}

export async function deleteCarpeta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const moduloId = Number(formData.get("modulo_id"));

  if (!id || !moduloId) return { error: "Carpeta no válida." };

  if (id.startsWith("orphan-")) {
    return { error: "Esta sección no se puede eliminar." };
  }

  const supabase = await createClient();

  // Quitar etiqueta visible de carpetas plantilla (vuelve al nombre original)
  if (id.startsWith("default-")) {
    await supabase
      .from("materiales")
      .delete()
      .eq("modulo_id", moduloId)
      .eq("storage_path", folderLabelKey(id));
    revalidateModulo(moduloId);
    return { success: "Se restauró el nombre original de la carpeta." };
  }

  if (id.startsWith(FOLDER_EXTRA_PREFIX)) {
    const { error } = await supabase
      .from("materiales")
      .delete()
      .eq("modulo_id", moduloId)
      .eq("storage_path", id);
    if (error) return { error: error.message };
    revalidateModulo(moduloId);
    return { success: "Carpeta eliminada." };
  }

  if (isUuid(id)) {
    await supabase
      .from("materiales")
      .update({ carpeta_id: null })
      .eq("carpeta_id", id);

    const { error } = await supabase
      .from("modulo_carpetas")
      .delete()
      .eq("id", id)
      .eq("modulo_id", moduloId);

    if (error) {
      // Fallback: borrar etiqueta si existía
      await supabase
        .from("materiales")
        .delete()
        .eq("modulo_id", moduloId)
        .eq("storage_path", folderLabelKey(`uuid-${id}`));
    }

    revalidateModulo(moduloId);
    return { success: "Carpeta eliminada." };
  }

  return { error: "Carpeta no válida." };
}

export async function createRecurso(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const moduloId = Number(formData.get("modulo_id"));
  const titulo = formData.get("titulo")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim() || null;
  const tipo = formData.get("tipo")?.toString() as RecursoTipo;
  const carpetaId = formData.get("carpeta_id")?.toString() || null;
  const url = formData.get("url")?.toString().trim() || null;
  const semana = parseOptionalInt(formData.get("semana"));
  const orden = parseOptionalInt(formData.get("orden")) ?? 0;
  const activo = formData.get("activo") === "on";
  const file = formData.get("archivo");

  if (!moduloId || !titulo || !tipo) {
    return { error: "Completa los campos obligatorios." };
  }

  if ((tipo === "youtube" || tipo === "enlace") && !url) {
    return { error: "La URL es obligatoria para YouTube y enlaces." };
  }

  const supabase = await createClient();
  const resolved = await resolveCarpeta(moduloId, carpetaId);
  let storagePath: string | null = null;
  let archivoNombre: string | null = null;
  let finalUrl = url;

  if (tipo === "documento" && file instanceof File && file.size > 0) {
    archivoNombre = file.name;
    const pathFolder =
      carpetaId?.startsWith(FOLDER_EXTRA_PREFIX)
        ? "Personalizada"
        : resolved.pathNombre;
    storagePath = buildStoragePath(moduloId, pathFolder, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || undefined });

    if (uploadError) {
      return { error: storageUploadErrorMessage(uploadError.message) };
    }
  } else if (tipo === "documento" && isExternalHttpUrl(url)) {
    storagePath = null;
  } else if (tipo === "documento" && carpetaId?.startsWith(FOLDER_EXTRA_PREFIX)) {
    // Documento en carpeta personalizada sin archivo: solo vínculo de interfaz
    storagePath = null;
  } else if (tipo === "documento") {
    return { error: "Sube un archivo o indica una URL de documento." };
  }

  const bound = withFolderBinding(carpetaId, finalUrl, storagePath);
  finalUrl = bound.url;
  storagePath = bound.storagePath;

  const insertPayload: Record<string, unknown> = {
    modulo_id: moduloId,
    titulo,
    descripcion,
    tipo,
    categoria: resolved.categoria,
    url: finalUrl,
    storage_path: storagePath,
    archivo_nombre: archivoNombre,
    semana,
    orden,
    activo,
  };
  if (resolved.dbCarpetaId) {
    insertPayload.carpeta_id = resolved.dbCarpetaId;
  }

  const inserted = await insertMaterialRow(insertPayload);
  if (!inserted.id) {
    return { error: inserted.error ?? "No se pudo agregar el recurso." };
  }

  revalidateModulo(moduloId);
  return { success: "Recurso agregado." };
}

export async function updateRecurso(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const moduloId = Number(formData.get("modulo_id"));
  const titulo = formData.get("titulo")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim() || null;
  const tipo = formData.get("tipo")?.toString() as RecursoTipo;
  const carpetaId = formData.get("carpeta_id")?.toString() || null;
  const url = formData.get("url")?.toString().trim() || null;
  const semana = parseOptionalInt(formData.get("semana"));
  const orden = parseOptionalInt(formData.get("orden")) ?? 0;
  const activo = formData.get("activo") === "on";
  const file = formData.get("archivo");

  if (!id || !moduloId || !titulo || !tipo) {
    return { error: "Datos incompletos." };
  }

  const supabase = await createClient();

  let recursoId = id;
  if (!isUuid(id)) {
    const promoted = await ensureStaticRecursoEnDb(id, moduloId);
    if (!promoted.id) {
      return {
        error:
          promoted.error ??
          "No se pudo guardar este recurso en Supabase.",
      };
    }
    recursoId = promoted.id;
  }

  const { data: existing } = await supabase
    .from("materiales")
    .select("storage_path, archivo_nombre")
    .eq("id", recursoId)
    .maybeSingle();

  const staticOriginal = !isUuid(id)
    ? materialesModulo1.find((m) => m.id === id)
    : null;

  const resolved = await resolveCarpeta(moduloId, carpetaId);
  let storagePath =
    existing?.storage_path?.startsWith(FOLDER_BIND_STORAGE_PREFIX)
      ? null
      : (existing?.storage_path ??
        (staticOriginal ? `local:${staticOriginal.archivo}` : null));
  let archivoNombre =
    existing?.archivo_nombre ??
    (staticOriginal
      ? staticOriginal.archivo.includes("/")
        ? staticOriginal.archivo.slice(
            staticOriginal.archivo.lastIndexOf("/") + 1,
          )
        : staticOriginal.archivo
      : null);
  let finalUrl = isExternalHttpUrl(url) ? url : null;

  if (tipo === "documento" && file instanceof File && file.size > 0) {
    if (
      storagePath &&
      !storagePath.startsWith("local:") &&
      !storagePath.startsWith(FOLDER_BIND_STORAGE_PREFIX)
    ) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    archivoNombre = file.name;
    const pathFolder = carpetaId?.startsWith(FOLDER_EXTRA_PREFIX)
      ? "Personalizada"
      : resolved.pathNombre;
    storagePath = buildStoragePath(moduloId, pathFolder, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || undefined });

    if (uploadError) {
      return { error: storageUploadErrorMessage(uploadError.message) };
    }
  } else if (tipo !== "documento") {
    if (
      storagePath &&
      !storagePath.startsWith("local:") &&
      !storagePath.startsWith(FOLDER_BIND_STORAGE_PREFIX)
    ) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    storagePath = null;
    archivoNombre = null;
  }

  const bound = withFolderBinding(carpetaId, finalUrl, storagePath);
  finalUrl = bound.url;
  storagePath = bound.storagePath;

  const updatePayload: Record<string, unknown> = {
    titulo,
    descripcion,
    tipo,
    categoria: resolved.categoria,
    url: finalUrl,
    storage_path: storagePath,
    archivo_nombre: archivoNombre,
    semana,
    orden,
    activo,
    updated_at: new Date().toISOString(),
  };
  if (resolved.dbCarpetaId) {
    updatePayload.carpeta_id = resolved.dbCarpetaId;
  }

  let { error } = await supabase
    .from("materiales")
    .update(updatePayload)
    .eq("id", recursoId);

  // Si la categoría nueva no está permitida en la DB, reintentar con legacy
  if (error && (error.message.includes("categoria") || error.message.includes("check"))) {
    const retry = await supabase
      .from("materiales")
      .update({
        ...updatePayload,
        categoria: categoriaCompatible(resolved.categoria),
      })
      .eq("id", recursoId);
    error = retry.error;
  }

  if (error) {
    return { error: error.message };
  }

  revalidateModulo(moduloId);
  return { success: "Recurso actualizado." };
}

export async function deleteRecurso(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = formData.get("id")?.toString();
  const moduloId = Number(formData.get("modulo_id"));

  if (!id || !moduloId) return { error: "Recurso no válido." };

  const supabase = await createClient();
  const staticMaterial = !isUuid(id)
    ? materialesModulo1.find((m) => m.id === id)
    : null;

  let existingPath: string | null = null;
  let existingArchivo: string | null = null;
  let recursoId: string | null = isUuid(id) ? id : null;

  if (!isUuid(id) && staticMaterial) {
    const { data: byTitle } = await supabase
      .from("materiales")
      .select("id, storage_path, archivo_nombre")
      .eq("modulo_id", moduloId)
      .eq("titulo", staticMaterial.titulo)
      .maybeSingle();

    if (byTitle?.id) {
      recursoId = String(byTitle.id);
      existingPath = byTitle.storage_path ?? null;
      existingArchivo = byTitle.archivo_nombre ?? null;
    }
  } else if (isUuid(id)) {
    const { data: existing } = await supabase
      .from("materiales")
      .select("storage_path, archivo_nombre")
      .eq("id", id)
      .maybeSingle();
    existingPath = existing?.storage_path ?? null;
    existingArchivo = existing?.archivo_nombre ?? null;
  }

  const catalogItem =
    staticMaterial ??
    (existingPath?.startsWith("local:")
      ? materialesModulo1.find(
          (m) => m.archivo === existingPath.replace(/^local:/, ""),
        )
      : null) ??
    (existingArchivo
      ? materialesModulo1.find((m) => {
          const base = m.archivo.includes("/")
            ? m.archivo.slice(m.archivo.lastIndexOf("/") + 1)
            : m.archivo;
          return base === existingArchivo;
        })
      : null);

  if (
    existingPath &&
    !existingPath.startsWith("local:") &&
    !existingPath.startsWith("deleted:")
  ) {
    await supabase.storage.from(BUCKET).remove([existingPath]);
  }

  if (recursoId) {
    const { error, count } = await supabase
      .from("materiales")
      .delete({ count: "exact" })
      .eq("id", recursoId);
    if (error) {
      return { error: error.message };
    }
    if ((count ?? 0) === 0 && !catalogItem) {
      return {
        error:
          "No se pudo eliminar (sin permisos o el recurso ya no existe). ¿Tu usuario es admin en Supabase?",
      };
    }
  }

  // Marca de eliminación para que el catálogo local no lo vuelva a mostrar
  if (catalogItem) {
    const marker = `deleted:${catalogItem.id}`;
    const { data: already } = await supabase
      .from("materiales")
      .select("id")
      .eq("modulo_id", moduloId)
      .eq("storage_path", marker)
      .maybeSingle();

    if (!already) {
      // activo=true para que RLS permita leer la marca y no reaparezca el ítem local
      const markerInsert = await insertMaterialRow({
        modulo_id: moduloId,
        titulo: `[eliminado] ${catalogItem.titulo}`,
        descripcion: null,
        tipo: "documento",
        categoria: "guia",
        storage_path: marker,
        archivo_nombre: null,
        semana: null,
        orden: 0,
        activo: true,
      });
      if (markerInsert.error) {
        return { error: markerInsert.error };
      }
    }
  } else if (!recursoId) {
    return { error: "No se encontró el recurso para eliminar." };
  }

  revalidateModulo(moduloId);
  return { success: "Recurso eliminado." };
}

/** Elimina la sección automática "Sin carpeta" borrando sus documentos */
export async function clearSinCarpeta(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const moduloId = Number(formData.get("modulo_id"));
  if (!moduloId) return { error: "Módulo no válido." };

  const [carpetas, recursos] = await Promise.all([
    getCarpetasByModulo(moduloId),
    getRecursosByModulo(moduloId, true, true),
  ]);

  const orphans =
    groupRecursosByCarpetas(carpetas, recursos, {
      includeEmpty: false,
      includeOrphans: true,
    }).find((s) => s.carpeta.id.startsWith("orphan-"))?.items ?? [];

  if (orphans.length === 0) {
    return { success: "No hay documentos sin carpeta." };
  }

  for (const recurso of orphans) {
    const fd = new FormData();
    fd.set("id", recurso.id);
    fd.set("modulo_id", String(moduloId));
    const result = await deleteRecurso(null, fd);
    if (result?.error) {
      return {
        error: `No se pudo eliminar "${recurso.titulo}": ${result.error}`,
      };
    }
  }

  revalidateModulo(moduloId);
  return {
    success: `Se eliminaron ${orphans.length} documento(s). La sección "Sin carpeta" desaparecerá.`,
  };
}
