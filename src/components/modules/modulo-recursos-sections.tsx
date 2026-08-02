"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RecursoCard } from "@/components/modules/recurso-card";
import type { MaterialCategory, Recurso } from "@/lib/types";

export interface ModuloSeccion {
  seccion: MaterialCategory;
  titulo: string;
  items: Recurso[];
}

export function ModuloRecursosSections({
  secciones,
}: {
  secciones: ModuloSeccion[];
}) {
  const defaultOpen = secciones.map((s) => s.seccion);

  return (
    <Accordion
      multiple
      defaultValue={defaultOpen}
      className="rounded-xl border bg-card px-4 shadow-xs ring-1 ring-foreground/10"
    >
      {secciones.map((seccion) => (
        <AccordionItem key={seccion.seccion} value={seccion.seccion}>
          <AccordionTrigger className="py-3.5 text-base font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              {seccion.titulo}
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                {seccion.items.length}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-1 pt-1 pb-4">
            {seccion.items.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Aún no hay material en esta sección.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {seccion.items.map((recurso) => (
                  <RecursoCard key={recurso.id} recurso={recurso} compact />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
