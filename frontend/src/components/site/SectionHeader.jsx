export const SectionHeader = ({ overline, title, subtitle, action, align = "left" }) => (
  <div
    className={`flex flex-col gap-6 ${align === "left" ? "md:flex-row md:items-end md:justify-between" : "items-start"}`}
  >
    <div className="max-w-2xl">
      {overline && <p className="overline">{overline}</p>}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-white/55">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ title, description, action, testId = "empty-state" }) => (
  <div
    data-testid={testId}
    className="flex flex-col items-start gap-3 border border-dashed border-white/15 bg-[#0e0e0e] p-10"
  >
    <p className="text-lg font-semibold text-white">{title}</p>
    {description && <p className="max-w-xl text-sm text-white/50">{description}</p>}
    {action}
  </div>
);

export const SkeletonGrid = ({ count = 3, className = "" }) => (
  <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`} data-testid="loading-skeleton">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse border border-white/10 bg-[#111111]">
        <div className="aspect-[16/10] w-full bg-white/5" />
        <div className="space-y-3 p-6">
          <div className="h-3 w-20 bg-white/10" />
          <div className="h-5 w-2/3 bg-white/10" />
          <div className="h-3 w-full bg-white/5" />
          <div className="h-3 w-4/5 bg-white/5" />
        </div>
      </div>
    ))}
  </div>
);

export default SectionHeader;
