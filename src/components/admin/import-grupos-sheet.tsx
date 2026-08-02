"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { importGrupos } from "@/app/dashboard/admin/grupos/actions";
import type { ActionState } from "@/app/dashboard/admin/grupos/types";
import { Button } from "@/components/ui/button";
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

export function ImportGruposSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(importGrupos, initial);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state?.success, onOpenChange, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Importar lista de grupos</SheetTitle>
          <SheetDescription>
            Una línea por grupo. Separadores: coma, punto y coma o |.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lista-grupos">Lista</Label>
            <textarea
              id="lista-grupos"
              name="lista"
              required
              rows={12}
              placeholder={`# nombre,ciudad,modulo,fecha_inicio,fecha_fin
ESI Bogotá Norte,Bogotá,1,2026-02-01,2026-06-30
ESI Medellín,Medellín,1,2026-02-01,2026-06-30
ESI Cali,Cali,2,,,`}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <p className="text-xs text-muted-foreground">
              Formato:{" "}
              <code>nombre,ciudad,modulo_id,fecha_inicio,fecha_fin</code>. Las
              fechas y el módulo son opcionales (YYYY-MM-DD).
            </p>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700">{state.success}</p>
          )}

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Importando…" : "Importar grupos"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
