import React from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyField?: string;
}

export default function Table<T extends object>({
  columns,
  data,
  loading,
  emptyMessage = "No records found",
  keyField = "id",
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6b7280]">
        <span className="animate-spin mr-2">⟳</span> Loading…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-16 text-[#6b7280]">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2a2d3e]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2d3e] bg-[#1a1d27]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-xs font-medium text-[#6b7280] uppercase tracking-wider whitespace-nowrap ${col.className || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={String((row as Record<string, unknown>)[keyField] ?? i)}
              className="border-b border-[#2a2d3e] last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-[#d1d5db] ${col.className || ""}`}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
