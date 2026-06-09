import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api";

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  social_rating: number;
  total_ratings: number;
  events_hosted: number;
  events_attended: number;
  created_at: string;
  deleted_at: string | null;
}

interface EditModal {
  user: User;
  display_name: string;
  bio: string;
}

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ type: "ban" | "unban" | "delete"; user: User } | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [actionError, setActionError] = useState("");

  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(showDeleted && { deleted: "true" }),
      });
      const data = await api.get<{ users: User[]; total: number }>(`/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, showDeleted]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleBan(user: User) {
    setActionError("");
    try {
      await api.patch(`/admin/users/${user.id}`, { banned: true });
      fetchUsers();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  async function handleUnban(user: User) {
    setActionError("");
    try {
      await api.patch(`/admin/users/${user.id}`, { banned: false });
      fetchUsers();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  async function handleDelete(user: User) {
    setActionError("");
    try {
      await api.delete(`/admin/users/${user.id}`);
      fetchUsers();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  }

  async function handleEdit() {
    if (!editModal) return;
    setActionError("");
    try {
      await api.patch(`/admin/users/${editModal.user.id}`, {
        display_name: editModal.display_name,
        bio: editModal.bio,
      });
      setEditModal(null);
      fetchUsers();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Update failed");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchParams(search ? { search } : {});
    fetchUsers();
  }

  const columns = [
    {
      key: "avatar",
      label: "",
      render: (u: User) => (
        <img
          src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name)}&background=6c63ff&color=fff&size=32`}
          className="w-8 h-8 rounded-full object-cover"
          alt=""
        />
      ),
      className: "w-12",
    },
    {
      key: "username",
      label: "User",
      render: (u: User) => (
        <div>
          <div className="font-medium text-white text-sm">{u.display_name}</div>
          <div className="text-xs text-[#6b7280]">@{u.username}</div>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "rating",
      label: "Rating",
      render: (u: User) => (
        <span>⭐ {Number(u.social_rating).toFixed(1)} ({u.total_ratings})</span>
      ),
    },
    {
      key: "events",
      label: "Events",
      render: (u: User) => (
        <span className="text-xs">
          <span className="text-[#6c63ff]">{u.events_hosted}</span> hosted ·{" "}
          <span className="text-green-400">{u.events_attended}</span> attended
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (u: User) => (
        <span className="text-xs text-[#6b7280]">
          {new Date(u.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (u: User) => (
        <Badge value={u.deleted_at ? "banned" : "active"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (u: User) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditModal({ user: u, display_name: u.display_name, bio: u.bio || "" })}
            className="px-2 py-1 text-xs rounded bg-[#6c63ff]/20 text-[#6c63ff] hover:bg-[#6c63ff]/30 transition-colors"
          >
            Edit
          </button>
          {u.deleted_at ? (
            <button
              onClick={() => setConfirm({ type: "unban", user: u })}
              className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Unban
            </button>
          ) : (
            <button
              onClick={() => setConfirm({ type: "ban", user: u })}
              className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Ban
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout
      title="Users"
      subtitle={`${total} total users`}
      actions={
        <label className="flex items-center gap-2 text-sm text-[#9ca3af] cursor-pointer">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }}
            className="accent-[#6c63ff]"
          />
          Show banned
        </label>
      }
    >
      {actionError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, name, or email…"
          className="flex-1 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#6c63ff] transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#6c63ff] hover:bg-[#5a52e0] text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setPage(1); }}
            className="px-3 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : (
        <>
          <Table columns={columns as never} data={users as never} loading={loading} />
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.type === "ban" ? "Ban User" : confirm.type === "unban" ? "Unban User" : "Delete User"}
          message={
            confirm.type === "ban"
              ? `Ban @${confirm.user.username}? They will no longer be able to use the platform.`
              : confirm.type === "unban"
              ? `Restore @${confirm.user.username}'s access?`
              : `Permanently delete @${confirm.user.username}? This cannot be undone.`
          }
          confirmLabel={confirm.type === "ban" ? "Ban" : confirm.type === "unban" ? "Unban" : "Delete"}
          danger={confirm.type !== "unban"}
          onConfirm={() => {
            if (confirm.type === "ban") handleBan(confirm.user);
            else if (confirm.type === "unban") handleUnban(confirm.user);
            else handleDelete(confirm.user);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)} />
          <div className="relative z-10 bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Edit User — @{editModal.user.username}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Display Name</label>
                <input
                  value={editModal.display_name}
                  onChange={(e) => setEditModal({ ...editModal, display_name: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c63ff] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Bio</label>
                <textarea
                  value={editModal.bio}
                  onChange={(e) => setEditModal({ ...editModal, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c63ff] transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-[#9ca3af] hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleEdit} className="px-4 py-2 text-sm bg-[#6c63ff] hover:bg-[#5a52e0] text-white rounded-lg transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
