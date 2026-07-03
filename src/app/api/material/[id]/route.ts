import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { materialesModulo1 } from "@/lib/data/modulos";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function findMaterial(id: string) {
  return materialesModulo1.find((m) => m.id === id);
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const material = findMaterial(id);

  if (!material) {
    return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
  }

  const materialDir =
    process.env.LOCAL_MATERIAL_PATH ??
    path.join(/* turbopackIgnore: true */ process.cwd(), "Primer modulo");

  const filePath = path.join(materialDir, material.archivo);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(material.archivo)}"`,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Archivo no disponible. Verifica que los PDFs estén en la carpeta Primer modulo o configura LOCAL_MATERIAL_PATH.",
      },
      { status: 404 },
    );
  }
}
