export const Seo = ({ title, description, image, canonical, jsonLd, noindex }) => {
  const set = (selector, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(attrs.tag || "meta");
      Object.entries(attrs.key || {}).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    }
    Object.entries(attrs.set || {}).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  if (typeof document !== "undefined") {
    if (title) document.title = title;
    if (description)
      set('meta[name="description"]', { key: { name: "description" }, set: { content: description } });
    set('meta[name="robots"]', {
      key: { name: "robots" },
      set: { content: noindex ? "noindex, nofollow" : "index, follow" },
    });
    if (title) set('meta[property="og:title"]', { key: { property: "og:title" }, set: { content: title } });
    if (description)
      set('meta[property="og:description"]', { key: { property: "og:description" }, set: { content: description } });
    if (image) set('meta[property="og:image"]', { key: { property: "og:image" }, set: { content: image } });
    set('meta[name="twitter:card"]', { key: { name: "twitter:card" }, set: { content: "summary_large_image" } });
    if (title) set('meta[name="twitter:title"]', { key: { name: "twitter:title" }, set: { content: title } });
    const href = canonical || window.location.origin + window.location.pathname;
    set('link[rel="canonical"]', { tag: "link", key: { rel: "canonical" }, set: { href } });
    const existing = document.getElementById("byd-jsonld");
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = "byd-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }

  return null;
};

export default Seo;
