import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertTriangle,
  Server,
  BarChart3,
  WifiOff,
  Cpu,
  HardDrive,
  Database,
  AlertOctagon,
  PowerOff,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  Layers,
  Building2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/Button/Button";
import {
  getIncidentsReport,
  updateIncidentStatus,
  getDevices,
  type IncidentReportItem,
  type IncidentReportStats,
  type TypologyMeta,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Device } from "../types/device";
import { InventoryReportModal } from "../components/InventoryReportModal/InventoryReportModal";
import { DeviceSummaryReportModal } from "../components/DeviceSummaryReportModal/DeviceSummaryReportModal";
import "./ReportsView.css";

export type ReportTabType = "incidents" | "fleet" | "summary";

export interface ReportsViewProps {
  initialTab?: ReportTabType;
  onOpenDeviceDetail?: (deviceId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialTab = "incidents",
  onOpenDeviceDetail,
}) => {
  const { activeOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTabType>(initialTab);

  // Synchronize initialTab if changed by parent navigation
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Incidents Data & Filters State
  const [incidents, setIncidents] = useState<IncidentReportItem[]>([]);
  const [stats, setStats] = useState<IncidentReportStats | null>(null);
  const [typologies, setTypologies] = useState<TypologyMeta[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(true);

  // Filters
  const [selectedTypology, setSelectedTypology] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("30d");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Resolution Modal State
  const [selectedIncident, setSelectedIncident] = useState<IncidentReportItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Fleet & Summary Modals
  const [devicesList, setDevicesList] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
  const [inventoryReportOpen, setInventoryReportOpen] = useState<boolean>(false);
  const [summaryReportOpen, setSummaryReportOpen] = useState<boolean>(false);

  // Cargar dispositivos para los reportes de flota y resumen
  const fetchDevices = useCallback(async () => {
    try {
      setLoadingDevices(true);
      const res = await getDevices();
      setDevicesList(res);
    } catch (err) {
      console.error("Error loading devices for reports:", err);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Cargar reporte de incidencias desde API
  const fetchIncidents = useCallback(async () => {
    try {
      setLoadingIncidents(true);
      const data = await getIncidentsReport({
        organization_id: activeOrganization?.id || undefined,
        typology: selectedTypology !== "ALL" ? selectedTypology : undefined,
        severity: selectedSeverity !== "ALL" ? selectedSeverity : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        time_range: selectedTimeRange,
        search: searchQuery.trim() || undefined,
      });

      setIncidents(data.items);
      setStats(data.stats);
      setTypologies(data.typologies);
    } catch (err) {
      console.error("Error fetching incidents report:", err);
    } finally {
      setLoadingIncidents(false);
    }
  }, [
    activeOrganization?.id,
    selectedTypology,
    selectedSeverity,
    selectedStatus,
    selectedTimeRange,
    searchQuery,
  ]);

  useEffect(() => {
    if (activeTab === "incidents") {
      fetchIncidents();
    }
  }, [activeTab, fetchIncidents]);

  // Exportar datos de incidencias a CSV
  const handleExportCSV = () => {
    if (incidents.length === 0) return;

    const headers = [
      "ID",
      "Fecha y Hora",
      "Equipo (Hostname)",
      "Organización",
      "Tipología",
      "Severidad",
      "Título",
      "Descripción",
      "Estado",
      "Resuelto Por",
    ];

    const rows = incidents.map((item) => [
      `"${item.id}"`,
      `"${new Date(item.occurred_at).toLocaleString()}"`,
      `"${item.hostname}"`,
      `"${item.organization_name}"`,
      `"${item.typology_label}"`,
      `"${item.severity}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.status}"`,
      `"${item.resolved_by || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Reporte_Incidencias_Qhapana_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Guardar cambio de estado de incidencia
  const handleSaveStatus = async () => {
    if (!selectedIncident) return;
    try {
      setUpdatingStatus(true);
      await updateIncidentStatus(selectedIncident.id, newStatus, resolutionNote);
      setSelectedIncident(null);
      setResolutionNote("");
      await fetchIncidents();
    } catch (err: any) {
      alert(err.message || "Error al actualizar la incidencia");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Ícono de tipología
  const renderTypologyIcon = (key: string, size = 15) => {
    switch (key) {
      case "DESCONEXION":
        return <WifiOff size={size} style={{ color: "#ef4444" }} />;
      case "RECURSO_CPU":
        return <Cpu size={size} style={{ color: "#f59e0b" }} />;
      case "RECURSO_MEMORIA":
        return <HardDrive size={size} style={{ color: "#8b5cf6" }} />;
      case "RECURSO_DISCO":
        return <Database size={size} style={{ color: "#ec4899" }} />;
      case "ERROR_AGENTE":
        return <AlertOctagon size={size} style={{ color: "#f97316" }} />;
      case "APAGADO_INESPERADO":
        return <PowerOff size={size} style={{ color: "#64748b" }} />;
      case "SEGURIDAD_ACCESO":
        return <ShieldAlert size={size} style={{ color: "#dc2626" }} />;
      default:
        return <AlertTriangle size={size} style={{ color: "var(--color-brand-primary)" }} />;
    }
  };

  return (
    <div className="q-reports-container">
      {/* Header & Main Tabs */}
      <div className="q-reports-header">
        <div className="q-reports-title-area">
          <div>
            <h1 className="q-reports-title">
              <BarChart3 size={24} style={{ color: "var(--color-brand-primary)" }} />
              Centro de Reportes & Análisis Operativo
            </h1>
            <p className="q-reports-subtitle">
              Auditoría unificada de parque de equipos, registro de fallas, desconexiones y tipologías.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {activeTab === "incidents" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={handleExportCSV}
                  disabled={incidents.length === 0}
                >
                  Exportar CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Printer size={14} />}
                  onClick={() => window.print()}
                >
                  Imprimir / PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="q-reports-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "incidents"}
            className={`q-reports-tab-btn ${
              activeTab === "incidents" ? "q-reports-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("incidents")}
          >
            <AlertTriangle size={16} />
            <span>Incidencias & Desconexiones</span>
            {stats && <span className="q-reports-tab-count">{stats.total_incidents}</span>}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "fleet"}
            className={`q-reports-tab-btn ${
              activeTab === "fleet" ? "q-reports-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("fleet")}
          >
            <Server size={16} />
            <span>Inventario de Flota & Equipos</span>
            <span className="q-reports-tab-count">{devicesList.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "summary"}
            className={`q-reports-tab-btn ${
              activeTab === "summary" ? "q-reports-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("summary")}
          >
            <Layers size={16} />
            <span>Resumen Operativo & Áreas</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          PESTAÑA 1: INCIDENCIAS, ERRORES Y DESCONEXIONES
      ======================================================== */}
      {activeTab === "incidents" && (
        <>
          {/* KPI Summary Cards */}
          <div className="q-reports-kpi-grid">
            <div className="q-reports-kpi-card">
              <div className="q-reports-kpi-header">
                <span>Total Incidencias</span>
                <div
                  className="q-reports-kpi-icon-wrap"
                  style={{ background: "rgba(123, 87, 232, 0.12)", color: "var(--color-brand-primary)" }}
                >
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="q-reports-kpi-value">{stats ? stats.total_incidents : "—"}</div>
              <div className="q-reports-kpi-footer">
                <span>Ventana analizada: {selectedTimeRange === "all" ? "Histórico total" : selectedTimeRange}</span>
              </div>
            </div>

            <div className="q-reports-kpi-card">
              <div className="q-reports-kpi-header">
                <span>Desconexiones Registradas</span>
                <div
                  className="q-reports-kpi-icon-wrap"
                  style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}
                >
                  <WifiOff size={18} />
                </div>
              </div>
              <div className="q-reports-kpi-value" style={{ color: "#ef4444" }}>
                {stats ? stats.disconnections_count : "—"}
              </div>
              <div className="q-reports-kpi-footer">
                <span>Pérdidas de enlace y timeouts</span>
              </div>
            </div>

            <div className="q-reports-kpi-card">
              <div className="q-reports-kpi-header">
                <span>Críticas No Resueltas</span>
                <div
                  className="q-reports-kpi-icon-wrap"
                  style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}
                >
                  <AlertOctagon size={18} />
                </div>
              </div>
              <div className="q-reports-kpi-value" style={{ color: "#f59e0b" }}>
                {stats ? stats.critical_active : "—"}
              </div>
              <div className="q-reports-kpi-footer">
                <span>Requieren atención inmediata de soporte</span>
              </div>
            </div>

            <div className="q-reports-kpi-card">
              <div className="q-reports-kpi-header">
                <span>Tasa de Resolución</span>
                <div
                  className="q-reports-kpi-icon-wrap"
                  style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
                >
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="q-reports-kpi-value" style={{ color: "#10b981" }}>
                {stats ? `${stats.resolved_rate}%` : "—"}
              </div>
              <div className="q-reports-kpi-footer">
                <span>Efectividad en mitigación de incidentes</span>
              </div>
            </div>
          </div>

          {/* Tipologías Chips Bar */}
          <div className="q-typology-bar-wrap">
            <div className="q-typology-bar-title">
              <Filter size={13} />
              <span>Filtrar por Tipología de Incidencia</span>
            </div>
            <div className="q-typology-chips">
              {typologies.map((t) => {
                const isActive = selectedTypology === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`q-typology-chip ${isActive ? "q-typology-chip--active" : ""}`}
                    onClick={() => setSelectedTypology(t.key)}
                  >
                    {renderTypologyIcon(t.key, 14)}
                    <span>{t.label}</span>
                    <span className="q-typology-chip-count">{t.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="q-reports-toolbar">
            <div className="q-reports-search-box">
              <Search size={15} className="q-reports-search-icon" />
              <input
                type="text"
                className="q-reports-search-input"
                placeholder="Buscar por equipo, descripción, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="q-reports-filter-group">
              <select
                className="q-reports-select"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                title="Filtrar por Severidad"
              >
                <option value="ALL">Todas las Severidades</option>
                <option value="CRITICAL">🔴 Crítica</option>
                <option value="WARNING">🟡 Advertencia</option>
                <option value="INFO">🔵 Informativa</option>
              </select>

              <select
                className="q-reports-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                title="Filtrar por Estado"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="OPEN">Abierta / Activa</option>
                <option value="INVESTIGATING">En Investigación</option>
                <option value="RESOLVED">Resuelta</option>
              </select>

              <select
                className="q-reports-select"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                title="Filtrar por Rango Temporal"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="all">Todo el histórico</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={14} className={loadingIncidents ? "q-spin" : ""} />}
                onClick={fetchIncidents}
                disabled={loadingIncidents}
                title="Actualizar datos"
              >
                Refrescar
              </Button>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="q-reports-table-card">
            <div className="q-reports-table-wrap">
              <table className="q-reports-table">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Equipo / Hostname</th>
                    <th>Cliente / Org</th>
                    <th>Tipología</th>
                    <th>Severidad</th>
                    <th>Título & Detalle del Fallo</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingIncidents ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                        <RefreshCw size={24} className="q-spin" style={{ color: "var(--color-brand-primary)" }} />
                        <div style={{ marginTop: "10px", color: "var(--color-text-secondary)" }}>
                          Consultando reporte de incidencias y telemetría...
                        </div>
                      </td>
                    </tr>
                  ) : incidents.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="q-reports-empty">
                          <CheckCircle2 size={40} className="q-reports-empty-icon" style={{ color: "#10b981" }} />
                          <h4 style={{ margin: 0, color: "var(--color-text-primary)" }}>
                            No se encontraron incidencias
                          </h4>
                          <p style={{ margin: 0, fontSize: "13px" }}>
                            No existen fallos ni desconexiones que coincidan con los filtros seleccionados.
                          </p>
                          {(selectedTypology !== "ALL" ||
                            selectedSeverity !== "ALL" ||
                            selectedStatus !== "ALL" ||
                            searchQuery) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTypology("ALL");
                                setSelectedSeverity("ALL");
                                setSelectedStatus("ALL");
                                setSearchQuery("");
                              }}
                            >
                              Restablecer Filtros
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    incidents.map((item) => (
                      <tr key={item.id}>
                        <td className="q-incident-time">
                          {new Date(item.occurred_at).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          <br />
                          <span style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>
                            {new Date(item.occurred_at).toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        <td>
                          <div className="q-incident-hostname-cell">
                            <span
                              className="q-incident-hostname"
                              onClick={() => onOpenDeviceDetail && onOpenDeviceDetail(item.device_id)}
                              style={{ cursor: onOpenDeviceDetail ? "pointer" : "default" }}
                              title="Ver ficha de dispositivo"
                            >
                              {item.hostname}
                              {onOpenDeviceDetail && <ExternalLink size={11} />}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="q-incident-org">
                            <Building2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                            {item.organization_name}
                          </span>
                        </td>

                        <td>
                          <span
                            className="q-pill"
                            style={{
                              background: "var(--color-surface-muted)",
                              border: "1px solid var(--color-border-default)",
                            }}
                          >
                            {renderTypologyIcon(item.typology, 12)}
                            {item.typology_label}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`q-pill q-pill--${item.severity.toLowerCase()}`}
                          >
                            {item.severity === "CRITICAL"
                              ? "🔴 Crítica"
                              : item.severity === "WARNING"
                              ? "🟡 Advertencia"
                              : "🔵 Info"}
                          </span>
                        </td>

                        <td className="q-incident-title-cell">
                          <div className="q-incident-title">{item.title}</div>
                          <div className="q-incident-desc">{item.description}</div>
                        </td>

                        <td>
                          <span
                            className={`q-pill q-pill--${item.status.toLowerCase()}`}
                          >
                            {item.status === "OPEN"
                              ? "Abierta"
                              : item.status === "INVESTIGATING"
                              ? "En Atención"
                              : item.status === "RESOLVED"
                              ? "Resuelta"
                              : item.status}
                          </span>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedIncident(item);
                              setNewStatus(item.status === "OPEN" ? "RESOLVED" : item.status);
                            }}
                          >
                            Gestionar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          PESTAÑA 2: INVENTARIO DE FLOTA & EQUIPOS
      ======================================================== */}
      {activeTab === "fleet" && (
        <div className="q-reports-embedded-hub">
          <div className="q-reports-cta-card">
            <div className="q-reports-cta-left">
              <div className="q-reports-cta-icon-box">
                <FileText size={26} />
              </div>
              <div>
                <h3 className="q-reports-cta-title">Reporte Técnico Ejecutivo de Dispositivos</h3>
                <p className="q-reports-cta-desc">
                  Genera una hoja ejecutiva de inventario formal con especificaciones completas de hardware
                  (CPU, RAM, Discos), sistemas operativos, sedes georreferenciales y estados operativos.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<Printer size={16} />}
              onClick={() => setInventoryReportOpen(true)}
              disabled={loadingDevices || devicesList.length === 0}
            >
              Generar & Exportar Reporte de Inventario (PDF)
            </Button>
          </div>

          {/* Quick Snapshot Table of Devices */}
          <div className="q-reports-table-card">
            <div className="q-reports-table-wrap">
              <table className="q-reports-table">
                <thead>
                  <tr>
                    <th>Equipo / Hostname</th>
                    <th>Tipo</th>
                    <th>Sistema Operativo</th>
                    <th>IP / Red</th>
                    <th>Sede / Ubicación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {devicesList.map((dev) => (
                    <tr key={dev.id}>
                      <td style={{ fontWeight: 700 }}>{dev.hostname}</td>
                      <td>{dev.specs?.peripherals?.chassis_type || "Desktop"}</td>
                      <td>{dev.os_type} {dev.os_version}</td>
                      <td>{dev.public_ip || dev.private_ip || "—"}</td>
                      <td>{dev.location_name || "Sede Principal"}</td>
                      <td>
                        <span
                          className={`q-pill ${
                            dev.status?.current_state === "ONLINE"
                              ? "q-pill--resolved"
                              : "q-pill--critical"
                          }`}
                        >
                          {dev.status?.current_state || "UNKNOWN"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PESTAÑA 3: RESUMEN OPERATIVO & ÁREAS
      ======================================================== */}
      {activeTab === "summary" && (
        <div className="q-reports-embedded-hub">
          <div className="q-reports-cta-card">
            <div className="q-reports-cta-left">
              <div className="q-reports-cta-icon-box">
                <Layers size={26} />
              </div>
              <div>
                <h3 className="q-reports-cta-title">Reporte Resumen con Quiebre por Áreas y SO</h3>
                <p className="q-reports-cta-desc">
                  Visualiza el reparto del parque informático categorizado por clientes, áreas funcionales
                  (Sistemas, Administración, Operaciones) o distribución por familias de Sistemas Operativos.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<Layers size={16} />}
              onClick={() => setSummaryReportOpen(true)}
              disabled={loadingDevices || devicesList.length === 0}
            >
              Abrir Reporte Resumen con Desglose
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: GESTIÓN Y RESOLUCIÓN DE INCIDENCIA
      ======================================================== */}
      {selectedIncident && (
        <div className="q-incident-modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="q-incident-modal" onClick={(e) => e.stopPropagation()}>
            <div className="q-incident-modal-header">
              <h3>Gestión de Incidencia</h3>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="q-incident-modal-body">
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <span className={`q-pill q-pill--${selectedIncident.severity.toLowerCase()}`}>
                    {selectedIncident.severity}
                  </span>
                  <span className="q-pill">
                    {renderTypologyIcon(selectedIncident.typology, 12)}
                    {selectedIncident.typology_label}
                  </span>
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "var(--color-text-primary)" }}>
                  {selectedIncident.title}
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                  {selectedIncident.description}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12.5px" }}>
                <div>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Equipo:</span>{" "}
                  <strong>{selectedIncident.hostname}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Cliente / Org:</span>{" "}
                  <strong>{selectedIncident.organization_name}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Detectado:</span>{" "}
                  <span>{new Date(selectedIncident.occurred_at).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Estado actual:</span>{" "}
                  <strong>{selectedIncident.status}</strong>
                </div>
              </div>

              <div className="q-incident-modal-field">
                <label className="q-incident-modal-label">Actualizar Estado</label>
                <select
                  className="q-reports-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="OPEN">🔴 Abierta / Pendiente</option>
                  <option value="INVESTIGATING">🟡 En Investigación por Técnico</option>
                  <option value="RESOLVED">🟢 Resuelta y Mitigada</option>
                  <option value="MUTED">⚪ Silenciada / Falso Positivo</option>
                </select>
              </div>

              <div className="q-incident-modal-field">
                <label className="q-incident-modal-label">Notas de Resolución / Causa Raíz</label>
                <textarea
                  className="q-incident-modal-textarea"
                  placeholder="Detalla las acciones tomadas para resolver esta desconexión o falla (ej: Reinicio de router, limpieza de disco, reconexión de cable de red)..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
            </div>

            <div className="q-incident-modal-footer">
              <Button variant="outline" size="sm" onClick={() => setSelectedIncident(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveStatus}
                loading={updatingStatus}
              >
                Guardar Actualización
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reporte de Inventario Técnico Ejecutivo */}
      {inventoryReportOpen && (
        <InventoryReportModal
          devices={devicesList}
          onClose={() => setInventoryReportOpen(false)}
        />
      )}

      {/* Modal Reporte Resumen por Áreas y Sistemas Operativos */}
      <DeviceSummaryReportModal
        devices={devicesList}
        isOpen={summaryReportOpen}
        onClose={() => setSummaryReportOpen(false)}
      />
    </div>
  );
};
