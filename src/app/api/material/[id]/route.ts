import { readdir, readFile } from "fs/promises";
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

async function resolveMaterialPath(materialDir: string, archivo: string) {
  const direct = path.join(materialDir, archivo);
  try {
    await readFile(direct);
    return direct;
  } catch {
    const files = await readdir(materialDir);
    const match = files.find(
      (file) => file.normalize("NFC") === archivo.normalize("NFC"),
    );
    if (!match) return null;
    return path.join(materialDir, match);
  }
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

  if (recurso.url && !recurso.storage_path) {
    return NextResponse.redirect(recurso.url);
  }

  let file: { buffer: Buffer; filename: string } | null = null;

  if (recurso.storage_path?.startsWith("local:")) {
    file = await readLocalFile(recurso.storage_path);
  } else if (recurso.storage_path) {
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
