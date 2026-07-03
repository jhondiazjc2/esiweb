import Link from "next/link";
import { modulos } from "@/lib/data/modulos";
import { getSessionProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ModulosPage() {
  const profile = await getSessionProfile();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Módulos</h1>
        <p className="mt-1 text-muted-foreground">
          Seis semestres del programa ESI de tres años
        </p>
      </div>

      <div className="grid gap-4">
        {modulos.map((modulo) => {
          const disponible =
            modulo.id === 1 || profile.role === "admin";
          const enCurso = modulo.id === profile.modulo_actual;

          return (
            <Card
              key={modulo.id}
              className={disponible ? "transition-colors hover:bg-muted/30" : "opacity-60"}
            >
              <Link
                href={
                  disponible
                    ? `/dashboard/modulos/${modulo.id}`
                    : "#"
                }
                className={disponible ? "" : "pointer-events-none"}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Módulo {modulo.id}: {modulo.titulo}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {modulo.descripcion}
                    </CardDescription>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {modulo.semanas} semanas
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {enCurso && <Badge>En curso</Badge>}
                    {disponible ? (
                      <Badge variant="secondary">Disponible</Badge>
                    ) : (
                      <Badge variant="outline">Próximamente</Badge>
                    )}
                  </div>
                </CardHeader>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
