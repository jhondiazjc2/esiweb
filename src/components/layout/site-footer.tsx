import Image from "next/image";
import { landingSections } from "@/lib/data/landing-sections";
import { SocialLinks } from "@/components/brand/social-links";
import { siteConfig } from "@/lib/data/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <Image
            src={siteConfig.logo}
            alt={siteConfig.logoAlt}
            width={48}
            height={48}
            className="shrink-0 rounded-md object-contain"
          />
          <div>
            <p className="font-semibold">{siteConfig.organization}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {siteConfig.tagline} — Colombia
            </p>
            <SocialLinks className="mt-3 flex flex-col gap-2" />
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
          <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
            {landingSections.map((section) => (
              <a
                key={section.id}
                href={`/#${section.id}`}
                className="hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <a
              href={siteConfig.internationalSite}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Sitio internacional ESI
            </a>
            <a href="/login" className="hover:text-foreground">
              Ingresar
            </a>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.organizationShort}
      </div>
    </footer>
  );
}
