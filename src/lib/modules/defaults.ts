import type { MaterialCategory, ModuloCarpeta, Recurso } from "@/lib/types";

/** Carpetas sugeridas al crear un módulo */
export const DEFAULT_CARPETA_NOMBRES = [
  "Material de estudio",
  "Formatos",
  "Documentos facilitador",
] as const;

export const CATEGORIA_TO_CARPETA: Partial<Record<MaterialCategory, string>> = {
  material_estudio: "Material de estudio",
  formato: "Formatos",
  documento_facilitador: "Documentos facilitador",
  paquete: "Material de estudio",
  lectura: "Material de estudio",
  cronograma: "Material de estudio",
  guia: "Documentos facilitador",
};

export function defaultCarpetasForModulo(moduloId: number): ModuloCarpeta[] {
  return DEFAULT_CARPETA_NOMBRES.map((nombre, index) => ({
    id: `default-${moduloId}-${index + 1}`,
    modulo_id: moduloId,
    nombre,
    orden: index + 1,
    visible_para:
      nombre === "Documentos facilitador"
        ? ["facilitador", "admin"]
        : ["estudiante", "facilitador", "admin"],
  }));
}

export function carpetaNombreForCategoria(
  categoria: MaterialCategory,
): string | null {
  return CATEGORIA_TO_CARPETA[categoria] ?? null;
}

/** Prefijos en materiales para metadatos de carpetas (sin tabla extra) */
export const FOLDER_LABEL_PREFIX = "folder-label:";
export const FOLDER_EXTRA_PREFIX = "folder-extra:";
/** Vincula un recurso a una carpeta personalizada (solo interfaz/DB) */
export const FOLDER_BIND_PREFIX = "esi-folder:";
export const FOLDER_BIND_STORAGE_PREFIX = "bind:";

export function folderLabelKey(carpetaId: string) {
  return `${FOLDER_LABEL_PREFIX}${carpetaId}`;
}

export function folderBindUrl(carpetaId: string) {
  return `${FOLDER_BIND_PREFIX}${carpetaId}`;
}

export function parseFolderBind(recurso: {
  url?: string | null;
  storage_path?: string | null;
}): string | null {
  const url = recurso.url?.trim() ?? "";
  if (url.startsWith(FOLDER_BIND_PREFIX)) {
    return url.slice(FOLDER_BIND_PREFIX.length);
  }
  const path = recurso.storage_path ?? "";
  if (path.startsWith(FOLDER_BIND_STORAGE_PREFIX)) {
    return path.slice(FOLDER_BIND_STORAGE_PREFIX.length);
  }
  return null;
}

function canonicalCarpetaNombre(
  carpeta: ModuloCarpeta,
  defaults: ModuloCarpeta[],
) {
  return (
    defaults.find((d) => d.id === carpeta.id)?.nombre ??
    defaults.find((d) => d.orden === carpeta.orden)?.nombre ??
    carpeta.nombre
  );
}

/** True if bind/carpeta_id points at this section (UUID, default-* or same template). */
function matchesCarpetaRef(
  refId: string,
  carpeta: ModuloCarpeta,
  defaults: ModuloCarpeta[],
  canonicalNombre: string,
) {
  if (refId === carpeta.id) return true;

  const refDefault = defaults.find((d) => d.id === refId);
  if (refDefault) {
    return (
      refDefault.nombre === carpeta.nombre ||
      refDefault.nombre === canonicalNombre ||
      refDefault.orden === carpeta.orden
    );
  }

  return false;
}

export function groupRecursosByCarpetas(
  carpetas: ModuloCarpeta[],
  recursos: Recurso[],
  options: { includeEmpty?: boolean; includeOrphans?: boolean } = {},
) {
  const { includeEmpty = true, includeOrphans = false } = options;
  const assigned = new Set<string>();
  const defaults = defaultCarpetasForModulo(carpetas[0]?.modulo_id ?? 1);
  const knownIds = new Set(carpetas.map((c) => c.id));

  const sections = carpetas
    .map((carpeta) => {
      const canonicalNombre = canonicalCarpetaNombre(carpeta, defaults);
      const items = recursos.filter((r) => {
        if (assigned.has(r.id)) return false;

        const bindId = parseFolderBind(r);
        if (bindId) {
          if (matchesCarpetaRef(bindId, carpeta, defaults, canonicalNombre)) {
            assigned.add(r.id);
            return true;
          }
          // Vinculado a otra carpeta: no usar categoría (evita duplicados)
          return false;
        }

        if (r.carpeta_id) {
          if (
            matchesCarpetaRef(r.carpeta_id, carpeta, defaults, canonicalNombre)
          ) {
            assigned.add(r.id);
            return true;
          }
          // Apunta a otra carpeta conocida / default: no filtrar por categoría
          if (
            knownIds.has(r.carpeta_id) ||
            r.carpeta_id.startsWith("default-")
          ) {
            return false;
          }
        }

        // Solo recursos sin carpeta explícita: agrupar por categoría
        if (!r.carpeta_id) {
          const nombre = carpetaNombreForCategoria(r.categoria);
          if (nombre === carpeta.nombre || nombre === canonicalNombre) {
            assigned.add(r.id);
            return true;
          }
        }
        return false;
      });
      return { carpeta, items };
    })
    .filter((s) => includeEmpty || s.items.length > 0);

  if (includeOrphans) {
    const orphans = recursos.filter((r) => !assigned.has(r.id));
    if (orphans.length > 0) {
      sections.push({
        carpeta: {
          id: `orphan-${carpetas[0]?.modulo_id ?? 0}`,
          modulo_id: carpetas[0]?.modulo_id ?? 0,
          nombre: "Sin carpeta",
          orden: 999,
        },
        items: orphans,
      });
    }
  }

  return sections;
}
