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
  const { user, logout, organizationsList, activeOrganization, setActiveOrganization, language } = useAuth();
  const [reportsOpen, setReportsOpen] = React.useState<boolean>(true);

  const getHeaderTitle = () => {
    switch (activeView) {
      case "dashboard":
        return activeOrganization
          ? `Dashboard — ${activeOrganization.name}`
          : language === "es" ? "Panel de Supervisión (Global)" : "Global Supervision Dashboard";
      case "inventory":
        return activeOrganization
          ? `${language === "es" ? "Inventario" : "Inventory"} — ${activeOrganization.name}`
          : language === "es" ? "Inventario de Activos y Equipos" : "Asset & Device Inventory";
      case "reports":
        return activeOrganization
          ? `${language === "es" ? "Centro de Reportes & Incidencias" : "Reports & Incidents Center"} — ${activeOrganization.name}`
          : language === "es" ? "Centro de Reportes & Análisis Operativo" : "Reports & Operational Analysis Center";
      case "ai-health":
        return activeOrganization
          ? `AI Health & ${language === "es" ? "Diagnóstico Predictivo" : "Predictive Diagnostics"} — ${activeOrganization.name}`
          : language === "es" ? "AI Health & Diagnóstico Predictivo (AIOps)" : "AI Health & Predictive Diagnostics (AIOps)";
      case "clients":
        return language === "es" ? "Gestión de Clientes SaaS" : "SaaS Client Management";
      case "users":
        return language === "es" ? "Administración de Usuarios y Presencia en Vivo" : "User Administration & Live Presence";
      case "payments":
        return language === "es" ? "Historial de Pagos y Facturación SaaS" : "Payment History & SaaS Billing";
      case "discovery":
        return language === "es" ? "Descubrimiento de Red (Network Discovery)" : "Network Discovery";
      case "settings":
        return language === "es" ? "Configuración del Sistema y Alertas" : "System Settings & Alerts";
      case "support":
        return language === "es" ? "Mesa de Ayuda, Soporte & Sugerencias" : "Help Desk, Support & Suggestions";
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
            <span className="q-brand-sub">{language === "es" ? "Plataforma Tecnológica" : "SaaS Platform"}</span>
          </div>
        </div>
        <nav className="q-sidebar-nav">
          <div className="q-nav-section-title">{language === "es" ? "Operaciones" : "Operations"}</div>
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
            <span>{language === "es" ? "Inventario de Equipos" : "Device Inventory"}</span>
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
              <span>{language === "es" ? "Reportes" : "Reports"}</span>
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
                  <span>{language === "es" ? "Incidencias y Fallas" : "Incidents & Failures"}</span>
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
                  <span>{language === "es" ? "Inventario y Flota" : "Inventory & Fleet"}</span>
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
                  <span>{language === "es" ? "Resumen por Áreas" : "Summary by Area"}</span>
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
            <span>{language === "es" ? "AI Health & Predictivo" : "AI Health & Predictive"}</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "discovery" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("discovery")}
            style={{ cursor: "pointer" }}
          >
            <Radio size={18} />
            <span>{language === "es" ? "Descubrimiento de Red" : "Network Discovery"}</span>
          </div>

          <div className="q-nav-section-title">{language === "es" ? "Administración SaaS" : "SaaS Administration"}</div>
          {user?.role === "SUPERADMIN" && (
            <div
              className={`q-nav-item ${activeView === "clients" ? "q-nav-item--active" : ""}`}
              onClick={() => onViewChange("clients")}
              style={{ cursor: "pointer" }}
            >
              <Building2 size={18} />
              <span>{language === "es" ? "Gestión de Clientes" : "Client Management"}</span>
            </div>
          )}
          <div
            className={`q-nav-item ${activeView === "users" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("users")}
            style={{ cursor: "pointer" }}
          >
            <Users size={18} />
            <span>{language === "es" ? "Usuarios y En Línea" : "Users & Online"}</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "payments" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("payments")}
            style={{ cursor: "pointer" }}
          >
            <CreditCard size={18} />
            <span>{language === "es" ? "Pagos y Facturación" : "Payments & Billing"}</span>
          </div>
          <div
            className={`q-nav-item ${activeView === "settings" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("settings")}
            style={{ cursor: "pointer" }}
          >
            <Bell size={18} />
            <span>{language === "es" ? "Configuración y Alertas" : "Settings & Alerts"}</span>
          </div>

          <div className="q-nav-section-title">{language === "es" ? "Atención y Experiencia" : "Support & Experience"}</div>
          <div
            className={`q-nav-item ${activeView === "support" ? "q-nav-item--active" : ""}`}
            onClick={() => onViewChange("support")}
            style={{ cursor: "pointer" }}
          >
            <LifeBuoy size={18} />
            <span>{language === "es" ? "Soporte & Sugerencias" : "Help Desk & Suggestions"}</span>
          </div>

          {onOpenPortal && (
            <div style={{ marginTop: "auto", paddingTop: "16px" }}>
              <div
                className="q-nav-item"
                onClick={onOpenPortal}
                style={{ cursor: "pointer", color: "var(--color-brand-primary)" }}
              >
                <Globe size={18} />
                <span>{language === "es" ? "Portal Público & Ofertas" : "Public Portal & Offers"}</span>
              </div>
            </div>
          )}
        </nav>
      </aside>

      <div className="q-main">
        <header className="q-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
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
                  title={language === "es" ? "Filtrar consola por cliente/organización (Acceso Superadmin)" : "Filter console by client/org (Superadmin access)"}
                >
                  <option value="all">🏢 {language === "es" ? "Todos los Clientes" : "All Clients"}</option>
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
              {isLiveConnected ? (language === "es" ? "Socket En vivo" : "Live Socket") : (language === "es" ? "Desconectado" : "Disconnected")}
            </Badge>

            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={onRefresh} title={language === "es" ? "Refrescar" : "Refresh"} />
            <Button
              variant="ghost"
              icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              onClick={onToggleTheme}
              title={language === "es" ? "Cambiar tema" : "Toggle theme"}
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
                {isLiveConnected ? (language === "es" ? "Telemetría en vivo & NOC Operativo" : "Live Telemetry & NOC Operational") : (language === "es" ? "Reconectando telemetría..." : "Reconnecting telemetry...")}
              </span>
            </div>

            <div className="q-footer-right">
              {onOpenPortal && (
                <button
                  type="button"
                  className="q-footer-link"
                  onClick={onOpenPortal}
                  title={language === "es" ? "Abrir Portal Público de Ofertas" : "Open Public Portal"}
                >
                  <Globe size={13} />
                  <span>{language === "es" ? "Portal Público" : "Public Portal"}</span>
                </button>
              )}
              <button
                type="button"
                className="q-footer-link"
                onClick={() => onViewChange("support")}
                title={language === "es" ? "Mesa de ayuda, soporte y sugerencias" : "Help desk and support"}
              >
                <LifeBuoy size={13} />
                <span>{language === "es" ? "Soporte" : "Support"}</span>
              </button>
              <button
                type="button"
                className="q-footer-link"
                onClick={() => onViewChange("reports")}
                title={language === "es" ? "Centro de reportes y análisis operativo" : "Reports and operational analysis"}
              >
                <BarChart3 size={13} />
                <span>{language === "es" ? "Reportes" : "Reports"}</span>
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
