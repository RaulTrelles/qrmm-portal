import React, { useState, useMemo } from "react";
import type { Device } from "../../types/device";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import {
  Printer,
  Download,
  X,
  Layers,
  Building2,
  Cpu,
  Monitor,
  CheckCircle2,
  XCircle,
  Search,
  PieChart,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import "./DeviceSummaryReportModal.css";

export interface DeviceSummaryReportModalProps {
  devices: Device[];
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSummaryReportModal: React.FC<DeviceSummaryReportModalProps> = ({
  devices,
  isOpen,
  onClose,
}) => {
  const [breakdownType, setBreakdownType] = useState<"area" | "os">("area");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ONLINE" | "OFFLINE">("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const nowFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "full",
      timeStyle: "medium",
    }).format(new Date());
  }, []);

  // Helper para clasificar el sistema operativo en familias normalizadas
  const getNormalizedOSFamily = (d: Device): string => {
    const raw = `${d.os_version || ""} ${d.os_type || ""}`.toLowerCase();
    if (raw.includes("server 2025")) return "Windows Server 2025";
    if (raw.includes("server 2022")) return "Windows Server 2022";
    if (raw.includes("server 2019")) return "Windows Server 2019";
    if (raw.includes("server 2016")) return "Windows Server 2016";
    if (raw.includes("server 2012")) return "Windows Server 2012";
    if (raw.includes("windows 11") || raw.includes("10.0.22") || raw.includes("10.0.26")) return "Windows 11";
    if (raw.includes("windows 10") || raw.includes("10.0.19")) return "Windows 10";
    if (raw.includes("windows 7") || raw.includes("windows 8")) return "Windows 7 / 8 Legacy";
    if (raw.includes("ubuntu")) return "Linux (Ubuntu)";
    if (raw.includes("debian")) return "Linux (Debian)";
    if (raw.includes("centos") || raw.includes("red hat") || raw.includes("rhel")) return "Linux (RHEL / CentOS)";
    if (raw.includes("linux")) return "Linux (General)";
    if (raw.includes("darwin") || raw.includes("mac")) return "macOS";
    return d.os_version || d.os_type || "Otros Sistemas";
  };

  // Filtrado reactivo inicial
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.hostname || "").toLowerCase().includes(q) ||
        (d.device_code || "").toLowerCase().includes(q) ||
        (d.client_area || "").toLowerCase().includes(q) ||
        (d.os_version || "").toLowerCase().includes(q) ||
        (d.private_ip || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ONLINE" && d.status?.current_state === "ONLINE") ||
        (statusFilter === "OFFLINE" && d.status?.current_state !== "ONLINE");

      return matchesSearch && matchesStatus;
    });
  }, [devices, searchQuery, statusFilter]);

  // Métricas ejecutivas globales de la flota
  const fleetMetrics = useMemo(() => {
    const total = devices.length;
    let online = 0;
    let totalRam = 0;
    let totalDisk = 0;
    const areas = new Set<string>();
    const osFamilies = new Set<string>();

    devices.forEach((d) => {
      if (d.status?.current_state === "ONLINE") online++;
      if (d.client_area) areas.add(d.client_area.trim());
      else areas.add("Sede General");
      osFamilies.add(getNormalizedOSFamily(d));
      if (d.specs?.ram_total_gb) totalRam += d.specs.ram_total_gb;
      if (d.specs?.disk_total_gb) totalDisk += d.specs.disk_total_gb;
    });

    const offline = total - online;
    const availability = total > 0 ? Math.round((online / total) * 100) : 0;
    const avgRam = total > 0 ? Math.round(totalRam / total) : 0;
    const avgDisk = total > 0 ? Math.round(totalDisk / total) : 0;

    return {
      total,
      online,
      offline,
      availability,
      totalAreas: areas.size,
      totalOSFamilies: osFamilies.size,
      avgRam,
      avgDisk,
    };
  }, [devices]);

  // Quiebre por Área / Cliente
  const areaBreakdown = useMemo(() => {
    const map = new Map<string, Device[]>();

    filteredDevices.forEach((d) => {
      const area = (d.client_area || "").trim() || "Sede General / Sin Área Asignada";
      if (!map.has(area)) map.set(area, []);
      map.get(area)!.push(d);
    });

    const result = Array.from(map.entries()).map(([areaName, devs]) => {
      const total = devs.length;
      const online = devs.filter((d) => d.status?.current_state === "ONLINE").length;
      const offline = total - online;
      const availability = total > 0 ? Math.round((online / total) * 100) : 0;

      // Distribución de SO en esta área
      const osCounts: Record<string, number> = {};
      devs.forEach((d) => {
        const osFam = getNormalizedOSFamily(d);
        osCounts[osFam] = (osCounts[osFam] || 0) + 1;
      });

      return {
        name: areaName,
        total,
        online,
        offline,
        availability,
        osCounts,
        devices: devs,
      };
    });

    // Ordenar de mayor a menor cantidad de equipos
    return result.sort((a, b) => b.total - a.total);
  }, [filteredDevices]);

  // Quiebre por Sistema Operativo
  const osBreakdown = useMemo(() => {
    const map = new Map<string, Device[]>();

    filteredDevices.forEach((d) => {
      const osFam = getNormalizedOSFamily(d);
      if (!map.has(osFam)) map.set(osFam, []);
      map.get(osFam)!.push(d);
    });

    const totalFleet = filteredDevices.length;
    const result = Array.from(map.entries()).map(([osName, devs]) => {
      const total = devs.length;
      const online = devs.filter((d) => d.status?.current_state === "ONLINE").length;
      const offline = total - online;
      const availability = total > 0 ? Math.round((online / total) * 100) : 0;
      const percentage = totalFleet > 0 ? Math.round((total / totalFleet) * 100) : 0;

      // Áreas donde está presente este SO
      const areasFound = Array.from(
        new Set(devs.map((d) => (d.client_area || "").trim() || "Sede General"))
      );

      return {
        name: osName,
        total,
        online,
        offline,
        availability,
        percentage,
        areasFound,
        devices: devs,
      };
    });

    // Ordenar de mayor a menor cantidad de equipos
    return result.sort((a, b) => b.total - a.total);
  }, [filteredDevices]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey] === undefined ? false : !prev[groupKey],
    }));
  };

  const isGroupExpanded = (groupKey: string) => {
    return expandedGroups[groupKey] !== false; // Abierto por defecto
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (devices.length === 0) return;

    const headers = [
      "Área / Cliente",
      "Familia SO",
      "Hostname",
      "Código Activo",
      "Estado",
      "Sistema Operativo Detallado",
      "Arquitectura",
      "IP Privada",
      "IP Pública",
      "Dirección MAC",
      "Procesador CPU",
      "RAM Total (GB)",
      "Disco Total (GB)",
      "Última Conexión",
    ];

    const rows = devices.map((d) => {
      const area = (d.client_area || "").trim() || "Sede General";
      const osFam = getNormalizedOSFamily(d);
      return [
        `"${area}"`,
        `"${osFam}"`,
        `"${d.hostname || ""}"`,
        `"${d.device_code || ""}"`,
        `"${d.status?.current_state || "UNKNOWN"}"`,
        `"${d.os_version || d.os_type || ""}"`,
        `"${d.architecture || ""}"`,
        `"${d.private_ip || ""}"`,
        `"${d.public_ip || ""}"`,
        `"${d.mac_address || ""}"`,
        `"${d.specs?.cpu_model || ""}"`,
        `"${d.specs?.ram_total_gb || ""}"`,
        `"${d.specs?.disk_total_gb || ""}"`,
        `"${d.status?.last_seen || ""}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_resumen_quiebre_${breakdownType}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="q-summary-overlay" onClick={onClose}>
      <div className="q-summary-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Barra Superior de Herramientas y Acciones */}
        <header className="q-summary-header">
          <div className="q-summary-title-group">
            <div className="q-summary-icon-badge">
              <PieChart size={20} />
            </div>
            <div>
              <h3>Reporte Resumen Ejecutivo de Flota</h3>
              <p>Análisis de densidad y disponibilidad con quiebre por Áreas y Sistemas Operativos</p>
            </div>
          </div>

          <div className="q-summary-actions q-non-printable">
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Download size={14} />
              <span>Exportar Excel (CSV)</span>
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Printer size={14} />
              <span>Imprimir / Guardar PDF</span>
            </Button>
            <button
              className="q-summary-close-btn"
              onClick={onClose}
              title="Cerrar Reporte (Esc)"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Contenido Principal con Scroll */}
        <div className="q-summary-body">
          {/* Cabecera Membretada para Documento Impreso */}
          <div className="q-summary-doc-header">
            <div>
              <div className="q-summary-brand-name">
                <ShieldCheck size={26} />
                <span>QHAPANA RMM — INFORME EJECUTIVO DE INFRAESTRUCTURA</span>
              </div>
              <div className="q-summary-brand-sub">
                Consolidado de Activos Informáticos, Segmentación Organizacional y Parque de Sistemas Operativos
              </div>
            </div>
            <div className="q-summary-doc-meta">
              <div>Fecha Emisión: <strong>{nowFormatted}</strong></div>
              <div>Total Analizados: <strong>{devices.length} Equipos</strong></div>
              <div>Criterio: <strong>{breakdownType === "area" ? "Quiebre por Área / Cliente" : "Quiebre por Sistema Operativo"}</strong></div>
            </div>
          </div>

          {/* Tarjetas KPI de Alto Impacto */}
          <section className="q-summary-kpi-grid">
            <div className="q-summary-kpi-card">
              <span className="q-summary-kpi-lbl">Total Equipos</span>
              <div className="q-summary-kpi-val-group">
                <Monitor size={18} className="q-summary-kpi-icon" />
                <span className="q-summary-kpi-val">{fleetMetrics.total}</span>
              </div>
              <span className="q-summary-kpi-hint">100% de la flota registrada</span>
            </div>

            <div className="q-summary-kpi-card q-summary-kpi-card--success">
              <span className="q-summary-kpi-lbl">En Línea (Disponibles)</span>
              <div className="q-summary-kpi-val-group">
                <CheckCircle2 size={18} style={{ color: "var(--color-status-success, #16a34a)" }} />
                <span className="q-summary-kpi-val" style={{ color: "var(--color-status-success, #16a34a)" }}>
                  {fleetMetrics.online}
                </span>
              </div>
              <span className="q-summary-kpi-hint">SLA {fleetMetrics.availability}% de operatividad</span>
            </div>

            <div className="q-summary-kpi-card q-summary-kpi-card--danger">
              <span className="q-summary-kpi-lbl">Fuera de Línea</span>
              <div className="q-summary-kpi-val-group">
                <XCircle size={18} style={{ color: "var(--color-status-danger, #dc2626)" }} />
                <span className="q-summary-kpi-val" style={{ color: "var(--color-status-danger, #dc2626)" }}>
                  {fleetMetrics.offline}
                </span>
              </div>
              <span className="q-summary-kpi-hint">Requieren revisión o soporte</span>
            </div>

            <div className="q-summary-kpi-card">
              <span className="q-summary-kpi-lbl">Áreas / Sedes</span>
              <div className="q-summary-kpi-val-group">
                <Building2 size={18} className="q-summary-kpi-icon" />
                <span className="q-summary-kpi-val">{fleetMetrics.totalAreas}</span>
              </div>
              <span className="q-summary-kpi-hint">Departamentos mapeados</span>
            </div>

            <div className="q-summary-kpi-card">
              <span className="q-summary-kpi-lbl">Sistemas Operativos</span>
              <div className="q-summary-kpi-val-group">
                <Layers size={18} className="q-summary-kpi-icon" />
                <span className="q-summary-kpi-val">{fleetMetrics.totalOSFamilies}</span>
              </div>
              <span className="q-summary-kpi-hint">Ediciones y distribuciones</span>
            </div>

            <div className="q-summary-kpi-card">
              <span className="q-summary-kpi-lbl">Promedios Hardware</span>
              <div className="q-summary-kpi-val-group">
                <Cpu size={18} className="q-summary-kpi-icon" />
                <span className="q-summary-kpi-val" style={{ fontSize: 16 }}>
                  {fleetMetrics.avgRam} GB <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>RAM</span>
                </span>
              </div>
              <span className="q-summary-kpi-hint">{fleetMetrics.avgDisk} GB almacenamiento prom.</span>
            </div>
          </section>

          {/* Barra de Filtros y Selector de Quiebre (No imprimible) */}
          <div className="q-summary-control-bar q-non-printable">
            <div className="q-summary-tabs">
              <button
                className={`q-summary-tab-btn ${breakdownType === "area" ? "q-summary-tab-btn--active" : ""}`}
                onClick={() => setBreakdownType("area")}
              >
                <Building2 size={15} />
                <span>Quiebre por Áreas / Clientes ({areaBreakdown.length})</span>
              </button>
              <button
                className={`q-summary-tab-btn ${breakdownType === "os" ? "q-summary-tab-btn--active" : ""}`}
                onClick={() => setBreakdownType("os")}
              >
                <Layers size={15} />
                <span>Quiebre por Sistemas Operativos ({osBreakdown.length})</span>
              </button>
            </div>

            <div className="q-summary-filters">
              <div className="q-summary-search">
                <Search size={15} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="Buscar en el reporte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="q-summary-clear-btn">
                    ×
                  </button>
                )}
              </div>

              <select
                className="q-summary-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Todos los Estados</option>
                <option value="ONLINE">Solo Online</option>
                <option value="OFFLINE">Solo Offline</option>
              </select>
            </div>
          </div>

          {/* VISTA 1: QUIEBRE POR ÁREA / CLIENTE */}
          {breakdownType === "area" && (
            <div className="q-summary-groups">
              {areaBreakdown.length === 0 ? (
                <div className="q-summary-empty">
                  <Building2 size={40} style={{ opacity: 0.35, margin: "0 auto 12px" }} />
                  <h4>No se encontraron equipos para el criterio seleccionado</h4>
                  <p>Pruebe limpiando los filtros de búsqueda o cambiando el estado.</p>
                </div>
              ) : (
                areaBreakdown.map((group) => {
                  const expanded = isGroupExpanded(group.name);
                  return (
                    <article key={group.name} className="q-summary-group-card">
                      <header
                        className="q-summary-group-header"
                        onClick={() => toggleGroup(group.name)}
                        title="Haga clic para expandir o colapsar el detalle de equipos"
                      >
                        <div className="q-summary-group-header-left">
                          <button
                            className={`q-summary-collapse-icon ${expanded ? "q-summary-collapse-icon--expanded" : ""}`}
                            aria-expanded={expanded}
                          >
                            <ChevronRight size={16} />
                          </button>
                          <Building2 size={18} className="q-summary-group-icon" />
                          <h4 className="q-summary-group-title">{group.name}</h4>
                          <span className="q-summary-badge-count">{group.total} equipos</span>
                        </div>

                        <div className="q-summary-group-header-right">
                          <div className="q-summary-pills">
                            <span className="q-summary-pill q-summary-pill--online">
                              <CheckCircle2 size={12} /> {group.online} Online
                            </span>
                            {group.offline > 0 && (
                              <span className="q-summary-pill q-summary-pill--offline">
                                <XCircle size={12} /> {group.offline} Offline
                              </span>
                            )}
                            <span className="q-summary-pill q-summary-pill--rate">
                              {group.availability}% SLA
                            </span>
                          </div>
                        </div>
                      </header>

                      {/* Resumen de SO en este departamento */}
                      <div className="q-summary-group-meta-bar">
                        <span className="q-summary-group-meta-title">Sistemas Operativos presentes:</span>
                        <div className="q-summary-tag-list">
                          {Object.entries(group.osCounts).map(([osName, count]) => (
                            <span key={osName} className="q-summary-tag">
                              {osName}: <strong>{count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tabla Detallada de Equipos del Área */}
                      {expanded && (
                        <div className="q-summary-table-wrap">
                          <table className="q-summary-table">
                            <thead>
                              <tr>
                                <th>Hostname / Código</th>
                                <th>Estado</th>
                                <th>Sistema Operativo & Edición</th>
                                <th>IP Privada / Pública</th>
                                <th>Hardware (CPU / RAM / Disco)</th>
                                <th>Última Conexión</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.devices.map((dev) => {
                                const isOnline = dev.status?.current_state === "ONLINE";
                                const cpu = dev.specs?.cpu_model || `${dev.specs?.cpu_cores || "?"} cores`;
                                const ram = dev.specs?.ram_total_gb ? `${dev.specs.ram_total_gb} GB` : "N/D";
                                const disk = dev.specs?.disk_total_gb ? `${dev.specs.disk_total_gb} GB` : "N/D";
                                const lastSeen = dev.status?.last_seen
                                  ? new Date(dev.status.last_seen).toLocaleString("es-PE")
                                  : "N/D";

                                return (
                                  <tr key={dev.id}>
                                    <td>
                                      <div className="q-summary-dev-name">
                                        <Monitor size={14} className="q-summary-dev-icon" />
                                        <span>{dev.hostname}</span>
                                      </div>
                                      <span className="q-summary-dev-code">{dev.device_code}</span>
                                    </td>
                                    <td>
                                      {isOnline ? (
                                        <Badge variant="success" pulse>
                                          ONLINE
                                        </Badge>
                                      ) : (
                                        <Badge variant="danger">
                                          OFFLINE
                                        </Badge>
                                      )}
                                    </td>
                                    <td>
                                      <span className="q-summary-os-text" title={dev.os_version}>
                                        {dev.os_version || dev.os_type}
                                      </span>
                                      <span className="q-summary-arch-tag">{dev.architecture}</span>
                                    </td>
                                    <td>
                                      <span className="q-summary-ip-mono">{dev.private_ip || "Sin IP"}</span>
                                      {dev.public_ip && (
                                        <span className="q-summary-ip-public">{dev.public_ip}</span>
                                      )}
                                    </td>
                                    <td>
                                      <div className="q-summary-specs-line">
                                        <span title={cpu} className="q-summary-cpu-cell">
                                          {cpu}
                                        </span>
                                      </div>
                                      <span className="q-summary-ram-disk">
                                        {ram} RAM • {disk} Disco
                                      </span>
                                    </td>
                                    <td className="q-summary-date-cell">{lastSeen}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* VISTA 2: QUIEBRE POR SISTEMA OPERATIVO */}
          {breakdownType === "os" && (
            <div className="q-summary-groups">
              {osBreakdown.length === 0 ? (
                <div className="q-summary-empty">
                  <Layers size={40} style={{ opacity: 0.35, margin: "0 auto 12px" }} />
                  <h4>No se encontraron equipos para el criterio seleccionado</h4>
                  <p>Pruebe limpiando los filtros de búsqueda o cambiando el estado.</p>
                </div>
              ) : (
                osBreakdown.map((group) => {
                  const expanded = isGroupExpanded(group.name);
                  return (
                    <article key={group.name} className="q-summary-group-card">
                      <header
                        className="q-summary-group-header"
                        onClick={() => toggleGroup(group.name)}
                        title="Haga clic para expandir o colapsar el detalle de equipos"
                      >
                        <div className="q-summary-group-header-left">
                          <button
                            className={`q-summary-collapse-icon ${expanded ? "q-summary-collapse-icon--expanded" : ""}`}
                            aria-expanded={expanded}
                          >
                            <ChevronRight size={16} />
                          </button>
                          <Layers size={18} className="q-summary-group-icon" style={{ color: "#38bdf8" }} />
                          <h4 className="q-summary-group-title">{group.name}</h4>
                          <span className="q-summary-badge-count">{group.total} equipos</span>
                          <span className="q-summary-badge-pct">({group.percentage}% de la flota)</span>
                        </div>

                        <div className="q-summary-group-header-right">
                          <div className="q-summary-pills">
                            <span className="q-summary-pill q-summary-pill--online">
                              <CheckCircle2 size={12} /> {group.online} Online
                            </span>
                            {group.offline > 0 && (
                              <span className="q-summary-pill q-summary-pill--offline">
                                <XCircle size={12} /> {group.offline} Offline
                              </span>
                            )}
                            <span className="q-summary-pill q-summary-pill--rate">
                              {group.availability}% SLA
                            </span>
                          </div>
                        </div>
                      </header>

                      {/* Resumen de Áreas asociadas a este SO */}
                      <div className="q-summary-group-meta-bar">
                        <span className="q-summary-group-meta-title">Distribuido en Áreas / Clientes:</span>
                        <div className="q-summary-tag-list">
                          {group.areasFound.map((area) => (
                            <span key={area} className="q-summary-tag">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tabla Detallada de Equipos del Sistema Operativo */}
                      {expanded && (
                        <div className="q-summary-table-wrap">
                          <table className="q-summary-table">
                            <thead>
                              <tr>
                                <th>Hostname / Código</th>
                                <th>Área / Cliente Asignada</th>
                                <th>Estado</th>
                                <th>Edición Exacta de SO</th>
                                <th>IP Privada / Pública</th>
                                <th>Hardware (CPU / RAM / Disco)</th>
                                <th>Última Conexión</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.devices.map((dev) => {
                                const isOnline = dev.status?.current_state === "ONLINE";
                                const cpu = dev.specs?.cpu_model || `${dev.specs?.cpu_cores || "?"} cores`;
                                const ram = dev.specs?.ram_total_gb ? `${dev.specs.ram_total_gb} GB` : "N/D";
                                const disk = dev.specs?.disk_total_gb ? `${dev.specs.disk_total_gb} GB` : "N/D";
                                const area = (dev.client_area || "").trim() || "Sede General";
                                const lastSeen = dev.status?.last_seen
                                  ? new Date(dev.status.last_seen).toLocaleString("es-PE")
                                  : "N/D";

                                return (
                                  <tr key={dev.id}>
                                    <td>
                                      <div className="q-summary-dev-name">
                                        <Monitor size={14} className="q-summary-dev-icon" />
                                        <span>{dev.hostname}</span>
                                      </div>
                                      <span className="q-summary-dev-code">{dev.device_code}</span>
                                    </td>
                                    <td>
                                      <span className="q-summary-area-badge">
                                        <Building2 size={12} />
                                        {area}
                                      </span>
                                    </td>
                                    <td>
                                      {isOnline ? (
                                        <Badge variant="success" pulse>
                                          ONLINE
                                        </Badge>
                                      ) : (
                                        <Badge variant="danger">
                                          OFFLINE
                                        </Badge>
                                      )}
                                    </td>
                                    <td>
                                      <span className="q-summary-os-text" title={dev.os_version}>
                                        {dev.os_version || dev.os_type}
                                      </span>
                                      <span className="q-summary-arch-tag">{dev.architecture}</span>
                                    </td>
                                    <td>
                                      <span className="q-summary-ip-mono">{dev.private_ip || "Sin IP"}</span>
                                      {dev.public_ip && (
                                        <span className="q-summary-ip-public">{dev.public_ip}</span>
                                      )}
                                    </td>
                                    <td>
                                      <div className="q-summary-specs-line">
                                        <span title={cpu} className="q-summary-cpu-cell">
                                          {cpu}
                                        </span>
                                      </div>
                                      <span className="q-summary-ram-disk">
                                        {ram} RAM • {disk} Disco
                                      </span>
                                    </td>
                                    <td className="q-summary-date-cell">{lastSeen}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
