import { categoryLabels as modulosCategoryLabels } from "@/lib/data/modulos";
import type { MaterialCategory, RecursoTipo } from "@/lib/types";

export const categoryLabels = modulosCategoryLabels;

export const tipoLabels: Record<RecursoTipo, string> = {
  documento: "Documento",
  youtube: "YouTube",
  enlace: "Enlace",
  otro: "Otro",
};

export const categoriaOptions: MaterialCategory[] = [
  "cronograma",
  "paquete",
  "lectura",
  "guia",
  "video",
  "recurso",
];

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
