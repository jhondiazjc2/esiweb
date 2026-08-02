import { redirect } from "next/navigation";

/** @deprecated Ruta antigua — redirige a Grupos */
export default function AdminSedesRedirectPage() {
  redirect("/dashboard/admin/grupos");
}
