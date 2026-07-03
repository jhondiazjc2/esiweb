import type { Sede } from "@/lib/types";

/** Sedes de ejemplo para la sección pública hasta conectar Supabase. */
export const sedesDemo: Sede[] = [
  {
    id: "1",
    nombre: "ESI Bogotá Norte",
    ciudad: "Bogotá",
    contacto: "facilitador.bogota@esi.co",
    activa: true,
  },
  {
    id: "2",
    nombre: "ESI Medellín",
    ciudad: "Medellín",
    contacto: "facilitador.medellin@esi.co",
    activa: true,
  },
  {
    id: "3",
    nombre: "ESI Cali",
    ciudad: "Cali",
    contacto: "facilitador.cali@esi.co",
    activa: true,
  },
];
