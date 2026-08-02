"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import {
  addMiembroGrupo,
  removeMiembroGrupo,
  setGrupoActivo,
  updatePersona,
} from "@/app/dashboard/admin/grupos/actions";
import type { ActionState } from "@/app/dashboard/admin/grupos/types";
import { GrupoFormSheet } from "@/components/admin/grupo-form-sheet";
import type {
  GrupoEsi,
  GrupoMiembro,
  GrupoMiembroRol,
  Modulo,
  Persona,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonLink } from "@/components/ui/button-link";

const initial: ActionState = null;

function MiembroFormSheet({
  open,
  onOpenChange,
  grupoId,
  rol,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoId: string;
  rol: GrupoMiembroRol;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addMiembroGrupo, initial);

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
            Agregar {rol === "facilitador" ? "facilitador" : "estudiante"}
          </SheetTitle>
          <SheetDescription>
            La identificación es opcional: si la dejas vacía se asigna una
            ficticia (11111111…). Iglesia por defecto: Mi iglesia Local. Puedes
            completar datos reales después.
          </SheetDescription>
        </SheetHeader>

        <form key={`${rol}-${open}`} action={action} className="mt-6 space-y-4">
          <input type="hidden" name="grupo_id" value={grupoId} />
          <input type="hidden" name="rol" value={rol} />

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" name="nombre_completo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id-doc">Identificación (opcional)</Label>
            <Input
              id="id-doc"
              name="identificacion"
              placeholder="Vacío = número ficticio automático"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iglesia">Iglesia local</Label>
            <Input
              id="iglesia"
              name="iglesia_local"
              defaultValue="Mi iglesia Local"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel">Teléfono</Label>
            <Input id="tel" name="telefono" />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Agregar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RemoveMiembroButton({
  miembroId,
  grupoId,
  nombre,
}: {
  miembroId: string;
  grupoId: string;
  nombre: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(removeMiembroGrupo, initial);

  useEffect(() => {
    if (state?.success) router.refresh();
    if (state?.error) alert(state.error);
  }, [state, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`¿Retirar a ${nombre} de este grupo?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={miembroId} />
      <input type="hidden" name="grupo_id" value={grupoId} />
      <Button
        type="submit"
        size="icon-sm"
        variant="outline"
        className="text-destructive"
        disabled={pending}
        aria-label="Retirar"
      >
        <Trash2 />
      </Button>
    </form>
  );
}

function ToggleActivoButton({
  grupoId,
  activo,
}: {
  grupoId: string;
  activo: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(setGrupoActivo, initial);

  useEffect(() => {
    if (state?.success) router.refresh();
    if (state?.error) alert(state.error);
  }, [state, router]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={grupoId} />
      <input type="hidden" name="activo" value={activo ? "false" : "true"} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : activo ? "Inactivar grupo" : "Activar grupo"}
      </Button>
    </form>
  );
}

function EditPersonaSheet({
  open,
  onOpenChange,
  persona,
  grupoId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona;
  grupoId: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updatePersona, initial);

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
          <SheetTitle>Editar persona</SheetTitle>
          <SheetDescription>
            Actualiza cédula, iglesia u otros datos cuando los tengas.
          </SheetDescription>
        </SheetHeader>
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={persona.id} />
          <input type="hidden" name="grupo_id" value={grupoId} />
          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre completo</Label>
            <Input
              id="edit-nombre"
              name="nombre_completo"
              required
              defaultValue={persona.nombre_completo}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-id">Identificación</Label>
            <Input
              id="edit-id"
              name="identificacion"
              defaultValue={persona.identificacion ?? ""}
              placeholder="Cédula real"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-iglesia">Iglesia local</Label>
            <Input
              id="edit-iglesia"
              name="iglesia_local"
              defaultValue={persona.iglesia_local ?? "Mi iglesia Local"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              defaultValue={persona.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tel">Teléfono</Label>
            <Input
              id="edit-tel"
              name="telefono"
              defaultValue={persona.telefono ?? ""}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function MiembrosTable({
  items,
  grupoId,
  emptyText,
  onEditPersona,
}: {
  items: GrupoMiembro[];
  grupoId: string;
  emptyText: string;
  onEditPersona: (persona: Persona) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Identificación</TableHead>
            <TableHead>Iglesia</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                {m.persona?.nombre_completo ?? "—"}
                {m.persona?.app_role === "admin" && (
                  <Badge className="ml-2">Admin</Badge>
                )}
                {m.persona?.app_role === "facilitador" && (
                  <Badge variant="secondary" className="ml-2">
                    Facilitador
                  </Badge>
                )}
                {!m.activo && (
                  <Badge variant="outline" className="ml-2">
                    Retirado
                  </Badge>
                )}
              </TableCell>
              <TableCell>{m.persona?.identificacion ?? "—"}</TableCell>
              <TableCell>{m.persona?.iglesia_local ?? "—"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {m.persona && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label="Editar persona"
                      onClick={() => onEditPersona(m.persona!)}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {m.activo && (
                    <RemoveMiembroButton
                      miembroId={m.id}
                      grupoId={grupoId}
                      nombre={m.persona?.nombre_completo ?? "miembro"}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminGrupoDetail({
  grupo,
  miembros,
  modulos,
}: {
  grupo: GrupoEsi;
  miembros: GrupoMiembro[];
  modulos: Pick<Modulo, "id" | "titulo">[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [miembroSheet, setMiembroSheet] = useState<GrupoMiembroRol | null>(
    null,
  );
  const [editPersona, setEditPersona] = useState<Persona | null>(null);

  const facilitadores = miembros.filter((m) => m.rol === "facilitador");
  const estudiantes = miembros.filter((m) => m.rol === "estudiante");

  return (
    <div className="space-y-8">
      <div>
        <ButtonLink
          href="/dashboard/admin/grupos"
          variant="link"
          size="sm"
          className="px-0"
        >
          ← Volver a grupos
        </ButtonLink>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{grupo.nombre}</h1>
              <Badge variant={grupo.activo ? "secondary" : "outline"}>
                {grupo.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {grupo.ciudad}
              {grupo.modulo_id != null ? ` · Módulo ${grupo.modulo_id}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToggleActivoButton grupoId={grupo.id} activo={grupo.activo} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Facilitadores</h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setMiembroSheet("facilitador")}
          >
            <UserPlus className="size-4" />
            Agregar facilitador
          </Button>
        </div>
        <MiembrosTable
          items={facilitadores}
          grupoId={grupo.id}
          emptyText="Aún no hay facilitadores en este grupo."
          onEditPersona={setEditPersona}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Estudiantes</h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setMiembroSheet("estudiante")}
          >
            <Plus className="size-4" />
            Agregar estudiante
          </Button>
        </div>
        <MiembrosTable
          items={estudiantes}
          grupoId={grupo.id}
          emptyText="Aún no hay estudiantes en este grupo."
          onEditPersona={setEditPersona}
        />
      </div>

      <GrupoFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        grupo={grupo}
        modulos={modulos}
      />
      {miembroSheet && (
        <MiembroFormSheet
          open
          onOpenChange={(open) => !open && setMiembroSheet(null)}
          grupoId={grupo.id}
          rol={miembroSheet}
        />
      )}
      {editPersona && (
        <EditPersonaSheet
          open
          onOpenChange={(open) => !open && setEditPersona(null)}
          persona={editPersona}
          grupoId={grupo.id}
        />
      )}
    </div>
  );
}
