import { SocialLinks } from "@/components/brand/social-links";
import {
  SectionIntro,
  SectionLabel,
  SectionTitle,
} from "@/components/home/section-heading";
import { ButtonAnchor } from "@/components/ui/button-link";
import { siteConfig, whatsappLink } from "@/lib/data/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ContactSection() {
  return (
    <section
      id="contacto"
      className="scroll-mt-20 border-t bg-muted/30 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionLabel>Contacto</SectionLabel>
          <SectionTitle>Comunícate con nosotros</SectionTitle>
          <SectionIntro>
            Escríbenos por WhatsApp o síguenos en Facebook para conocer más sobre
            ESI Colombia y cómo unirte a un grupo.
          </SectionIntro>
        </div>

        <Card className="mt-10 max-w-xl border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="font-medium">Información de contacto</CardTitle>
            <CardDescription>
              {siteConfig.organizationShort} — {siteConfig.location}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <SocialLinks className="flex flex-col gap-3" />

            <ButtonAnchor
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]"
            >
              Escribir por WhatsApp
            </ButtonAnchor>

            <p>
              <strong className="text-foreground">Dirección:</strong>
              <br />
              {siteConfig.address}
            </p>
            <p>
              <strong className="text-foreground">Sitio internacional:</strong>
              <br />
              <a
                href={siteConfig.internationalSite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c69152] hover:underline"
              >
                equippingservantsinternational.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
