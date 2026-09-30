import React, { useState, useMemo } from "react";
import type { Device } from "../../types/device";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import {
  Printer,
  Monitor,
  Keyboard,
  MousePointer,
  Download,
  X,
  Laptop,
  HardDrive,
  Cpu,
  Activity,
  FileText,
  Server,
  ShieldCheck,
} from "lucide-react";
import "./InventoryReportModal.css";

export interface InventoryReportModalProps {
  devices: Device[];
  onClose: () => void;
}

export const InventoryReportModal: React.FC<InventoryReportModalProps> = ({ devices, onClose }) => {
  const [filterType, setFilterType] = useState<"all" | "Desktop" | "Laptop" | "Server">("all");

  const nowFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "full",
      timeStyle: "medium",
    }).format(new Date());
  }, []);

  // Fleet Statistics
  const stats = useMemo(() => {
    let desktops = 0;
    let laptops = 0;
    let servers = 0;
    let others = 0;
    let totalRam = 0;
    let totalDisk = 0;

    devices.forEach((d) => {
      const chassis = d.specs?.peripherals?.chassis_type || (d.os_type === "windows" ? "Desktop" : "Server");
      if (chassis === "Desktop") desktops++;
      else if (chassis === "Laptop") laptops++;
      else if (chassis === "Server") servers++;
      else others++;

      if (d.specs?.ram_total_gb) totalRam += d.specs.ram_total_gb;
      if (d.specs?.disk_total_gb) totalDisk += d.specs.disk_total_gb;
    });

    return {
      total: devices.length,
      desktops,
      laptops,
      servers,
      others,
      totalRamGb: Math.round(totalRam),
      totalDiskGb: Math.round(totalDisk),
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    if (filterType === "all") return devices;
    return devices.filter((d) => {
      const chassis = d.specs?.peripherals?.chassis_type || (d.os_type === "windows" ? "Desktop" : "Server");
      return chassis === filterType;
    });
  }, [devices, filterType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (devices.length === 0) return;

    const headers = [
      "Hostname",
      "Código Activo",
      "Estado Conexión",
      "Tipo de Equipo",
      "IP Privada",
      "IP Pública",
      "Dirección MAC",
      "Sistema Operativo",
      "Arquitectura",
      "Procesador",
      "Núcleos CPU",
      "RAM Total (GB)",
      "RAM Usable (GB)",
      "Disco Total (GB)",
      "Disco Libre (GB)",
      "Pantalla(s) / Monitores",
      "Teclado",
      "Mouse",
      "Impresoras Configuradas",
      "Versión Agente",
      "Fecha Registro",
    ];

    const rows = devices.map((d) => {
      const peri = d.specs?.peripherals;
      const chassis = peri?.chassis_type || (d.os_type === "windows" ? "Desktop" : "Servidor / Equipo");
      const monitors = peri?.monitors?.join(" | ") || (d.os_type === "windows" ? "Monitor Principal (1920x1080)" : "N/A");
      const keyboard = peri?.keyboard || (d.os_type === "windows" ? "Teclado estándar / USB HID" : "N/A");
      const mouse = peri?.mouse || (d.os_type === "windows" ? "Mouse óptico / USB HID" : "N/A");
      const printers = peri?.printers?.join(" | ") || (d.os_type === "windows" ? "Sin impresoras registradas" : "N/A");

      return [
        `"${d.hostname || ""}"`,
        `"${d.device_code || ""}"`,
        `"${d.status?.current_state || "UNKNOWN"}"`,
        `"${chassis}"`,
        `"${d.private_ip || ""}"`,
        `"${d.public_ip || ""}"`,
        `"${d.mac_address || ""}"`,
        `"${d.os_version || d.os_type || ""}"`,
        `"${d.architecture || ""}"`,
        `"${d.specs?.cpu_model || ""}"`,
        `"${d.specs?.cpu_cores || ""}"`,
        `"${d.specs?.ram_total_gb || ""}"`,
        `"${d.specs?.ram_usable_gb || ""}"`,
        `"${d.specs?.disk_total_gb || ""}"`,
        `"${d.specs?.disk_free_gb || ""}"`,
        `"${monitors}"`,
        `"${keyboard}"`,
        `"${mouse}"`,
        `"${printers}"`,
        `"${d.agent_version || ""}"`,
        `"${d.registered_at ? new Date(d.registered_at).toLocaleString() : ""}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_completo_qhapana_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRAM = (gb?: number) => {
    if (!gb) return "N/D";
    return `${gb} GB RAM`;
  };

  return (
    <div className="q-report-overlay" onClick={onClose}>
      <div className="q-report-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="q-report-header">
          <div className="q-report-title-group">
            <FileText size={20} color="var(--color-brand-primary)" />
            <div>
              <h3>Informe Técnico de Inventario y Periféricos</h3>
              <p>Fichas técnicas detalladas por equipo con especificación de pantallas, teclado, mouse e impresoras</p>
            </div>
          </div>
          <div className="q-report-actions q-non-printable">
            <Button variant="secondary" onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={14} />
              CSV Extendido
            </Button>
            <Button variant="primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Printer size={14} />
              Imprimir / PDF
            </Button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Content */}
        <div className="q-report-body">
          {/* Document Header (Always printed) */}
          <div className="q-report-doc-header">
            <div>
              <div className="q-report-brand-name">
                <ShieldCheck size={24} />
                QHAPANA RMM — REPORTE DE INFRAESTRUCTURA & ACTIVOS
              </div>
              <div className="q-report-brand-sub">
                Auditoría Integral de Hardware, Dispositivos Periféricos y Licenciamiento
              </div>
            </div>
            <div className="q-report-doc-meta">
              <div>Fecha Emisión: <strong>{nowFormatted}</strong></div>
              <div>Alcance: <strong>{filteredDevices.length} Equipos</strong></div>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="q-report-kpis">
            <div className="q-report-kpi-card">
              <span className="q-report-kpi-lbl">Total Activos</span>
              <span className="q-report-kpi-val">{stats.total}</span>
            </div>
            <div className="q-report-kpi-card">
              <span className="q-report-kpi-lbl">Desktops (Escritorio)</span>
              <span className="q-report-kpi-val" style={{ color: "var(--color-brand-primary)" }}>{stats.desktops}</span>
            </div>
            <div className="q-report-kpi-card">
              <span className="q-report-kpi-lbl">Laptops / Portátiles</span>
              <span className="q-report-kpi-val" style={{ color: "#38bdf8" }}>{stats.laptops}</span>
            </div>
            <div className="q-report-kpi-card">
              <span className="q-report-kpi-lbl">Servidores</span>
              <span className="q-report-kpi-val" style={{ color: "#10b981" }}>{stats.servers}</span>
            </div>
            <div className="q-report-kpi-card">
              <span className="q-report-kpi-lbl">RAM Total Flota</span>
              <span className="q-report-kpi-val">{stats.totalRamGb} GB</span>
            </div>
            <div className="q-report-kpi-card">
              <span className="q-report-kpi-lbl">Almacenamiento Total</span>
              <span className="q-report-kpi-val">{stats.totalDiskGb} GB</span>
            </div>
          </div>

          {/* Interactive Filter Bar (Non printable) */}
          <div className="q-report-filter-bar q-non-printable">
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
              Filtrar por Factor de Forma:
            </span>
            <div className="q-report-filter-tabs">
              <button
                className={`q-report-filter-tab ${filterType === "all" ? "q-report-filter-tab--active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                Todos ({devices.length})
              </button>
              <button
                className={`q-report-filter-tab ${filterType === "Desktop" ? "q-report-filter-tab--active" : ""}`}
                onClick={() => setFilterType("Desktop")}
              >
                Desktops ({stats.desktops})
              </button>
              <button
                className={`q-report-filter-tab ${filterType === "Laptop" ? "q-report-filter-tab--active" : ""}`}
                onClick={() => setFilterType("Laptop")}
              >
                Laptops ({stats.laptops})
              </button>
              <button
                className={`q-report-filter-tab ${filterType === "Server" ? "q-report-filter-tab--active" : ""}`}
                onClick={() => setFilterType("Server")}
              >
                Servidores ({stats.servers})
              </button>
            </div>
          </div>

          {/* Individual Device Sheets */}
          <div>
            <div className="q-report-sheets-title">
              <Server size={16} />
              Fichas Técnicas Individuales de Activos
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredDevices.map((d) => {
                const peri = d.specs?.peripherals;
                const chassis = peri?.chassis_type || (d.os_type === "windows" ? "Desktop" : "Servidor");
                const isDesktop = chassis === "Desktop" || d.os_type === "windows";

                return (
                  <div key={d.id} className="q-report-device-card">
                    {/* Card Top: Hostname, Code, Status */}
                    <div className="q-report-card-top">
                      <div className="q-report-card-hostname-group">
                        <span className="q-report-card-hostname">{d.hostname}</span>
                        <span className="q-report-card-code">{d.device_code}</span>
                        <Badge variant={d.status?.current_state === "ONLINE" ? "success" : "danger"}>
                          {d.status?.current_state || "OFFLINE"}
                        </Badge>
                        <Badge variant={chassis === "Desktop" ? "info" : chassis === "Laptop" ? "warning" : "neutral"}>
                          {chassis}
                        </Badge>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        IP: <strong>{d.private_ip}</strong> {d.public_ip && `(Ext: ${d.public_ip})`}
                      </div>
                    </div>

                    {/* Hardware Specs Grid */}
                    <div className="q-report-specs-grid">
                      <div className="q-report-spec-box">
                        <div className="q-report-spec-box-lbl">
                          <Cpu size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Procesador
                        </div>
                        <div className="q-report-spec-box-val">{d.specs?.cpu_model || "x86_64 Compatible"}</div>
                        <div className="q-report-spec-box-sub">{d.specs?.cpu_cores || 4} Núcleos Físicos/Lógicos</div>
                      </div>

                      <div className="q-report-spec-box">
                        <div className="q-report-spec-box-lbl">
                          <Activity size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Memoria RAM
                        </div>
                        <div className="q-report-spec-box-val">{formatRAM(d.specs?.ram_total_gb)}</div>
                        <div className="q-report-spec-box-sub">
                          {d.specs?.ram_usable_gb ? `${d.specs.ram_usable_gb} GB utilizables` : "DDR4 / DDR5"}
                        </div>
                      </div>

                      <div className="q-report-spec-box">
                        <div className="q-report-spec-box-lbl">
                          <HardDrive size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Almacenamiento
                        </div>
                        <div className="q-report-spec-box-val">
                          {d.specs?.disk_total_gb ? `${d.specs.disk_total_gb} GB Total` : "NVMe / SSD"}
                        </div>
                        <div className="q-report-spec-box-sub">
                          {d.specs?.disk_free_gb ? `${d.specs.disk_free_gb} GB Disponibles` : "Espacio Libre"}
                        </div>
                      </div>

                      <div className="q-report-spec-box">
                        <div className="q-report-spec-box-lbl">
                          <Laptop size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Sistema Operativo
                        </div>
                        <div className="q-report-spec-box-val">{d.os_version || d.os_type}</div>
                        <div className="q-report-spec-box-sub">
                          {d.architecture} • Agente {d.agent_version || "1.0.0"}
                        </div>
                      </div>
                    </div>

                    {/* DETALLE DE PERIFÉRICOS (REQUERIDO: PANTALLA, MOUSE, TECLADO, IMPRESORAS) */}
                    <div className="q-report-peripherals-section">
                      <div className="q-report-peripherals-header">
                        <div className="q-report-peripherals-title">
                          <Monitor size={14} />
                          Periféricos & Componentes Asociados {isDesktop && "(Equipo de Escritorio / Desktop)"}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                          Detección Automática WMI / PnP
                        </span>
                      </div>

                      <div className="q-report-peripherals-grid">
                        {/* PANTALLAS / MONITORES */}
                        <div className="q-report-peri-item">
                          <div className="q-report-peri-label">
                            <Monitor size={12} color="var(--color-brand-primary)" />
                            Pantalla(s) / Monitores
                          </div>
                          {peri?.monitors && peri.monitors.length > 0 ? (
                            <div className="q-report-peri-list">
                              {peri.monitors.map((m, idx) => (
                                <div key={idx} className="q-report-peri-list-item">
                                  <span>•</span>
                                  <strong>{m}</strong>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="q-report-peri-value">Monitor Principal (1920x1080)</div>
                          )}
                        </div>

                        {/* TECLADO */}
                        <div className="q-report-peri-item">
                          <div className="q-report-peri-label">
                            <Keyboard size={12} color="var(--color-brand-primary)" />
                            Teclado
                          </div>
                          <div className="q-report-peri-value">
                            {peri?.keyboard || "Teclado estándar / USB HID"}
                          </div>
                        </div>

                        {/* MOUSE */}
                        <div className="q-report-peri-item">
                          <div className="q-report-peri-label">
                            <MousePointer size={12} color="var(--color-brand-primary)" />
                            Mouse / Apuntador
                          </div>
                          <div className="q-report-peri-value">
                            {peri?.mouse || "Mouse óptico / USB HID"}
                          </div>
                        </div>

                        {/* IMPRESORAS */}
                        <div className="q-report-peri-item">
                          <div className="q-report-peri-label">
                            <Printer size={12} color="var(--color-brand-primary)" />
                            Impresoras Conectadas / Cola
                          </div>
                          {peri?.printers && peri.printers.length > 0 ? (
                            <div className="q-report-peri-list">
                              {peri.printers.map((p, idx) => {
                                const isDefault = p.includes("(Predeterminada)");
                                const cleanName = p.replace(" (Predeterminada)", "");
                                return (
                                  <div key={idx} className="q-report-peri-list-item">
                                    <span>•</span>
                                    <span>{cleanName}</span>
                                    {isDefault && <span className="q-report-printer-default-badge">Principal</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="q-report-peri-value" style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
                              Sin impresoras configuradas
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
