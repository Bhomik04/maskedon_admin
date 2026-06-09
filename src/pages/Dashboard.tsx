import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api";

interface Stats {
  users: { total: number; active: number; deleted: number };
  events: { total: number; upcoming: number; ongoing: number; completed: number; cancelled: number };
  reports: { total: number; open: number };
  bugReports: { total: number; open: number };
  payments: { total: number; completed: number; refunded: number; revenue: number };
  photos: { total: number };
}

function StatCard({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-[#6c63ff]/50 transition-colors" : ""}`}
    >
      <div className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-[#6b7280] mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Stats>("/admin/stats")
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Dashboard">
        <div className="text-[#6b7280] text-sm">Loading stats…</div>
      </Layout>
    );
  }

  const revenueInRupees = (stats.payments.revenue / 100).toFixed(2);

  return (
    <Layout title="Dashboard" subtitle="Platform overview">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.users.total}
          sub={`${stats.users.active} active · ${stats.users.deleted} banned`}
          onClick={() => navigate("/users")}
        />
        <StatCard
          label="Total Events"
          value={stats.events.total}
          sub={`${stats.events.upcoming} upcoming · ${stats.events.ongoing} ongoing`}
          onClick={() => navigate("/events")}
        />
        <StatCard
          label="Open Reports"
          value={stats.reports.open}
          sub={`${stats.reports.total} total`}
          color={stats.reports.open > 0 ? "text-red-400" : "text-white"}
          onClick={() => navigate("/reports")}
        />
        <StatCard
          label="Open Bug Reports"
          value={stats.bugReports.open}
          sub={`${stats.bugReports.total} total`}
          color={stats.bugReports.open > 0 ? "text-orange-400" : "text-white"}
          onClick={() => navigate("/bug-reports")}
        />
        <StatCard
          label="Revenue"
          value={`₹${revenueInRupees}`}
          sub={`${stats.payments.completed} completed · ${stats.payments.refunded} refunded`}
          color="text-green-400"
          onClick={() => navigate("/payments")}
        />
        <StatCard
          label="Photos"
          value={stats.photos.total}
          onClick={() => navigate("/photos")}
        />
        <StatCard
          label="Events Completed"
          value={stats.events.completed}
          sub={`${stats.events.cancelled} cancelled`}
        />
        <StatCard
          label="Payments Total"
          value={stats.payments.total}
          sub={`${stats.payments.refunded} refunded`}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Event Status Breakdown</h3>
          {(["upcoming", "ongoing", "completed", "cancelled"] as const).map((s) => {
            const count = stats.events[s];
            const pct = stats.events.total > 0 ? (count / stats.events.total) * 100 : 0;
            const colors: Record<string, string> = {
              upcoming: "bg-blue-500",
              ongoing: "bg-green-500",
              completed: "bg-gray-500",
              cancelled: "bg-red-500",
            };
            return (
              <div key={s} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9ca3af] capitalize">{s}</span>
                  <span className="text-white">{count}</span>
                </div>
                <div className="h-1.5 bg-[#2a2d3e] rounded-full">
                  <div
                    className={`h-full rounded-full ${colors[s]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "View open reports", href: "/reports?status=open", badge: stats.reports.open, color: "text-red-400" },
              { label: "View critical bugs", href: "/bug-reports?severity=critical", badge: null, color: "text-orange-400" },
              { label: "View pending payments", href: "/payments?status=pending", badge: null, color: "text-yellow-400" },
              { label: "View all users", href: "/users", badge: stats.users.total, color: "text-blue-400" },
              { label: "Financial ops & refunds", href: "/financial", badge: null, color: "text-green-400" },
              { label: "KYC verification queue", href: "/verifications?status=pending", badge: null, color: "text-purple-400" },
              { label: "Send push notification", href: "/notifications", badge: null, color: "text-[#6c63ff]" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f1117] hover:bg-white/5 transition-colors text-sm text-[#9ca3af] hover:text-white"
              >
                <span>{action.label}</span>
                {action.badge !== null && action.badge !== undefined && action.badge > 0 && (
                  <span className={`text-xs font-medium ${action.color}`}>{action.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
