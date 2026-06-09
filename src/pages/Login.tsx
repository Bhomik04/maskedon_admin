import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSecret, setApiUrl, getApiUrl, getSecret } from "../api";

export default function Login() {
  const [secret, setSecretValue] = useState(getSecret());
  const [apiUrl, setApiUrlValue] = useState(getApiUrl());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      setApiUrl(apiUrl.trim());
      setSecret(secret.trim());
      await api.get("/admin/stats");
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            mask<span className="text-[#6c63ff]">On</span>
          </h1>
          <p className="text-[#6b7280] mt-1 text-sm">Admin Panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
              Backend API URL
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrlValue(e.target.value)}
              placeholder="https://your-backend.com/api/v1"
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">
              Admin Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Enter ADMIN_SECRET from backend .env"
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? "Verifying…" : "Connect"}
          </button>
        </form>

        <p className="text-center text-xs text-[#4b5563] mt-4">
          Credentials are stored locally in your browser only.
        </p>
      </div>
    </div>
  );
}
