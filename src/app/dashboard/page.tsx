import { BookOpen, GraduationCap, Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { modulos } from "@/lib/data/modulos";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardHomePage() {
  const profile = await getSessionProfile();
  const moduloActual = modulos.find((m) => m.id === profile.modulo_actual);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Área de aprendizaje ESIWeb Colombia
        </p>
      </div>

      {moduloActual && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Módulo {moduloActual.id}</CardTitle>
                <CardDescription>{moduloActual.titulo}</CardDescription>
              </div>
              <Badge>En curso</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {moduloActual.descripcion}
            </p>
            <ButtonLink href={`/dashboard/modulos/${moduloActual.id}`} className="mt-4">
              <BookOpen className="size-4" />
              Ver material
            </ButtonLink>
          </CardContent>
        </Card>
      )}

      {(profile.role === "facilitador" || profile.role === "admin") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <Users className="mb-2 size-6 text-primary" />
              <CardTitle className="text-lg">Estudiantes</CardTitle>
              <CardDescription>
                Crear cuentas y gestionar tu grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href="/dashboard/facilitador/estudiantes" variant="outline" size="sm">
                Gestionar
              </ButtonLink>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <GraduationCap className="mb-2 size-6 text-primary" />
              <CardTitle className="text-lg">Notas</CardTitle>
              <CardDescription>
                Seguimiento de calificaciones semanales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href="/dashboard/facilitador/notas" variant="outline" size="sm">
                Ver notas
              </ButtonLink>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
