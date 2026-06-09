import React, { useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api";

interface BroadcastResult {
  sent: number;
  total: number;
  message: string;
}

interface HistoryEntry {
  id: string;
  title: string;
  body: string;
  sent: number;
  total: number;
  timestamp: string;
}

export default function Notifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSending(true);
    setError("");
    setResult(null);

    try {
      const data = await api.post<BroadcastResult>("/admin/notifications/broadcast", {
        title: title.trim(),
        body: body.trim() || undefined,
      });

      setResult(data);
      setHistory((prev) => [
        {
          id: String(Date.now()),
          title: title.trim(),
          body: body.trim(),
          sent: data.sent,
          total: data.total,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);
      setTitle("");
      setBody("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout title="Push Notifications" subtitle="Broadcast notifications to all app users">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose form */}
        <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">📣 Broadcast Notification</h2>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="e.g. New events this weekend! 🎉"
                maxLength={100}
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] transition-colors"
              />
              <div className="text-right text-xs text-[#6b7280] mt-1">{title.length}/100</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                Body (optional)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 300))}
                placeholder="Optional message body shown below the title…"
                maxLength={300}
                rows={4}
                className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] transition-colors resize-none"
              />
              <div className="text-right text-xs text-[#6b7280] mt-1">{body.length}/300</div>
            </div>

            {/* Preview */}
            {title && (
              <div className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg p-4">
                <div className="text-xs text-[#6b7280] uppercase tracking-wider mb-2">Preview</div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6c63ff] flex items-center justify-center text-sm shrink-0">
                    🎭
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    {body && <div className="text-xs text-[#9ca3af] mt-0.5">{body}</div>}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {result && (
              <div className="text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <div className="text-green-400 font-medium">✓ Sent successfully</div>
                <div className="text-[#9ca3af] text-xs mt-0.5">
                  {result.message} ({result.sent} of {result.total} devices)
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim()}
              className="w-full bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {sending ? "Sending…" : "Send to All Users"}
            </button>

            <p className="text-xs text-[#4b5563] text-center">
              This will send a push notification to every device with the app installed.
            </p>
          </form>
        </div>

        {/* History */}
        <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">📋 Sent This Session</h2>

          {history.length === 0 ? (
            <div className="text-[#6b7280] text-sm text-center py-8">
              No broadcasts sent yet this session.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{entry.title}</div>
                      {entry.body && (
                        <div className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">
                          {entry.body}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-medium text-green-400">
                        {entry.sent}/{entry.total}
                      </div>
                      <div className="text-xs text-[#6b7280]">devices</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4b5563] mt-2">
                    {new Date(entry.timestamp).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#2a2d3e]">
            <p className="text-xs text-[#4b5563]">
              Note: History is session-only and clears when you reload the page.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
