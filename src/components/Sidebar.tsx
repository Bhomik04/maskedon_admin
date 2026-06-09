import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../api";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/users", label: "Users", icon: "👥" },
  { to: "/events", label: "Events", icon: "🎉" },
  { to: "/photos", label: "Photos", icon: "🖼️" },
  { to: "/reports", label: "Reports", icon: "🚨" },
  { to: "/bug-reports", label: "Bug Reports", icon: "🐛" },
  { to: "/payments", label: "Payments", icon: "💳" },
  { to: "/financial", label: "Financial Ops", icon: "💰" },
  { to: "/verifications", label: "Verifications", icon: "✅" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-[#1a1d27] border-r border-[#2a2d3e]">
      <div className="px-5 py-5 border-b border-[#2a2d3e]">
        <div className="text-lg font-bold text-white tracking-tight">
          mask<span className="text-[#6c63ff]">On</span>
        </div>
        <div className="text-xs text-[#6b7280] mt-0.5">Admin Panel</div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#6c63ff]/20 text-[#6c63ff] font-medium"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
        >
          <span className="text-base leading-none">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
