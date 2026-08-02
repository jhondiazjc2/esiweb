export type UserRole = "estudiante" | "facilitador" | "admin";

export type MaterialCategory =
  | "material_estudio"
  | "formato"
  | "documento_facilitador"
  | "video"
  | "recurso"
  /** @deprecated Categorías anteriores — se mantienen por compatibilidad con datos existentes */
  | "cronograma"
  | "paquete"
  | "lectura"
  | "guia";

export type RecursoTipo = "documento" | "youtube" | "enlace" | "otro";

export type GrupoMiembroRol = "facilitador" | "estudiante";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  /** @deprecated Usar persona_id + grupo_miembros */
  sede_id: string | null;
  /** @deprecated Usar persona_id + grupo_miembros */
  grupo_id: string | null;
  persona_id?: string | null;
  modulo_actual: number;
}

/** @deprecated Usar GrupoEsi — compatibilidad landing demo */
export interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  contacto: string | null;
  activa: boolean;
}

export interface Persona {
  id: string;
  /** Puede ser null si solo se registró el nombre (completar después) */
  identificacion: string | null;
  nombre_completo: string;
  iglesia_local: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  /** Rol en ESIWeb (admin | facilitador | estudiante) */
  app_role?: UserRole;
}

export interface GrupoEsi {
  id: string;
  nombre: string;
  ciudad: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  modulo_id: number | null;
  activo: boolean;
  notas: string | null;
  /** Agregados en listados */
  facilitadores_count?: number;
  estudiantes_count?: number;
  facilitadores?: Pick<Persona, "id" | "nombre_completo">[];
}

export interface GrupoMiembro {
  id: string;
  grupo_id: string;
  persona_id: string;
  rol: GrupoMiembroRol;
  fecha_ingreso: string | null;
  activo: boolean;
  persona?: Persona;
}

export interface Modulo {
  id: number;
  titulo: string;
  descripcion: string;
  semanas: number;
  activo?: boolean;
  orden?: number;
}

export interface ModuloCarpeta {
  id: string;
  modulo_id: number;
  nombre: string;
  orden: number;
  /** Quién puede ver la carpeta: estudiante | facilitador | admin */
  visible_para?: string[];
}

export interface Recurso {
  id: string;
  modulo_id: number;
  titulo: string;
  descripcion: string | null;
  tipo: RecursoTipo;
  categoria: MaterialCategory;
  carpeta_id: string | null;
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
  /** Ruta relativa dentro de Modulo I, p. ej. "Material de estudio/archivo.pdf" */
  archivo: string;
  semana: number | null;
  orden: number;
}
