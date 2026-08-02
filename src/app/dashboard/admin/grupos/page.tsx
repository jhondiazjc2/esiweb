import { AdminGruposList } from "@/components/admin/admin-grupos-list";
import { getGruposEsi } from "@/lib/grupos/queries";
import { getModulos } from "@/lib/modules/queries";

export default async function AdminGruposPage() {
  const [grupos, modulos] = await Promise.all([
    getGruposEsi(true),
    getModulos(true),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <AdminGruposList
        grupos={grupos}
        modulos={modulos.map((m) => ({ id: m.id, titulo: m.titulo }))}
      />
    </div>
  );
}
