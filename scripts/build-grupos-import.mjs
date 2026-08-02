import fs from "fs";

const raw = fs.readFileSync("grupos2026.csv", "utf8");
const lines = raw
  .split(/\r?\n/)
  .slice(1)
  .filter((l) => l.trim());

const modMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };

/**
 * Snapshot jul 2026: semestre actual cierra 2026-06-30.
 * fecha_inicio = inicio de cohorte (cuando entraron a Módulo I).
 * fecha_fin = fin proyectado del programa (módulos restantes hasta el VI).
 *   Ej. Módulo IV → faltan V (jul–dic 2026) y VI (ene–jun 2027) → 2027-06-30
 */
const datesByMod = {
  1: ["2026-01-01", "2028-12-31"], // faltan II–VI (5 semestres)
  2: ["2025-07-01", "2028-06-30"], // faltan III–VI (4)
  3: ["2025-01-01", "2027-12-31"], // faltan IV–VI (3)
  4: ["2024-07-01", "2027-06-30"], // faltan V–VI (2)
  5: ["2024-01-01", "2026-12-31"], // falta VI (1)
  6: ["2023-07-01", "2026-06-30"], // último semestre en curso
};

function titleCase(s) {
  let out = s
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s/\\\-.(])([a-záéíóúñü])/gi, (_, a, b) => a + b.toUpperCase());

  const fixes = [
    [/Bogota/g, "Bogotá"],
    [/Quindio/g, "Quindío"],
    [/Magangue/g, "Magangué"],
    [/Boyaca/g, "Boyacá"],
    [/Jose /g, "José "],
    [/Maria /g, "María "],
    [/Andres /g, "Andrés "],
    [/Angelica /g, "Angélica "],
    [/Sebastian /g, "Sebastián "],
    [/Rocio /g, "Rocío "],
    [/Lisimaco /g, "Lisímaco "],
    [/Volney /g, "Volney "],
  ];
  for (const [re, rep] of fixes) out = out.replace(re, rep);
  return out;
}

function parseMod(m) {
  const t = m.replace(/\s+/g, "").toUpperCase();
  return modMap[t] || null;
}

function csvEscape(s) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

const rows = [];
for (const line of lines) {
  const parts = line.split(";");
  if (parts.length < 3) continue;
  const fac = parts[0].trim().replace(/\s+/g, " ");
  const ciudad = parts[1].trim().replace(/\s+/g, " ");
  const mod = parseMod(parts[2]);
  const part = (parts[3] || "").trim();
  if (!fac || !ciudad || !mod) {
    console.error("SKIP", line);
    continue;
  }
  rows.push({ fac, ciudad, mod, part: part || null });
}

const counts = new Map();
const out = [];
for (const r of rows) {
  const key = [r.ciudad.toUpperCase(), r.fac.toUpperCase(), r.mod].join("|");
  const n = (counts.get(key) || 0) + 1;
  counts.set(key, n);

  const facTitle = titleCase(r.fac);
  const cityTitle = titleCase(r.ciudad);
  let nombre = `${cityTitle} · ${facTitle} · Módulo ${r.mod}`;
  if (n > 1) nombre += `.${n}`;

  const [ini, fin] = datesByMod[r.mod];
  const notas = [
    `Facilitador(es): ${facTitle}`,
    r.part ? `Participantes reportados (jul 2026): ${r.part}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  out.push({ nombre, ciudad: cityTitle, mod: r.mod, ini, fin, notas });
}

let csv =
  "nombre,ciudad,modulo_id,fecha_inicio,fecha_fin,notas\n";
for (const o of out) {
  csv +=
    [
      csvEscape(o.nombre),
      csvEscape(o.ciudad),
      o.mod,
      o.ini,
      o.fin,
      csvEscape(o.notas),
    ].join(",") + "\n";
}

fs.writeFileSync("grupos2026-import.csv", csv);

// Pegar en "Importar lista" (separador ; — más seguro). Incluye notas.
let paste = "";
for (const o of out) {
  paste += `${o.nombre};${o.ciudad};${o.mod};${o.ini};${o.fin};${o.notas}\n`;
}
fs.writeFileSync("grupos2026-import-paste.txt", paste);

console.log(`TOTAL: ${out.length} grupos`);
console.log("---");
for (const o of out) {
  console.log(`${o.nombre} | ${o.ciudad} | M${o.mod} | ${o.ini} → ${o.fin}`);
}
