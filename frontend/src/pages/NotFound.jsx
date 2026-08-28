import { Link } from "react-router-dom";
import Seo from "@/components/site/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Halaman tidak ditemukan" noindex />
      <section className="container-byd flex min-h-[70vh] flex-col justify-center pb-28 pt-28"
               data-testid="not-found-page">
        <p className="overline">Error 404</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tighter text-white sm:text-6xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-5 max-w-xl text-white/55">
          Tautan yang Anda buka mungkin sudah dipindahkan atau tidak lagi tersedia.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/" className="btn-primary-byd" data-testid="notfound-home-cta">Kembali ke Home</Link>
          <Link to="/models" className="btn-ghost-byd" data-testid="notfound-models-cta">Lihat Model</Link>
        </div>
      </section>
    </>
  );
}
