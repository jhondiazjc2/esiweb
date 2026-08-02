import type { GrupoEsi } from "@/lib/types";

/** Grupos de ejemplo hasta conectar / poblar Supabase. */
export const gruposDemo: GrupoEsi[] = [
  {
    id: "1",
    nombre: "ESI Bogotá Norte",
    ciudad: "Bogotá",
    fecha_inicio: "2026-02-01",
    fecha_fin: "2026-06-30",
    modulo_id: 1,
    activo: true,
    notas: null,
    facilitadores_count: 2,
    estudiantes_count: 18,
    facilitadores: [
      { id: "f1", nombre_completo: "Ana Ruiz" },
      { id: "f2", nombre_completo: "Carlos Méndez" },
    ],
  },
  {
    id: "2",
    nombre: "ESI Medellín",
    ciudad: "Medellín",
    fecha_inicio: "2026-02-01",
    fecha_fin: "2026-06-30",
    modulo_id: 1,
    activo: true,
    notas: null,
    facilitadores_count: 1,
    estudiantes_count: 12,
    facilitadores: [{ id: "f3", nombre_completo: "Laura Gómez" }],
  },
  {
    id: "3",
    nombre: "ESI Cali",
    ciudad: "Cali",
    fecha_inicio: "2026-03-01",
    fecha_fin: "2026-07-31",
    modulo_id: 2,
    activo: true,
    notas: null,
    facilitadores_count: 1,
    estudiantes_count: 15,
    facilitadores: [{ id: "f4", nombre_completo: "Diego Torres" }],
  },
];
