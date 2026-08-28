export const NA = "Data belum tersedia";
export const CONTACT_SALES = "Hubungi sales untuk informasi terbaru";

export function formatIDR(value, fallback = CONTACT_SALES) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return fallback;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return NA;
  return new Intl.NumberFormat("id-ID").format(Number(value));
}

export function orNA(value) {
  if (value === null || value === undefined || value === "" ||
      (Array.isArray(value) && value.length === 0)) return NA;
  return value;
}

export function formatDate(value) {
  if (!value) return NA;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return NA;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit" });
}

export function countdown(endDate) {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
