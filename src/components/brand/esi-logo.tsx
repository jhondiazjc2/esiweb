"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/data/site";
import { cn } from "@/lib/utils";

interface EsiLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  linked?: boolean;
  onNavigateHome?: () => void;
}

const sizes = {
  sm: { image: 36, text: "text-base" },
  md: { image: 44, text: "text-lg" },
  lg: { image: 80, text: "text-2xl" },
};

export function EsiLogo({
  size = "sm",
  showText = true,
  className,
  linked = true,
  onNavigateHome,
}: EsiLogoProps) {
  const { image, text } = sizes[size];

  const content = (
    <>
      <Image
        src={siteConfig.logo}
        alt={siteConfig.logoAlt}
        width={image}
        height={image}
        className="rounded-md object-contain"
        style={{ width: "auto", height: "auto", maxWidth: image, maxHeight: image }}
        priority={size === "lg"}
      />
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className={cn(text, "tracking-tight")}>ESIWeb</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            Colombia
          </span>
        </span>
      )}
    </>
  );

  const wrapperClass = cn("flex items-center gap-2.5 font-semibold", className);

  if (!linked) {
    return <div className={wrapperClass}>{content}</div>;
  }

  return (
    <Link
      href="/"
      onClick={(e) => {
        if (onNavigateHome) {
          e.preventDefault();
          onNavigateHome();
        }
      }}
      className={wrapperClass}
    >
      {content}
    </Link>
  );
}
