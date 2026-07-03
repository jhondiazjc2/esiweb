"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { EsiLogo } from "@/components/brand/esi-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  landingSections,
  type LandingSectionId,
} from "@/lib/data/landing-sections";
import { cn } from "@/lib/utils";

function scrollToSection(id: LandingSectionId) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }
}

function NavAnchor({
  sectionId,
  label,
  active,
  onNavigate,
}: {
  sectionId: LandingSectionId;
  label: string;
  active: boolean;
  onNavigate: (id: LandingSectionId) => void;
}) {
  return (
    <a
      href={`/#${sectionId}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(sectionId);
      }}
      className={cn(
        "rounded-md px-3 py-2 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors hover:text-[#c69152]",
        active ? "text-[#c69152]" : "text-[#717171]",
      )}
    >
      {label}
    </a>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [activeSection, setActiveSection] = useState<LandingSectionId>("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = useCallback((id: LandingSectionId) => {
    if (isHome) {
      scrollToSection(id);
      setMobileOpen(false);
    } else {
      window.location.href = `/#${id}`;
    }
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;

    const hash = window.location.hash.replace("#", "") as LandingSectionId;
    if (landingSections.some((s) => s.id === hash)) {
      requestAnimationFrame(() => scrollToSection(hash));
    }

    const sectionElements = landingSections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as LandingSectionId);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <EsiLogo
          onNavigateHome={
            isHome ? () => handleNavigate("inicio") : undefined
          }
        />

        <nav className="hidden items-center gap-1 md:flex">
          {landingSections.map((link) => (
            <NavAnchor
              key={link.id}
              sectionId={link.id}
              label={link.label}
              active={isHome && activeSection === link.id}
              onNavigate={handleNavigate}
            />
          ))}
          <ButtonLink
            href="/login"
            size="sm"
            className="ml-2 border-0 bg-[#c69152] text-[13px] uppercase tracking-[0.08em] text-white hover:bg-[#b58248]"
          >
            Ingresar
          </ButtonLink>
        </nav>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" />
            }
          >
            <Menu className="size-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>ESIWeb Colombia</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              {landingSections.map((link) => (
                <NavAnchor
                  key={link.id}
                  sectionId={link.id}
                  label={link.label}
                  active={isHome && activeSection === link.id}
                  onNavigate={handleNavigate}
                />
              ))}
              <ButtonLink href="/login" className="mt-4">
                Ingresar
              </ButtonLink>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
