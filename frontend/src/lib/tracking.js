import { api } from "./api";

const SESSION_KEY = "byd_session_id";
const UTM_KEY = "byd_utm";
const VIEWED_KEY = "byd_viewed_vehicles";
const COMPARE_KEY = "byd_compare";
const CONSENT_KEY = "byd_consent";

function uuid() {
  return (crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

export function sessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function captureUtm() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const found = {};
  keys.forEach((k) => {
    const v = params.get(k);
    if (v) found[k] = v;
  });
  if (Object.keys(found).length) {
    localStorage.setItem(UTM_KEY, JSON.stringify({ ...getUtm(), ...found }));
  }
  return getUtm();
}

export function getUtm() {
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || "{}");
  } catch {
    return {};
  }
}

export function device() {
  return window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
}

export function attribution(extra = {}) {
  return {
    ...getUtm(),
    session_id: sessionId(),
    device: device(),
    landing_page: window.location.pathname,
    campaign: getUtm().utm_campaign || null,
    ...extra,
  };
}

export function consentGiven() {
  return localStorage.getItem(CONSENT_KEY) === "granted";
}

export function setConsent(value) {
  localStorage.setItem(CONSENT_KEY, value);
}

export function hasConsentChoice() {
  return localStorage.getItem(CONSENT_KEY) !== null;
}

export function track(event, payload = {}) {
  if (!consentGiven() && event !== "page_view") return;
  const body = { event, path: window.location.pathname, ...attribution(), ...payload };
  api.post("/public/track", body).catch(() => {});
  const w = window;
  if (w.gtag) w.gtag("event", event, payload);
  if (w.fbq) w.fbq("trackCustom", event, payload);
  if (w.ttq) w.ttq.track(event, payload);
}

export function recordViewedVehicle(slug) {
  if (!slug) return;
  const list = getViewedVehicles().filter((v) => v.slug !== slug);
  list.unshift({ slug, at: Date.now() });
  localStorage.setItem(VIEWED_KEY, JSON.stringify(list.slice(0, 8)));
}

export function getViewedVehicles() {
  try {
    return JSON.parse(localStorage.getItem(VIEWED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCompare() {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleCompare(slug) {
  const list = getCompare();
  let next;
  if (list.includes(slug)) next = list.filter((s) => s !== slug);
  else if (list.length >= 3) next = [...list.slice(1), slug];
  else next = [...list, slug];
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("byd-compare-change"));
  return next;
}

export function clearCompare() {
  localStorage.setItem(COMPARE_KEY, "[]");
  window.dispatchEvent(new Event("byd-compare-change"));
}

export function whatsappLink(settings, templateKey, vars = {}, extraMessage) {
  const number = settings?.whatsapp_number || "";
  const templates = settings?.whatsapp_templates || {};
  let text = templates[templateKey] || templates.general || "Hi {sales}, saya ingin bertanya tentang BYD.";
  text = text
    .replace(/\{sales\}/g, (settings?.sales_consultant || "Sales").split(" ")[0])
    .replace(/\{model\}/g, vars.model || "")
    .replace(/\{promotion\}/g, vars.promotion || "")
    .replace(/\{dealer\}/g, settings?.dealer_name || "");
  if (extraMessage) text += `\n\n${extraMessage}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
