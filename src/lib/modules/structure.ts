import "server-only";
import { mkdir } from "fs/promises";
import path from "path";
import {
  categoryLabels,
  seccionOrder,
} from "@/lib/data/modulos";
import type { MaterialCategory } from "@/lib/types";

/** Subcarpetas estándar de cada módulo */
export const MODULO_SECCION_FOLDERS: Record<
  (typeof seccionOrder)[number],
  string
> = {
  material_estudio: "Material de estudio",
  formato: "Formatos",
  documento_facilitador: "Documentos facilitador",
};

export function moduloFolderName(moduloId: number) {
  // El módulo 1 histórico vive en "Modulo I"
  if (moduloId === 1) return "Modulo I";
  return `Modulo ${moduloId}`;
}

export function seccionFolderName(categoria: MaterialCategory) {
  if (categoria in MODULO_SECCION_FOLDERS) {
    return MODULO_SECCION_FOLDERS[
      categoria as keyof typeof MODULO_SECCION_FOLDERS
    ];
  }
  return null;
}

/** Crea en disco: Modulo N/{Material de estudio,Formatos,Documentos facilitador} */
export async function ensureModuloFolderStructure(moduloId: number) {
  const root =
    process.env.LOCAL_MATERIAL_ROOT ??
    path.join(/* turbopackIgnore: true */ process.cwd());
  const moduloDir = path.join(root, moduloFolderName(moduloId));

  for (const seccion of seccionOrder) {
    const folder = MODULO_SECCION_FOLDERS[seccion];
    await mkdir(path.join(moduloDir, folder), { recursive: true });
  }

  return moduloDir;
}

export function seccionLabels() {
  return seccionOrder.map((seccion) => ({
    seccion,
    folder: MODULO_SECCION_FOLDERS[seccion],
    titulo: categoryLabels[seccion],
  }));
}
