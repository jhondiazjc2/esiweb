export type UserRole = "estudiante" | "facilitador" | "admin";

export type MaterialCategory =
  | "cronograma"
  | "paquete"
  | "lectura"
  | "guia";

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
}

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
