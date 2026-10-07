import React from "react";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Server,
  Bell,
  Sun,
  Moon,
  RefreshCw,
  Radio,
  Building2,
  LogOut,
  Users,
  CreditCard,
  Globe,
  Sparkles,
  LifeBuoy,
  BarChart3,
  ChevronDown,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { FeedbackFAB, FeedbackModal } from "../FeedbackModal/FeedbackModal";
import "./AppShell.css";

export type ViewType =
  | "dashboard"
  | "inventory"
  | "reports"
  | "ai-health"
  | "discovery"
  | "clients"
  | "users"
  | "payments"
  | "settings"
  | "support";

export interface AppShellProps {
  children: React.ReactNode;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isLiveConnected: boolean;
  onRefresh: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  activeReportTab?: "incidents" | "fleet" | "summary";
  onReportTabChange?: (tab: "incidents" | "fleet" | "summary") => void;
  onOpenPortal?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  theme,
  onToggleTheme,
  isLiveConnected,
  onRefresh,
  activeView,
  onViewChange,
  activeReportTab = "incidents",
  onReportTabChange,
  onOpenPortal,
}) => {
  const { user, logout, organizationsList, activeOrganization, setActiveOrganization } = useAuth();
  const [reportsOpen, setReportsOpen] = React.useState<boolean>(true);

  const getHeaderTitle = () => {
    switch (activeView) {
      case "dashboard":
        return activeOrganization
          ? `Dashboard — ${activeOrganization.name}`
          : "Panel de Supervisión (Global)";
      case "inventory":
        return activeOrganization
          ? `Inventario — ${activeOrganization.name}`
          : "Inventario de Activos y Equipos";
      case "reports":
        return activeOrganization
          ? `Centro de Reportes & Incidencias — ${activeOrganization.name}`
          : "Centro de Reportes & Análisis Operativo";
      case "ai-health":
        return activeOrganization
          ? `AI Health & Diagnóstico Predictivo — ${activeOrganization.name}`
          : "AI Health & Diagnóstico Predictivo (AIOps)";
      case "clients":
        return "Gestión de Clientes SaaS";
      case "users":
        return "Administración de Usuarios y Presencia en Vivo";
      case "payments":
        return "Historial de Pagos y Facturación SaaS";
      case "discovery":
        return "Descubrimiento de Red (Network Discovery)";
      case "settings":
        return "Configuración del Sistema y Alertas";
      case "support":
        return "Mesa de Ayuda, Soporte & Sugerencias";
      default:
        return "Qhapana RMM";
    }
  };

  const [feedbackOpen, setFeedbackOpen] = React.useState<boolean>(false);

  return (
    <div className="q-shell">
      <aside className="q-sidebar">
        <div className="q-sidebar-header">
          <div className="q-logo-badge">Q</div>
          <div className="q-brand-info">
            <span className="q-brand-name">Qhapana RMM</span>
            <span className="q-brand-sub">SaaS Platform</span>
          </div>
        </div>
        <nav className="q-sidebar-nav">
          <div className="q-nav-section-title">Operaciones</div>
          <div
            className={`q-nav-item ${activeView === "dashboard" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("dashboard")}
            style={{ cursor: "pointer" }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "inventory" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("inventory")}
            style={{ cursor: "pointer" }}
          >
            <Server size={18} />
            <span>Inventario de Equipos</span>
          </div>

          {/* Módulo Primer Nivel: Reportes con Subniveles */}
          <div className="q-nav-item-group">
            <div
              className={`q-nav-item ${activeView === "reports" ? "q-nav-item--active" : ""}`}
              onClick={() => {
                onViewChange("reports");
                setReportsOpen((prev) => !prev);
              }}
              style={{ cursor: "pointer" }}
            >
              <BarChart3 size={18} />
              <span>Reportes</span>
              <ChevronDown
                size={14}
                style={{
                  marginLeft: "auto",
                  transform: reportsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>

            {reportsOpen && (
              <div className="q-nav-subitems">
                <div
                  className={`q-nav-subitem ${
                    activeView === "reports" && activeReportTab === "incidents"
                      ? "q-nav-subitem--active"
                      : ""
                  }`}
                  onClick={() => {
                    onViewChange("reports");
                    onReportTabChange?.("incidents");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <AlertTriangle size={14} />
                  <span>Incidencias y Fallas</span>
                </div>
                <div
                  className={`q-nav-subitem ${
                    activeView === "reports" && activeReportTab === "fleet"
                      ? "q-nav-subitem--active"
                      : ""
                  }`}
                  onClick={() => {
                    onViewChange("reports");
                    onReportTabChange?.("fleet");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <Server size={14} />
                  <span>Inventario y Flota</span>
                </div>
                <div
                  className={`q-nav-subitem ${
                    activeView === "reports" && activeReportTab === "summary"
                      ? "q-nav-subitem--active"
                      : ""
                  }`}
                  onClick={() => {
                    onViewChange("reports");
                    onReportTabChange?.("summary");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <Layers size={14} />
                  <span>Resumen por Áreas</span>
                </div>
              </div>
            )}
          </div>
          <div
            className={`q-nav-item ${activeView === "ai-health" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("ai-health")}
            style={{ cursor: "pointer" }}
          >
            <Sparkles size={18} color="var(--color-brand-primary)" />
            <span>AI Health & Predictivo</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "discovery" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("discovery")}
            style={{ cursor: "pointer" }}
          >
            <Radio size={18} />
            <span>Descubrimiento de Red</span>
          </div>

          <div className="q-nav-section-title">Administración SaaS</div>
          {user?.role === "SUPERADMIN" && (
            <div
              className={`q-nav-item ${activeView === "clients" ? "q-nav-item--active" : ""}`}
              onClick={() => onViewChange("clients")}
              style={{ cursor: "pointer" }}
            >
              <Building2 size={18} />
              <span>Gestión de Clientes</span>
            </div>
          )}
          <div
            className={`q-nav-item ${activeView === "users" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("users")}
            style={{ cursor: "pointer" }}
          >
            <Users size={18} />
            <span>Usuarios y En Línea</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "payments" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("payments")}
            style={{ cursor: "pointer" }}
          >
            <CreditCard size={18} />
            <span>Pagos y Facturación</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "settings" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("settings")}
            style={{ cursor: "pointer" }}
          >
            <Bell size={18} />
            <span>Configuración y Alertas</span>
          </div>

          <div className="q-nav-section-title">Atención y Experiencia</div>
          <div
            className={`q-nav-item ${activeView === "support" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("support")}
            style={{ cursor: "pointer" }}
          >
            <LifeBuoy size={18} />
            <span>Soporte & Sugerencias</span>
          </div>

          {onOpenPortal && (
            <div style={{ marginTop: "auto", paddingTop: "16px" }}>
              <div
                className="q-nav-item"
                onClick={onOpenPortal}
                style={{ cursor: "pointer", color: "var(--color-brand-primary)" }}
              >
                <Globe size={18} />
                <span>Portal Público & Ofertas</span>
              </div>
            </div>
          )}
        </nav>
      </aside>

      <div className="q-main">
        <header className="q-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="q-header-title">{getHeaderTitle()}</div>

            {/* Tenant Selector: Solo Superadmin puede alternar empresas; los clientes ven solo su propia organización fija */}
            {user?.role === "SUPERADMIN" ? (
              <div className="q-tenant-switcher">
                <Building2 size={14} style={{ color: "var(--color-brand-primary)" }} />
                <select
                  value={activeOrganization?.id || "all"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") setActiveOrganization(null);
                    else {
                      const sel = organizationsList.find((o) => o.id === val);
                      setActiveOrganization(sel || null);
                    }
                  }}
                  className="q-tenant-select"
                  title="Filtrar consola por cliente/organización (Acceso Superadmin)"
                >
                  <option value="all">🏢 Todos los Clientes</option>
                  {organizationsList.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.stats?.total_devices ?? 0} eq.)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                className="q-tenant-switcher"
                style={{
                  background: "var(--color-surface-hover)",
                  border: "1px solid var(--color-border)",
                  padding: "4px 10px",
                  borderRadius: "var(--border-radius-md)",
                  gap: "6px",
                  cursor: "default",
                }}
                title={`Organización: ${activeOrganization?.name || user?.organization?.name || "Mi Organización"}`}
              >
                <Building2 size={14} style={{ color: "var(--color-brand-primary)" }} />
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {activeOrganization?.name || user?.organization?.name || "Mi Organización"}
                </span>
              </div>
            )}
          </div>

          <div className="q-header-actions">
            <Badge variant={isLiveConnected ? "success" : "danger"} pulse={isLiveConnected}>
              {isLiveConnected ? "Socket En vivo" : "Desconectado"}
            </Badge>

            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={onRefresh} title="Refrescar" />
            <Button
              variant="ghost"
              icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              onClick={onToggleTheme}
              title="Cambiar tema"
            />

            {/* User Chip */}
            {user && (
              <div className="q-user-profile" title={`Conectado como ${user.email}`}>
                <div className="q-user-avatar">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                    />
                  ) : (
                    user.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="q-user-name">{user.full_name.split(" ")[0]}</span>
                <Badge variant={user.role === "SUPERADMIN" ? "info" : "neutral"} style={{ fontSize: 10, padding: "1px 6px" }}>
                  {user.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LogOut size={15} />}
                  onClick={logout}
                  title="Cerrar sesión"
                  style={{ padding: 4, minWidth: 28, height: 28 }}
                />
              </div>
            )}
          </div>
        </header>

        <main className="q-content">{children}</main>

        {/* Global Application Footer */}
        <footer className="q-footer" role="contentinfo">
          <div className="q-footer-inner">
            <div className="q-footer-left">
              <span className="q-footer-brand">Qhapana RMM</span>
              <span className="q-footer-divider">•</span>
              <span className="q-footer-copy">© {new Date().getFullYear()} Plataforma SaaS Enterprise</span>
              <span className="q-footer-tag">v1.2.4</span>
            </div>

            <div className="q-footer-center">
              <span className={`q-footer-status ${isLiveConnected ? "q-footer-status--online" : "q-footer-status--offline"}`}>
                <span className="q-footer-dot" />
                {isLiveConnected ? "Telemetría en vivo & NOC Operativo" : "Reconectando telemetría..."}
              </span>
            </div>

            <div className="q-footer-right">
              {onOpenPortal && (
                <button
                  type="button"
                  className="q-footer-link"
                  onClick={onOpenPortal}
                  title="Abrir Portal Público de Ofertas"
                >
                  <Globe size={13} />
                  <span>Portal Público</span>
                </button>
              )}
              <button
                type="button"
                className="q-footer-link"
                onClick={() => onViewChange("support")}
                title="Mesa de ayuda, soporte y sugerencias"
              >
                <LifeBuoy size={13} />
                <span>Soporte</span>
              </button>
              <button
                type="button"
                className="q-footer-link"
                onClick={() => onViewChange("reports")}
                title="Centro de reportes y análisis operativo"
              >
                <BarChart3 size={13} />
                <span>Reportes</span>
              </button>
              <span className="q-footer-time">Lima, PE (UTC-5)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Botón flotante y modal de soporte accesibles solo para ADMIN y SUPERADMIN */}
      {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
        <>
          <FeedbackFAB onOpen={() => setFeedbackOpen(true)} />
          <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
      )}
    </div>
  );
};
