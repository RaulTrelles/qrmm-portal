import React, { useState, useEffect } from "react";
import {
  Wrench,
  Clock,
  ShieldAlert,
  RefreshCw,
  Mail,
  KeyRound,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../components/Button/Button";
import {
  getMaintenanceStatus,
  type MaintenanceSettings,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./MaintenanceView.css";

export interface MaintenanceViewProps {
  initialSettings?: MaintenanceSettings | null;
  isSuperAdmin?: boolean;
  onBackToConsole?: () => void;
  onBypassSuccess?: () => void;
  onStatusRestored?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  initialSettings,
  isSuperAdmin = false,
  onBackToConsole,
  onBypassSuccess,
  onStatusRestored,
}) => {
  const { login } = useAuth();
  const [settings, setSettings] = useState<MaintenanceSettings>({
    maintenance_mode: true,
    title: initialSettings?.title || "Mantenimiento Programado del Sistema",
    message:
      initialSettings?.message ||
      "Estamos realizando labores de optimización de infraestructura, actualización de seguridad y mantenimiento de bases de datos. Estaremos de vuelta en breve.",
    estimated_end: initialSettings?.estimated_end || "Aproximadamente 45 minutos",
    contact_email: initialSettings?.contact_email || "soporte@qhapana.com",
    updated_at: initialSettings?.updated_at || null,
  });

  const [checking, setChecking] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);

  // Bypass Form State
  const [showBypassForm, setShowBypassForm] = useState<boolean>(false);
  const [bypassEmail, setBypassEmail] = useState<string>("");
  const [bypassPassword, setBypassPassword] = useState<string>("");
  const [bypassLoading, setBypassLoading] = useState<boolean>(false);
  const [bypassError, setBypassError] = useState<string | null>(null);

  // Auto-check periodic status every 30s
  useEffect(() => {
    const checkTimer = setInterval(async () => {
      try {
        const data = await getMaintenanceStatus();
        if (!data.maintenance_mode) {
          if (onStatusRestored) {
            onStatusRestored();
          } else {
            window.location.href = "/";
          }
        }
      } catch {}
    }, 30000);

    return () => clearInterval(checkTimer);
  }, [onStatusRestored]);

  const handleManualCheck = async () => {
    setChecking(true);
    setFeedbackToast(null);
    try {
      const data = await getMaintenanceStatus();
      setSettings(data);
      if (!data.maintenance_mode) {
        setFeedbackToast({
          type: "success",
          text: "¡El mantenimiento ha finalizado y los servicios están activos! Redirigiendo...",
        });
        setTimeout(() => {
          if (onStatusRestored) {
            onStatusRestored();
          } else {
            window.location.href = "/";
          }
        }, 1500);
      } else {
        setFeedbackToast({
          type: "info",
          text: "El mantenimiento continúa en progreso. Los ingenieros de infraestructura están trabajando.",
        });
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } catch {
      setFeedbackToast({
        type: "info",
        text: "Verificación completada. La plataforma permanece en mantenimiento preventivo.",
      });
      setTimeout(() => setFeedbackToast(null), 4000);
    } finally {
      setChecking(false);
    }
  };

  const handleBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bypassEmail.trim() || !bypassPassword.trim()) {
      setBypassError("Ingresa tu correo y contraseña de Superadministrador.");
      return;
    }

    setBypassLoading(true);
    setBypassError(null);
    try {
      await login(bypassEmail.trim(), bypassPassword.trim());
      if (onBypassSuccess) {
        onBypassSuccess();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setBypassError(err.message || "Credenciales no válidas o sin permisos de Superadministrador.");
    } finally {
      setBypassLoading(false);
    }
  };

  return (
    <main className="q-maintenance-page" role="main">
      {isSuperAdmin && onBackToConsole && (
        <div style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 9999,
          display: "flex",
          gap: "8px",
        }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToConsole}
          >
            ← Volver a la Consola
          </Button>
        </div>
      )}
      <div className="q-maintenance-card">
        {/* Brand / Logo Header */}
        <div className="q-maintenance-brand">
          <div className="q-maintenance-logo-badge" aria-hidden="true">
            Q
          </div>
          <div className="q-maintenance-brand-text">
            <span className="q-maintenance-brand-name">Qhapana RMM</span>
            <span className="q-maintenance-brand-sub">Centro de Control NOC</span>
          </div>
        </div>

        {/* Hero Pulse Icon */}
        <div className="q-maintenance-icon-wrap">
          <div className="q-maintenance-pulse-ring" aria-hidden="true"></div>
          <Wrench size={38} className="q-maintenance-icon-spinning" />
        </div>

        {/* Status Pill Badge */}
        <div className="q-maintenance-status-badge">
          <span className="q-maintenance-dot-pulse" aria-hidden="true"></span>
          <span>Plataforma en Mantenimiento Técnico</span>
        </div>

        {/* Main Title & Message */}
        <h1 className="q-maintenance-title">{settings.title}</h1>
        <p className="q-maintenance-message">{settings.message}</p>

        {/* Estimated Completion Time */}
        <div className="q-maintenance-time-card">
          <Clock size={16} className="q-maintenance-time-icon" />
          <span className="q-maintenance-time-label">Tiempo estimado de retorno:</span>
          <span>{settings.estimated_end}</span>
        </div>

        {/* Interactive Action Buttons */}
        <div className="q-maintenance-actions">
          <Button
            variant="primary"
            icon={<RefreshCw size={15} className={checking ? "spin" : ""} />}
            onClick={handleManualCheck}
            disabled={checking}
          >
            {checking ? "Verificando conexión..." : "Verificar Disponibilidad"}
          </Button>

          <a
            href={`mailto:${settings.contact_email}?subject=Consulta%20durante%20Mantenimiento%20Qhapana%20RMM`}
            className="q-maintenance-email-link"
          >
            <Button variant="outline" icon={<Mail size={15} />}>
              Soporte de Emergencia
            </Button>
          </a>
        </div>

        {/* Toast Feedback */}
        {feedbackToast && (
          <div className={`q-maintenance-feedback-toast q-maintenance-feedback-toast--${feedbackToast.type}`}>
            {feedbackToast.type === "success" ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>{feedbackToast.text}</span>
          </div>
        )}

        {/* Superadmin Emergency Bypass Toggle */}
        <div className="q-maintenance-bypass-wrap">
          <button
            type="button"
            className="q-maintenance-bypass-btn"
            onClick={() => setShowBypassForm((v) => !v)}
          >
            <KeyRound size={13} />
            <span>Acceso Técnico para Superadministradores</span>
            {showBypassForm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showBypassForm && (
            <form onSubmit={handleBypassSubmit} className="q-maintenance-bypass-form">
              {bypassError && (
                <div style={{ color: "var(--color-status-danger, #ef4444)", fontSize: "12px", fontWeight: 600 }}>
                  ⚠️ {bypassError}
                </div>
              )}
              <div>
                <label htmlFor="m-bypass-email">Correo Superadmin</label>
                <input
                  id="m-bypass-email"
                  type="email"
                  className="q-maintenance-bypass-input"
                  placeholder="admin@qhapana.com"
                  value={bypassEmail}
                  onChange={(e) => setBypassEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="m-bypass-password">Contraseña</label>
                <input
                  id="m-bypass-password"
                  type="password"
                  className="q-maintenance-bypass-input"
                  placeholder="••••••••••••"
                  value={bypassPassword}
                  onChange={(e) => setBypassPassword(e.target.value)}
                  required
                />
              </div>
              <Button variant="primary" size="sm" type="submit" loading={bypassLoading}>
                Iniciar Sesión y Omitir Mantenimiento
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="q-maintenance-footer">
        <span>Qhapana RMM SaaS Platform © {new Date().getFullYear()}</span>
        <span>•</span>
        <span>SLA & Infraestructura Cloud</span>
      </footer>
    </main>
  );
};
