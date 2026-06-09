import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api";

interface BugReport {
  id: string;
  category: string;
  severity: string;
  affected_feature: string | null;
  steps_to_reproduce: string;
  expected_behavior: string;
  actual_behavior: string;
  screenshot_urls: string[];
  status: string;
  created_at: string;
  reporter_username: string | null;
  reporter_display_name: string | null;
}

const SEVERITIES = ["", "critical", "high", "medium", "low"];
const STATUSES = ["", "open", "in_progress", "resolved", "closed", "wont_fix"];

export default function BugReports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "open");
  const [severityFilter, setSeverityFilter] = useState(searchParams.get("severity") || "");
  const [confirm, setConfirm] = useState<{ report: BugReport; newStatus: string } | null>(null);
  const [actionError, setActionError] = useState("");
  const [detail, setDetail] = useState<BugReport | null>(null);
  const limit = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter && { status: statusFilter }),
        ...(severityFilter && { severity: severityFilter }),
      });
      const data = await api.get<{ bugReports: BugReport[]; total: number }>(`/admin/bug-reports?${params}`);
      setReports(data.bugReports);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load bug reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleStatusChange(report: BugReport, newStatus: string) {
    setActionError("");
    try {
      await api.patch(`/admin/bug-reports/${report.id}`, { status: newStatus });
      fetchReports();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  const columns = [
    {
      key: "severity",
      label: "Sev",
      render: (r: BugReport) => <Badge value={r.severity} />,
      className: "w-24",
    },
    {
      key: "category",
      label: "Category",
      render: (r: BugReport) => (
        <div>
          <div className="text-sm text-white capitalize">{r.category.replace(/_/g, " ")}</div>
          {r.affected_feature && (
            <div className="text-xs text-[#6b7280]">{r.affected_feature}</div>
          )}
        </div>
      ),
    },
    {
      key: "actual_behavior",
      label: "Issue",
      render: (r: BugReport) => (
        <span className="text-sm text-[#9ca3af] max-w-xs truncate block">{r.actual_behavior}</span>
      ),
    },
    {
      key: "reporter",
      label: "Reporter",
      render: (r: BugReport) => (
        <span className="text-sm text-[#9ca3af]">
          {r.reporter_username ? `@${r.reporter_username}` : <span className="text-[#4b5563]">anonymous</span>}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Reported",
      render: (r: BugReport) => (
        <span className="text-xs text-[#6b7280]">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r: BugReport) => <Badge value={r.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: BugReport) => (
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
            {["open", "in_progress", "resolved", "closed", "wont_fix"]
              .filter((s) => s !== r.status)
              .map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Bug Reports" subtitle={`${total} total`}>
      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button
              key={s || "all"}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === s
                  ? "bg-[#6c63ff] text-white"
                  : "bg-[#1a1d27] border border-[#2a2d3e] text-[#9ca3af] hover:text-white"
              }`}
            >
              {s === "" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {SEVERITIES.map((s) => (
            <button
              key={s || "all-sev"}
              onClick={() => { setSeverityFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                severityFilter === s
                  ? "bg-[#6c63ff] text-white"
                  : "bg-[#1a1d27] border border-[#2a2d3e] text-[#9ca3af] hover:text-white"
              }`}
            >
              {s === "" ? "All severity" : s}
            </button>
          ))}
        </div>
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
          title="Update Bug Status"
          message={`Change status to "${confirm.newStatus.replace(/_/g, " ")}"?`}
          confirmLabel="Update"
          onConfirm={() => handleStatusChange(confirm.report, confirm.newStatus)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative z-10 bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Bug Report Details</h3>
              <div className="flex gap-2">
                <Badge value={detail.severity} />
                <Badge value={detail.status} />
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[#6b7280] text-xs mb-1">Category</div>
                  <div className="text-white capitalize">{detail.category.replace(/_/g, " ")}</div>
                </div>
                {detail.affected_feature && (
                  <div>
                    <div className="text-[#6b7280] text-xs mb-1">Affected Feature</div>
                    <div className="text-white">{detail.affected_feature}</div>
                  </div>
                )}
                <div>
                  <div className="text-[#6b7280] text-xs mb-1">Reporter</div>
                  <div className="text-white">
                    {detail.reporter_username ? `@${detail.reporter_username}` : "Anonymous"}
                  </div>
                </div>
                <div>
                  <div className="text-[#6b7280] text-xs mb-1">Reported</div>
                  <div className="text-white">{new Date(detail.created_at).toLocaleString()}</div>
                </div>
              </div>

              {[
                { label: "Steps to Reproduce", value: detail.steps_to_reproduce },
                { label: "Expected Behavior", value: detail.expected_behavior },
                { label: "Actual Behavior", value: detail.actual_behavior },
              ].map((field) => (
                <div key={field.label}>
                  <div className="text-[#6b7280] text-xs mb-1">{field.label}</div>
                  <p className="text-white bg-[#0f1117] rounded-lg p-3 text-sm whitespace-pre-wrap">{field.value}</p>
                </div>
              ))}

              {Array.isArray(detail.screenshot_urls) && detail.screenshot_urls.length > 0 && (
                <div>
                  <div className="text-[#6b7280] text-xs mb-2">Screenshots</div>
                  <div className="flex gap-2 flex-wrap">
                    {detail.screenshot_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} className="w-24 h-24 object-cover rounded-lg border border-[#2a2d3e]" alt={`Screenshot ${i + 1}`} />
                      </a>
                    ))}
                  </div>
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
