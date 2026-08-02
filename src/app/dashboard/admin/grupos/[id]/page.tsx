import { notFound } from "next/navigation";
import { AdminGrupoDetail } from "@/components/admin/admin-grupo-detail";
import {
  getGrupoEsiById,
  getMiembrosByGrupo,
} from "@/lib/grupos/queries";
import { getModulos } from "@/lib/modules/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGrupoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [grupo, miembros, modulos] = await Promise.all([
    getGrupoEsiById(id),
    getMiembrosByGrupo(id, true),
    getModulos(true),
  ]);

  if (!grupo) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <AdminGrupoDetail
        grupo={grupo}
        miembros={miembros}
        modulos={modulos.map((m) => ({ id: m.id, titulo: m.titulo }))}
      />
    </div>
  );
}
