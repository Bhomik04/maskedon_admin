import React from "react";

const COLORS: Record<string, string> = {
  // status
  open: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  reviewed: "bg-blue-500/20 text-blue-400",
  resolved: "bg-green-500/20 text-green-400",
  dismissed: "bg-gray-500/20 text-gray-400",
  in_progress: "bg-purple-500/20 text-purple-400",
  closed: "bg-gray-500/20 text-gray-400",
  wont_fix: "bg-gray-500/20 text-gray-400",
  // event status
  upcoming: "bg-blue-500/20 text-blue-400",
  ongoing: "bg-green-500/20 text-green-400",
  completed: "bg-gray-500/20 text-gray-400",
  cancelled: "bg-red-500/20 text-red-400",
  archived: "bg-gray-500/20 text-gray-400",
  // payment
  paid: "bg-green-500/20 text-green-400",
  refunded: "bg-orange-500/20 text-orange-400",
  // severity
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-gray-500/20 text-gray-400",
  // banned
  banned: "bg-red-500/20 text-red-400",
  active: "bg-green-500/20 text-green-400",
  // verification
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  flagged: "bg-yellow-500/20 text-yellow-400",
  // financial jobs
  processing: "bg-blue-500/20 text-blue-400",
  retrying: "bg-orange-500/20 text-orange-400",
  succeeded: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

interface BadgeProps {
  value: string;
  label?: string;
}

export default function Badge({ value, label }: BadgeProps) {
  const key = (value || "").toLowerCase().replace(" ", "_");
  const cls = COLORS[key] || "bg-gray-500/20 text-gray-400";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label || value}
    </span>
  );
}
