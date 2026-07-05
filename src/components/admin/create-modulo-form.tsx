"use client";

import { useActionState } from "react";
import { createModulo } from "@/app/dashboard/admin/modulos/actions";
import type { ActionState } from "@/app/dashboard/admin/modulos/types";
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

export function CreateModuloForm() {
  const [state, action, pending] = useActionState(createModulo, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar módulo</CardTitle>
        <CardDescription>
          Crea un nuevo semestre o unidad del programa ESI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="new-titulo">Título</Label>
            <Input id="new-titulo" name="titulo" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="new-descripcion">Descripción</Label>
            <textarea
              id="new-descripcion"
              name="descripcion"
              required
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-semanas">Semanas</Label>
            <Input
              id="new-semanas"
              name="semanas"
              type="number"
              min={1}
              defaultValue={15}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="new-activo" name="activo" type="checkbox" defaultChecked />
            <Label htmlFor="new-activo">Visible para estudiantes</Label>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700 sm:col-span-2">{state.success}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear módulo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
