import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import {
  categoryLabels,
  materialesModulo1,
  modulos,
} from "@/lib/data/modulos";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ModuloDetailPageProps {
  params: Promise<{ id: string }>;
}

function getMaterialsForModule(moduloId: number) {
  if (moduloId === 1) return materialesModulo1;
  return [];
}

export default async function ModuloDetailPage({
  params,
}: ModuloDetailPageProps) {
  const { id } = await params;
  const moduloId = Number(id);
  const modulo = modulos.find((m) => m.id === moduloId);

  if (!modulo) notFound();

  const materiales = getMaterialsForModule(moduloId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/dashboard/modulos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a módulos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Módulo {modulo.id}: {modulo.titulo}
        </h1>
        <p className="mt-1 text-muted-foreground">{modulo.descripcion}</p>
      </div>

      {materiales.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            El material de este módulo estará disponible próximamente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materiales.map((material) => (
            <Card key={material.id}>
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{material.titulo}</CardTitle>
                    <Badge variant="outline">
                      {categoryLabels[material.categoria]}
                    </Badge>
                  </div>
                  {material.descripcion && (
                    <CardDescription className="mt-1">
                      {material.descripcion}
                    </CardDescription>
                  )}
                </div>
                <ButtonAnchor
                  href={`/api/material/${material.id}`}
                  download
                  size="sm"
                  variant="outline"
                >
                  <Download className="size-4" />
                  Descargar
                </ButtonAnchor>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
