import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import { api } from "../api";

interface RefundJob {
  id: string;
  payment_id: string;
  refund_amount: number;
  status: string;
  attempt_count: number;
  last_error: string | null;
  provider_refund_id: string | null;
  next_retry_at: string | null;
  created_at: string;
  payer_username?: string;
  host_username?: string;
  event_title?: string;
}

interface HostPayout {
  id: string;
  event_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  provider_transfer_id: string | null;
  failure_reason: string | null;
  settled_at: string | null;
  created_at: string;
  event_title?: string;
  host_username?: string;
  host_display_name?: string;
}

interface RefundRequest {
  id: string;
  payment_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  reason: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  guest_username?: string;
  guest_display_name?: string;
  event_title?: string;
  payment_amount?: number;
  payment_status?: string;
}

interface HostOverride {
  id: string;
  username: string;
  display_name: string;
  email: string;
  commission_override_rate: number;
}

const LIMIT = 20;

export default function Financial() {
  const [tab, setTab] = useState<"refunds" | "refund_requests" | "payouts" | "settings">("refunds");

  // Refund jobs
  const [refundJobs, setRefundJobs] = useState<RefundJob[]>([]);
  const [refundTotal, setRefundTotal] = useState(0);
  const [refundPage, setRefundPage] = useState(1);
  const [refundStatus, setRefundStatus] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);

  // Refund requests (Review Queue)
  const [refundReqs, setRefundReqs] = useState<RefundRequest[]>([]);
  const [refundReqTotal, setRefundReqTotal] = useState(0);
  const [refundReqPage, setRefundReqPage] = useState(1);
  const [refundReqStatus, setRefundReqStatus] = useState("pending_review");
  const [refundReqLoading, setRefundReqLoading] = useState(false);
  const [refundReqError, setRefundReqError] = useState("");

  // Host payouts
  const [payouts, setPayouts] = useState<HostPayout[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  // Passcode modal state
  const [showPasscodeModal, setShowPasscodeModal] = useState<{
    type: "refund" | "payout" | "force_payout";
    id: string;
    action?: "approved" | "rejected";
  } | null>(null);
  const [passcode, setPasscode] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [submittingPasscode, setSubmittingPasscode] = useState(false);

  // Manual / Force Payout State
  const [forceEventId, setForceEventId] = useState("");

  // Platform settings
  const [commissionEnabled, setCommissionEnabled] = useState(true);
  const [commissionRate, setCommissionRate] = useState(12.0);
  const [autoSettlementsEnabled, setAutoSettlementsEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Host overrides
  const [overrides, setOverrides] = useState<HostOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [overridesError, setOverridesError] = useState("");
  const [newOverrideHostId, setNewOverrideHostId] = useState("");
  const [newOverrideRate, setNewOverrideRate] = useState("12.0");
  const [addingOverride, setAddingOverride] = useState(false);

  useEffect(() => {
    if (tab === "refunds") {
      loadRefundJobs();
    } else if (tab === "refund_requests") {
      loadRefundRequests();
    } else if (tab === "payouts") {
      loadPayouts();
    } else if (tab === "settings") {
      loadPlatformSettings();
      loadHostOverrides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, refundPage, refundStatus, refundReqPage, refundReqStatus, payoutPage]);

  async function loadRefundJobs() {
    setRefundLoading(true);
    setRefundError("");
    try {
      const params = new URLSearchParams({ page: String(refundPage), limit: String(LIMIT) });
      if (refundStatus) params.set("status", refundStatus);
      const data = await api.get<{ refund_jobs: RefundJob[]; total: number }>(
        `/admin/refund-jobs?${params.toString()}`
      );
      setRefundJobs(data.refund_jobs ?? []);
      setRefundTotal(data.total ?? 0);
    } catch (e: unknown) {
      setRefundError(e instanceof Error ? e.message : "Failed to load refund jobs");
    } finally {
      setRefundLoading(false);
    }
  }

  async function loadRefundRequests() {
    setRefundReqLoading(true);
    setRefundReqError("");
    try {
      const params = new URLSearchParams({ page: String(refundReqPage), limit: String(LIMIT) });
      if (refundReqStatus) params.set("status", refundReqStatus);
      const data = await api.get<{ refund_requests: RefundRequest[]; total: number }>(
        `/admin/refund-requests?${params.toString()}`
      );
      setRefundReqs(data.refund_requests ?? []);
      setRefundReqTotal(data.total ?? 0);
    } catch (e: unknown) {
      setRefundReqError(e instanceof Error ? e.message : "Failed to load refund requests");
    } finally {
      setRefundReqLoading(false);
    }
  }

  async function loadPayouts() {
    setPayoutLoading(true);
    setPayoutError("");
    try {
      const params = new URLSearchParams({ page: String(payoutPage), limit: String(LIMIT) });
      const data = await api.get<{ host_payouts: HostPayout[]; total: number }>(
        `/admin/host-payouts?${params.toString()}`
      );
      setPayouts(data.host_payouts ?? []);
      setPayoutTotal(data.total ?? 0);
    } catch (e: unknown) {
      setPayoutError(e instanceof Error ? e.message : "Failed to load payouts");
    } finally {
      setPayoutLoading(false);
    }
  }

  async function loadPlatformSettings() {
    try {
      const data = await api.get<{ commission_enabled: boolean; commission_rate_percent: number; auto_settlements_enabled: boolean }>(
        "/admin/platform-settings"
      );
      setCommissionEnabled(data.commission_enabled);
      setCommissionRate(data.commission_rate_percent);
      setAutoSettlementsEnabled(data.auto_settlements_enabled);
    } catch (e: unknown) {
      console.error("Failed to load settings", e);
    }
  }

  async function loadHostOverrides() {
    setOverridesLoading(true);
    setOverridesError("");
    try {
      const data = await api.get<{ hosts: HostOverride[] }>("/admin/host-overrides");
      setOverrides(data.hosts ?? []);
    } catch (e: unknown) {
      setOverridesError(e instanceof Error ? e.message : "Failed to load overrides");
    } finally {
      setOverridesLoading(false);
    }
  }

  async function handleRetry(jobId: string) {
    setRetrying(jobId);
    try {
      await api.post(`/admin/refund-jobs/${jobId}/retry`, {});
      await loadRefundJobs();
    } finally {
      setRetrying(null);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      await api.post("/admin/platform-settings", {
        commission_enabled: commissionEnabled,
        commission_rate_percent: Number(commissionRate),
        auto_settlements_enabled: autoSettlementsEnabled,
      });
      setSettingsSuccess("Platform settings updated successfully!");
    } catch (e: unknown) {
      setSettingsError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleAddOverride() {
    if (!newOverrideHostId.trim()) return;
    setAddingOverride(true);
    try {
      await api.post(`/admin/users/${newOverrideHostId.trim()}/commission-override`, {
        commission_override_rate: Number(newOverrideRate),
      });
      setNewOverrideHostId("");
      await loadHostOverrides();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add override");
    } finally {
      setAddingOverride(false);
    }
  }

  async function handleRemoveOverride(hostId: string) {
    if (!window.confirm("Are you sure you want to remove the commission override for this host?")) return;
    try {
      await api.post(`/admin/users/${hostId}/commission-override`, {
        commission_override_rate: null,
      });
      await loadHostOverrides();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to remove override");
    }
  }

  async function handleReviewSubmit() {
    if (!showPasscodeModal) return;
    setSubmittingPasscode(true);

    try {
      if (showPasscodeModal.type === "refund") {
        await api.post(`/admin/refund-requests/${showPasscodeModal.id}/review`, {
          status: showPasscodeModal.action,
          admin_note: reviewNote,
          passcode,
        });
        await loadRefundRequests();
      } else if (showPasscodeModal.type === "payout") {
        await api.post(`/admin/host-payouts/${showPasscodeModal.id}/release`, {
          passcode,
        });
        await loadPayouts();
      } else if (showPasscodeModal.type === "force_payout") {
        await api.post("/admin/host-payouts/force", {
          event_id: showPasscodeModal.id,
          passcode,
        });
        setForceEventId("");
        await loadPayouts();
      }
      setShowPasscodeModal(null);
      setPasscode("");
      setReviewNote("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Authentication/Processing error");
    } finally {
      setSubmittingPasscode(false);
    }
  }

  const refundStatusFilters = ["", "pending", "processing", "retrying", "succeeded", "failed"];
  const refundReqStatusFilters = ["pending_review", "approved", "rejected"];

  return (
    <Layout title="Financial Operations" subtitle="Refunds, holding logic, overrides, and settlements">
      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "refunds", label: "💸 Refund Jobs" },
          { id: "refund_requests", label: "📥 Refund Reviews" },
          { id: "payouts", label: "🏦 Host Payouts" },
          { id: "settings", label: "⚙️ Commission Settings" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[#6c63ff] text-white"
                : "bg-[#1a1d27] border border-[#2a2d3e] text-[#9ca3af] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Passcode Modal Dialog */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#13151c] border border-[#2a2d3e] p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-2">Admin Passcode Required</h3>
            <p className="text-xs text-[#9ca3af] mb-4">
              {showPasscodeModal.type === "payout"
                ? "Please enter your admin passcode to authorize releasing host payout funds."
                : showPasscodeModal.type === "force_payout"
                ? "Please enter your admin passcode to force create host payout records for this event."
                : `Please enter your admin passcode to authorize the ${showPasscodeModal.action} status for this refund request.`}
            </p>
            <input
              type="password"
              placeholder="Enter admin passcode (e.g. 123456)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-xl px-4 py-3 text-sm text-white text-center focus:border-[#6c63ff] focus:outline-none mb-4"
              autoFocus
            />
            {showPasscodeModal.type === "refund" && (
              <input
                type="text"
                placeholder="Reason / Admin Note (optional)"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-xl px-4 py-3 text-sm text-white text-left focus:border-[#6c63ff] focus:outline-none mb-4"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleReviewSubmit}
                disabled={submittingPasscode || !passcode}
                className="flex-1 px-4 py-2.5 bg-[#6c63ff] hover:bg-[#5850e0] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submittingPasscode ? "Processing…" : "Confirm"}
              </button>
              <button
                onClick={() => {
                  setShowPasscodeModal(null);
                  setPasscode("");
                  setReviewNote("");
                }}
                className="flex-1 px-4 py-2.5 bg-[#2a2d3e] hover:bg-[#3f445e] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Jobs Tab */}
      {tab === "refunds" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {refundStatusFilters.map((s) => (
              <button
                key={s || "all"}
                onClick={() => {
                  setRefundStatus(s);
                  setRefundPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  refundStatus === s
                    ? "bg-[#6c63ff] text-white"
                    : "bg-[#1a1d27] border border-[#2a2d3e] text-[#6b7280] hover:text-white"
                }`}
              >
                {s ? s.toUpperCase() : "ALL"}
              </button>
            ))}
          </div>

          {refundError && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {refundError}
            </div>
          )}

          <Table<RefundJob>
            data={refundJobs}
            loading={refundLoading}
            emptyMessage="No refund jobs found"
            columns={[
              {
                key: "id",
                label: "Job ID",
                render: (r) => (
                  <span className="font-mono text-xs text-[#6b7280]">{r.id.slice(0, 8)}…</span>
                ),
              },
              {
                key: "event_title",
                label: "Event",
                render: (r) => (
                  <span className="max-w-[140px] truncate block text-sm">
                    {r.event_title || "—"}
                  </span>
                ),
              },
              {
                key: "payer_username",
                label: "Payer",
                render: (r) => r.payer_username ? `@${r.payer_username}` : "—",
              },
              {
                key: "refund_amount",
                label: "Amount",
                render: (r) => (
                  <span className="font-medium text-green-400">
                    ₹{(r.refund_amount / 100).toFixed(2)}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <Badge value={r.status} />,
              },
              {
                key: "attempt_count",
                label: "Attempts",
                render: (r) => (
                  <span className={r.attempt_count >= 3 ? "text-orange-400" : ""}>
                    {r.attempt_count}
                  </span>
                ),
              },
              {
                key: "last_error",
                label: "Last Error",
                render: (r) => (
                  <span
                    className="max-w-[160px] truncate block text-xs text-red-400"
                    title={r.last_error ?? ""}
                  >
                    {r.last_error || "—"}
                  </span>
                ),
              },
              {
                key: "created_at",
                label: "Created",
                render: (r) => new Date(r.created_at).toLocaleDateString("en-IN"),
              },
              {
                key: "actions",
                label: "",
                render: (r) =>
                  ["pending", "retrying", "failed"].includes(r.status) ? (
                    <button
                      onClick={() => handleRetry(r.id)}
                      disabled={retrying === r.id}
                      className="text-xs px-2.5 py-1 bg-[#6c63ff]/20 text-[#6c63ff] rounded-md hover:bg-[#6c63ff]/30 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {retrying === r.id ? "…" : "Retry"}
                    </button>
                  ) : null,
              },
            ]}
          />
          <Pagination
            page={refundPage}
            total={refundTotal}
            limit={LIMIT}
            onPage={setRefundPage}
          />
        </div>
      )}

      {/* Refund Reviews Tab */}
      {tab === "refund_requests" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {refundReqStatusFilters.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setRefundReqStatus(s);
                  setRefundReqPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  refundReqStatus === s
                    ? "bg-[#6c63ff] text-white"
                    : "bg-[#1a1d27] border border-[#2a2d3e] text-[#6b7280] hover:text-white"
                }`}
              >
                {s === "pending_review" ? "PENDING REVIEW" : s.toUpperCase()}
              </button>
            ))}
          </div>

          {refundReqError && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {refundReqError}
            </div>
          )}

          <Table<RefundRequest>
            data={refundReqs}
            loading={refundReqLoading}
            emptyMessage="No refund requests awaiting review"
            columns={[
              {
                key: "id",
                label: "Req ID",
                render: (r) => (
                  <span className="font-mono text-xs text-[#6b7280]">{r.id.slice(0, 8)}…</span>
                ),
              },
              {
                key: "event_title",
                label: "Event",
                render: (r) => (
                  <span className="max-w-[140px] truncate block text-sm">
                    {r.event_title || "—"}
                  </span>
                ),
              },
              {
                key: "guest_username",
                label: "Guest",
                render: (r) => r.guest_username ? `@${r.guest_username}` : "—",
              },
              {
                key: "amount",
                label: "Refund Amount",
                render: (r) => (
                  <span className="font-medium text-amber-400">
                    ₹{(r.amount / 100).toFixed(2)}
                  </span>
                ),
              },
              {
                key: "reason",
                label: "Reason",
                render: (r) => (
                  <span className="text-xs text-[#9ca3af] max-w-[150px] truncate block">
                    {r.reason || "—"}
                  </span>
                ),
              },
              {
                key: "admin_note",
                label: "Admin Note",
                render: (r) => (
                  <span className="text-xs text-[#6b7280] max-w-[150px] truncate block">
                    {r.admin_note || "—"}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <Badge value={r.status} />,
              },
              {
                key: "created_at",
                label: "Submitted",
                render: (r) => new Date(r.created_at).toLocaleDateString("en-IN"),
              },
              {
                key: "actions",
                label: "",
                render: (r) =>
                  r.status === "pending_review" ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setShowPasscodeModal({ type: "refund", id: r.id, action: "approved" })}
                        className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const note = window.prompt("Reason for rejection:");
                          if (note !== null) {
                            api.post(`/admin/refund-requests/${r.id}/review`, {
                              status: "rejected",
                              admin_note: note,
                            }).then(() => loadRefundRequests());
                          }
                        }}
                        className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null,
              },
            ]}
          />
          <Pagination
            page={refundReqPage}
            total={refundReqTotal}
            limit={LIMIT}
            onPage={setRefundReqPage}
          />
        </div>
      )}

      {/* Host Payouts Tab */}
      {tab === "payouts" && (
        <div>
          {payoutError && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {payoutError}
            </div>
          )}

          {/* Manual Force Settlement form */}
          <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-white mb-2">Force Event Payout Settlement</h3>
            <p className="text-xs text-[#9ca3af] mb-4">
              Manually calculate and enqueue a host payout for any event immediately (bypassing the 7-day automated hold).
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (forceEventId.trim()) {
                  setShowPasscodeModal({ type: "force_payout", id: forceEventId.trim() });
                }
              }}
              className="flex flex-col sm:flex-row gap-3 items-end max-w-xl"
            >
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider block mb-1">
                  Event UUID
                </label>
                <input
                  type="text"
                  placeholder="Enter Event's UUID"
                  value={forceEventId}
                  onChange={(e) => setForceEventId(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6c63ff]"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#6c63ff] hover:bg-[#5850e0] text-white rounded-lg text-xs font-semibold transition-colors w-full sm:w-auto whitespace-nowrap"
              >
                Force Settlement
              </button>
            </form>
          </div>

          <Table<HostPayout>
            data={payouts}
            loading={payoutLoading}
            emptyMessage="No host payouts found"
            columns={[
              {
                key: "id",
                label: "Payout ID",
                render: (r) => (
                  <span className="font-mono text-xs text-[#6b7280]">{r.id.slice(0, 8)}…</span>
                ),
              },
              {
                key: "event_title",
                label: "Event",
                render: (r) => (
                  <span className="max-w-[140px] truncate block text-sm">
                    {r.event_title || "—"}
                  </span>
                ),
              },
              {
                key: "host_username",
                label: "Host",
                render: (r) =>
                  r.host_username ? `@${r.host_username}` : r.host_display_name || "—",
              },
              {
                key: "gross_amount",
                label: "Gross",
                render: (r) => `₹${(r.gross_amount / 100).toFixed(2)}`,
              },
              {
                key: "platform_fee",
                label: "Commission",
                render: (r) => (
                  <span className="text-orange-400">
                    ₹{(r.platform_fee / 100).toFixed(2)}
                  </span>
                ),
              },
              {
                key: "net_amount",
                label: "Net Host Transfer",
                render: (r) => (
                  <span className="font-medium text-green-400">
                    ₹{(r.net_amount / 100).toFixed(2)}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <Badge value={r.status} />,
              },
              {
                key: "settled_at",
                label: "Settled At",
                render: (r) =>
                  r.settled_at
                    ? new Date(r.settled_at).toLocaleDateString("en-IN")
                    : "—",
              },
              {
                key: "actions",
                label: "",
                render: (r) =>
                  r.status === "pending" || r.status === "failed" ? (
                    <button
                      onClick={() => setShowPasscodeModal({ type: "payout", id: r.id })}
                      className="text-xs px-2.5 py-1 bg-[#6c63ff]/20 text-[#6c63ff] rounded-md hover:bg-[#6c63ff]/30 transition-colors whitespace-nowrap font-semibold"
                    >
                      Release
                    </button>
                  ) : null,
              },
            ]}
          />
          <Pagination
            page={payoutPage}
            total={payoutTotal}
            limit={LIMIT}
            onPage={setPayoutPage}
          />
        </div>
      )}

      {/* Commission Settings Tab */}
      {tab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Global platform Settings */}
          <div className="bg-[#13151c] border border-[#2a2d3e] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Global Commission Settings</h3>
            {settingsError && (
              <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="mb-4 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                {settingsSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-white block">Platform Commission Cut</label>
                  <span className="text-[10px] text-[#9ca3af]">Charge hosts percentage per-ticket sold</span>
                </div>
                <input
                  type="checkbox"
                  checked={commissionEnabled}
                  onChange={(e) => setCommissionEnabled(e.target.checked)}
                  className="w-10 h-5 rounded-full appearance-none bg-[#2a2d3e] checked:bg-[#6c63ff] cursor-pointer relative transition-colors before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-5 before:transition-transform"
                />
              </div>

              {commissionEnabled && (
                <div>
                  <label className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider block mb-1.5">Standard Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6c63ff] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#2a2d3e] pt-4">
                <div>
                  <label className="text-sm font-semibold text-white block">Automatic Host Settlements</label>
                  <span className="text-[10px] text-[#9ca3af]">Release payouts automatically 7 days post-event</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSettlementsEnabled}
                  onChange={(e) => setAutoSettlementsEnabled(e.target.checked)}
                  className="w-10 h-5 rounded-full appearance-none bg-[#2a2d3e] checked:bg-[#6c63ff] cursor-pointer relative transition-colors before:content-[''] before:absolute before:h-4 before:w-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-5 before:transition-transform"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-2.5 bg-[#6c63ff] hover:bg-[#5850e0] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingSettings ? "Saving…" : "Save Platform Settings"}
              </button>
            </div>
          </div>

          {/* Host exceptions / overrides */}
          <div className="bg-[#13151c] border border-[#2a2d3e] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Host Overrides (Promotional Offers)</h3>
            <p className="text-xs text-[#9ca3af] mb-4">Set specific custom commission rates for individual hosts.</p>

            {overridesError && (
              <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                {overridesError}
              </div>
            )}

            {/* Add override form */}
            <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-4 mb-5 flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider block mb-1">Host User ID</label>
                <input
                  type="text"
                  placeholder="Enter Host's UUID"
                  value={newOverrideHostId}
                  onChange={(e) => setNewOverrideHostId(e.target.value)}
                  className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6c63ff]"
                />
              </div>
              <div className="w-full md:w-28">
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider block mb-1">Override Rate %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newOverrideRate}
                  onChange={(e) => setNewOverrideRate(e.target.value)}
                  className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6c63ff]"
                />
              </div>
              <button
                onClick={handleAddOverride}
                disabled={addingOverride || !newOverrideHostId.trim()}
                className="w-full md:w-auto px-4 py-2 bg-[#6c63ff] hover:bg-[#5850e0] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {addingOverride ? "…" : "Add Override"}
              </button>
            </div>

            <Table<HostOverride>
              data={overrides}
              loading={overridesLoading}
              emptyMessage="No customized host overrides set"
              columns={[
                {
                  key: "username",
                  label: "Host",
                  render: (r) => (
                    <div>
                      <p className="text-xs font-bold">@{r.username}</p>
                      <p className="text-[10px] text-[#6b7280]">{r.email}</p>
                    </div>
                  ),
                },
                {
                  key: "commission_override_rate",
                  label: "Override Rate",
                  render: (r) => (
                    <span className="font-bold text-[#6c63ff]">
                      {r.commission_override_rate.toFixed(1)}%
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  render: (r) => (
                    <button
                      onClick={() => handleRemoveOverride(r.id)}
                      className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                    >
                      Delete
                    </button>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
