import { notFound } from "next/navigation";
import { AdminModuloDetail } from "@/components/admin/admin-modulo-detail";
import { getModuloById, getRecursosByModulo } from "@/lib/modules/queries";

interface AdminModuloPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminModuloPage({ params }: AdminModuloPageProps) {
  const { id } = await params;
  const moduloId = Number(id);
  const modulo = await getModuloById(moduloId, true);

  if (!modulo) notFound();

  const recursos = await getRecursosByModulo(moduloId, true, false);

  return <AdminModuloDetail modulo={modulo} recursos={recursos} />;
}
