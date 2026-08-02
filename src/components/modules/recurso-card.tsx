"use client";

import type { ReactNode } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Play,
  Video,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function IconActionLink({
  label,
  href,
  download,
  target,
  children,
}: {
  label: string;
  href: string;
  download?: boolean;
  target?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ButtonAnchor
            href={href}
            download={download}
            target={target}
            size="icon-sm"
            variant="outline"
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function RecursoAction({ recurso }: { recurso: Recurso }) {
  if (recurso.tipo === "youtube" && recurso.url) {
    return (
      <IconActionLink label="Ver video" href={recurso.url} target="_blank">
        <Video />
      </IconActionLink>
    );
  }

  if (recurso.tipo === "enlace" && recurso.url) {
    return (
      <IconActionLink label="Abrir enlace" href={recurso.url} target="_blank">
        <ExternalLink />
      </IconActionLink>
    );
  }

  if (recurso.tipo === "documento") {
    const hasFile =
      Boolean(recurso.storage_path) &&
      !recurso.storage_path!.startsWith("bind:") &&
      !recurso.storage_path!.startsWith("folder-");
    const hasExternalUrl =
      Boolean(recurso.url) &&
      !recurso.url!.startsWith("esi-folder:") &&
      (recurso.url!.startsWith("http://") ||
        recurso.url!.startsWith("https://"));

    if (!hasFile && !hasExternalUrl) {
      return (
        <span className="text-xs text-muted-foreground">Sin archivo</span>
      );
    }

    return (
      <IconActionLink
        label="Descargar"
        href={`/api/material/${recurso.id}`}
        download
      >
        <Download />
      </IconActionLink>
    );
  }

  if (recurso.url) {
    return (
      <IconActionLink label="Abrir" href={recurso.url} target="_blank">
        <ExternalLink />
      </IconActionLink>
    );
  }

  return null;
}

function YoutubeEmbed({
  url,
  compact = false,
}: {
  url: string;
  compact?: boolean;
}) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;

  // Compact: thumbnail + play (YouTube iframe chrome does not scale down well)
  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-1.5 block w-full max-w-[11.5rem] overflow-hidden rounded-md border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Ver video en YouTube"
      >
        <img
          src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
          alt=""
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
          <span className="flex size-6 items-center justify-center rounded-full bg-black/70 text-white shadow-sm">
            <Play className="size-3 fill-current" />
          </span>
        </span>
      </a>
    );
  }

  return (
    <div className="mt-3 aspect-video overflow-hidden rounded-md border">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Video de YouTube"
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export function RecursoCard({
  recurso,
  compact = false,
  actions,
}: {
  recurso: Recurso;
  compact?: boolean;
  actions?: ReactNode;
}) {
  const Icon =
    recurso.tipo === "youtube"
      ? Video
      : recurso.tipo === "enlace"
        ? ExternalLink
        : FileText;

  const actionRow = (
    <div className={cn("flex items-center gap-1.5", compact && "pt-0.5")}>
      <RecursoAction recurso={recurso} />
      {actions}
    </div>
  );

  if (compact) {
    return (
      <Card size="sm" className="h-full">
        <CardHeader className="gap-2">
          <div className="flex items-start gap-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm leading-snug">
                {recurso.titulo}
              </CardTitle>
              {recurso.descripcion && (
                <CardDescription className="mt-1 line-clamp-2 text-xs">
                  {recurso.descripcion}
                </CardDescription>
              )}
            </div>
          </div>
          {recurso.tipo === "youtube" && recurso.url && (
            <YoutubeEmbed url={recurso.url} compact />
          )}
          {actionRow}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{recurso.titulo}</CardTitle>
            <Badge variant="outline">{categoryLabels[recurso.categoria]}</Badge>
            <Badge variant="secondary">{tipoLabels[recurso.tipo]}</Badge>
          </div>
          {recurso.descripcion && (
            <CardDescription className="mt-1">
              {recurso.descripcion}
            </CardDescription>
          )}
          {recurso.tipo === "youtube" && recurso.url && (
            <YoutubeEmbed url={recurso.url} />
          )}
        </div>
        {actionRow}
      </CardHeader>
    </Card>
  );
}
