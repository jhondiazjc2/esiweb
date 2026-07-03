import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  return (
    <DashboardShell role={profile.role} userName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
