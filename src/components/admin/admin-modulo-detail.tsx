"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  deleteModulo,
  updateModulo,
} from "@/app/dashboard/admin/modulos/actions";
import type { ActionState } from "@/app/dashboard/admin/modulos/types";
import {
  CreateRecursoForm,
  RecursosAdminList,
} from "@/components/admin/recursos-manager";
import type { Modulo, Recurso } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: ActionState = null;

function ModuloEditForm({ modulo }: { modulo: Modulo }) {
  const [state, action, pending] = useActionState(updateModulo, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del módulo</CardTitle>
        <CardDescription>Título, descripción y visibilidad</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={modulo.id} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" defaultValue={modulo.titulo} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              name="descripcion"
              defaultValue={modulo.descripcion}
              required
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semanas">Semanas</Label>
            <Input
              id="semanas"
              name="semanas"
              type="number"
              min={1}
              defaultValue={modulo.semanas}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              name="orden"
              type="number"
              min={0}
              defaultValue={modulo.orden ?? modulo.id}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              defaultChecked={modulo.activo !== false}
            />
            <Label htmlFor="activo">Visible para estudiantes</Label>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700 sm:col-span-2">{state.success}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar módulo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteModuloForm({ moduloId }: { moduloId: number }) {
  const [state, action, pending] = useActionState(deleteModulo, initial);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este módulo y todos sus recursos?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={moduloId} />
      <Button type="submit" variant="outline" disabled={pending}>
        Eliminar módulo
      </Button>
      {state?.error && (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}

export function AdminModuloDetail({
  modulo,
  recursos,
}: {
  modulo: Modulo;
  recursos: Recurso[];
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/dashboard/admin/modulos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a módulos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Módulo {modulo.id}: {modulo.titulo}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Administra documentos, YouTube y enlaces
        </p>
      </div>

      <ModuloEditForm modulo={modulo} />
      <CreateRecursoForm moduloId={modulo.id} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Recursos ({recursos.length})
        </h2>
        <RecursosAdminList recursos={recursos} moduloId={modulo.id} />
      </div>

      <DeleteModuloForm moduloId={modulo.id} />
    </div>
  );
}
