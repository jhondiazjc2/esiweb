"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RecursoCard } from "@/components/modules/recurso-card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  clearSinCarpeta,
  createCarpeta,
  createRecurso,
  deleteCarpeta,
  deleteRecurso,
  updateCarpeta,
  updateRecurso,
} from "@/app/dashboard/admin/modulos/actions";
import type { ActionState } from "@/app/dashboard/admin/modulos/types";
import { tipoLabels } from "@/lib/modules/constants";
import type { ModuloCarpeta, Recurso, RecursoTipo } from "@/lib/types";

const initial: ActionState = null;
const tipoOptions: RecursoTipo[] = ["documento", "youtube", "enlace", "otro"];

function fieldClassName() {
  return "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
}

export interface ModuloSeccion {
  carpeta: ModuloCarpeta;
  items: Recurso[];
}

export function ModuloRecursosSections({
  secciones,
  moduloId,
  editable = false,
}: {
  secciones: ModuloSeccion[];
  moduloId: number;
  editable?: boolean;
}) {
  const defaultOpen = secciones.map((s) => s.carpeta.id);
  const [recursoSheet, setRecursoSheet] = useState<{
    mode: "create" | "edit";
    carpetaId: string | null;
    recurso?: Recurso;
  } | null>(null);
  const [carpetaSheet, setCarpetaSheet] = useState<{
    mode: "create" | "edit";
    carpeta?: ModuloCarpeta;
  } | null>(null);

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Modo administrador: gestiona carpetas y recursos
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCarpetaSheet({ mode: "create" })}
          >
            <FolderPlus className="size-4" />
            Nueva carpeta
          </Button>
        </div>
      )}

      <Accordion
        multiple
        defaultValue={defaultOpen}
        className="rounded-xl border bg-card px-4 shadow-xs ring-1 ring-foreground/10"
      >
        {secciones.map((seccion) => {
          const isOrphan = seccion.carpeta.id.startsWith("orphan-");
          return (
            <AccordionItem key={seccion.carpeta.id} value={seccion.carpeta.id}>
              <div className="flex items-center gap-2">
                <AccordionTrigger className="flex-1 py-3.5 text-base font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    {seccion.carpeta.nombre}
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                      {seccion.items.length}
                    </span>
                  </span>
                </AccordionTrigger>
                {editable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          aria-label="Opciones de carpeta"
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOrphan ? (
                        <>
                          <DropdownMenuItem disabled>
                            Sección automática (docs sin carpeta)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={async () => {
                              if (
                                !confirm(
                                  `¿Eliminar los ${seccion.items.length} documento(s) sin carpeta? Esta sección desaparecerá.`,
                                )
                              ) {
                                return;
                              }
                              const fd = new FormData();
                              fd.set("modulo_id", String(moduloId));
                              const result = await clearSinCarpeta(null, fd);
                              if (result?.error) {
                                alert(result.error);
                                return;
                              }
                              window.location.reload();
                            }}
                          >
                            <Trash2 className="size-4" />
                            Eliminar documentos sin carpeta
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              setCarpetaSheet({
                                mode: "edit",
                                carpeta: seccion.carpeta,
                              })
                            }
                          >
                            <Pencil className="size-4" />
                            Editar carpeta
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setRecursoSheet({
                                mode: "create",
                                carpetaId: seccion.carpeta.id,
                              })
                            }
                          >
                            <Plus className="size-4" />
                            Agregar recurso
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={async () => {
                              if (
                                !confirm(
                                  `¿Eliminar la carpeta "${seccion.carpeta.nombre}"? Los recursos quedarán sin carpeta.`,
                                )
                              ) {
                                return;
                              }
                              const fd = new FormData();
                              fd.set("id", seccion.carpeta.id);
                              fd.set("modulo_id", String(moduloId));
                              const result = await deleteCarpeta(null, fd);
                              if (result?.error) {
                                alert(result.error);
                                return;
                              }
                              window.location.reload();
                            }}
                          >
                            <Trash2 className="size-4" />
                            Eliminar carpeta
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <AccordionContent className="px-1 pt-1 pb-4">
                {seccion.items.length === 0 ? (
                  <div className="space-y-3">
                    <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                      Aún no hay material en esta sección.
                    </p>
                    {editable && !isOrphan && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setRecursoSheet({
                            mode: "create",
                            carpetaId: seccion.carpeta.id,
                          })
                        }
                      >
                        <Plus className="size-4" />
                        Agregar documento o recurso
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {seccion.items.map((recurso) => (
                        <RecursoCard
                          key={recurso.id}
                          recurso={recurso}
                          compact
                          actions={
                            editable ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="outline"
                                        aria-label="Editar"
                                        onClick={() =>
                                          setRecursoSheet({
                                            mode: "edit",
                                            carpetaId:
                                              seccion.carpeta.id.startsWith(
                                                "orphan-",
                                              )
                                                ? null
                                                : seccion.carpeta.id,
                                            recurso,
                                          })
                                        }
                                      />
                                    }
                                  >
                                    <Pencil />
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <DeleteRecursoInline
                                  recurso={recurso}
                                  moduloId={moduloId}
                                />
                              </>
                            ) : undefined
                          }
                        />
                      ))}
                    </div>
                    {editable && !isOrphan && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setRecursoSheet({
                            mode: "create",
                            carpetaId: seccion.carpeta.id,
                          })
                        }
                      >
                        <Plus className="size-4" />
                        Agregar documento o recurso
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {carpetaSheet && (
        <CarpetaSheet
          key={`${carpetaSheet.mode}-${carpetaSheet.carpeta?.id ?? "new"}`}
          open
          onOpenChange={(open) => !open && setCarpetaSheet(null)}
          mode={carpetaSheet.mode}
          moduloId={moduloId}
          carpeta={carpetaSheet.carpeta}
        />
      )}

      {recursoSheet && (
        <RecursoSheet
          key={`${recursoSheet.mode}-${recursoSheet.recurso?.id ?? "new"}-${recursoSheet.carpetaId ?? "none"}`}
          open
          onOpenChange={(open) => !open && setRecursoSheet(null)}
          mode={recursoSheet.mode}
          moduloId={moduloId}
          carpetas={secciones
            .map((s) => s.carpeta)
            .filter((c) => !c.id.startsWith("orphan-"))}
          carpetaId={recursoSheet.carpetaId}
          recurso={recursoSheet.recurso}
        />
      )}
    </div>
  );
}

function DeleteRecursoInline({
  recurso,
  moduloId,
}: {
  recurso: Recurso;
  moduloId: number;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteRecurso, initial);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
    if (state?.error) {
      alert(state.error);
    }
  }, [state?.success, state?.error, router]);

  return (
    <form
      action={action}
      className="inline-flex"
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${recurso.titulo}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={recurso.id} />
      <input type="hidden" name="modulo_id" value={moduloId} />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="submit"
              size="icon-sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={pending}
              aria-label={pending ? "Eliminando…" : "Eliminar"}
            />
          }
        >
          <Trash2 />
        </TooltipTrigger>
        <TooltipContent>{pending ? "Eliminando…" : "Eliminar"}</TooltipContent>
      </Tooltip>
    </form>
  );
}

