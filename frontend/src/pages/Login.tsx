import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@vsod.in");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      if (!err.response) {
        setError("Can't reach the server. Is the backend running on port 4000?");
      } else if (err.response.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <Car size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight">Instant Mechanic</span>
        </div>

        <div className="bg-base-card border border-base-border rounded-xl shadow-card p-6">
          <h1 className="text-lg font-semibold mb-1">Sign in to operations</h1>
          <p className="text-sm text-base-muted mb-6">Live service dashboard for your team.</p>

          {error && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-base-muted mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-base-border focus:border-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-base-muted mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-base-border focus:border-accent outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-base-muted mt-5 text-center">
            Demo: admin@vsod.in / password123
          </p>
        </div>
      </div>
    </div>
  );
}
