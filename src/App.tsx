import { useState, useEffect } from "react";
import { AppShell } from "./components/AppShell/AppShell";
import type { ViewType } from "./components/AppShell/AppShell";
import { DashboardView } from "./views/DashboardView";
import { InventoryView } from "./views/InventoryView";
import { SettingsView } from "./views/SettingsView";
import { NetworkDiscoveryView } from "./views/NetworkDiscoveryView";
import { ClientsView } from "./views/ClientsView";
import { UsersView } from "./views/UsersView";
import { PaymentsView } from "./views/PaymentsView";
import { AIHealthView } from "./views/AIHealthView";
import { PortalView } from "./views/PortalView";
import { LoginView } from "./views/LoginView";
import { DeviceDetailModal } from "./components/DeviceDetailModal/DeviceDetailModal";
import { dashboardSocket } from "./services/socket";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getDeviceById } from "./services/api";
import type { Device } from "./types/device";

function AppContent() {
  const { token, isLoading } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("q_theme") as "light" | "dark") || "light";
  });
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [visitorView, setVisitorView] = useState<"portal" | "login">("portal");
  const [visitorMode, setVisitorMode] = useState<"login" | "register">("login");
  const [showPortalPreview, setShowPortalPreview] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const handleOpenDeviceById = async (deviceId: string) => {
    try {
      const dev = await getDeviceById(deviceId);
      if (dev) setSelectedDevice(dev);
    } catch (err) {
      console.error("Error loading device detail:", err);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("q_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!token) return;
    const unsub = dashboardSocket.onStatusChange((status) => {
      setIsLiveConnected(status);
    });
    return () => unsub();
  }, [token]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const handleRefresh = () => setRefreshKey((k) => k + 1);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        backgroundColor: "var(--color-surface-page)"
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--color-brand-primary), var(--purple-700))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 20
        }}>
          Q
        </div>
        <span style={{ fontSize: 14, color: "var(--color-text-secondary)", fontWeight: 500 }}>
          Cargando consola Qhapana RMM...
        </span>
      </div>
    );
  }

  // Vista para visitantes no autenticados (Portal de Productos & Ofertas por defecto, o Login)
  if (!token) {
    if (visitorView === "portal") {
      return (
        <PortalView
          onGoToLogin={(m = "login") => {
            setVisitorMode(m);
            setVisitorView("login");
          }}
        />
      );
    }
    return (
      <LoginView
        initialMode={visitorMode}
        onGoToPortal={() => setVisitorView("portal")}
      />
    );
  }

  // Vista previa de portal para usuario autenticado
  if (showPortalPreview) {
    return (
      <div style={{ position: "relative" }}>
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "#111827",
          color: "#ffffff",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px"
        }}>
          <span>Vista Previa del Portal Comercial Público</span>
          <button
            onClick={() => setShowPortalPreview(false)}
            style={{
              background: "var(--color-brand-primary)",
              border: "none",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ← Volver a la Consola RMM
          </button>
        </div>
        <PortalView />
      </div>
    );
  }

  return (
    <>
      <AppShell
        theme={theme}
        onToggleTheme={toggleTheme}
        isLiveConnected={isLiveConnected}
        onRefresh={handleRefresh}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenPortal={() => setShowPortalPreview(true)}
      >
        {activeView === "dashboard" ? (
          <DashboardView refreshTrigger={refreshKey} />
        ) : activeView === "inventory" ? (
          <InventoryView refreshTrigger={refreshKey} />
        ) : activeView === "ai-health" ? (
          <AIHealthView onSelectDevice={handleOpenDeviceById} />
        ) : activeView === "discovery" ? (
          <NetworkDiscoveryView
            onOpenDeviceDetail={(dev) => setSelectedDevice(dev)}
          />
        ) : activeView === "clients" ? (
          <ClientsView
            onSelectClientForDevices={() => setActiveView("inventory")}
          />
        ) : activeView === "users" ? (
          <UsersView />
        ) : activeView === "payments" ? (
          <PaymentsView />
        ) : (
          <SettingsView />
        )}
      </AppShell>

      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
