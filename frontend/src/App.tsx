import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { LiveProvider } from "./context/LiveContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { ThemeTransitionOverlay } from "./components/ThemeTransitionOverlay";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Bookings } from "./pages/Bookings";
import { Mechanics } from "./pages/Mechanics";
import { Customers } from "./pages/Customers";
import { Analytics } from "./pages/Analytics";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <LiveProvider>
                <Layout />
              </LiveProvider>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Overview />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/mechanics" element={<Mechanics />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ThemeTransitionOverlay />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
