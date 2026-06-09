import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import { api } from "../api";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  mock_transaction_id: string | null;
  created_at: string;
  completed_at: string | null;
  payer_username: string;
  payer_display_name: string;
  host_username: string;
  host_display_name: string;
  event_title: string;
}

const PAYMENT_STATUSES = ["", "pending", "completed", "refunded"];

export default function Payments() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const limit = 20;

  // Manual Refund modal states
  const [showRefundModal, setShowRefundModal] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter && { status: statusFilter }),
      });
      const data = await api.get<{ payments: Payment[]; total: number }>(`/admin/payments?${params}`);
      setPayments(data.payments);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  async function handleRefundSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showRefundModal || !passcode) return;
    setSubmittingRefund(true);
    try {
      await api.post(`/admin/payments/${showRefundModal}/refund`, {
        passcode,
        admin_note: adminNote,
      });
      setShowRefundModal(null);
      setPasscode("");
      setAdminNote("");
      fetchPayments();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setSubmittingRefund(false);
    }
  }

  const columns = [
    {
      key: "payer",
      label: "Guest",
      render: (p: Payment) => (
        <div>
          <div className="text-sm text-white">{p.payer_display_name}</div>
          <div className="text-xs text-[#6b7280]">@{p.payer_username}</div>
        </div>
      ),
    },
    {
      key: "event",
      label: "Event",
      render: (p: Payment) => (
        <div>
          <div className="text-sm text-white truncate max-w-[160px]">{p.event_title}</div>
          <div className="text-xs text-[#6b7280]">host: @{p.host_username}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (p: Payment) => (
        <span className={`font-medium text-sm ${p.status === "refunded" ? "text-orange-400 line-through" : "text-green-400"}`}>
          ₹{(p.amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p: Payment) => <Badge value={p.status} />,
    },
    {
      key: "mock_transaction_id",
      label: "Txn ID",
      render: (p: Payment) => (
        <span className="font-mono text-xs text-[#6b7280]">
          {p.mock_transaction_id ? p.mock_transaction_id.slice(0, 12) + "…" : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (p: Payment) => (
        <span className="text-xs text-[#6b7280]">
          {new Date(p.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "completed_at",
      label: "Completed",
      render: (p: Payment) => (
        <span className="text-xs text-[#6b7280]">
          {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (p: Payment) =>
        p.status === "completed" ? (
          <button
            onClick={() => setShowRefundModal(p.id)}
            className="text-xs px-2.5 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors whitespace-nowrap font-semibold"
          >
            Refund
          </button>
        ) : null,
    },
  ];

  return (
    <Layout title="Payments" subtitle={`${total} total payments`}>
      <div className="flex gap-1 mb-4">
        {PAYMENT_STATUSES.map((s) => (
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
          <Table columns={columns as never} data={payments as never} loading={loading} />
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </>
      )}

      {/* Manual Refund modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#13151c] border border-[#2a2d3e] p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-2">Admin Passcode Required</h3>
            <p className="text-xs text-[#9ca3af] mb-4">
              Please enter your admin passcode to authorize a direct manual refund for this payment.
            </p>
            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Enter admin passcode (e.g. 123456)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-xl px-4 py-3 text-sm text-white text-center focus:border-[#6c63ff] focus:outline-none"
                autoFocus
                required
              />
              <input
                type="text"
                placeholder="Refund reason / Admin Note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full bg-[#1c1f2b] border border-[#2a2d3e] rounded-xl px-4 py-3 text-sm text-white text-left focus:border-[#6c63ff] focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingRefund || !passcode}
                  className="flex-1 px-4 py-2.5 bg-[#6c63ff] hover:bg-[#5850e0] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingRefund ? "Refunding…" : "Confirm Refund"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(null);
                    setPasscode("");
                    setAdminNote("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#2a2d3e] hover:bg-[#3f445e] text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
