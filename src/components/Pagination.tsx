import React from "react";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, total, limit, onPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-[#6b7280]">
      <span>
        {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(Number(p))}
              className={`w-8 h-8 rounded text-center transition-colors ${
                p === page
                  ? "bg-[#6c63ff] text-white font-medium"
                  : "hover:bg-white/5 text-[#9ca3af]"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}
