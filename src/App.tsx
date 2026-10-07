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
import { SupportView } from "./views/SupportView";
import { PortalView } from "./views/PortalView";
import { LoginView } from "./views/LoginView";
import { MaintenanceView } from "./views/MaintenanceView";
import { ReportsView, type ReportTabType } from "./views/ReportsView";
import { DeviceDetailModal } from "./components/DeviceDetailModal/DeviceDetailModal";
import { dashboardSocket } from "./services/socket";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  getDeviceById,
  getMaintenanceStatus,
  updateMaintenanceStatus,
  type MaintenanceSettings,
} from "./services/api";
import { trackPageView, trackEvent } from "./services/analytics";
import type { Device } from "./types/device";

function AppContent() {
  const { token, user, isLoading } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("q_theme") as "light" | "dark") || "dark";
  });
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceSettings | null>(null);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState<boolean>(false);
  const [forceMaintenanceView, setForceMaintenanceView] = useState<boolean>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return (
      p.includes("maintenance") ||
      p.includes("mantenimiento") ||
      h.includes("maintenance") ||
      h.includes("mantenimiento")
    );
  });
  const [activeReportTab, setActiveReportTab] = useState<ReportTabType>("incidents");
  const [activeView, setActiveView] = useState<ViewType>(() => {
    const path = window.location.pathname.replace(/^\//, "");
    const validViews: ViewType[] = [
      "dashboard",
      "inventory",
      "reports",
      "ai-health",
      "discovery",
      "clients",
      "users",
      "payments",
      "settings",
      "support",
    ];
    if (validViews.includes(path as ViewType)) {
      return path as ViewType;
    }
    return "dashboard";
  });
  const [visitorView, setVisitorView] = useState<"portal" | "login">(() => {
    const path = window.location.pathname.toLowerCase();
    return path.includes("login") || path.includes("register") ? "login" : "portal";
  });
  const [visitorMode, setVisitorMode] = useState<"login" | "register">(() => {
    return window.location.pathname.toLowerCase().includes("register") ? "register" : "login";
  });
  const [showPortalPreview, setShowPortalPreview] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const checkMaintenance = async () => {
    try {
      const data = await getMaintenanceStatus();
      setMaintenanceConfig(data);
      setIsMaintenanceActive(Boolean(data.maintenance_mode));
    } catch (err) {
      console.error("Error checking maintenance status:", err);
    }
  };

  useEffect(() => {
    checkMaintenance();
    const timer = setInterval(checkMaintenance, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleDisableMaintenance = async () => {
    try {
      await updateMaintenanceStatus({ maintenance_mode: false });
      await checkMaintenance();
    } catch (err: any) {
      alert(err.message || "Error al desactivar el mantenimiento.");
    }
  };

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

  // Rastreo automático de vistas y permanencia en Google Analytics 4 (SPA)
  useEffect(() => {
    if (!token) {
      if (visitorView === "portal") {
        trackPageView("Portal Comercial & Precios", "/portal");
      } else if (visitorMode === "register") {
        trackPageView("Registro de Organización", "/register");
      } else {
        trackPageView("Inicio de Sesión", "/login");
      }
      return;
    }

    if (showPortalPreview) {
      trackPageView("Vista Previa del Portal Público", "/portal-preview");
      return;
    }

    const viewMeta: Record<ViewType, { title: string; path: string }> = {
      dashboard: { title: "Panel de Monitoreo RMM", path: "/dashboard" },
      inventory: { title: "Inventario de Dispositivos", path: "/inventory" },
      reports: { title: "Centro de Reportes & Incidencias", path: "/reports" },
      "ai-health": { title: "Salud y Diagnóstico Predictivo IA", path: "/ai-health" },
      discovery: { title: "Descubrimiento de Red", path: "/discovery" },
      clients: { title: "Gestión de Clientes y Áreas", path: "/clients" },
      users: { title: "Administración de Usuarios", path: "/users" },
      payments: { title: "Planes y Suscripciones", path: "/plans" },
      settings: { title: "Configuración y Alertas", path: "/settings" },
      support: { title: "Mesa de Ayuda, Soporte & Feedback", path: "/support" },
    };

    const current = viewMeta[activeView] || { title: "Consola Qhapana RMM", path: `/${activeView}` };
    trackPageView(current.title, current.path);
  }, [token, visitorView, visitorMode, showPortalPreview, activeView]);

  // Evento de apertura de ficha de equipo
  useEffect(() => {
    if (selectedDevice) {
      trackEvent("view_device_detail", {
        device_id: selectedDevice.id,
        hostname: selectedDevice.hostname,
        os_type: selectedDevice.os_type,
        current_state: selectedDevice.status?.current_state,
      });
    }
  }, [selectedDevice]);

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

  // Vista de mantenimiento si se solicita directamente por URL (/maintenance o /mantenimiento)
  if (forceMaintenanceView) {
    return (
      <MaintenanceView
        initialSettings={maintenanceConfig}
        isSuperAdmin={user?.role === "SUPERADMIN"}
        onBackToConsole={() => setForceMaintenanceView(false)}
        onStatusRestored={() => {
          setForceMaintenanceView(false);
          checkMaintenance();
        }}
        onBypassSuccess={() => {
          setForceMaintenanceView(false);
          checkMaintenance();
        }}
      />
    );
  }

  // Vista de mantenimiento automática si está activado y el usuario no es SUPERADMIN
  if (isMaintenanceActive && user?.role !== "SUPERADMIN") {
    return (
      <MaintenanceView
        initialSettings={maintenanceConfig}
        isSuperAdmin={false}
        onBypassSuccess={() => {
          checkMaintenance();
        }}
        onStatusRestored={() => {
          checkMaintenance();
        }}
      />
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
      {isMaintenanceActive && user?.role === "SUPERADMIN" && (
        <div style={{
          backgroundColor: "#b45309",
          color: "#ffffff",
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: "13px",
          zIndex: 9999,
          position: "sticky",
          top: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>🛠️</span>
            <span>
              <strong>MODO MANTENIMIENTO ACTIVO:</strong> El portal y la consola están fuera de línea para clientes y usuarios generales. Solo Superadministradores tienen acceso técnico.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setForceMaintenanceView(true)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.4)",
                color: "#ffffff",
                padding: "5px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              👁️ Previsualizar Pantalla
            </button>
            <button
              onClick={handleDisableMaintenance}
              style={{
                background: "#ffffff",
                border: "none",
                color: "#92400e",
                padding: "5px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Desactivar Mantenimiento
            </button>
          </div>
        </div>
      )}
      <AppShell
        theme={theme}
        onToggleTheme={toggleTheme}
        isLiveConnected={isLiveConnected}
        onRefresh={handleRefresh}
        activeView={activeView}
        onViewChange={setActiveView}
        activeReportTab={activeReportTab}
        onReportTabChange={setActiveReportTab}
        onOpenPortal={() => setShowPortalPreview(true)}
      >
        {activeView === "dashboard" ? (
          <DashboardView refreshTrigger={refreshKey} />
        ) : activeView === "inventory" ? (
          <InventoryView refreshTrigger={refreshKey} />
        ) : activeView === "reports" ? (
          <ReportsView
            initialTab={activeReportTab}
            onOpenDeviceDetail={handleOpenDeviceById}
          />
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
        ) : activeView === "support" ? (
          <SupportView />
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
