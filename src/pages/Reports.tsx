import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api";

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_username: string;
  reporter_display_name: string;
}

const REPORT_STATUSES = ["", "open", "reviewed", "resolved", "dismissed"];

export default function Reports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "open");
  const [confirm, setConfirm] = useState<{ report: Report; newStatus: string } | null>(null);
  const [actionError, setActionError] = useState("");
  const [detail, setDetail] = useState<Report | null>(null);
  const limit = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter && { status: statusFilter }),
      });
      const data = await api.get<{ reports: Report[]; total: number }>(`/admin/reports?${params}`);
      setReports(data.reports);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleStatusChange(report: Report, newStatus: string) {
    setActionError("");
    try {
      await api.patch(`/admin/reports/${report.id}`, { status: newStatus });
      fetchReports();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  const columns = [
    {
      key: "reporter",
      label: "Reporter",
      render: (r: Report) => (
        <div>
          <div className="text-sm text-white">{r.reporter_display_name}</div>
          <div className="text-xs text-[#6b7280]">@{r.reporter_username}</div>
        </div>
      ),
    },
    {
      key: "target_type",
      label: "Target",
      render: (r: Report) => (
        <div>
          <Badge value={r.target_type} />
          <div className="text-xs text-[#6b7280] mt-1 font-mono">{r.target_id.slice(0, 8)}…</div>
        </div>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (r: Report) => (
        <span className="text-sm capitalize">{r.reason.replace(/_/g, " ")}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (r: Report) => (
        <span className="text-sm text-[#9ca3af] max-w-xs truncate block">
          {r.description || <span className="text-[#4b5563]">—</span>}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Reported",
      render: (r: Report) => (
        <span className="text-xs text-[#6b7280]">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r: Report) => <Badge value={r.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: Report) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetail(r)}
            className="px-2 py-1 text-xs rounded bg-[#6c63ff]/20 text-[#6c63ff] hover:bg-[#6c63ff]/30 transition-colors"
          >
            View
          </button>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setConfirm({ report: r, newStatus: e.target.value });
            }}
            className="text-xs bg-[#0f1117] border border-[#2a2d3e] text-[#9ca3af] rounded px-2 py-1 focus:outline-none focus:border-[#6c63ff]"
          >
            <option value="">Update…</option>
            {["open", "reviewed", "resolved", "dismissed"]
              .filter((s) => s !== r.status)
              .map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Reports" subtitle={`${total} reports`}>
      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {REPORT_STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              statusFilter === s
                ? "bg-[#6c63ff] text-white"
                : "bg-[#1a1d27] border border-[#2a2d3e] text-[#9ca3af] hover:text-white"
            }`}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      {error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : (
        <>
          <Table columns={columns as never} data={reports as never} loading={loading} />
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </>
      )}

      {confirm && (
        <ConfirmModal
          title="Update Report Status"
          message={`Change status to "${confirm.newStatus}"?`}
          confirmLabel="Update"
          onConfirm={() => handleStatusChange(confirm.report, confirm.newStatus)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative z-10 bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Report Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-[#6b7280] w-28 shrink-0">Reporter</span>
                <span className="text-white">@{detail.reporter_username}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#6b7280] w-28 shrink-0">Target</span>
                <span className="text-white">{detail.target_type} · <span className="font-mono text-xs">{detail.target_id}</span></span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#6b7280] w-28 shrink-0">Reason</span>
                <span className="text-white capitalize">{detail.reason.replace(/_/g, " ")}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#6b7280] w-28 shrink-0">Status</span>
                <Badge value={detail.status} />
              </div>
              <div className="flex gap-2">
                <span className="text-[#6b7280] w-28 shrink-0">Reported</span>
                <span className="text-white">{new Date(detail.created_at).toLocaleString()}</span>
              </div>
              {detail.description && (
                <div>
                  <span className="text-[#6b7280] block mb-1">Description</span>
                  <p className="text-white bg-[#0f1117] rounded-lg p-3 text-sm">{detail.description}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setDetail(null)}
              className="mt-5 w-full py-2 text-sm text-[#9ca3af] hover:bg-white/5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
