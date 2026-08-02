import { notFound } from "next/navigation";
import { AdminModuloDetail } from "@/components/admin/admin-modulo-detail";
import {
  getCarpetasByModulo,
  getModuloById,
  getRecursosByModulo,
} from "@/lib/modules/queries";
import { requireAdmin } from "@/lib/admin/require-admin";

interface AdminModuloPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminModuloPage({ params }: AdminModuloPageProps) {
  await requireAdmin();

  const { id } = await params;
  const moduloId = Number(id);
  const modulo = await getModuloById(moduloId, true);

  if (!modulo) notFound();

  const [recursos, carpetas] = await Promise.all([
    getRecursosByModulo(moduloId, true, true),
    getCarpetasByModulo(moduloId),
  ]);

  return (
    <AdminModuloDetail
      modulo={modulo}
      recursos={recursos}
      carpetas={carpetas}
    />
  );
}
