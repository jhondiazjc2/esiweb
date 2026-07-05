import { Download, ExternalLink, FileText, Video } from "lucide-react";
import {
  categoryLabels,
  extractYoutubeId,
  tipoLabels,
} from "@/lib/modules/constants";
import type { Recurso } from "@/lib/types";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function RecursoAction({ recurso }: { recurso: Recurso }) {
  if (recurso.tipo === "youtube" && recurso.url) {
    return (
      <ButtonAnchor href={recurso.url} target="_blank" size="sm" variant="outline">
        <Video className="size-4" />
        Ver video
      </ButtonAnchor>
    );
  }

  if (recurso.tipo === "enlace" && recurso.url) {
    return (
      <ButtonAnchor href={recurso.url} target="_blank" size="sm" variant="outline">
        <ExternalLink className="size-4" />
        Abrir enlace
      </ButtonAnchor>
    );
  }

  if (recurso.tipo === "documento") {
    return (
      <ButtonAnchor
        href={`/api/material/${recurso.id}`}
        download
        size="sm"
        variant="outline"
      >
        <Download className="size-4" />
        Descargar
      </ButtonAnchor>
    );
  }

  if (recurso.url) {
    return (
      <ButtonAnchor href={recurso.url} target="_blank" size="sm" variant="outline">
        <ExternalLink className="size-4" />
        Abrir
      </ButtonAnchor>
    );
  }

  return null;
}

function YoutubeEmbed({ url }: { url: string }) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;

  return (
    <div className="mt-4 aspect-video overflow-hidden rounded-lg border">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Video de YouTube"
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function RecursoCard({ recurso }: { recurso: Recurso }) {
  const Icon =
    recurso.tipo === "youtube"
      ? Video
      : recurso.tipo === "enlace"
        ? ExternalLink
        : FileText;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{recurso.titulo}</CardTitle>
            <Badge variant="outline">{categoryLabels[recurso.categoria]}</Badge>
            <Badge variant="secondary">{tipoLabels[recurso.tipo]}</Badge>
          </div>
          {recurso.descripcion && (
            <CardDescription className="mt-1">{recurso.descripcion}</CardDescription>
          )}
          {recurso.tipo === "youtube" && recurso.url && (
            <YoutubeEmbed url={recurso.url} />
          )}
        </div>
        <RecursoAction recurso={recurso} />
      </CardHeader>
    </Card>
  );
}
