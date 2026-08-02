"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Upload, Users } from "lucide-react";
import { GrupoFormSheet } from "@/components/admin/grupo-form-sheet";
import { ImportGruposSheet } from "@/components/admin/import-grupos-sheet";
import { SyncFacilitadoresButton } from "@/components/admin/sync-facilitadores-button";
import type { GrupoEsi, Modulo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatFecha(value: string | null) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminGruposList({
  grupos,
  modulos,
}: {
  grupos: GrupoEsi[];
  modulos: Pick<Modulo, "id" | "titulo">[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Grupos</h1>
          <p className="mt-1 text-muted-foreground">
            Administra los grupos ESI, facilitadores y participantes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SyncFacilitadoresButton />
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-4" />
            Importar lista
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo grupo
          </Button>
        </div>
      </div>

      {grupos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin grupos aún</CardTitle>
            <CardDescription>
              Crea un grupo o importa tu lista (nombre, ciudad, módulo, fechas).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {grupos.map((grupo) => (
            <Card key={grupo.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle>
                    <Link
                      href={`/dashboard/admin/grupos/${grupo.id}`}
                      className="hover:underline"
                    >
                      {grupo.nombre}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {grupo.ciudad}
                    {grupo.modulo_id != null
                      ? ` · Módulo ${grupo.modulo_id}`
                      : ""}
                  </CardDescription>
                </div>
                <Badge variant={grupo.activo ? "secondary" : "outline"}>
                  {grupo.activo ? "Activo" : "Inactivo"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  <span>
                    Inicio:{" "}
                    <span className="text-foreground">
                      {formatFecha(grupo.fecha_inicio)}
                    </span>
                  </span>
                  <span>
                    Fin:{" "}
                    <span className="text-foreground">
                      {formatFecha(grupo.fecha_fin)}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5" />
                    {grupo.facilitadores_count ?? 0} facilitador(es)
                    {" · "}
                    {grupo.estudiantes_count ?? 0} estudiante(s)
                  </span>
                  <ButtonLink
                    href={`/dashboard/admin/grupos/${grupo.id}`}
                    size="sm"
                    variant="outline"
                  >
                    Administrar
                  </ButtonLink>
                </div>

                {grupo.facilitadores && grupo.facilitadores.length > 0 && (
                  <p className="text-muted-foreground">
                    Facilitadores:{" "}
                    <span className="text-foreground">
                      {grupo.facilitadores
                        .map((f) => f.nombre_completo)
                        .join(", ")}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GrupoFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        modulos={modulos}
      />
      <ImportGruposSheet open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
