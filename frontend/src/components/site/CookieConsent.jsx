import { useState } from "react";
import { Link } from "react-router-dom";
import { hasConsentChoice, setConsent } from "@/lib/tracking";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(!hasConsentChoice());
  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      data-testid="cookie-consent"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-[#111111]"
    >
      <div className="container-byd flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-white/65">
          Kami menggunakan cookie untuk mengingat model yang Anda lihat dan mengukur performa kampanye.{" "}
          <Link to="/cookie-policy" className="underline hover:text-white">
            Kebijakan Cookie
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => choose("denied")}
            data-testid="cookie-decline"
            className="border border-white/20 px-5 py-3 text-xs uppercase tracking-[0.14em] text-white/70"
          >
            Tolak
          </button>
          <button
            onClick={() => choose("granted")}
            data-testid="cookie-accept"
            className="bg-[#d92d20] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white"
          >
            Terima
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
