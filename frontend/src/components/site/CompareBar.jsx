import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { getCompare, clearCompare, toggleCompare } from "@/lib/tracking";

export const CompareBar = () => {
  const [list, setList] = useState(getCompare());

  useEffect(() => {
    const handler = () => setList(getCompare());
    window.addEventListener("byd-compare-change", handler);
    return () => window.removeEventListener("byd-compare-change", handler);
  }, []);

  if (!list.length) return null;

  return (
    <div
      data-testid="compare-bar"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 backdrop-blur-xl"
    >
      <div className="container-byd flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="overline">Bandingkan ({list.length}/3)</span>
          {list.map((slug) => (
            <button
              key={slug}
              onClick={() => setList(toggleCompare(slug))}
              data-testid={`compare-remove-${slug}`}
              className="flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/80 transition-colors duration-300 hover:border-[#d92d20]"
            >
              {slug.replace(/-/g, " ")}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearCompare();
              setList([]);
            }}
            data-testid="compare-clear"
            className="text-xs uppercase tracking-[0.14em] text-white/50 hover:text-white"
          >
            Reset
          </button>
          <Link
            to={`/compare?models=${list.join(",")}`}
            data-testid="compare-go"
            className="bg-[#d92d20] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
          >
            Lihat Perbandingan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
