import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api";

interface Event {
  id: string;
  title: string;
  location_name: string;
  location_city: string;
  date_time: string;
  max_capacity: number;
  current_attendees: number;
  ticket_price: number;
  currency: string;
  status: string;
  cover_image_url: string | null;
  host_username: string;
  host_display_name: string;
  created_at: string;
  deleted_at: string | null;
}

const EVENT_STATUSES = ["", "upcoming", "ongoing", "completed", "cancelled", "archived"];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState<{ type: "delete" | "status"; event: Event; newStatus?: string } | null>(null);
  const [actionError, setActionError] = useState("");
  const limit = 20;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const data = await api.get<{ events: Event[]; total: number }>(`/admin/events?${params}`);
      setEvents(data.events);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function handleStatusChange(event: Event, newStatus: string) {
    setActionError("");
    try {
      await api.patch(`/admin/events/${event.id}`, { status: newStatus });
      fetchEvents();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  async function handleDelete(event: Event) {
    setActionError("");
    try {
      await api.delete(`/admin/events/${event.id}`);
      fetchEvents();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  const columns = [
    {
      key: "cover",
      label: "",
      render: (p: Event) =>
        p.cover_image_url ? (
          <img src={p.cover_image_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#2a2d3e] flex items-center justify-center text-lg">🎉</div>
        ),
      className: "w-12",
    },
    {
      key: "title",
      label: "Event",
      render: (p: Event) => (
        <div>
          <div className="font-medium text-white text-sm">{p.title}</div>
          <div className="text-xs text-[#6b7280]">{p.location_city}</div>
        </div>
      ),
    },
    {
      key: "host",
      label: "Host",
      render: (p: Event) => (
        <div className="text-sm">
          <div className="text-white">{p.host_display_name}</div>
          <div className="text-xs text-[#6b7280]">@{p.host_username}</div>
        </div>
      ),
    },
    {
      key: "date_time",
      label: "Date",
      render: (p: Event) => (
        <span className="text-xs text-[#9ca3af]">
          {new Date(p.date_time).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (p: Event) => (
        <span className="text-sm">
          <span className={p.current_attendees >= p.max_capacity ? "text-red-400" : "text-white"}>
            {p.current_attendees}
          </span>
          <span className="text-[#6b7280]">/{p.max_capacity}</span>
        </span>
      ),
    },
    {
      key: "ticket_price",
      label: "Price",
      render: (p: Event) => (
        <span className="text-sm">
          {p.ticket_price === 0 ? <span className="text-green-400">Free</span> : `₹${(p.ticket_price / 100).toFixed(0)}`}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p: Event) => <Badge value={p.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (p: Event) => (
        <div className="flex items-center gap-1 flex-wrap">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setConfirm({ type: "status", event: p, newStatus: e.target.value });
            }}
            className="text-xs bg-[#0f1117] border border-[#2a2d3e] text-[#9ca3af] rounded px-2 py-1 focus:outline-none focus:border-[#6c63ff]"
          >
            <option value="">Set status…</option>
            {["upcoming", "ongoing", "completed", "cancelled", "archived"]
              .filter((s) => s !== p.status)
              .map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => setConfirm({ type: "delete", event: p })}
            className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Events" subtitle={`${total} total events`}>
      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchEvents(); } }}
          placeholder="Search by title or city…"
          className="flex-1 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] transition-colors"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-[#9ca3af] focus:outline-none focus:border-[#6c63ff] transition-colors"
        >
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "" ? "All statuses" : s}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : (
        <>
          <Table columns={columns as never} data={events as never} loading={loading} />
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.type === "delete" ? "Delete Event" : "Change Event Status"}
          message={
            confirm.type === "delete"
              ? `Delete "${confirm.event.title}"? This will soft-delete the event.`
              : `Change status of "${confirm.event.title}" to "${confirm.newStatus}"?`
          }
          confirmLabel={confirm.type === "delete" ? "Delete" : "Confirm"}
          danger={confirm.type === "delete"}
          onConfirm={() => {
            if (confirm.type === "delete") handleDelete(confirm.event);
            else handleStatusChange(confirm.event, confirm.newStatus!);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Layout>
  );
}
