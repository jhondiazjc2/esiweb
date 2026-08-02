import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuloRecursosSections } from "@/components/modules/modulo-recursos-sections";
import {
  getCarpetasByModulo,
  getModuloById,
  getRecursosByModulo,
  groupRecursosByCarpetas,
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
  const isAdmin = profile.role === "admin" && profile.id !== "demo";
  const modulo = await getModuloById(moduloId, isAdmin);
  const recursos = await getRecursosByModulo(moduloId, isAdmin);
  const carpetas = await getCarpetasByModulo(moduloId);

  if (!modulo) notFound();

  const disponible = isAdmin || modulo.activo !== false;
  if (!disponible) notFound();

  const secciones = groupRecursosByCarpetas(carpetas, recursos, {
    includeEmpty: true,
    includeOrphans: isAdmin,
  });

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
        {isAdmin && (
          <ButtonLink
            href={`/dashboard/admin/modulos/${modulo.id}`}
            variant="outline"
            size="sm"
          >
            Datos del módulo
          </ButtonLink>
        )}
      </div>

      <ModuloRecursosSections
        secciones={secciones}
        moduloId={modulo.id}
        editable={isAdmin}
      />
    </div>
  );
}
