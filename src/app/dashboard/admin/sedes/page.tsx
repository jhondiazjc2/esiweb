import { Plus } from "lucide-react";
import { sedesDemo } from "@/lib/data/sedes-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSedesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sedes</h1>
          <p className="mt-1 text-muted-foreground">
            Administra las sedes ESI en Colombia
          </p>
        </div>
        <Button disabled>
          <Plus className="size-4" />
          Nueva sede
        </Button>
      </div>

      <div className="grid gap-4">
        {sedesDemo.map((sede) => (
          <Card key={sede.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{sede.nombre}</CardTitle>
                <CardDescription>{sede.ciudad}</CardDescription>
              </div>
              <Badge variant={sede.activa ? "secondary" : "outline"}>
                {sede.activa ? "Activa" : "Inactiva"}
              </Badge>
            </CardHeader>
            {sede.contacto && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{sede.contacto}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
