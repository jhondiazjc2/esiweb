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

const notasDemo = [
  { estudiante: "Juan Pérez", semana: 1, nota: "4.5", observacion: "Completo" },
  { estudiante: "Juan Pérez", semana: 2, nota: "4.0", observacion: "Completo" },
  { estudiante: "María Gómez", semana: 1, nota: "5.0", observacion: "Excelente" },
  { estudiante: "María Gómez", semana: 2, nota: "—", observacion: "Pendiente" },
];

export default function NotasPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notas y seguimiento</h1>
        <p className="mt-1 text-muted-foreground">
          Registra el avance semanal de cada estudiante
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo 1 — Semanas 1-2</CardTitle>
          <CardDescription>
            Vista de demostración — se conectará a Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Semana</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasDemo.map((n, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{n.estudiante}</TableCell>
                  <TableCell>{n.semana}</TableCell>
                  <TableCell>{n.nota}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {n.observacion}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
