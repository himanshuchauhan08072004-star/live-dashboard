import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../lib/api";
import { ErrorState } from "../components/States";
import { useTheme } from "../context/ThemeContext";

const RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#8B5CF6",
  ASSIGNED: "#3B82F6",
  ON_THE_WAY: "#0EA5E9",
  IN_PROGRESS: "#F1600B",
  COMPLETED: "#16A34A",
  CANCELLED: "#DC2626",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function formatINR(n: number) {
  return `₹${(n / 1000).toFixed(0)}k`;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-base-card border border-base-border rounded-xl shadow-card p-4">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

export function Analytics() {
  const [range, setRange] = useState("30");
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#262A31" : "#E5E7EB";
  const tickColor = theme === "dark" ? "#8A8F98" : "#6B7280";
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: `1px solid ${gridColor}`,
    background: theme === "dark" ? "#16191E" : "#FFFFFF",
    color: theme === "dark" ? "#F0F1F3" : "#14181F",
  };

  const bookingsQ = useQuery({
    queryKey: ["analytics", "bookings", range],
    queryFn: async () => (await api.get("/analytics/bookings", { params: { range } })).data,
  });
  const revenueQ = useQuery({
    queryKey: ["analytics", "revenue", range],
    queryFn: async () => (await api.get("/analytics/revenue", { params: { range } })).data,
  });
  const statusQ = useQuery({
    queryKey: ["analytics", "status"],
    queryFn: async () => (await api.get("/analytics/status-breakdown")).data,
  });
  const servicesQ = useQuery({
    queryKey: ["analytics", "services"],
    queryFn: async () => (await api.get("/analytics/services")).data,
  });

  const anyError = bookingsQ.isError || revenueQ.isError || statusQ.isError || servicesQ.isError;
  if (anyError) {
    return (
      <ErrorState
        message="Couldn't load analytics."
        onRetry={() => {
          bookingsQ.refetch();
          revenueQ.refetch();
          statusQ.refetch();
          servicesQ.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex bg-base-card border border-base-border rounded-lg p-0.5">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === r.value ? "bg-accent text-white" : "text-base-muted hover:text-base-text"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Bookings over time">
          {bookingsQ.isLoading ? (
            <div className="h-64 bg-base-border/30 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={bookingsQ.data.data}>
                <defs>
                  <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F1600B" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F1600B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} width={30} />
                <Tooltip labelFormatter={(d) => formatDate(String(d))} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#F1600B" strokeWidth={2} fill="url(#bookingsFill)" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue over time">
          {revenueQ.isLoading ? (
            <div className="h-64 bg-base-border/30 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueQ.data.data}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  labelFormatter={(d) => formatDate(String(d))}
                  formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={tooltipStyle}
                />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} fill="url(#revenueFill)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Booking status">
          {statusQ.isLoading ? (
            <div className="h-64 bg-base-border/30 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusQ.data.data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {statusQ.data.data.map((entry: any) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#999"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value: string) => <span className="text-xs">{value.replace(/_/g, " ")}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Service category breakdown">
          {servicesQ.isLoading ? (
            <div className="h-64 bg-base-border/30 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={servicesQ.data.data} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" width={130} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" fill="#F1600B" radius={[0, 4, 4, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
