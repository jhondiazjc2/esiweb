import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ModuloCarpeta, Recurso, UserRole } from "@/lib/types";

export {
  ADMIN_PERSONA_NAMES,
  isAdminPersonaName,
} from "@/lib/grupos/normalize";

const ROLE_RANK: Record<UserRole, number> = {
  estudiante: 1,
  facilitador: 2,
  admin: 3,
};

export function higherRole(a: UserRole, b: UserRole): UserRole {
  return ROLE_RANK[a] >= ROLE_RANK[b] ? a : b;
}

export function canEditModuloContent(role: UserRole): boolean {
  return role === "admin";
}

export function canViewAllModulos(role: UserRole): boolean {
  return role === "admin" || role === "facilitador";
}

/** Audiencia de carpeta según rol efectivo */
export function canViewCarpetaForRole(
  visiblePara: string[] | null | undefined,
  role: UserRole,
): boolean {
  if (role === "admin") return true;
  const audience =
    visiblePara && visiblePara.length > 0
      ? visiblePara
      : ["estudiante", "facilitador", "admin"];
  if (role === "facilitador") {
    return audience.includes("facilitador") || audience.includes("admin");
  }
  return audience.includes("estudiante");
}

export function defaultVisibleParaForNombre(nombre: string): string[] {
  if (nombre === "Documentos facilitador") {
    return ["facilitador", "admin"];
  }
  return ["estudiante", "facilitador", "admin"];
}

export function filterCarpetasByRole(
  carpetas: ModuloCarpeta[],
  role: UserRole,
): ModuloCarpeta[] {
  return carpetas.filter((c) =>
    canViewCarpetaForRole(
      c.visible_para ?? defaultVisibleParaForNombre(c.nombre),
      role,
    ),
  );
}

export function filterRecursosByCarpetas(
  recursos: Recurso[],
  carpetasVisibles: ModuloCarpeta[],
  role: UserRole,
): Recurso[] {
  const ids = new Set(carpetasVisibles.map((c) => c.id));
  const nombres = new Set(carpetasVisibles.map((c) => c.nombre));

  return recursos.filter((r) => {
    if (r.carpeta_id && ids.has(r.carpeta_id)) return true;

    // Recursos sin carpeta_id: por categoría / nombre de sección
    if (!r.carpeta_id || r.carpeta_id.startsWith("default-")) {
      if (r.categoria === "documento_facilitador" || r.categoria === "guia") {
        return canViewCarpetaForRole(
          ["facilitador", "admin"],
          role,
        );
      }
      if (r.categoria === "formato") {
        return nombres.has("Formatos") || role === "admin";
      }
      return (
        nombres.has("Material de estudio") ||
        nombres.has("Formatos") ||
        role === "admin"
      );
    }
    return false;
  });
}

/** Módulos permitidos para un estudiante (desde grupos activos). */
export async function getModuloIdsForEstudiante(
  personaId: string | null | undefined,
  fallbackModulo: number,
): Promise<number[]> {
  if (!personaId || !isSupabaseConfigured()) {
    return [fallbackModulo];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("grupo_miembros")
    .select("grupo:grupos_esi(modulo_id, activo)")
    .eq("persona_id", personaId)
    .eq("rol", "estudiante")
    .eq("activo", true);

  const ids = new Set<number>();
  for (const row of data ?? []) {
    const g = row.grupo as { modulo_id?: number | null; activo?: boolean } | null;
    if (g?.activo === false) continue;
    if (g?.modulo_id != null) ids.add(Number(g.modulo_id));
  }

  if (ids.size === 0) return [fallbackModulo];
  return [...ids].sort((a, b) => a - b);
}

export function canAccessModulo(
  moduloId: number,
  role: UserRole,
  allowedModuloIds: number[] | "all",
): boolean {
  if (allowedModuloIds === "all") return true;
  return allowedModuloIds.includes(moduloId);
}
