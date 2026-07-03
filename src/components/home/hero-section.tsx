"use client";

import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { galleryImages } from "@/lib/data/gallery";
import { siteConfig } from "@/lib/data/site";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 4000;

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setIndex((next + galleryImages.length) % galleryImages.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % galleryImages.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      id="inicio"
      className="scroll-mt-20 relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[min(78vh,580px)] w-full sm:h-[min(82vh,620px)]">
        {/* Slider de fotos a pantalla completa */}
        <div className="absolute inset-0 overflow-hidden">
          {galleryImages.map((image, i) => (
            <div
              key={image.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={i !== index}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Overlay para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/62 to-black/48" />

        {/* Contenido */}
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#d4a574]">
              {siteConfig.organization}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              {siteConfig.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Plataforma educativa para pastores y líderes que caminan juntos en
              el evangelio, con material de estudio y recursos por módulo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink
                href="/login"
                className="h-10 border-0 bg-[#c69152] px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-white hover:bg-[#b58248]"
              >
                Acceder al material
                <ArrowRight className="ml-2 size-4" />
              </ButtonLink>
              <a
                href="#mision"
                className="inline-flex h-10 items-center justify-center border border-white/80 bg-transparent px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
              >
                Conocer ESI
              </a>
            </div>
          </div>
        </div>

        {/* Controles discretos */}
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="absolute top-1/2 left-3 z-20 hidden -translate-y-1/2 rounded-full bg-black/25 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/40 sm:flex"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 rounded-full bg-black/25 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/40 sm:flex"
          aria-label="Foto siguiente"
        >
          <ChevronRight className="size-5" />
        </button>

        <div
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2"
          role="tablist"
          aria-label="Galería de fotos"
        >
          {galleryImages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Foto ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === index
                  ? "w-8 bg-white/90"
                  : "w-2 bg-white/40 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
