import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (res.ok) navigate("/admin", { replace: true });
    else setError(res.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-5" data-testid="admin-login-page">
      <form onSubmit={submit} className="w-full max-w-md border border-white/10 bg-[#111111] p-8 sm:p-10">
        <ShieldCheck className="h-7 w-7 text-[#d92d20]" />
        <h1 className="mt-6 font-display text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-white/50">Masuk untuk mengelola konten dan prospek penjualan.</p>

        <div className="mt-8 space-y-7">
          <div>
            <label htmlFor="admin-email" className="overline">Email</label>
            <input id="admin-email" type="email" required data-testid="admin-email-input"
                   className="field-byd mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="admin-password" className="overline">Password</label>
            <input id="admin-password" type="password" required data-testid="admin-password-input"
                   className="field-byd mt-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        {error && (
          <p className="mt-6 border border-[#d92d20]/40 bg-[#d92d20]/10 px-4 py-3 text-sm text-[#fca5a5]"
             data-testid="admin-login-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} data-testid="admin-login-submit"
                className="btn-primary-byd mt-8 w-full disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
