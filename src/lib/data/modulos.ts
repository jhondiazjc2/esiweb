import type { Material, MaterialCategory, Modulo } from "@/lib/types";

export const modulos: Modulo[] = [
  {
    id: 1,
    titulo: "Fundamentos para estudiar la Biblia",
    descripcion:
      "Incluye un estudio profundo de Romanos capítulos 1-4. Base del proceso ESI de discipulado mutuo.",
    semanas: 15,
  },
  {
    id: 2,
    titulo: "Fundamentos para entender el evangelio",
    descripcion: "Estudio profundo de Romanos capítulos 5-8.",
    semanas: 15,
  },
  {
    id: 3,
    titulo: "Fundamentos para la vida santa",
    descripcion: "Estudio profundo de Romanos capítulos 9-11.",
    semanas: 15,
  },
  {
    id: 4,
    titulo: "Fundamentos para la predicación bíblica",
    descripcion: "Enfoque en proclamar la Palabra con el evangelio al centro.",
    semanas: 15,
  },
  {
    id: 5,
    titulo: "Fundamentos para el liderazgo y consejería bíblica",
    descripcion: "Estudio profundo de II Timoteo 1-4.",
    semanas: 15,
  },
  {
    id: 6,
    titulo: "Fundamentos para impactar el mundo bíblicamente",
    descripcion: "Estudio profundo de Efesios 1-6.",
    semanas: 15,
  },
];

/** Plantilla de secciones/carpetas para todo módulo */
export const seccionOrder: MaterialCategory[] = [
  "material_estudio",
  "formato",
  "documento_facilitador",
];

export const materialesModulo1: Material[] = [
  {
    id: "m1-intro-romanos",
    modulo_id: 1,
    titulo: "Introducción a Romanos",
    descripcion: "Material principal del módulo: estudio de Romanos 1-4.",
    categoria: "material_estudio",
    archivo: "Material de estudio/Introducción a ROMANOS ESI.pdf",
    semana: null,
    orden: 1,
  },
  {
    id: "m1-interpretar",
    modulo_id: 1,
    titulo: "Cómo interpretar la Biblia fielmente",
    descripcion: "Principios de hermenéutica bíblica.",
    categoria: "material_estudio",
    archivo: "Material de estudio/Cómo inerpretar la Biblia fielmente.pdf",
    semana: null,
    orden: 2,
  },
  {
    id: "m1-jesus-evangelio",
    modulo_id: 1,
    titulo: "Jesús y su Evangelio",
    descripcion: "Lectura sobre el evangelio de Cristo.",
    categoria: "material_estudio",
    archivo: "Material de estudio/Jesús y su Evangelio - ESI.pdf",
    semana: null,
    orden: 3,
  },
  {
    id: "m1-lujuria",
    modulo_id: 1,
    titulo: "Combatiendo la lujuria con la fe",
    descripcion: "Lectura sobre santidad y lucha contra el pecado.",
    categoria: "material_estudio",
    archivo: "Material de estudio/Combatiéndo la lujuria con la fe.pdf",
    semana: null,
    orden: 4,
  },
  {
    id: "m1-somos-carta",
    modulo_id: 1,
    titulo: "Somos carta",
    descripcion: "Reflexión sobre la vida cristiana testimonial.",
    categoria: "material_estudio",
    archivo: "Material de estudio/Somos carta.pdf",
    semana: null,
    orden: 5,
  },
  {
    id: "m1-hendricks",
    modulo_id: 1,
    titulo: "Enseñando para cambiar vidas",
    descripcion: "Lectura de Howard Hendricks sobre enseñanza transformadora.",
    categoria: "material_estudio",
    archivo: "Material de estudio/Enseñando para cambiar vidas - Howard Hendricks.pdf",
    semana: null,
    orden: 6,
  },
  {
    id: "m1-patron",
    modulo_id: 1,
    titulo: "Patrón de estudio bíblico ESI",
    descripcion: "Plantilla para preparar y dirigir el estudio semanal.",
    categoria: "formato",
    archivo: "Formatos/Patrón estudio bíblico ESI.docx",
    semana: null,
    orden: 7,
  },
  {
    id: "m1-dirigir",
    modulo_id: 1,
    titulo: "Cómo dirigir un estudio de grupo ESI",
    descripcion: "Guía para facilitar la discusión grupal.",
    categoria: "documento_facilitador",
    archivo: "Documentos facilitador/Cómo dirigir un estudio de grupo ESI.pdf",
    semana: null,
    orden: 8,
  },
  {
    id: "m1-asistencia",
    modulo_id: 1,
    titulo: "Lista de asistencia ESI",
    descripcion: "Formato para registrar asistencia del grupo.",
    categoria: "documento_facilitador",
    archivo: "Documentos facilitador/LISTA DE ASISTENCIA ESI.pdf",
    semana: null,
    orden: 9,
  },
];

export const categoryLabels: Record<MaterialCategory, string> = {
  material_estudio: "Material de estudio",
  formato: "Formatos",
  documento_facilitador: "Documentos facilitador",
  video: "Video",
  recurso: "Recurso",
  cronograma: "Cronograma",
  paquete: "Paquete semanal",
  lectura: "Lectura ministerial",
  guia: "Guía y documentos",
};
