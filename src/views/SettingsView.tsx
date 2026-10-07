import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Server,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  Plus,
  X,
  ShieldCheck,
  Loader2,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Wrench,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/Card/Card";
import { Button } from "../components/Button/Button";
import { Badge } from "../components/Badge/Badge";
import { BillingView } from "./BillingView";
import {
  getAlertSettings,
  updateAlertSettings,
  testAlertEmail,
  updateClientAreas,
  generateExecutiveHealthReport,
  getPaymentSettings,
  updatePaymentSettings,
  getMaintenanceStatus,
  updateMaintenanceStatus,
  type PaymentSettings,
  type MaintenanceSettings,
} from "../services/api";
import type { AlertSettings } from "../services/api";
import "./SettingsView.css";


export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"alerts" | "billing" | "payments" | "maintenance">("alerts");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);

  // Modalidades de pago y modo Beta
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    enable_lemon_squeezy: true,
    enable_b2b_wire: true,
    allow_beta_free_trial: true,
    beta_badge_text: "Programa Beta Qhapana",
    beta_description: "",
  });
  const [savingPaymentSettings, setSavingPaymentSettings] = useState<boolean>(false);

  // Estado del Modo Mantenimiento
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    maintenance_mode: false,
    title: "Mantenimiento Programado del Sistema",
    message: "Estamos realizando labores de optimización de infraestructura y actualización de seguridad. Estaremos de vuelta en breve.",
    estimated_end: "Aproximadamente 45 minutos",
    contact_email: "soporte@qhapana.com",
  });
  const [savingMaintenance, setSavingMaintenance] = useState<boolean>(false);

  // Estados del formulario
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(true);
  const [notifyOnOffline, setNotifyOnOffline] = useState<boolean>(true);
  const [notifyOnContainerCrash, setNotifyOnContainerCrash] = useState<boolean>(true);
  const [notifyOnPerformanceIssues, setNotifyOnPerformanceIssues] = useState<boolean>(true);
  const [reportSchedule, setReportSchedule] = useState<string>("daily");
  const [deliveryChannel, setDeliveryChannel] = useState<"google_oauth" | "smtp">("google_oauth");

  // Destinatarios múltiples
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState<string>("");

  // Catálogo de Áreas / Clientes
  const [clientAreas, setClientAreas] = useState<string[]>(["General"]);
  const [newAreaInput, setNewAreaInput] = useState<string>("");
  const [areaError, setAreaError] = useState<string | null>(null);
  const [savingArea, setSavingArea] = useState<boolean>(false);

  // SMTP
  const [smtpHost, setSmtpHost] = useState<string>("");
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>("");
  const [smtpPassword, setSmtpPassword] = useState<string>("");
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState<boolean>(false);
  const [smtpUseTls, setSmtpUseTls] = useState<boolean>(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState<string>("alertas@qhapana-rmm.local");

  // Google OAuth info
  const [googleOauthConfigured, setGoogleOauthConfigured] = useState<boolean>(false);
  const [googleClientId, setGoogleClientId] = useState<string>("");

  // Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data: AlertSettings = await getAlertSettings();
      setEmailAlertsEnabled(data.email_alerts_enabled);
      setNotifyOnOffline(data.notify_on_device_offline);
      setNotifyOnContainerCrash(data.notify_on_container_crash);
      setNotifyOnPerformanceIssues(data.notify_on_performance_issues ?? true);
      setReportSchedule(data.report_schedule || "daily");
      setDeliveryChannel(data.delivery_channel || "google_oauth");
      setRecipients(data.alert_recipients || []);
      setClientAreas(data.client_areas && data.client_areas.length > 0 ? data.client_areas : ["General"]);
      setSmtpHost(data.smtp_host || "");
      setSmtpPort(data.smtp_port || 587);
      setSmtpUser(data.smtp_user || "");
      setSmtpPasswordConfigured(data.smtp_password_configured);
      setSmtpUseTls(data.smtp_use_tls);
      setSmtpFromEmail(data.smtp_from_email || "alertas@qhapana-rmm.local");
      setGoogleOauthConfigured(data.google_oauth_configured);
      setGoogleClientId(data.google_client_id || "");

      // Cargar configuración de pasarelas y modo beta
      try {
        const pData = await getPaymentSettings();
        setPaymentSettings(pData);
      } catch (pErr) {
        console.warn("No se pudo cargar payment settings:", pErr);
      }

      try {
        const mData = await getMaintenanceStatus();
        setMaintenanceSettings(mData);
      } catch (mErr) {
        console.warn("No se pudo cargar maintenance settings:", mErr);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al cargar la configuración de alertas" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaintenance = async () => {
    try {
      setSavingMaintenance(true);
      setFeedback(null);
      const updated = await updateMaintenanceStatus(maintenanceSettings);
      setMaintenanceSettings(updated);
      setFeedback({
        type: "success",
        message: updated.maintenance_mode
          ? "🚨 ¡Modo Mantenimiento ACTIVADO! El portal regular ha sido dado de baja temporalmente."
          : "✅ Modo Mantenimiento DESACTIVADO. La plataforma vuelve a operar con normalidad para todos los usuarios.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Error al actualizar modo de mantenimiento",
      });
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    try {
      setSavingPaymentSettings(true);
      setFeedback(null);
      const updated = await updatePaymentSettings({
        enable_lemon_squeezy: paymentSettings.enable_lemon_squeezy,
        enable_b2b_wire: paymentSettings.enable_b2b_wire,
        allow_beta_free_trial: paymentSettings.allow_beta_free_trial,
      });
      setPaymentSettings(updated);
      setFeedback({
        type: "success",
        message: "Configuración de modalidades de pago y modo Beta actualizada exitosamente.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al actualizar pasarelas de pago" });
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  const handleAddArea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (clientAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAreaError(`El área o cliente "${trimmed}" ya se encuentra registrado.`);
      return;
    }
    const updated = [...clientAreas, trimmed];
    setClientAreas(updated);
    setNewAreaInput("");
    setAreaError(null);
    try {
      setSavingArea(true);
      await updateClientAreas(updated);
    } catch (err: any) {
      setAreaError(err.message || "Error al registrar el área en el servidor");
    } finally {
      setSavingArea(false);
    }
  };

  const handleRemoveArea = async (areaToRemove: string) => {
    if (areaToRemove.toLowerCase() === "general") return; // "General" no puede eliminarse
    const updated = clientAreas.filter((a) => a.toLowerCase() !== areaToRemove.toLowerCase());
    setClientAreas(updated);
    try {
      setSavingArea(true);
      await updateClientAreas(updated);
    } catch (err: any) {
      setAreaError(err.message || "Error al eliminar el área en el servidor");
    } finally {
      setSavingArea(false);
    }
  };

  const handleAddRecipient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = newRecipient.trim().toLowerCase();
    if (!email) return;

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedback({ type: "error", message: `"${email}" no es una dirección de correo electrónico válida.` });
      return;
    }

    if (recipients.includes(email)) {
      setFeedback({ type: "error", message: `El correo "${email}" ya se encuentra en la lista de destinatarios.` });
      return;
    }

    setRecipients([...recipients, email]);
    setNewRecipient("");
    setFeedback(null);
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter((r) => r !== emailToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      if (emailAlertsEnabled && recipients.length === 0) {
        setFeedback({
          type: "error",
          message: "Debe agregar al menos un correo destinatario si las alertas están activas.",
        });
        setSaving(false);
        return;
      }

      await updateAlertSettings({
        email_alerts_enabled: emailAlertsEnabled,
        notify_on_device_offline: notifyOnOffline,
        notify_on_container_crash: notifyOnContainerCrash,
        notify_on_performance_issues: notifyOnPerformanceIssues,
        report_schedule: reportSchedule,
        alert_recipients: recipients,
        client_areas: clientAreas,
        delivery_channel: deliveryChannel,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_password: smtpPassword || undefined,
        smtp_use_tls: smtpUseTls,
        smtp_from_email: smtpFromEmail,
      });

      setFeedback({
        type: "success",
        message: "Configuración de alertas y programación guardada exitosamente.",
      });
      if (smtpPassword) {
        setSmtpPasswordConfigured(true);
        setSmtpPassword("");
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al guardar la configuración." });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateImmediateReport = async () => {
    try {
      setGeneratingReport(true);
      setFeedback(null);
      await generateExecutiveHealthReport({
        report_type: "DAILY",
        send_email: true,
        language: "es",
      });
      setFeedback({
        type: "success",
        message: "Informe de salud, saturación y diagnóstico por IA generado y enviado a su correo con éxito.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `Error al generar el informe: ${err.message}`,
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleTestEmail = async () => {
    if (recipients.length === 0) {
      setFeedback({
        type: "error",
        message: "Agregue al menos un correo destinatario antes de realizar la prueba de envío.",
      });
      return;
    }

    try {
      setTesting(true);
      setFeedback(null);
      const res = await testAlertEmail(recipients);
      setFeedback({
        type: "success",
        message: `Prueba de correo enviada: ${res.message}`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `Fallo en prueba: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="q-settings-page" style={{ alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="q-spin" color="var(--color-brand-primary)" />
        <span style={{ color: "var(--color-text-secondary)", marginTop: "12px" }}>Cargando configuración de alertas...</span>
      </div>
    );
  }

  return (
    <div className="q-settings-page">
      <div className="q-settings-header">
        <div>
          <h1 className="q-settings-title">
            <Bell size={24} color="var(--color-brand-primary)" />
            Configuración de Alertas y Notificaciones
          </h1>
          <p className="q-settings-subtitle">
            Configure los disparadores automáticos de caída de equipos y microservicios, asigne destinatarios y canales de mensajería.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Badge variant={emailAlertsEnabled ? "success" : "neutral"} pulse={emailAlertsEnabled}>
            {emailAlertsEnabled ? "Alertas Activas" : "Alertas Pausadas"}
          </Badge>
        </div>
      </div>

      <div className="q-settings-tabs-bar">
        <button
          className={`q-settings-tab-btn ${activeTab === "alerts" ? "q-tab-active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          <Bell size={16} /> Notificaciones y Alertas
        </button>
        {user?.role === "SUPERADMIN" && (
          <button
            className={`q-settings-tab-btn ${activeTab === "payments" ? "q-tab-active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard size={16} /> Modos de Pago & Beta
          </button>
        )}
        {user?.role === "SUPERADMIN" && (
          <button
            className={`q-settings-tab-btn ${activeTab === "maintenance" ? "q-tab-active" : ""}`}
            onClick={() => setActiveTab("maintenance")}
          >
            <Wrench size={16} /> Modo Mantenimiento
          </button>
        )}
        <button
          className={`q-settings-tab-btn ${activeTab === "billing" ? "q-tab-active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          <FileText size={16} /> Suscripción & Facturación
        </button>
      </div>

      {activeTab === "billing" ? (
        <BillingView />
      ) : activeTab === "payments" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feedback && (
            <div className={`q-feedback-banner q-feedback-banner--${feedback.type}`}>
              {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <Card className="q-settings-card">
            <div className="q-card-header-row">
              <div className="q-card-heading">
                <CreditCard size={20} color="var(--color-brand-primary)" />
                <div>
                  <h3>Control de Pasarelas y Modalidades de Cobro</h3>
                  <p>
                    Activa o desactiva pasarelas de pago externas o habilita el Modo Beta de pruebas para evitar costos de comisiones y ganar usuarios reales.
                  </p>
                </div>
              </div>
            </div>

            <div className="q-toggle-row">
              <div className="q-toggle-label">
                <span className="q-toggle-title">🚀 Modo Beta / Prueba Gratuita ($0)</span>
                <span className="q-toggle-desc">
                  Permite a nuevos clientes registrarse y activar el plan Pro a $0 sin requerir tarjeta. Ideal para ganar tracción, realizar pruebas reales y recopilar feedback técnico sin costo de procesamiento.
                </span>
              </div>
              <label className="q-switch">
                <input
                  type="checkbox"
                  checked={paymentSettings.allow_beta_free_trial}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, allow_beta_free_trial: e.target.checked })
                  }
                />
                <span className="q-switch-slider"></span>
              </label>
            </div>

            <div className="q-toggle-row">
              <div className="q-toggle-label">
                <span className="q-toggle-title">💳 Pasarela Lemon Squeezy (Tarjetas, PayPal, Apple Pay)</span>
                <span className="q-toggle-desc">
                  Habilita el cobro formal automatizado a través de Lemon Squeezy Merchant of Record en el checkout del portal comercial.
                </span>
              </div>
              <label className="q-switch">
                <input
                  type="checkbox"
                  checked={paymentSettings.enable_lemon_squeezy}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, enable_lemon_squeezy: e.target.checked })
                  }
                />
                <span className="q-switch-slider"></span>
              </label>
            </div>

            <div className="q-toggle-row">
              <div className="q-toggle-label">
                <span className="q-toggle-title">🏦 Transferencia Bancaria B2B (Facturación Comercial)</span>
                <span className="q-toggle-desc">
                  Permite a clientes corporativos solicitar factura y abonar mediante cuenta corriente bancaria previa verificación manual.
                </span>
              </div>
              <label className="q-switch">
                <input
                  type="checkbox"
                  checked={paymentSettings.enable_b2b_wire}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, enable_b2b_wire: e.target.checked })
                  }
                />
                <span className="q-switch-slider"></span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button
                variant="primary"
                onClick={handleSavePaymentSettings}
                disabled={savingPaymentSettings}
              >
                {savingPaymentSettings ? "Guardando..." : "Guardar Modalidades de Pago"}
              </Button>
            </div>
          </Card>
        </div>
      ) : activeTab === "maintenance" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feedback && (
            <div className={`q-feedback-banner q-feedback-banner--${feedback.type}`}>
              {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <Card className="q-settings-card">
            <div className="q-card-header-row">
              <div className="q-card-heading">
                <Wrench size={22} color="var(--color-brand-primary)" />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3>Control de Mantenimiento Global del Sistema</h3>
                    <Badge
                      variant={maintenanceSettings.maintenance_mode ? "warning" : "success"}
                      pulse={maintenanceSettings.maintenance_mode}
                    >
                      {maintenanceSettings.maintenance_mode ? "Mantenimiento Activo" : "Plataforma Operativa"}
                    </Badge>
                  </div>
                  <p>
                    Permite dar de baja temporalmente el portal cuando se requiera realizar trabajos de infraestructura, mantenimiento de bases de datos o despliegues críticos. Cuando está activo, los visitantes y clientes son redirigidos a la pantalla de mantenimiento.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="q-toggle-row"
              style={{
                backgroundColor: maintenanceSettings.maintenance_mode
                  ? "rgba(245, 158, 11, 0.08)"
                  : "var(--color-surface-muted)",
                padding: "16px 20px",
                borderRadius: "12px",
                border: maintenanceSettings.maintenance_mode
                  ? "1px solid rgba(245, 158, 11, 0.35)"
                  : "1px solid var(--color-border-default)",
                transition: "all var(--motion-fast)",
              }}
            >
              <div className="q-toggle-label">
                <span className="q-toggle-title">
                  {maintenanceSettings.maintenance_mode
                    ? "🚨 MODO MANTENIMIENTO ACTIVADO (Portal fuera de servicio)"
                    : "🛡️ Activar Modo Mantenimiento"}
                </span>
                <span className="q-toggle-desc">
                  Al encender este interruptor, el portal completo mostrará la página de mantenimiento con los tiempos estimados y datos de contacto de soporte a todos los usuarios y visitantes. Solo los Superadministradores podrán acceder a la consola.
                </span>
              </div>
              <label className="q-switch">
                <input
                  type="checkbox"
                  checked={maintenanceSettings.maintenance_mode}
                  onChange={(e) =>
                    setMaintenanceSettings({ ...maintenanceSettings, maintenance_mode: e.target.checked })
                  }
                />
                <span className="q-switch-slider"></span>
              </label>
            </div>

            <div className="q-form-grid" style={{ marginTop: 24 }}>
              <div className="q-form-group">
                <label className="q-form-label">Título del Mantenimiento (Encabezado público)</label>
                <input
                  type="text"
                  className="q-input"
                  value={maintenanceSettings.title}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, title: e.target.value })}
                  placeholder="Ej: Mantenimiento Programado del Sistema"
                />
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Tiempo Estimado de Retorno (Duración)</label>
                <input
                  type="text"
                  className="q-input"
                  value={maintenanceSettings.estimated_end}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, estimated_end: e.target.value })}
                  placeholder="Ej: Aproximadamente 45 minutos"
                />
              </div>

              <div className="q-form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="q-form-label">Mensaje Explicativo para los Usuarios y Clientes</label>
                <textarea
                  className="q-input"
                  rows={3}
                  value={maintenanceSettings.message}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, message: e.target.value })}
                  placeholder="Describe brevemente las tareas en curso..."
                />
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Correo de Soporte de Emergencia</label>
                <input
                  type="email"
                  className="q-input"
                  value={maintenanceSettings.contact_email}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, contact_email: e.target.value })}
                  placeholder="soporte@qhapana.com"
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 28,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <a href="/maintenance" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Button variant="outline" size="md" icon={<Eye size={16} />}>
                  Ver Pantalla de Mantenimiento (Vista Previa)
                </Button>
              </a>

              <Button
                variant={maintenanceSettings.maintenance_mode ? "danger" : "primary"}
                size="md"
                icon={<Save size={16} />}
                onClick={handleSaveMaintenance}
                loading={savingMaintenance}
              >
                {maintenanceSettings.maintenance_mode ? "Guardar y Activar Mantenimiento" : "Guardar Configuración"}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {feedback && (
            <div className={`q-feedback-banner q-feedback-banner--${feedback.type}`}>
              {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="q-settings-grid">
        {/* CARD 1: DISPARADORES */}
        <Card className="q-settings-card">
          <div className="q-card-header-row">
            <div className="q-card-heading">
              <Bell size={20} color="var(--color-brand-primary)" />
              <div>
                <h3>Disparadores de Eventos Críticos</h3>
                <p>Elija qué condiciones disparan una notificación por correo</p>
              </div>
            </div>
          </div>

          <div className="q-toggle-row">
            <div className="q-toggle-label">
              <span className="q-toggle-title">Activar Alertas por Correo</span>
              <span className="q-toggle-desc">Habilita o deshabilita el envío global de notificaciones</span>
            </div>
            <label className="q-switch">
              <input
                type="checkbox"
                checked={emailAlertsEnabled}
                onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
              />
              <span className="q-switch-slider"></span>
            </label>
          </div>

          <div className="q-toggle-row">
            <div className="q-toggle-label">
              <span className="q-toggle-title">Caída de Equipo o Servidor (OFFLINE)</span>
              <span className="q-toggle-desc">Disparar cuando el Watchdog detecte ausencia de señal de presencia</span>
            </div>
            <label className="q-switch">
              <input
                type="checkbox"
                disabled={!emailAlertsEnabled}
                checked={notifyOnOffline && emailAlertsEnabled}
                onChange={(e) => setNotifyOnOffline(e.target.checked)}
              />
              <span className="q-switch-slider"></span>
            </label>
          </div>

          <div className="q-toggle-row">
            <div className="q-toggle-label">
              <span className="q-toggle-title">Falla de Contenedor Docker (CrashLoop / Exited)</span>
              <span className="q-toggle-desc">Disparar si un contenedor supervisado se detiene con error o unhealthy</span>
            </div>
            <label className="q-switch">
              <input
                type="checkbox"
                disabled={!emailAlertsEnabled}
                checked={notifyOnContainerCrash && emailAlertsEnabled}
                onChange={(e) => setNotifyOnContainerCrash(e.target.checked)}
              />
              <span className="q-switch-slider"></span>
            </label>
          </div>

          <div className="q-toggle-row">
            <div className="q-toggle-label">
              <span className="q-toggle-title">Saturación Crítica de Recursos</span>
              <span className="q-toggle-desc">Disparar alerta si un equipo supera umbrales de saturación (CPU &gt; 85%, RAM &gt; 90%, Disco &gt; 90%)</span>
            </div>
            <label className="q-switch">
              <input
                type="checkbox"
                disabled={!emailAlertsEnabled}
                checked={notifyOnPerformanceIssues && emailAlertsEnabled}
                onChange={(e) => setNotifyOnPerformanceIssues(e.target.checked)}
              />
              <span className="q-switch-slider"></span>
            </label>
          </div>

          <div style={{ marginTop: "8px", paddingTop: "14px", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Calendar size={18} color="var(--color-brand-primary)" />
              <strong style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>
                Programación de Entrega Automática de Informes
              </strong>
            </div>
            <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
              Los administradores deciden con qué frecuencia el sistema envía el informe ejecutivo con diagnóstico preventivo por IA a los destinatarios configurados.
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                className="q-select-field"
                value={reportSchedule}
                onChange={(e) => setReportSchedule(e.target.value)}
                style={{ minWidth: "220px", flex: 1 }}
              >
                <option value="daily">Diario (Todos los días, 08:00 AM)</option>
                <option value="weekly">Semanal (Cada Lunes, 08:00 AM)</option>
                <option value="disabled">Desactivado (Solo bajo demanda)</option>
              </select>
              <Button
                type="button"
                variant="secondary"
                icon={generatingReport ? <Loader2 size={16} className="q-spin" /> : <FileText size={16} />}
                onClick={handleGenerateImmediateReport}
                disabled={generatingReport || saving || recipients.length === 0}
                title="Generar y despachar informe consolidado de salud e incidencias por correo ahora mismo"
              >
                {generatingReport ? "Generando..." : "Enviar Informe de Salud Ahora"}
              </Button>
            </div>
          </div>
        </Card>

        {/* CARD 2: DESTINATARIOS */}
        <Card className="q-settings-card">
          <div className="q-card-header-row">
            <div className="q-card-heading">
              <Mail size={20} color="var(--color-brand-primary)" />
              <div>
                <h3>Destinatarios del Correo</h3>
                <p>Uno o múltiples correos electrónicos que recibirán las alertas</p>
              </div>
            </div>
            <Badge variant="info">{recipients.length} configurado(s)</Badge>
          </div>

          <div className="q-recipients-box">
            <form className="q-add-recipient-row" onSubmit={handleAddRecipient}>
              <input
                type="email"
                placeholder="ejemplo@empresa.com"
                className="q-input-field"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
              />
              <Button type="submit" variant="secondary" icon={<Plus size={16} />}>
                Agregar
              </Button>
            </form>

            <div className="q-recipient-chips">
              {recipients.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", padding: "4px" }}>
                  No hay destinatarios asignados aún.
                </span>
              ) : (
                recipients.map((email) => (
                  <span key={email} className="q-chip">
                    {email}
                    <button
                      type="button"
                      className="q-chip-remove"
                      onClick={() => handleRemoveRecipient(email)}
                      title={`Quitar ${email}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* CARD: CATÁLOGO DE ÁREAS Y CLIENTES */}
        <Card className="q-settings-card" style={{ gridColumn: "1 / -1" }}>
          <div className="q-card-header-row">
            <div className="q-card-heading">
              <Users size={20} color="var(--color-brand-primary)" />
              <div>
                <h3>Catálogo de Áreas y Clientes</h3>
                <p>Defina las áreas o clientes disponibles para clasificar y etiquetar los equipos de la flota</p>
              </div>
            </div>
            <Badge variant="neutral">
              {clientAreas.length} área(s) disponible(s)
            </Badge>
          </div>

          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
            Estas etiquetas se utilizan en la columna <strong>Área / Cliente</strong> del inventario y del panel de control. El área <strong>General</strong> es el valor predeterminado y está protegido.
          </p>

          <form onSubmit={handleAddArea} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <input
              type="text"
              className="q-input-field"
              placeholder="Nombre del área o cliente (ej: Contabilidad, Facturación, Gerencia, Sistemas, Sucursal Lima)..."
              value={newAreaInput}
              onChange={(e) => {
                setNewAreaInput(e.target.value);
                if (areaError) setAreaError(null);
              }}
              style={{ flex: 1 }}
            />
            <Button
              type="submit"
              variant="secondary"
              icon={savingArea ? <Loader2 size={16} className="q-spin" /> : <Plus size={16} />}
              disabled={!newAreaInput.trim() || savingArea}
            >
              {savingArea ? "Guardando..." : "Agregar Área / Cliente"}
            </Button>
          </form>

          {areaError && (
            <div style={{ color: "var(--color-status-danger)", fontSize: "12.5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> {areaError}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {clientAreas.map((area) => {
              const isGeneral = area.toLowerCase() === "general";
              return (
                <span
                  key={area}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: isGeneral ? "rgba(99, 102, 241, 0.15)" : "var(--color-surface-hover, rgba(255, 255, 255, 0.06))",
                    border: isGeneral ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))",
                    color: isGeneral ? "var(--color-brand-primary)" : "var(--color-text-primary)",
                    fontWeight: 500,
                    fontSize: "13px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                  }}
                >
                  <span>{area}</span>
                  {isGeneral ? (
                    <span style={{ fontSize: "10px", opacity: 0.75, textTransform: "uppercase", fontWeight: 700 }}>Por defecto</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(area)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-text-tertiary)",
                        cursor: "pointer",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      title={`Eliminar ${area}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </Card>
      </div>

      {/* CARD 3: CANAL DE ENTREGA (Exclusivo para Superusuarios) */}
      {user?.role === "SUPERADMIN" && (
        <Card className="q-settings-card">
          <div className="q-card-header-row">
            <div className="q-card-heading">
              <Server size={20} color="var(--color-brand-primary)" />
              <div>
                <h3>Canal de Envío y Servidor de Mensajería</h3>
                <p>Configuración de infraestructura de entrega de correo (Exclusivo Superadministrador)</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <Button
                variant={deliveryChannel === "google_oauth" ? "primary" : "outline"}
                onClick={() => setDeliveryChannel("google_oauth")}
              >
                Google OAuth (Gmail)
              </Button>
              <Button
                variant={deliveryChannel === "smtp" ? "primary" : "outline"}
                onClick={() => setDeliveryChannel("smtp")}
              >
                Servidor SMTP
              </Button>
            </div>
          </div>

          {deliveryChannel === "google_oauth" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px", background: "var(--color-bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldCheck size={20} color="var(--color-status-success)" />
                <div>
                  <strong>Google Messaging (OAuth 2.0 / Gmail API)</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                    Autenticación directa de Google configurada en variables de entorno (.env).
                  </p>
                </div>
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>• <strong>Client ID:</strong> <code>{googleClientId || "Configurado en .env"}</code></div>
                <div>• <strong>Estado del Token:</strong> {googleOauthConfigured ? <Badge variant="success">Token Presente</Badge> : <Badge variant="warning">Pendiente</Badge>}</div>
                <div>• <strong>Modo Resiliente:</strong> Si el token de Google expira, conmuta automáticamente a SMTP si está configurado.</div>
              </div>
            </div>
          ) : (
            <div className="q-form-grid">
              <div className="q-form-group">
                <label className="q-form-label">Servidor SMTP (Host)</label>
                <input
                  type="text"
                  className="q-input-field"
                  placeholder="smtp.gmail.com o smtp.office365.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>
              <div className="q-form-group">
                <label className="q-form-label">Puerto SMTP</label>
                <input
                  type="number"
                  className="q-input-field"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                />
              </div>
              <div className="q-form-group">
                <label className="q-form-label">Usuario SMTP / Correo</label>
                <input
                  type="text"
                  className="q-input-field"
                  placeholder="usuario@dominio.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>
              <div className="q-form-group">
                <label className="q-form-label">
                  Contraseña SMTP {smtpPasswordConfigured && <span style={{ color: "var(--color-status-success)" }}>(Configurada)</span>}
                </label>
                <input
                  type="password"
                  className="q-input-field"
                  placeholder={smtpPasswordConfigured ? "•••••••••• (Dejar en blanco para mantener)" : "Contraseña de aplicación"}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
              </div>
              <div className="q-form-group">
                <label className="q-form-label">Correo Remitente (From)</label>
                <input
                  type="text"
                  className="q-input-field"
                  placeholder="alertas@qhapana-rmm.local"
                  value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                />
              </div>
              <div className="q-form-group" style={{ justifyContent: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", marginTop: "16px" }}>
                  <input
                    type="checkbox"
                    checked={smtpUseTls}
                    onChange={(e) => setSmtpUseTls(e.target.checked)}
                  />
                  Utilizar conexión segura STARTTLS
                </label>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* BARRA DE ACCIONES */}
      <div className="q-settings-actions">
        <Button
          variant="outline"
          icon={testing ? <Loader2 size={16} className="q-spin" /> : <Send size={16} />}
          onClick={handleTestEmail}
          disabled={testing || saving || recipients.length === 0}
        >
          {testing ? "Enviando Prueba..." : "Enviar Correo de Prueba"}
        </Button>

        <Button
          variant="primary"
          icon={saving ? <Loader2 size={16} className="q-spin" /> : <Save size={16} />}
          onClick={handleSave}
          disabled={saving || testing}
        >
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>
      </>
      )}
    </div>
  );
};
