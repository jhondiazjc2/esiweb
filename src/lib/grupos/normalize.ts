/** Alinea con public.normalize_identificacion en Supabase */
export function normalizeIdentificacion(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function normalizeNombre(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Nombres con rol admin en ESIWeb (además de facilitar grupos). */
export const ADMIN_PERSONA_NAMES = [
  "sebastian moreno",
  "sebastián moreno",
  "jhon jairo diaz",
  "jhon jairo díaz",
];

export function isAdminPersonaName(nombre: string): boolean {
  return ADMIN_PERSONA_NAMES.includes(normalizeNombre(nombre));
}

/** Extrae nombre de facilitador del título o notas del grupo */
export function extractFacilitadorNombre(grupo: {
  nombre: string;
  notas?: string | null;
}): string | null {
  const fromNotas = grupo.notas?.match(
    /Facilitador(?:es)?:\s*([^|]+)/i,
  )?.[1]?.trim();
  if (fromNotas) return fromNotas.replace(/\s+/g, " ");

  // "Ciudad · Facilitador · Módulo N" o "... Módulo N.2"
  const parts = grupo.nombre.split("·").map((p) => p.trim());
  if (parts.length >= 3) {
    const middle = parts.slice(1, -1).join(" · ").trim();
    if (middle) return middle;
  }
  return null;
}
