import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const estudiantesDemo = [
  { nombre: "Juan Pérez", email: "juan@esi.co", modulo: 1, sede: "Bogotá Norte" },
  { nombre: "María Gómez", email: "maria@esi.co", modulo: 1, sede: "Bogotá Norte" },
];

export default function EstudiantesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estudiantes</h1>
          <p className="mt-1 text-muted-foreground">
            Crea y administra las cuentas de tu grupo
          </p>
        </div>
        <Button disabled>
          <Plus className="size-4" />
          Nuevo estudiante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grupo actual</CardTitle>
          <CardDescription>
            Vista de demostración — se conectará a Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Sede</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantesDemo.map((e) => (
                <TableRow key={e.email}>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell>{e.modulo}</TableCell>
                  <TableCell>{e.sede}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
