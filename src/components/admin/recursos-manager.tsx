"use client";

import { useActionState } from "react";
import {
  categoriaOptions,
  tipoLabels,
} from "@/lib/modules/constants";
import type { ActionState } from "@/app/dashboard/admin/modulos/types";
import {
  createRecurso,
  deleteRecurso,
  updateRecurso,
} from "@/app/dashboard/admin/modulos/actions";
import type { Recurso, RecursoTipo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: ActionState = null;

const tipoOptions: RecursoTipo[] = ["documento", "youtube", "enlace", "otro"];

function fieldClassName() {
  return "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
}

function RecursoFields({
  recurso,
  moduloId,
}: {
  recurso?: Recurso;
  moduloId: number;
}) {
  return (
    <>
      <input type="hidden" name="modulo_id" value={moduloId} />
      {recurso && <input type="hidden" name="id" value={recurso.id} />}
      <div className="space-y-2 sm:col-span-2">
        <Label>Título</Label>
        <Input name="titulo" defaultValue={recurso?.titulo} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Descripción</Label>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={recurso?.descripcion ?? ""}
          className={fieldClassName()}
        />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <select
          name="tipo"
          defaultValue={recurso?.tipo ?? "documento"}
          className={fieldClassName()}
        >
          {tipoOptions.map((t) => (
            <option key={t} value={t}>
              {tipoLabels[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <select
          name="categoria"
          defaultValue={recurso?.categoria ?? "recurso"}
          className={fieldClassName()}
        >
          {categoriaOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>URL (YouTube, enlace o documento externo)</Label>
        <Input
          name="url"
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          defaultValue={recurso?.url ?? ""}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Archivo (PDF, Word, etc.)</Label>
        <Input name="archivo" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" />
        {recurso?.archivo_nombre && (
          <p className="text-xs text-muted-foreground">
            Actual: {recurso.archivo_nombre}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Semana (opcional)</Label>
        <Input
          name="semana"
          type="number"
          min={1}
          max={15}
          defaultValue={recurso?.semana ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Orden</Label>
        <Input
          name="orden"
          type="number"
          min={0}
          defaultValue={recurso?.orden ?? 0}
        />
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id={`activo-${recurso?.id ?? "new"}`}
          name="activo"
          type="checkbox"
          defaultChecked={recurso?.activo ?? true}
        />
        <Label htmlFor={`activo-${recurso?.id ?? "new"}`}>Visible</Label>
      </div>
    </>
  );
}

function DeleteRecursoButton({
  recurso,
  moduloId,
}: {
  recurso: Recurso;
  moduloId: number;
}) {
  const [state, action, pending] = useActionState(deleteRecurso, initial);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${recurso.titulo}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={recurso.id} />
      <input type="hidden" name="modulo_id" value={moduloId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Eliminar
      </Button>
      {state?.error && (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}

export function CreateRecursoForm({ moduloId }: { moduloId: number }) {
  const [state, action, pending] = useActionState(createRecurso, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar recurso</CardTitle>
        <CardDescription>
          Documentos, videos de YouTube, enlaces u otros materiales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <RecursoFields moduloId={moduloId} />
          {state?.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700 sm:col-span-2">{state.success}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Agregar recurso"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RecursosAdminList({
  recursos,
  moduloId,
}: {
  recursos: Recurso[];
  moduloId: number;
}) {
  if (recursos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay recursos en la base de datos. Agrega el primero arriba.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {recursos.map((recurso) => (
        <RecursoEditCard key={recurso.id} recurso={recurso} moduloId={moduloId} />
      ))}
    </div>
  );
}

function RecursoEditCard({
  recurso,
  moduloId,
}: {
  recurso: Recurso;
  moduloId: number;
}) {
  const [state, action, pending] = useActionState(updateRecurso, initial);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{recurso.titulo}</CardTitle>
            <Badge variant="outline">{tipoLabels[recurso.tipo]}</Badge>
            {!recurso.activo && <Badge variant="secondary">Oculto</Badge>}
          </div>
          {recurso.descripcion && (
            <CardDescription className="mt-1">{recurso.descripcion}</CardDescription>
          )}
        </div>
        <DeleteRecursoButton recurso={recurso} moduloId={moduloId} />
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <RecursoFields recurso={recurso} moduloId={moduloId} />
          {state?.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700 sm:col-span-2">{state.success}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
