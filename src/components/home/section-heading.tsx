export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#c69152]">
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

export function SectionIntro({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mt-3 text-[15px] leading-relaxed text-[#717171] sm:text-base ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
