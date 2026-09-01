import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { User, Shield, Sun } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

export function Settings() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-base-card border border-base-border rounded-xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-base-muted" />
          <h2 className="text-sm font-semibold">Account</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-base-muted">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-muted">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-muted">Role</span>
            <span className="font-medium">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="bg-base-card border border-base-border rounded-xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-base-muted" />
          <h2 className="text-sm font-semibold">Permissions</h2>
        </div>
        <p className="text-sm text-base-muted">
          {user?.role === "ADMIN"
            ? "You have full access to all operations data and can update any booking."
            : "You can view and manage bookings, mechanics, and customers."}
        </p>
      </div>

      <div className="bg-base-card border border-base-border rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun size={16} className="text-base-muted" />
            <div>
              <h2 className="text-sm font-semibold">Appearance</h2>
              <p className="text-xs text-base-muted mt-0.5">
                Currently {theme === "dark" ? "dark" : "light"}. Preference is saved on this device.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
