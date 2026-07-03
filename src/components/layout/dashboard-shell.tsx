import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { siteConfig } from "@/lib/data/site";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface DashboardShellProps {
  children: React.ReactNode;
  role?: UserRole;
  userName?: string;
}

const roleLabels: Record<UserRole, string> = {
  estudiante: "Estudiante",
  facilitador: "Facilitador",
  admin: "Administrador",
};

function getNavItems(role: UserRole) {
  const common = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/modulos", label: "Módulos", icon: BookOpen },
  ];

  if (role === "facilitador" || role === "admin") {
    common.push(
      { href: "/dashboard/facilitador/estudiantes", label: "Estudiantes", icon: Users },
      { href: "/dashboard/facilitador/notas", label: "Notas", icon: GraduationCap },
    );
  }

  if (role === "admin") {
    common.push(
      { href: "/dashboard/admin/sedes", label: "Sedes", icon: Building2 },
      { href: "/dashboard/admin/material", label: "Material", icon: BookOpen },
    );
  }

  return common;
}

export function DashboardShell({
  children,
  role = "estudiante",
  userName = "Usuario",
}: DashboardShellProps) {
  const navItems = getNavItems(role);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Image
              src={siteConfig.logo}
              alt={siteConfig.logoAlt}
              width={28}
              height={28}
              className="rounded object-contain"
            />
            ESIWeb
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {roleLabels[role]}
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <form action="/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <main className="flex min-h-svh flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="text-sm text-muted-foreground">
            Área de aprendizaje
          </span>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
