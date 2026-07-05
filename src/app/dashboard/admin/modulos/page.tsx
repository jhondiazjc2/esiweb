import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { CreateModuloForm } from "@/components/admin/create-modulo-form";
import { getModulos } from "@/lib/modules/queries";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminModulosPage() {
  const modulos = await getModulos(true);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrar módulos</h1>
        <p className="mt-1 text-muted-foreground">
          Crea, edita y gestiona el contenido de cada semestre ESI
        </p>
      </div>

      <CreateModuloForm />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Módulos del programa</h2>
        {modulos.map((modulo) => (
          <Card key={modulo.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">
                    Módulo {modulo.id}: {modulo.titulo}
                  </CardTitle>
                  {modulo.activo === false && (
                    <Badge variant="secondary">Oculto</Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {modulo.descripcion}
                </CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  {modulo.semanas} semanas · orden {modulo.orden ?? modulo.id}
                </p>
              </div>
              <ButtonLink
                href={`/dashboard/admin/modulos/${modulo.id}`}
                size="sm"
                variant="outline"
              >
                <Pencil className="size-4" />
                Gestionar
              </ButtonLink>
            </CardHeader>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        <Plus className="mr-1 inline size-4" />
        Desde <strong>Gestionar</strong> puedes agregar PDFs, videos de YouTube y
        enlaces.
      </p>
    </div>
  );
}
