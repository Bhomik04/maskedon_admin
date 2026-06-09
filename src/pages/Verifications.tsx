import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api";

interface Verification {
  id: string;
  user_id: string;
  pan_name: string;
  pan_number_masked: string;
  pan_image_url: string;
  aadhaar_name: string;
  aadhaar_number_masked: string;
  aadhaar_image_url: string;
  bank_ifsc: string;
  bank_account_name: string;
  bank_account_masked: string;
  bank_name: string;
  status: string;
  rejection_reason: string | null;
  auto_flags: string[] | null;
  submitted_at: string;
  reviewed_at: string | null;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
}

interface ReviewModalState {
  verification: Verification;
  action: "approved" | "rejected";
}

const LIMIT = 20;

export default function Verifications() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewModal, setReviewModal] = useState<ReviewModalState | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (status) params.set("status", status);
      const data = await api.get<{ verifications: Verification[]; total: number }>(
        `/admin/verifications?${params.toString()}`
      );
      setVerifications(data.verifications ?? []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }

  function openReview(v: Verification, action: "approved" | "rejected") {
    setRejectionReason("");
    setReviewModal({ verification: v, action });
  }

  async function confirmReview() {
    if (!reviewModal) return;
    setReviewing(true);
    try {
      await api.patch(`/admin/verifications/${reviewModal.verification.user_id}`, {
        status: reviewModal.action,
        rejection_reason: reviewModal.action === "rejected" ? rejectionReason || undefined : undefined,
      });
      setReviewModal(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewing(false);
    }
  }

  const statusFilters = ["", "pending", "approved", "rejected", "flagged"];

  return (
    <Layout title="KYC Verifications" subtitle="Review host identity and bank verifications">
      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              status === s
                ? "bg-[#6c63ff] text-white"
                : "bg-[#1a1d27] border border-[#2a2d3e] text-[#6b7280] hover:text-white"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <Table<Verification>
        data={verifications}
        loading={loading}
        emptyMessage={`No ${status || ""} verifications found`}
        columns={[
          {
            key: "username",
            label: "User",
            render: (v) => (
              <div className="flex items-center gap-2">
                {v.avatar_url ? (
                  <img
                    src={v.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center text-xs text-[#6b7280]">
                    {v.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <div className="text-sm text-white">@{v.username}</div>
                  <div className="text-xs text-[#6b7280]">{v.email}</div>
                </div>
              </div>
            ),
          },
          {
            key: "pan_name",
            label: "PAN",
            render: (v) => (
              <div>
                <div className="text-sm">{v.pan_name}</div>
                <div className="text-xs text-[#6b7280] font-mono">{v.pan_number_masked}</div>
              </div>
            ),
          },
          {
            key: "bank_name",
            label: "Bank",
            render: (v) => (
              <div>
                <div className="text-sm">{v.bank_name}</div>
                <div className="text-xs text-[#6b7280]">{v.bank_ifsc}</div>
                <div className="text-xs text-[#6b7280] font-mono">{v.bank_account_masked}</div>
              </div>
            ),
          },
          {
            key: "auto_flags",
            label: "Flags",
            render: (v) =>
              v.auto_flags && v.auto_flags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {v.auto_flags.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#6b7280]">None</span>
              ),
          },
          {
            key: "documents",
            label: "Docs",
            render: (v) => (
              <div className="flex gap-2">
                {v.pan_image_url && (
                  <button
                    onClick={() => setSelectedImage(v.pan_image_url)}
                    className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                  >
                    PAN
                  </button>
                )}
                {v.aadhaar_image_url && (
                  <button
                    onClick={() => setSelectedImage(v.aadhaar_image_url)}
                    className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                  >
                    Aadhaar
                  </button>
                )}
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (v) => <Badge value={v.status} />,
          },
          {
            key: "submitted_at",
            label: "Submitted",
            render: (v) => new Date(v.submitted_at).toLocaleDateString("en-IN"),
          },
          {
            key: "actions",
            label: "",
            render: (v) =>
              v.status === "pending" || v.status === "flagged" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => openReview(v, "approved")}
                    className="text-xs px-2.5 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openReview(v, "rejected")}
                    className="text-xs px-2.5 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#6b7280]">
                  {v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString("en-IN") : "—"}
                </span>
              ),
          },
        ]}
      />

      <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />

      {/* Document Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-black/80"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Review Confirm Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReviewModal(null)}
          />
          <div className="relative z-10 bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">
              {reviewModal.action === "approved" ? "✅ Approve Verification" : "❌ Reject Verification"}
            </h3>
            <p className="text-sm text-[#9ca3af] mb-4">
              User: <span className="text-white">@{reviewModal.verification.username}</span>
            </p>

            {reviewModal.action === "rejected" && (
              <div className="mb-4">
                <label className="block text-xs text-[#9ca3af] mb-1.5">
                  Rejection reason (optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. PAN image blurry, name mismatch…"
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReviewModal(null)}
                disabled={reviewing}
                className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReview}
                disabled={reviewing}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  reviewModal.action === "approved"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {reviewing ? "Processing…" : reviewModal.action === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
