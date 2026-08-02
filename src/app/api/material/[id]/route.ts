import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getRecursoById } from "@/lib/modules/queries";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MATERIAL_DIR_NAME = "Modulo I";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function contentTypeFor(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

function nfc(value: string) {
  return value.normalize("NFC");
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
}

async function resolveMaterialPath(materialDir: string, archivo: string) {
  const normalized = archivo.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  const candidate = path.join(materialDir, ...segments);

  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  } catch {
    // fall through to fuzzy match
  }

  const targetRel = nfc(normalized);
  const targetBase = nfc(path.basename(normalized));
  const files = await listFilesRecursive(materialDir);

  const byRelative = files.find((file) => {
    const rel = path.relative(materialDir, file).split(path.sep).join("/");
    return nfc(rel) === targetRel;
  });
  if (byRelative) return byRelative;

  const byBasename = files.find(
    (file) => nfc(path.basename(file)) === targetBase,
  );
  return byBasename ?? null;
}

async function readLocalFile(storagePath: string) {
  const localName = storagePath.replace(/^local:/, "");
  const materialDir =
    process.env.LOCAL_MATERIAL_PATH ??
    path.join(/* turbopackIgnore: true */ process.cwd(), MATERIAL_DIR_NAME);
  const filePath = await resolveMaterialPath(materialDir, localName);
  if (!filePath) return null;

  const buffer = await readFile(filePath);
  const filename = path.basename(filePath);
  return { buffer, filename };
}

async function readStorageFile(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("materiales")
    .download(storagePath);

  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  const filename = path.basename(storagePath);
  return { buffer, filename };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const recurso = await getRecursoById(id);

  if (!recurso || recurso.tipo !== "documento") {
    return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
  }

  const externalUrl =
    recurso.url &&
    !recurso.url.startsWith("esi-folder:") &&
    (recurso.url.startsWith("http://") || recurso.url.startsWith("https://"))
      ? recurso.url
      : null;

  if (externalUrl && !recurso.storage_path) {
    return NextResponse.redirect(externalUrl);
  }

  let file: { buffer: Buffer; filename: string } | null = null;

  if (recurso.storage_path?.startsWith("local:")) {
    file = await readLocalFile(recurso.storage_path);
  } else if (
    recurso.storage_path &&
    !recurso.storage_path.startsWith("bind:") &&
    !recurso.storage_path.startsWith("folder-")
  ) {
    file = await readStorageFile(recurso.storage_path);
  }

  if (!file) {
    return NextResponse.json(
      {
        error:
          "Archivo no disponible. Verifica la carpeta Modulo I o Supabase Storage.",
      },
      { status: 404 },
    );
  }

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": contentTypeFor(file.filename),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(recurso.archivo_nombre ?? file.filename)}"`,
    },
  });
}
