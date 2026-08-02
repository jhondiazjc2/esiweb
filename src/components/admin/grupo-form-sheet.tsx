"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createGrupo,
  updateGrupo,
} from "@/app/dashboard/admin/grupos/actions";
import type { ActionState } from "@/app/dashboard/admin/grupos/types";
import type { GrupoEsi, Modulo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const initial: ActionState = null;

function fieldClassName() {
  return "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
}

export function GrupoFormSheet({
  open,
  onOpenChange,
  mode,
  grupo,
  modulos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  grupo?: GrupoEsi | null;
  modulos: Pick<Modulo, "id" | "titulo">[];
}) {
  const router = useRouter();
  const action = mode === "create" ? createGrupo : updateGrupo;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state?.success, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Nuevo grupo" : "Editar grupo"}
          </SheetTitle>
          <SheetDescription>
            Ciudad, fechas, módulo y estado del grupo ESI
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4">
          {mode === "edit" && grupo && (
            <input type="hidden" name="id" value={grupo.id} />
          )}

          <div className="space-y-2">
            <Label htmlFor="grupo-nombre">Nombre</Label>
            <Input
              id="grupo-nombre"
              name="nombre"
              required
              defaultValue={grupo?.nombre ?? ""}
              placeholder="ESI Bogotá Norte"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo-ciudad">Ciudad</Label>
            <Input
              id="grupo-ciudad"
              name="ciudad"
              required
              defaultValue={grupo?.ciudad ?? ""}
              placeholder="Bogotá"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="grupo-inicio">Fecha inicio</Label>
              <Input
                id="grupo-inicio"
                name="fecha_inicio"
                type="date"
                defaultValue={grupo?.fecha_inicio ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupo-fin">Fecha fin</Label>
              <Input
                id="grupo-fin"
                name="fecha_fin"
                type="date"
                defaultValue={grupo?.fecha_fin ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo-modulo">Módulo</Label>
            <select
              id="grupo-modulo"
              name="modulo_id"
              defaultValue={grupo?.modulo_id?.toString() ?? ""}
              className={fieldClassName()}
            >
              <option value="">Sin módulo asignado</option>
              {modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  Módulo {m.id}: {m.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo-notas">Notas</Label>
            <textarea
              id="grupo-notas"
              name="notas"
              rows={3}
              defaultValue={grupo?.notas ?? ""}
              className={fieldClassName()}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="grupo-activo"
              name="activo"
              type="checkbox"
              defaultChecked={grupo?.activo ?? true}
            />
            <Label htmlFor="grupo-activo">Grupo activo</Label>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Crear grupo"
                  : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
