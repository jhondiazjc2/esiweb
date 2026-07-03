export const landingSections = [
  { id: "inicio", label: "Inicio" },
  { id: "mision", label: "Misión y visión" },
  { id: "programa", label: "Programa" },
  { id: "grupos", label: "Grupos" },
  { id: "contacto", label: "Contacto" },
] as const;

export type LandingSectionId = (typeof landingSections)[number]["id"];