function CarpetaSheet({
  open,
  onOpenChange,
  mode,
  moduloId,
  carpeta,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  moduloId: number;
  carpeta?: ModuloCarpeta;
}) {
  const router = useRouter();
  const actionFn = mode === "create" ? createCarpeta : updateCarpeta;
  const [state, action, pending] = useActionState(actionFn, initial);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!state?.success) return;
    onOpenChangeRef.current(false);
    router.refresh();
  }, [state?.success, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Nueva carpeta" : "Editar carpeta"}
          </SheetTitle>
          <SheetDescription>
            Este cambio es solo visual en la interfaz. No renombra carpetas en
            disco, ni rutas de Storage, ni los archivos.
          </SheetDescription>
        </SheetHeader>
        <form
          key={`${mode}-${carpeta?.id ?? "new"}`}
          action={action}
          className="flex flex-1 flex-col gap-4 px-4"
        >
          <input type="hidden" name="modulo_id" value={moduloId} />
          {carpeta && <input type="hidden" name="id" value={carpeta.id} />}
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              name="nombre"
              required
              defaultValue={carpeta?.nombre}
              placeholder="Ej. Videos complementarios"
            />
          </div>
          <div className="space-y-2">
            <Label>Orden</Label>
            <Input
              name="orden"
              type="number"
              min={0}
              defaultValue={carpeta?.orden ?? ""}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Crear carpeta"
                  : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RecursoSheet({
  open,
  onOpenChange,
  mode,
  moduloId,
  carpetas,
  carpetaId,
  recurso,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  moduloId: number;
  carpetas: ModuloCarpeta[];
  carpetaId: string | null;
  recurso?: Recurso;
}) {
  const router = useRouter();
  const actionFn = mode === "create" ? createRecurso : updateRecurso;
  const [state, action, pending] = useActionState(actionFn, initial);
  const defaultCarpeta = recurso?.carpeta_id ?? carpetaId ?? carpetas[0]?.id ?? "";
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!state?.success) return;
    onOpenChangeRef.current(false);
    router.refresh();
  }, [state?.success, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Agregar recurso" : "Editar recurso"}
          </SheetTitle>
          <SheetDescription>
            Documento, YouTube, enlace u otro material de la carpeta
          </SheetDescription>
        </SheetHeader>
        <form
          key={`${mode}-${recurso?.id ?? "new"}-${defaultCarpeta}`}
          action={action}
          className="flex flex-1 flex-col gap-4 px-4 pb-6"
        >
          <input type="hidden" name="modulo_id" value={moduloId} />
          {recurso && <input type="hidden" name="id" value={recurso.id} />}
          <div className="space-y-2">
            <Label>Carpeta</Label>
            <select
              name="carpeta_id"
              required
              defaultValue={defaultCarpeta}
              className={fieldClassName()}
            >
              {carpetas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input name="titulo" required defaultValue={recurso?.titulo} />
          </div>
          <div className="space-y-2">
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
            <Label>URL (YouTube, enlace o documento externo)</Label>
            <Input
              name="url"
              type="url"
              placeholder="https://..."
              defaultValue={
                recurso?.url?.startsWith("esi-folder:")
                  ? ""
                  : (recurso?.url ?? "")
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Archivo (PDF, Word, etc.)</Label>
            <Input name="archivo" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" />
            {recurso?.archivo_nombre && (
              <p className="text-xs text-muted-foreground">
                Actual: {recurso.archivo_nombre}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Semana</Label>
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
          </div>
          <div className="flex items-center gap-2">
            <input
              id="recurso-activo"
              name="activo"
              type="checkbox"
              defaultChecked={recurso?.activo ?? true}
            />
            <Label htmlFor="recurso-activo">Visible</Label>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-700">{state.success}</p>
          )}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Agregar recurso"
                  : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
