"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import type { ActionState } from "@/app/dashboard/admin/modulos/types";
import { createClient } from "@/lib/supabase/server";
import type { MaterialCategory, RecursoTipo } from "@/lib/types";

export type { ActionState };

const BUCKET = "materiales";

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

  revalidatePath("/dashboard/admin/modulos");
  return { success: "Módulo creado correctamente." };
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

export async function createRecurso(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const moduloId = Number(formData.get("modulo_id"));
  const titulo = formData.get("titulo")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim() || null;
  const tipo = formData.get("tipo")?.toString() as RecursoTipo;
  const categoria = formData.get("categoria")?.toString() as MaterialCategory;
  const url = formData.get("url")?.toString().trim() || null;
  const semana = parseOptionalInt(formData.get("semana"));
  const orden = parseOptionalInt(formData.get("orden")) ?? 0;
  const activo = formData.get("activo") === "on";
  const file = formData.get("archivo");

  if (!moduloId || !titulo || !tipo || !categoria) {
    return { error: "Completa los campos obligatorios." };
  }

  if ((tipo === "youtube" || tipo === "enlace") && !url) {
    return { error: "La URL es obligatoria para YouTube y enlaces." };
  }

  const supabase = await createClient();
  let storagePath: string | null = null;
  let archivoNombre: string | null = null;

  if (tipo === "documento" && file instanceof File && file.size > 0) {
    archivoNombre = file.name;
    storagePath = `${moduloId}/${crypto.randomUUID()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || undefined });

    if (uploadError) {
      return {
        error: `No se pudo subir el archivo. Crea el bucket "${BUCKET}" en Supabase Storage. ${uploadError.message}`,
      };
    }
  } else if (tipo === "documento" && url) {
    storagePath = null;
  } else if (tipo === "documento") {
    return { error: "Sube un archivo o indica una URL de documento." };
  }

  const { error } = await supabase.from("materiales").insert({
    modulo_id: moduloId,
    titulo,
    descripcion,
    tipo,
    categoria,
    url,
    storage_path: storagePath,
    archivo_nombre: archivoNombre,
    semana,
    orden,
    activo,
  });

  if (error) {
    return { error: error.message };
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
  const categoria = formData.get("categoria")?.toString() as MaterialCategory;
  const url = formData.get("url")?.toString().trim() || null;
  const semana = parseOptionalInt(formData.get("semana"));
  const orden = parseOptionalInt(formData.get("orden")) ?? 0;
  const activo = formData.get("activo") === "on";
  const file = formData.get("archivo");

  if (!id || !moduloId || !titulo || !tipo || !categoria) {
    return { error: "Datos incompletos." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("materiales")
    .select("storage_path, archivo_nombre")
    .eq("id", id)
    .single();

  let storagePath = existing?.storage_path ?? null;
  let archivoNombre = existing?.archivo_nombre ?? null;

  if (tipo === "documento" && file instanceof File && file.size > 0) {
    if (storagePath && !storagePath.startsWith("local:")) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    archivoNombre = file.name;
    storagePath = `${moduloId}/${crypto.randomUUID()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || undefined });

    if (uploadError) {
      return { error: uploadError.message };
    }
  } else if (tipo !== "documento") {
    if (storagePath && !storagePath.startsWith("local:")) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    storagePath = null;
    archivoNombre = null;
  }

  const { error } = await supabase
    .from("materiales")
    .update({
      titulo,
      descripcion,
      tipo,
      categoria,
      url,
      storage_path: storagePath,
      archivo_nombre: archivoNombre,
      semana,
      orden,
      activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

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

  if (!id) return { error: "Recurso no válido." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("materiales")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (
    existing?.storage_path &&
    !existing.storage_path.startsWith("local:")
  ) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  }

  const { error } = await supabase.from("materiales").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateModulo(moduloId);
  return { success: "Recurso eliminado." };
}
