import {
  categoryLabels as modulosCategoryLabels,
  seccionOrder,
} from "@/lib/data/modulos";
import type { MaterialCategory, Recurso, RecursoTipo } from "@/lib/types";

export const categoryLabels = modulosCategoryLabels;
export { seccionOrder };

export const tipoLabels: Record<RecursoTipo, string> = {
  documento: "Documento",
  youtube: "YouTube",
  enlace: "Enlace",
  otro: "Otro",
};

/** Categorías de carpeta (plantilla de todo módulo) + extras opcionales */
export const categoriaOptions: MaterialCategory[] = [
  "material_estudio",
  "formato",
  "documento_facilitador",
  "video",
  "recurso",
];

/** Solo las 3 secciones de carpeta estándar */
export const seccionCategoriaOptions: MaterialCategory[] = [...seccionOrder];

const LEGACY_SECCION: Partial<Record<MaterialCategory, MaterialCategory>> = {
  paquete: "material_estudio",
  lectura: "material_estudio",
  cronograma: "material_estudio",
  guia: "documento_facilitador",
};

export function seccionForCategoria(categoria: MaterialCategory): MaterialCategory {
  if (seccionOrder.includes(categoria)) return categoria;
  return LEGACY_SECCION[categoria] ?? "recurso";
}

/**
 * Agrupa recursos en las 3 secciones de carpeta estándar.
 * Por defecto siempre incluye Material de estudio / Formatos / Documentos facilitador
 * (aunque estén vacías), para que todo módulo use el mismo formato.
 */
export function groupRecursosBySeccion(
  recursos: Recurso[],
  options: { includeEmptySecciones?: boolean } = {},
) {
  const { includeEmptySecciones = true } = options;
  const groups = new Map<MaterialCategory, Recurso[]>();

  for (const key of seccionOrder) {
    groups.set(key, []);
  }
  groups.set("recurso", []);

  for (const recurso of recursos) {
    const seccion = seccionForCategoria(recurso.categoria);
    const bucket = groups.get(seccion) ?? groups.get("recurso")!;
    bucket.push(recurso);
  }

  return [...groups.entries()]
    .filter(([seccion, items]) => {
      if (items.length > 0) return true;
      if (!includeEmptySecciones) return false;
      return seccionOrder.includes(seccion);
    })
    .map(([seccion, items]) => ({
      seccion,
      titulo:
        seccion === "recurso"
          ? "Otros recursos"
          : categoryLabels[seccion],
      items,
    }));
}

export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}
