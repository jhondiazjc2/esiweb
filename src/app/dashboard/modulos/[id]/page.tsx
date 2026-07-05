import Link from "next/link";
import { notFound } from "next/navigation";
import { RecursoCard } from "@/components/modules/recurso-card";
import { getModuloById, getRecursosByModulo } from "@/lib/modules/queries";
import { getSessionProfile } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

interface ModuloDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModuloDetailPage({
  params,
}: ModuloDetailPageProps) {
  const { id } = await params;
  const moduloId = Number(id);
  const profile = await getSessionProfile();
  const modulo = await getModuloById(moduloId);
  const recursos = await getRecursosByModulo(moduloId);

  if (!modulo) notFound();

  const disponible =
    profile.role === "admin" || modulo.activo !== false;

  if (!disponible) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
        {profile.role === "admin" && (
          <ButtonLink
            href={`/dashboard/admin/modulos/${modulo.id}`}
            variant="outline"
            size="sm"
          >
            Editar módulo
          </ButtonLink>
        )}
      </div>

      {recursos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            El material de este módulo estará disponible próximamente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recursos.map((recurso) => (
            <RecursoCard key={recurso.id} recurso={recurso} />
          ))}
        </div>
      )}
    </div>
  );
}
