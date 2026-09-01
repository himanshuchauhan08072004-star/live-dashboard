import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardList,
  Wrench,
  Users,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Car,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/bookings", label: "Bookings", icon: ClipboardList },
  { to: "/mechanics", label: "Mechanics", icon: Wrench },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-base-card border-r border-base-border w-64">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-base-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Car size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">Instant Mechanic</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent-dark"
                  : "text-base-muted hover:bg-base-bg hover:text-base-text"
              }`
            }
          >
            <item.icon size={17} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-base-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-dark flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-base-muted">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="text-base-muted hover:text-red-600 transition-colors p-1"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
