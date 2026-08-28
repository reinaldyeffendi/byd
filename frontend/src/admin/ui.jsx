export const Card = ({ children, className = "", ...rest }) => (
  <div className={`border border-white/10 bg-[#111111] ${className}`} {...rest}>
    {children}
  </div>
);

export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-white/50">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

const STATUS_STYLES = {
  published: "border-emerald-500/40 text-emerald-300",
  active: "border-emerald-500/40 text-emerald-300",
  confirmed: "border-emerald-500/40 text-emerald-300",
  won: "border-emerald-500/40 text-emerald-300",
  draft: "border-white/25 text-white/60",
  requested: "border-amber-500/40 text-amber-300",
  new: "border-sky-500/40 text-sky-300",
  scheduled: "border-sky-500/40 text-sky-300",
  archived: "border-white/15 text-white/35",
  expired: "border-white/15 text-white/35",
  cancelled: "border-red-500/40 text-red-300",
  lost: "border-red-500/40 text-red-300",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-block border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
    STATUS_STYLES[status] || "border-white/25 text-white/60"
  }`}>
    {String(status || "-").replace(/_/g, " ")}
  </span>
);

export const AdminButton = ({ variant = "primary", className = "", as, ...rest }) => {
  const styles = {
    primary: "bg-[#d92d20] text-white hover:-translate-y-0.5",
    ghost: "border border-white/20 text-white/80 hover:bg-white/5",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-transform duration-200 disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  );
};

export const Field = ({ label, children, hint, required }) => (
  <div>
    <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
      {label} {required && <span className="text-[#d92d20]">*</span>}
    </label>
    <div className="mt-2">{children}</div>
    {hint && <p className="mt-2 text-xs text-white/35">{hint}</p>}
  </div>
);

export const inputClass =
  "w-full border border-white/15 bg-[#0d0d0d] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#d92d20] focus:outline-none";

export const EmptyRow = ({ colSpan, message, testId = "admin-empty-state" }) => (
  <tr>
    <td colSpan={colSpan} className="px-5 py-16 text-center text-sm text-white/40" data-testid={testId}>
      {message}
    </td>
  </tr>
);
