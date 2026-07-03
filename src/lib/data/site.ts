export const siteConfig = {
  name: "ESIWeb",
  organization: "Equipando Siervos Internacional",
  organizationShort: "ESI Colombia",
  tagline: "Discipulado mutuo con el evangelio al centro",
  logo: "/esi-logo.png",
  logoAlt: "Logo ESI — cruz, Biblia y comunidad",
  facebook: "https://www.facebook.com/esicolombia",
  whatsapp: {
    display: "+57 304 466 1901",
    href: "https://wa.me/573044661901",
    message:
      "Hola, me gustaría conocer más sobre Equipando Siervos Internacional en Colombia.",
  },
  internationalSite: "https://equippingservantsinternational.com/",
  location: "Bogotá, Colombia",
  address: "Calle 50a sur # 6-81, Bogotá, Colombia",
} as const;

export function whatsappLink(message?: string) {
  const text = encodeURIComponent(message ?? siteConfig.whatsapp.message);
  return `${siteConfig.whatsapp.href}?text=${text}`;
}
