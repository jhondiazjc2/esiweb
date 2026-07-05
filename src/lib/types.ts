export type UserRole = "estudiante" | "facilitador" | "admin";

export type MaterialCategory =
  | "cronograma"
  | "paquete"
  | "lectura"
  | "guia"
  | "video"
  | "recurso";

export type RecursoTipo = "documento" | "youtube" | "enlace" | "otro";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  sede_id: string | null;
  grupo_id: string | null;
  modulo_actual: number;
}

export interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  contacto: string | null;
  activa: boolean;
}

export interface Modulo {
  id: number;
  titulo: string;
  descripcion: string;
  semanas: number;
  activo?: boolean;
  orden?: number;
}

export interface Recurso {
  id: string;
  modulo_id: number;
  titulo: string;
  descripcion: string | null;
  tipo: RecursoTipo;
  categoria: MaterialCategory;
  url: string | null;
  storage_path: string | null;
  archivo_nombre: string | null;
  semana: number | null;
  orden: number;
  activo: boolean;
}

/** @deprecated Usar Recurso — compatibilidad con catálogo local */
export interface Material {
  id: string;
  modulo_id: number;
  titulo: string;
  descripcion: string | null;
  categoria: MaterialCategory;
  archivo: string;
  semana: number | null;
  orden: number;
}
