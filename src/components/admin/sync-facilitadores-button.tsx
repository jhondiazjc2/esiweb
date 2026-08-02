"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { syncFacilitadoresDesdeGrupos } from "@/app/dashboard/admin/grupos/actions";
import type { ActionState } from "@/app/dashboard/admin/grupos/types";
import { Button } from "@/components/ui/button";

const initial: ActionState = null;

export function SyncFacilitadoresButton() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    syncFacilitadoresDesdeGrupos,
    initial,
  );
  const lastMsg = useRef<string | null>(null);

  useEffect(() => {
    const msg = state?.success ?? state?.error ?? null;
    if (!msg || msg === lastMsg.current) return;
    lastMsg.current = msg;
    alert(msg);
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Crear facilitadores desde los nombres de cada grupo?\n\n" +
              "• Identificación ficticia: 11111111, 11111112, …\n" +
              "• Iglesia: Mi iglesia Local\n" +
              "• Se pueden editar después.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="outline" disabled={pending}>
        <UserPlus className="size-4" />
        {pending ? "Creando…" : "Crear facilitadores"}
      </Button>
      {pending && (
        <p className="mt-1 text-xs text-muted-foreground">
          Procesando en lote, suele tardar unos segundos…
        </p>
      )}
    </form>
  );
}
