import { ArrowRight, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SectionIntro,
  SectionLabel,
  SectionTitle,
} from "@/components/home/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sedesDemo } from "@/lib/data/sedes-demo";
import { ContactSection } from "@/components/home/contact-section";

export { HeroSection } from "@/components/home/hero-section";

export function AboutSection() {
  const features = [
    {
      icon: BookOpen,
      title: "6 módulos semestrales",
      description:
        "Un proceso de tres años con estudio bíblico personal y reuniones grupales semanales de 2.5 horas.",
    },
    {
      icon: Users,
      title: "Grupos por sede",
      description:
        "Pastores y líderes de distintas iglesias caminan juntos en unidad evangélica y amistad bíblica.",
    },
    {
      icon: ArrowRight,
      title: "Material accesible",
      description:
        "Estudiantes consultan y descargan lecturas, paquetes semanales y guías desde cualquier dispositivo.",
    },
  ];

  return (
    <section id="esi" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionLabel>¿Qué es ESI?</SectionLabel>
      <SectionTitle>Discipulado mutuo con la Palabra al centro</SectionTitle>
      <SectionIntro className="max-w-2xl">
        ESI no es una iglesia ni un seminario, sino un contexto de discipulado
        mutuo donde líderes evangélicos estudian la Palabra y se edifican
        mutuamente.
      </SectionIntro>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-border/60 shadow-none">
            <CardHeader>
              <feature.icon className="mb-2 size-7 text-[#c69152]" />
              <CardTitle className="text-base font-medium">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function MissionSection() {
  return (
    <section
      id="mision"
      className="scroll-mt-20 border-t bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionLabel>Misión y visión</SectionLabel>
          <SectionTitle>Quiénes somos y hacia dónde vamos</SectionTitle>
          <SectionIntro>Equipando Siervos Internacional — Colombia</SectionIntro>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="font-medium">¿Quiénes somos?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                ESI es un proceso de discipulado mutuo de tres años diseñado
                para animar a pastores y líderes de iglesia a honrar a Cristo
                siendo fieles a las Escrituras. No somos una iglesia,
                denominación ni seminario, sino un contexto en el que líderes de
                distintas iglesias evangélicas caminan juntos en el evangelio.
              </p>
              <p>
                Nuestro enfoque es Jesús. Por eso dedicamos tiempo a estudiar Su
                Palabra. Estamos apasionados por honrar a Cristo fortaleciendo
                iglesias locales para hacer discípulos y evangelizar.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="font-medium">Visión</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              <p>
                En nuestras reuniones grupales semanales de ESI, discutimos la
                Biblia, oramos y compartimos avances en nuestra vida en Cristo.
                Nos comprometemos a no caminar solos, sino a formar amistades
                centradas en el evangelio y ayudarnos mutuamente a crecer en
                nuestra caminata con Cristo.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="font-medium">Misión</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              <p>
                El plan de estudio de ESI se basa en la Biblia como autoridad
                final. Creemos que el Espíritu Santo guiará al pueblo de Dios a
                Su verdad mientras estudiamos Su Palabra, para conocer a Jesús,
                confiar en Su ayuda y ser cada vez más semejantes a Él en
                nuestra vida diaria y servicio.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="font-medium">El método ESI</CardTitle>
              <CardDescription>
                Cada semana tiene dos partes: tarea personal y reunión grupal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Tarea personal:</strong>{" "}
                  estudio bíblico del pasaje asignado y lectura de habilidades
                  ministeriales con un párrafo de resumen.
                </li>
                <li>
                  <strong className="text-foreground">
                    Reunión grupal (2.5 h):
                  </strong>{" "}
                  discusión del estudio bíblico, discusión de la lectura
                  ministerial y grupos de transparencia y rendición de cuentas.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function ModulesSection() {
  const modules = [
    "Fundamentos para estudiar la Biblia",
    "Fundamentos para entender el evangelio",
    "Fundamentos para la vida santa",
    "Fundamentos para la predicación bíblica",
    "Fundamentos para el liderazgo y consejería",
    "Fundamentos para impactar el mundo bíblicamente",
  ];

  return (
    <section
      id="programa"
      className="scroll-mt-20 border-t py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionLabel>Programa</SectionLabel>
          <SectionTitle>Seis módulos semestrales</SectionTitle>
          <SectionIntro>
            Un proceso de tres años con 15 semanas por módulo, alineado con el
            calendario académico local.
          </SectionIntro>
        </div>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2">
          {modules.map((title, index) => (
            <li
              key={title}
              className="flex gap-3 rounded-lg border border-border/60 bg-card p-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#c69152] text-sm font-medium text-white">
                {index + 1}
              </span>
              <span className="text-sm font-medium leading-snug">{title}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function GroupsSection() {
  return (
    <section
      id="grupos"
      className="scroll-mt-20 border-t bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionLabel>Grupos</SectionLabel>
          <SectionTitle>Sedes en Colombia</SectionTitle>
          <SectionIntro>
            Grupos de discipulado mutuo por ciudad. Cada grupo reúne entre 10 y
            15 participantes una vez por semana.
          </SectionIntro>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sedesDemo.map((sede) => (
            <Card key={sede.id} className="border-border/60 shadow-none">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-medium">{sede.nombre}</CardTitle>
                  <CardDescription>{sede.ciudad}</CardDescription>
                </div>
                {sede.activa && <Badge variant="secondary">Activa</Badge>}
              </CardHeader>
              {sede.contacto && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    <a
                      href={`mailto:${sede.contacto}`}
                      className="text-primary hover:underline"
                    >
                      {sede.contacto}
                    </a>
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          ¿Interesado en unirte?{" "}
          <a href="#contacto" className="text-[#c69152] hover:underline">
            Escríbenos
          </a>{" "}
          o habla con el facilitador de la sede más cercana.
        </p>
      </div>
    </section>
  );
}

export { ContactSection };
