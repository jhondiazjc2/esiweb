import Link from "next/link";
import {
  canAccessModulo,
  canViewAllModulos,
  getModuloIdsForEstudiante,
} from "@/lib/access/permissions";
import { getModulos } from "@/lib/modules/queries";
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
  const allModulos = await getModulos(profile.role === "admin");

  const allowed: number[] | "all" = canViewAllModulos(profile.role)
    ? "all"
    : await getModuloIdsForEstudiante(
        profile.persona_id,
        profile.modulo_actual,
      );

  const modulos = allModulos.filter(
    (m) =>
      (profile.role === "admin" || m.activo !== false) &&
      canAccessModulo(m.id, profile.role, allowed),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Módulos</h1>
        <p className="mt-1 text-muted-foreground">
          {profile.role === "estudiante"
            ? "Material del módulo asignado a tu grupo"
            : profile.role === "facilitador"
              ? "Consulta de todos los módulos (sin edición)"
              : "Semestres del programa ESI de tres años"}
        </p>
      </div>

      <div className="grid gap-4">
        {modulos.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin módulos disponibles</CardTitle>
              <CardDescription>
                Tu cuenta aún no tiene un grupo/módulo asignado.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          modulos.map((modulo) => {
            const enCurso =
              allowed !== "all" && allowed.includes(modulo.id)
                ? modulo.id === allowed[0] ||
                  modulo.id === profile.modulo_actual
                : modulo.id === profile.modulo_actual;

            return (
              <Card
                key={modulo.id}
                className="transition-colors hover:bg-muted/30"
              >
                <Link href={`/dashboard/modulos/${modulo.id}`}>
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
                      {enCurso && profile.role === "estudiante" && (
                        <Badge>En curso</Badge>
                      )}
                      <Badge variant="secondary">Disponible</Badge>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
