import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuloRecursosSections } from "@/components/modules/modulo-recursos-sections";
import {
  getModuloById,
  getRecursosByModulo,
  groupRecursosBySeccion,
} from "@/lib/modules/queries";
import { getSessionProfile } from "@/lib/auth";
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

  const secciones = groupRecursosBySeccion(recursos);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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

      <ModuloRecursosSections secciones={secciones} />
    </div>
  );
}
