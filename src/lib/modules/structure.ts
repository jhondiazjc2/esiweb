import "server-only";
import { mkdir } from "fs/promises";
import path from "path";
import { DEFAULT_CARPETA_NOMBRES } from "@/lib/modules/defaults";
import type { MaterialCategory } from "@/lib/types";
import { CATEGORIA_TO_CARPETA } from "@/lib/modules/defaults";

export function moduloFolderName(moduloId: number) {
  // El módulo 1 histórico vive en "Modulo I"
  if (moduloId === 1) return "Modulo I";
  return `Modulo ${moduloId}`;
}

export function seccionFolderName(categoria: MaterialCategory) {
  return CATEGORIA_TO_CARPETA[categoria] ?? null;
}

function materialRoot() {
  return (
    process.env.LOCAL_MATERIAL_ROOT ??
    path.join(/* turbopackIgnore: true */ process.cwd())
  );
}

/** Crea en disco: Modulo N/{Material de estudio,Formatos,Documentos facilitador} */
export async function ensureModuloFolderStructure(moduloId: number) {
  const moduloDir = path.join(materialRoot(), moduloFolderName(moduloId));

  for (const folder of DEFAULT_CARPETA_NOMBRES) {
    await mkdir(path.join(moduloDir, folder), { recursive: true });
  }

  return moduloDir;
}

export async function ensureCarpetaFolder(
  moduloId: number,
  carpetaNombre: string,
) {
  const dir = path.join(
    materialRoot(),
    moduloFolderName(moduloId),
    carpetaNombre,
  );
  await mkdir(dir, { recursive: true });
  return dir;
}
