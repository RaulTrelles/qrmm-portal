import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Activity,
  CheckCircle2,
  RefreshCw,
  FileText,
  Mail,
  Check,
  Clock,
  ShieldAlert,
  HardDrive,
  Layers,
  Copy,
} from "lucide-react";
import { Button } from "../components/Button/Button";
import { Badge } from "../components/Badge/Badge";
import {
  getAIOverview,
  getAIReports,
  getDevices,
  acknowledgeIncident,
  resolveIncident,
  generateAIReport,
  sendReportEmail,
} from "../services/api";
import type { AIHealthOverview, AIReportItem } from "../types/ai";
import { computeLocalAIOverview, computeLocalAIReport } from "../utils/aiFallback";
import {
  formatAnomalyType,
  formatIncidentStatus,
  formatAnomalyDescription,
  getAppLanguage,
} from "../utils/aiFormatters";
import "./AIHealthView.css";

interface AIHealthViewProps {
  onSelectDevice?: (deviceId: string) => void;
}

export const AIHealthView: React.FC<AIHealthViewProps> = ({ onSelectDevice }) => {
  const [overview, setOverview] = useState<AIHealthOverview | null>(null);
  const [reports, setReports] = useState<AIReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"incidents" | "reports">("incidents");
  const [reportViewMode, setReportViewMode] = useState<"executive" | "technical">("executive");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEs = getAppLanguage() === "es";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, fetchedReports] = await Promise.all([
        getAIOverview().catch(() => null),
        getAIReports().catch(() => [] as AIReportItem[]),
      ]);

      const reportsList: AIReportItem[] = [...fetchedReports];

      if (overviewData) {
        setOverview(overviewData);
      } else {
        // Fallback: calcular analítica de salud en cliente a partir de dispositivos reales
        const devs = await getDevices().catch(() => []);
        const localOverview = computeLocalAIOverview(devs);
        setOverview(localOverview);
        if (reportsList.length === 0 && devs.length > 0) {
          reportsList.push(computeLocalAIReport(devs));
        }
      }
      setReports(reportsList);
    } catch (err: any) {
      setError(err.message || (isEs ? "Error al cargar datos de IA" : "Error loading AI data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeIncident(id, isEs ? "Reconocido desde consola AI" : "Acknowledged from AI console");
      fetchData();
    } catch (_err: any) {
      // Simular reconocimiento local si la base de datos remota está en despliegue
      setOverview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          incidents: prev.incidents.map((i) =>
            i.id === id ? { ...i, status: "ACKNOWLEDGED", acknowledged_by: isEs ? "Operador Local" : "Local Operator" } : i
          ),
        };
      });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveIncident(id, isEs ? "Resuelto por técnico" : "Resolved by technician");
      fetchData();
    } catch (_err: any) {
      setOverview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          incidents: prev.incidents.filter((i) => i.id !== id),
          open_incidents_count: Math.max(0, prev.open_incidents_count - 1),
        };
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const rep = await generateAIReport({ report_type: "DAILY", language: isEs ? "es" : "en" });
      setReports((prev) => [rep, ...prev]);
      setActiveTab("reports");
    } catch (_err: any) {
      // Fallback: generar reporte a partir de telemetría de dispositivos
      const devs = await getDevices().catch(() => []);
      const localReport = computeLocalAIReport(devs);
      setReports((prev) => [localReport, ...prev]);
      setActiveTab("reports");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(isEs ? "¡Copiado al portapapeles!" : "Copied to clipboard!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleSendEmail = async (reportId: string) => {
    try {
      setEmailStatus(isEs ? "Enviando correo..." : "Sending email...");
      await sendReportEmail(reportId);
      setEmailStatus(isEs ? "¡Informe enviado con éxito a los contactos configurados!" : "Report successfully sent to configured contacts!");
      setTimeout(() => setEmailStatus(null), 4000);
    } catch (err: any) {
      setEmailStatus(`${isEs ? "Error:" : "Error:"} ${err.message}`);
      setTimeout(() => setEmailStatus(null), 4000);
    }
  };

  if (loading && !overview) {
    return (
      <div className="q-ai-health-view">
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--color-text-secondary)" }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: "0 auto 16px auto", color: "var(--color-brand-primary)" }} />
          <div>{isEs ? "Analizando telemetría y diagnósticos predictivos..." : "Analyzing telemetry and predictive diagnostics..."}</div>
        </div>
      </div>
    );
  }

  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <div className="q-ai-health-view">
      {/* 1. Header */}
      <div className="q-ai-header">
        <div className="q-ai-title-box">
          <h1>
            <Sparkles size={24} color="var(--color-brand-primary, #673de6)" />
            {isEs ? "AI Health & Diagnóstico Predictivo" : "AI Health & Predictive Diagnostics"}
          </h1>
          <p className="q-ai-subtitle">
            {isEs
              ? "Monitoreo proactivo continuo, detección de anomalías correlacionadas y reportes ejecutivos automatizados."
              : "Continuous proactive monitoring, correlated anomaly detection and automated executive reports."}
          </p>
        </div>

        <div className="q-ai-header-actions">
          <Button variant="secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} style={{ marginRight: 6 }} className={loading ? "animate-spin" : ""} />
            {isEs ? "Actualizar" : "Refresh"}
          </Button>

          <Button variant="primary" onClick={handleGenerateReport} disabled={generatingReport}>
            <FileText size={15} style={{ marginRight: 6 }} />
            {generatingReport
              ? isEs ? "Generando..." : "Generating..."
              : isEs ? "Generar Informe Diario" : "Generate Daily Report"}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* 2. KPI Metrics Strip */}
      <div className="q-ai-kpi-grid">
        {/* KPI 1: Health Score Global */}
        <div className="q-ai-kpi-card">
          <span className="q-ai-kpi-label">
            <Activity size={15} color="var(--color-brand-primary)" />
            {isEs ? "Índice de Salud Global" : "Global Health Score"}
          </span>
          <div className="q-ai-kpi-value-row">
            <span
              className="q-ai-kpi-value"
              style={{
                color:
                  (overview?.overall_health_score || 100) >= 80
                    ? "var(--color-status-success, #16a34a)"
                    : (overview?.overall_health_score || 100) >= 60
                    ? "var(--color-status-warning, #d97706)"
                    : "var(--color-status-danger, #dc2626)",
              }}
            >
              {overview?.overall_health_score || 100}
            </span>
            <span style={{ fontSize: 18, color: "var(--color-text-tertiary)", fontWeight: 700 }}>/ 100</span>
          </div>
          <span className="q-ai-kpi-subtext">
            {isEs
              ? (overview?.overall_health_score || 100) >= 85
                ? "🟢 Infraestructura estable y saludable"
                : "🟡 Atención preventiva requerida"
              : (overview?.overall_health_score || 100) >= 85
                ? "🟢 Stable and healthy infrastructure"
                : "🟡 Preventive attention required"}
          </span>
        </div>

        {/* KPI 2: Equipos Supervisados */}
        <div className="q-ai-kpi-card">
          <span className="q-ai-kpi-label">
            <Layers size={15} />
            {isEs ? "Equipos Supervisados" : "Monitored Devices"}
          </span>
          <div className="q-ai-kpi-value-row">
            <span className="q-ai-kpi-value">{overview?.total_devices || 0}</span>
          </div>
          <span className="q-ai-kpi-subtext">
            {overview?.devices_by_health.healthy || 0} {isEs ? "saludables" : "healthy"} • {overview?.devices_by_health.warning || 0} {isEs ? "advertencias" : "warnings"}
          </span>
        </div>

        {/* KPI 3: Incidentes Activos Correlacionados */}
        <div className="q-ai-kpi-card">
          <span className="q-ai-kpi-label">
            <ShieldAlert size={15} color="var(--color-status-danger)" />
            {isEs ? "Incidentes Activos" : "Active Incidents"}
          </span>
          <div className="q-ai-kpi-value-row">
            <span
              className="q-ai-kpi-value"
              style={{
                color: (overview?.open_incidents_count || 0) > 0 ? "var(--color-status-danger)" : "var(--color-text-primary)",
              }}
            >
              {overview?.open_incidents_count || 0}
            </span>
          </div>
          <span className="q-ai-kpi-subtext">
            {isEs ? "Deduplicados para evitar fatiga de alertas" : "Deduplicated to prevent alert fatigue"}
          </span>
        </div>

        {/* KPI 4: Alertas Predictivas */}
        <div className="q-ai-kpi-card">
          <span className="q-ai-kpi-label">
            <Clock size={15} color="var(--color-status-warning)" />
            {isEs ? "Tendencias Predictivas" : "Predictive Trends"}
          </span>
          <div className="q-ai-kpi-value-row">
            <span className="q-ai-kpi-value">{overview?.recent_anomalies.length || 0}</span>
          </div>
          <span className="q-ai-kpi-subtext">
            {isEs ? "Proyecciones de almacenamiento y memoria" : "Storage and memory projections"}
          </span>
        </div>
      </div>

      {/* 3. Navegación por Pestañas */}
      <div className="q-ai-tabs-bar">
        <button
          className={`q-ai-tab-btn ${activeTab === "incidents" ? "q-ai-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("incidents")}
        >
          <ShieldAlert size={17} />
          {isEs ? "Monitoreo e Incidentes Activos" : "Monitoring & Active Incidents"} ({overview?.incidents.length || 0})
        </button>
        <button
          className={`q-ai-tab-btn ${activeTab === "reports" ? "q-ai-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <FileText size={17} />
          {isEs ? "Informes Ejecutivos & Técnicos" : "Executive & Technical Reports"} ({reports.length})
        </button>
      </div>

      {/* 4. Contenido Pestaña 1: Incidentes & Anomalías Predictivas */}
      {activeTab === "incidents" && (
        <div className="q-ai-content-grid">
          {/* Panel Izquierdo: Incidentes Correlacionados */}
          <div className="q-ai-panel">
            <div className="q-ai-panel-header">
              <h2 className="q-ai-panel-title">
                <ShieldAlert size={18} color="var(--color-brand-primary)" />
                {isEs ? "Incidentes Correlacionados por IA" : "AI Correlated Incidents"}
              </h2>
              <Badge variant="neutral">
                {overview?.incidents.length || 0} {isEs ? "Registrados" : "Recorded"}
              </Badge>
            </div>

            {(!overview?.incidents || overview.incidents.length === 0) ? (
              <div className="q-ai-empty-state">
                <div className="q-ai-empty-icon">
                  <CheckCircle2 size={26} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {isEs ? "Sin incidentes activos" : "No active incidents"}
                </div>
                <div style={{ fontSize: 13.5 }}>
                  {isEs
                    ? "Todos los agentes reportan telemetría en rangos óptimos. No se han detectado anomalías no resueltas."
                    : "All agents report telemetry in optimal ranges. No unresolved anomalies detected."}
                </div>
              </div>
            ) : (
              <div className="q-ai-incidents-list">
                {overview.incidents.map((inc) => (
                  <div key={inc.id} className="q-ai-incident-item">
                    <div className="q-ai-incident-top">
                      <div>
                        <h3 className="q-ai-incident-title">{inc.title}</h3>
                        <p className="q-ai-incident-summary">{inc.summary}</p>
                      </div>
                      <Badge
                        variant={
                          inc.status === "OPEN"
                            ? "danger"
                            : inc.status === "ACKNOWLEDGED"
                            ? "warning"
                            : "success"
                        }
                      >
                        {formatIncidentStatus(inc.status, isEs ? "es" : "en")}
                      </Badge>
                    </div>

                    <div className="q-ai-incident-actions">
                      <div className="q-ai-incident-meta">
                        <Clock size={13} />
                        <span>{isEs ? "Riesgo Calculado:" : "Calculated Risk:"} <b>{inc.risk_score}/100</b></span>
                        {inc.acknowledged_by && (
                          <span>• {isEs ? "Reconocido por:" : "Acknowledged by:"} {inc.acknowledged_by}</span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {inc.status === "OPEN" && (
                          <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(inc.id)}>
                            {isEs ? "Reconocer" : "Acknowledge"}
                          </Button>
                        )}
                        {inc.status !== "RESOLVED" && (
                          <Button size="sm" variant="primary" onClick={() => handleResolve(inc.id)}>
                            {isEs ? "Resolver" : "Resolve"}
                          </Button>
                        )}
                        {onSelectDevice && inc.device_id && (
                          <Button size="sm" variant="secondary" onClick={() => onSelectDevice(inc.device_id)}>
                            {isEs ? "Ver Equipo" : "View Device"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Derecho: Alertas Predictivas y Tendencias */}
          <div className="q-ai-panel">
            <div className="q-ai-panel-header">
              <h2 className="q-ai-panel-title">
                <HardDrive size={18} color="var(--color-status-warning)" />
                {isEs ? "Proyecciones de Tendencia" : "Trend Projections"}
              </h2>
            </div>

            {(!overview?.recent_anomalies || overview.recent_anomalies.length === 0) ? (
              <div className="q-ai-empty-state">
                <div className="q-ai-empty-icon">
                  <Check size={26} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {isEs ? "Tendencias estables" : "Stable trends"}
                </div>
                <div style={{ fontSize: 13 }}>
                  {isEs
                    ? "No hay riesgo de agotamiento de almacenamiento ni fugas de memoria."
                    : "No storage exhaustion or memory leak risk detected."}
                </div>
              </div>
            ) : (
              <div>
                {overview.recent_anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className={`q-ai-anomaly-item ${
                      anom.severity === "CRITICAL" ? "q-ai-anomaly-item--critical" : ""
                    }`}
                  >
                    <div className="q-ai-anomaly-title">
                      {formatAnomalyType(anom.type || (anom as any).anomaly_type, isEs ? "es" : "en")}
                    </div>
                    <p className="q-ai-anomaly-desc">
                      {formatAnomalyDescription(anom.description, isEs ? "es" : "en")}
                    </p>
                    {anom.projection_days && (
                      <span className="q-ai-projection-badge">
                        <Clock size={12} />
                        {isEs ? "Saturación estimada:" : "Estimated saturation:"} ~{anom.projection_days} {isEs ? "días" : "days"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Contenido Pestaña 2: Informes Ejecutivos & Técnicos */}
      {activeTab === "reports" && (
        <div className="q-ai-reports-container">
          {latestReport ? (
            <div className="q-ai-report-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)" }}>
                    {isEs ? "Informe de Infraestructura TI" : "IT Infrastructure Report"} ({latestReport.report_type})
                  </h3>
                  <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
                    {isEs ? "Generado el" : "Generated on"} {new Date(latestReport.created_at).toLocaleString(isEs ? "es-ES" : "en-US")} • {isEs ? "Salud General:" : "Overall Health:"} {latestReport.overall_health_score}/100
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div className="q-ai-report-view-toggle">
                    <button
                      className={`q-ai-report-view-btn ${reportViewMode === "executive" ? "q-ai-report-view-btn--active" : ""}`}
                      onClick={() => setReportViewMode("executive")}
                    >
                      {isEs ? "Ejecutivo (Cliente)" : "Executive (Client)"}
                    </button>
                    <button
                      className={`q-ai-report-view-btn ${reportViewMode === "technical" ? "q-ai-report-view-btn--active" : ""}`}
                      onClick={() => setReportViewMode("technical")}
                    >
                      {isEs ? "Técnico (Ingeniería)" : "Technical (Engineering)"}
                    </button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      handleCopyText(
                        reportViewMode === "executive" ? latestReport.client_facing_text : latestReport.executive_summary
                      )
                    }
                  >
                    <Copy size={14} style={{ marginRight: 6 }} />
                    {isEs ? "Copiar" : "Copy"}
                  </Button>

                  <Button variant="primary" size="sm" onClick={() => handleSendEmail(latestReport.id)}>
                    <Mail size={14} style={{ marginRight: 6 }} />
                    {isEs ? "Enviar por Correo" : "Send by Email"}
                  </Button>
                </div>
              </div>

              {copyFeedback && (
                <div style={{ background: "#dcfce7", color: "#166534", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  {copyFeedback}
                </div>
              )}

              {emailStatus && (
                <div style={{ background: "#ede9fe", color: "#5b21b6", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  {emailStatus}
                </div>
              )}

              {/* Vista Ejecutiva para el Cliente */}
              {reportViewMode === "executive" && (
                <div className="q-ai-report-textbox">
                  {latestReport.client_facing_text || latestReport.executive_summary}
                </div>
              )}

              {/* Vista Técnica para Ingenieros */}
              {reportViewMode === "technical" && (
                <div>
                  <div className="q-ai-report-textbox" style={{ marginBottom: 16 }}>
                    <b>{isEs ? "Resumen Técnico del Motor IA:" : "AI Engine Technical Summary:"}</b>
                    <br />
                    {latestReport.executive_summary}
                  </div>

                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: "16px 0 8px 0" }}>
                    {isEs ? "Hallazgos Principales" : "Key Findings"}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {latestReport.top_findings && latestReport.top_findings.length > 0 ? (
                      latestReport.top_findings.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: 8,
                            background: "var(--color-surface-page)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{f.device_name}: </span>
                            <span style={{ fontSize: 13.5, color: "var(--color-text-secondary)" }}>{f.issue}</span>
                            <div style={{ fontSize: 12.5, color: "var(--color-brand-primary)", marginTop: 4 }}>
                              {isEs ? "Acción recomendada:" : "Recommended action:"} {f.recommendation}
                            </div>
                          </div>
                          <Badge variant={f.severity === "CRITICAL" ? "danger" : f.severity === "WARNING" ? "warning" : "neutral"}>
                            {f.severity}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {isEs ? "No se registraron anomalías críticas durante este ciclo." : "No critical anomalies recorded during this cycle."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="q-ai-panel">
              <div className="q-ai-empty-state">
                <FileText size={32} color="var(--color-brand-primary)" />
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {isEs ? "Aún no se han generado informes de IA" : "No AI reports generated yet"}
                </div>
                <div style={{ fontSize: 13.5, maxWidth: 440 }}>
                  {isEs
                    ? 'Presione "Generar Informe Diario" en la parte superior para compilar el diagnóstico general de salud y generar los resúmenes ejecutivos.'
                    : 'Click "Generate Daily Report" at the top to compile the general health diagnosis and generate executive summaries.'}
                </div>
                <Button variant="primary" onClick={handleGenerateReport} disabled={generatingReport}>
                  {isEs ? "Generar Primer Informe" : "Generate First Report"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
