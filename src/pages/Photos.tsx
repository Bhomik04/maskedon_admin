import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api";

interface Photo {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  like_count: number;
  view_count: number;
  created_at: string;
  event_id: string | null;
  event_title: string | null;
  username: string;
  display_name: string;
}

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<Photo | null>(null);
  const [actionError, setActionError] = useState("");
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const limit = 24;

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      const data = await api.get<{ photos: Photo[]; total: number }>(`/admin/photos?${params}`);
      setPhotos(data.photos);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  async function handleDelete(photo: Photo) {
    setActionError("");
    try {
      await api.delete(`/admin/photos/${photo.id}`);
      setConfirm(null);
      fetchPhotos();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Layout title="Photos" subtitle={`${total} total photos`}>
      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : loading ? (
        <div className="text-[#6b7280] text-sm">Loading photos…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square">
                <img
                  src={photo.thumbnail_url || photo.image_url}
                  className="w-full h-full object-cover rounded-lg cursor-pointer"
                  onClick={() => setLightbox(photo)}
                  alt={photo.caption || ""}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                  <div className="text-xs text-white">@{photo.username}</div>
                  <div className="text-xs text-[#9ca3af]">❤️ {photo.like_count} · 👁 {photo.view_count}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirm(photo); }}
                    className="mt-1 px-2 py-0.5 text-xs bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </>
      )}

      {confirm && (
        <ConfirmModal
          title="Delete Photo"
          message={`Delete this photo by @${confirm.username}? This action cannot be easily undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.image_url}
              className="w-full rounded-xl object-contain max-h-[70vh]"
              alt={lightbox.caption || ""}
            />
            <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-b-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-white">@{lightbox.username}</div>
                  {lightbox.caption && <div className="text-sm text-[#9ca3af] mt-1">{lightbox.caption}</div>}
                  {lightbox.event_title && (
                    <div className="text-xs text-[#6b7280] mt-1">📍 {lightbox.event_title}</div>
                  )}
                  <div className="text-xs text-[#6b7280] mt-1">
                    ❤️ {lightbox.like_count} · 👁 {lightbox.view_count} ·{" "}
                    {new Date(lightbox.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => { setConfirm(lightbox); setLightbox(null); }}
                  className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
