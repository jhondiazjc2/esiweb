import { Upload } from "lucide-react";
import { materialesModulo1 } from "@/lib/data/modulos";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminMaterialPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Material de estudio</h1>
          <p className="mt-1 text-muted-foreground">
            Sube y edita PDFs por módulo
          </p>
        </div>
        <Button disabled>
          <Upload className="size-4" />
          Subir archivo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo 1 — archivos registrados</CardTitle>
          <CardDescription>
            {materialesModulo1.length} documentos en el catálogo local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {materialesModulo1.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>{m.titulo}</span>
                <span className="text-xs text-muted-foreground">{m.archivo}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
