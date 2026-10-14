export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "center" | "left";
}) {
  const alignment =
    align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <div className={`flex max-w-2xl flex-col ${alignment}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground text-pretty">{subtitle}</p>
    </div>
  );
}
