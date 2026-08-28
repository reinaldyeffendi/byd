import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Card, PageHeader } from "./ui";
import { formatNumber } from "@/lib/format";

const COLORS = ["#d92d20", "#8a8a8a", "#4b4b4b", "#e5e5e5", "#a33127"];

const StatCard = ({ label, value, sub, testId }) => (
  <Card className="p-6" data-testid={testId}>
    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
    <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
    {sub && <p className="mt-2 text-xs text-white/40">{sub}</p>}
  </Card>
);

const ChartBox = ({ title, children, empty, testId }) => (
  <Card className="p-6" data-testid={testId}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
    <div className="mt-6 h-64">
      {empty ? (
        <div className="flex h-full items-center justify-center text-sm text-white/35"
             data-testid={`${testId}-empty`}>
          Belum ada data untuk periode ini
        </div>
      ) : (
        children
      )}
    </div>
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    api
      .get(`/admin/analytics/overview?days=${days}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        setError(apiError(e));
        toast.error(apiError(e));
      });
  }, [days]);

  if (error)
    return (
      <Card className="p-10 text-sm text-white/60" data-testid="dashboard-error">
        {error}
      </Card>
    );
  if (!data) return <p className="text-white/40" data-testid="dashboard-loading">Memuat analitik…</p>;

  const c = data.cards;

  return (
    <div data-testid="admin-dashboard">
      <PageHeader
        title="Dashboard"
        description="Semua angka diambil langsung dari database. Tidak ada data contoh."
        actions={
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                  data-testid="dashboard-range-select"
                  className="border border-white/15 bg-[#0d0d0d] px-3.5 py-2.5 text-xs uppercase tracking-[0.12em] text-white">
            {[7, 30, 90].map((d) => (
              <option key={d} value={d}>{d} hari terakhir</option>
            ))}
          </select>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Leads" value={formatNumber(c.total_leads)} testId="stat-total-leads" />
        <StatCard label="Leads Baru" value={formatNumber(c.new_leads)} sub={`${days} hari terakhir`}
                  testId="stat-new-leads" />
        <StatCard label="Leads Terkualifikasi" value={formatNumber(c.qualified_leads)} testId="stat-qualified" />
        <StatCard label="Permintaan Test Drive" value={formatNumber(c.test_drives)} testId="stat-test-drives" />
        <StatCard label="Promo Aktif" value={formatNumber(c.active_promotions)} testId="stat-active-promos" />
        <StatCard label="Pengunjung (sesi)" value={formatNumber(c.visitors)} testId="stat-visitors" />
        <StatCard label="Klik WhatsApp" value={formatNumber(c.whatsapp_clicks)} testId="stat-whatsapp" />
        <StatCard label="Conversion Rate" value={`${c.conversion_rate}%`} sub="Lead menjadi Won"
                  testId="stat-conversion" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ChartBox title="Leads per Hari" empty={!data.leads_over_time.length} testId="chart-leads-time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.leads_over_time}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#6b6b6b" fontSize={11} />
              <YAxis stroke="#6b6b6b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Line type="monotone" dataKey="count" stroke="#d92d20" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Leads per Sumber" empty={!data.leads_by_source.length} testId="chart-leads-source">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.leads_by_source} dataKey="count" nameKey="label" outerRadius={90}>
                {data.leads_by_source.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Leads per Model" empty={!data.leads_by_vehicle.length} testId="chart-leads-vehicle">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.leads_by_vehicle}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="#6b6b6b" fontSize={10} />
              <YAxis stroke="#6b6b6b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Bar dataKey="count" fill="#d92d20" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Views per Model" empty={!data.vehicle_views.some((v) => v.count > 0)}
                  testId="chart-vehicle-views">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.vehicle_views}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="#6b6b6b" fontSize={10} />
              <YAxis stroke="#6b6b6b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Bar dataKey="count" fill="#8a8a8a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <Card className="mt-6 p-6" data-testid="funnel-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Conversion Funnel
        </p>
        <div className="mt-6 space-y-4">
          {data.funnel.map((stage) => {
            const max = Math.max(...data.funnel.map((s) => s.count), 1);
            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{stage.stage}</span>
                  <span className="font-medium text-white">{formatNumber(stage.count)}</span>
                </div>
                <div className="mt-2 h-2 w-full bg-white/5">
                  <div className="h-full bg-[#d92d20] transition-all duration-500"
                       style={{ width: `${(stage.count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
