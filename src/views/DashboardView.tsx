import React, { useEffect, useState, useMemo } from "react";
import type { Device, KpiSummary } from "../types/device";
import { getDevices, deleteDevice } from "../services/api";
import { dashboardSocket } from "../services/socket";
import { DataTable } from "../components/DataTable/DataTable";
import { DeviceCard } from "../components/DeviceCard/DeviceCard";
import { DeviceDetailModal } from "../components/DeviceDetailModal/DeviceDetailModal";
import { EnrollDeviceModal } from "../components/EnrollDeviceModal/EnrollDeviceModal";
import { RemoteDesktopModal } from "../components/RemoteDesktopModal/RemoteDesktopModal";
import { DeviceSummaryReportModal } from "../components/DeviceSummaryReportModal/DeviceSummaryReportModal";
import { Button } from "../components/Button/Button";
import { NetworkTrafficMap } from "../components/NetworkTrafficMap/NetworkTrafficMap";
import { useAuth } from "../context/AuthContext";
import {
  Server,
  Search,
  Filter,
  Plus,
  FileText,
  Cpu,
  HardDrive,
  Activity,
  ExternalLink,
  Wifi,
  Gauge,
  Radio,
  ChevronDown,
  Tv,
} from "lucide-react";
import "./DashboardView.css";

export interface DashboardViewProps {
  refreshTrigger: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ refreshTrigger }) => {
  const { activeOrganization } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [remoteDevice, setRemoteDevice] = useState<Device | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
  const [summaryReportOpen, setSummaryReportOpen] = useState<boolean>(false);

  const [areaFilter, setAreaFilter] = useState<string>("all");

  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => {
      if (d.client_area) set.add(d.client_area);
    });
    return Array.from(set);
  }, [devices]);

  const fetchDeviceData = async () => {
    try {
      setLoading(true);
      const data = await getDevices(activeOrganization?.id);
      setDevices(data);
    } catch (err) {
      console.error("Error fetching devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
  }, [refreshTrigger, activeOrganization?.id]);

  useEffect(() => {
    dashboardSocket.connect();
    const unsubState = dashboardSocket.on("device_state_changed", (data: any) => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === data.device_id) {
            return {
              ...d,
              status: {
                ...d.status,
                current_state: data.current_state,
                last_seen: data.last_seen || new Date().toISOString(),
                disconnect_reason: data.disconnect_reason || d.status.disconnect_reason,
              },
            };
          }
          return d;
        })
      );
    });

    const unsubHeartbeat = dashboardSocket.on("heartbeat_received", (data: any) => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === data.device_id) {
            return {
              ...d,
              status: { ...d.status, current_state: "ONLINE", last_seen: new Date().toISOString() },
              latest_telemetry: {
                cpu_percent: data.cpu_percent,
                ram_percent: data.ram_percent,
                disk_percent: data.disk_percent,
                telemetry: data.telemetry,
              },
            };
          }
          return d;
        })
      );
    });

    const unsubDeleted = dashboardSocket.on("device_deleted", (data: any) => {
      setDevices((prev) => prev.filter((d) => d.id !== data.device_id));
      setSelectedDevice((curr) => (curr?.id === data.device_id ? null : curr));
    });

    const unsubLocation = dashboardSocket.on("device_location_updated", (data: any) => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === data.device_id) {
            return {
              ...d,
              public_ip: data.public_ip || d.public_ip,
              latitude: data.latitude,
              longitude: data.longitude,
              location_name: data.location_name || d.location_name,
              specs: {
                ...d.specs,
                latitude: data.latitude,
                longitude: data.longitude,
                location_name: data.location_name || d.location_name,
                public_ip: data.public_ip || d.public_ip,
              },
            };
          }
          return d;
        })
      );
    });

    return () => {
      unsubState();
      unsubHeartbeat();
      unsubDeleted();
      unsubLocation();
    };
  }, []);

  const kpiSummary = useMemo<KpiSummary>(() => {
    const total = devices.length;
    let online = 0;
    let unstable = 0;
    let offline = 0;
    devices.forEach((d) => {
      if (d.status.current_state === "ONLINE") online++;
      else if (d.status.current_state === "UNSTABLE") unstable++;
      else offline++;
    });
    return { total, online, unstable, offline };
  }, [devices]);

  // Cálculos de Telemetría Global de la Flota para PrimaryVisualization
  const fleetMetrics = useMemo(() => {
    const onlineDevices = devices.filter((d) => d.status.current_state === "ONLINE");
    const countOnline = onlineDevices.length;

    // CPU promedio
    let totalCpu = 0;
    let cpuCount = 0;
    onlineDevices.forEach((d) => {
      if (typeof d.latest_telemetry?.cpu_percent === "number") {
        totalCpu += d.latest_telemetry.cpu_percent;
        cpuCount++;
      }
    });
    const avgCpu = cpuCount > 0 ? totalCpu / cpuCount : (countOnline > 0 ? 18.5 : 0);

    // RAM promedio y acumulada
    let totalRamGb = 0;
    let usedRamGb = 0;
    devices.forEach((d) => {
      const ramInstalled = d.specs?.ram_total_gb || 16;
      totalRamGb += ramInstalled;
      const ramPct = d.latest_telemetry?.ram_percent || (d.status.current_state === "ONLINE" ? 45 : 0);
      usedRamGb += (ramInstalled * ramPct) / 100;
    });
    const ramPctAvg = totalRamGb > 0 ? Math.round((usedRamGb / totalRamGb) * 100) : 0;

    // Disco total y libre acumulado
    let totalDiskGb = 0;
    let freeDiskGb = 0;
    devices.forEach((d) => {
      const diskInstalled = d.specs?.disk_total_gb || 512;
      totalDiskGb += diskInstalled;
      const diskFree = d.specs?.disk_free_gb || (diskInstalled * 0.4);
      freeDiskGb += diskFree;
    });
    const usedDiskGb = totalDiskGb - freeDiskGb;
    const diskPctAvg = totalDiskGb > 0 ? Math.round((usedDiskGb / totalDiskGb) * 100) : 0;

    // Disponibilidad SLA promedio 24h
    let sumAvail = 0;
    devices.forEach((d) => {
      sumAvail += typeof d.status.availability_percentage_24h === "number" ? d.status.availability_percentage_24h : 100;
    });
    const slaAvg = devices.length > 0 ? (sumAvail / devices.length).toFixed(1) : "100.0";

    // Distribución por Sistema Operativo
    let winServerCount = 0;
    let winDesktopCount = 0;
    let linuxCount = 0;
    let otherCount = 0;

    devices.forEach((d) => {
      const osLower = (d.os_type || "").toLowerCase();
      const osVer = (d.os_version || "").toLowerCase();
      if (osVer.includes("server")) {
        winServerCount++;
      } else if (osLower.includes("win")) {
        winDesktopCount++;
      } else if (osLower.includes("linux") || osLower.includes("ubuntu") || osLower.includes("debian")) {
        linuxCount++;
      } else {
        otherCount++;
      }
    });

    return {
      avgCpu: Math.round(avgCpu * 10) / 10,
      totalRamGb: Math.round(totalRamGb),
      usedRamGb: Math.round(usedRamGb),
      ramPctAvg,
      totalDiskTb: (totalDiskGb / 1024).toFixed(1),
      usedDiskTb: (usedDiskGb / 1024).toFixed(1),
      diskPctAvg,
      slaAvg,
      osBreakdown: {
        winServer: winServerCount,
        winDesktop: winDesktopCount,
        linux: linuxCount,
        other: otherCount,
      },
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      const matchSearch =
        dev.hostname.toLowerCase().includes(search.toLowerCase()) ||
        dev.device_code.toLowerCase().includes(search.toLowerCase()) ||
        (dev.client_area && dev.client_area.toLowerCase().includes(search.toLowerCase())) ||
        Boolean(dev.private_ip && dev.private_ip.includes(search));
      const matchOs = osFilter === "all" || dev.os_type.toLowerCase().includes(osFilter.toLowerCase());
      const matchState = stateFilter === "all" || dev.status.current_state === stateFilter;
      const matchArea = areaFilter === "all" || (dev.client_area || "").toLowerCase() === areaFilter.toLowerCase();
      return matchSearch && matchOs && matchState && matchArea;
    });
  }, [devices, search, osFilter, stateFilter, areaFilter]);



  const handleDeleteDevice = async (device: Device) => {
    try {
      await deleteDevice(device.id);
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
      if (selectedDevice?.id === device.id) {
        setSelectedDevice(null);
      }
    } catch (err) {
      console.error("Error eliminando dispositivo:", err);
      alert("Hubo un error al intentar eliminar el dispositivo.");
    }
  };

  return (
    <div className="q-dashboard-view q-it-dashboard">
      {/* ----------------------------------------------------------------------
          1. IT DASHBOARD HEADER (Título & Controles NOC)
      ---------------------------------------------------------------------- */}
      <header className="q-it-header">
        <div className="q-it-header-left">
          <h1 className="q-it-title">IT dashboard</h1>
          <span className="q-it-header-badge">
            <span className="q-it-dot-pulse"></span>
            Centro de Control NOC
          </span>
        </div>
        <div className="q-it-header-actions">
          <div className="q-it-select-wrap">
            <select
              className="q-it-select"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="all">IT management (Todos)</option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="q-it-select-chevron" />
          </div>
          <button className="q-it-btn-new-device" onClick={() => setEnrollModalOpen(true)}>
            <Plus size={16} />
            <span>New device</span>
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------------------
          2. TOP 4 VIBRANT HERO KPI CARDS (Púrpura 1, Púrpura 2, Teal 1, Teal 2)
      ---------------------------------------------------------------------- */}
      <section className="q-it-kpi-grid">
        {/* Card 1: Network latency (Purple 1) */}
        <div className="q-it-kpi-card q-it-kpi-card--purple1">
          <div className="q-it-kpi-top">
            <span className="q-it-kpi-title">Network latency</span>
            <span className="q-it-kpi-action-icon">
              <Radio size={14} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <Wifi size={32} className="q-it-kpi-icon-svg" />
            <span className="q-it-kpi-num">38%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">Network/IOs</span>
            <div className="q-it-kpi-track">
              <div className="q-it-kpi-fill" style={{ width: "38%" }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: CPU usage (Purple 2 con Donut Radial Ring) */}
        <div className="q-it-kpi-card q-it-kpi-card--purple2">
          <div className="q-it-kpi-top">
            <span className="q-it-kpi-title">CPU usage</span>
            <span className="q-it-kpi-action-icon">
              <Cpu size={14} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <svg width="40" height="40" viewBox="0 0 40 40" className="q-it-donut-ring">
              <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="3.5" />
              <circle
                cx="20"
                cy="20"
                r="15"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 15}
                strokeDashoffset={2 * Math.PI * 15 * (1 - Math.min(1, Math.max(0.05, fleetMetrics.avgCpu / 100)))}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="q-it-kpi-num">{fleetMetrics.avgCpu}%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">CPU usage</span>
            <div className="q-it-kpi-track">
              <div
                className="q-it-kpi-fill"
                style={{ width: `${Math.min(100, Math.max(5, fleetMetrics.avgCpu))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Bandwidth / RAM (Teal 1 con Speedometer) */}
        <div className="q-it-kpi-card q-it-kpi-card--teal1">
          <div className="q-it-kpi-top">
            <span className="q-it-kpi-title">Bandwidth</span>
            <span className="q-it-kpi-action-icon">
              <Activity size={14} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <Gauge size={32} className="q-it-kpi-icon-svg" />
            <span className="q-it-kpi-num">{fleetMetrics.ramPctAvg}%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">RAM usage</span>
            <div className="q-it-kpi-track">
              <div className="q-it-kpi-fill" style={{ width: `${fleetMetrics.ramPctAvg}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Bandwidth / Almacenamiento & SLA (Cyan / Teal 2) */}
        <div className="q-it-kpi-card q-it-kpi-card--teal2">
          <div className="q-it-kpi-top">
            <span className="q-it-kpi-title">Bandwidth</span>
            <span className="q-it-kpi-action-icon">
              <HardDrive size={14} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <HardDrive size={32} className="q-it-kpi-icon-svg" />
            <span className="q-it-kpi-num">{fleetMetrics.diskPctAvg}%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">Storage / IOs</span>
            <div className="q-it-kpi-track">
              <div className="q-it-kpi-fill" style={{ width: `${fleetMetrics.diskPctAvg}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          3. MAIN OPERATIONS GRID: Server status (Left) + Live traffic (Right)
      ---------------------------------------------------------------------- */}
      <section className="q-it-operations-grid">
        {/* PANEL IZQUIERDO: Server status */}
        <div className="q-it-panel q-it-panel--server-status">
          <div className="q-it-panel-header">
            <div className="q-it-panel-title-group">
              <Server size={17} className="q-it-icon-server-green" />
              <h3 className="q-it-panel-title">Server status</h3>
            </div>
            <span className="q-it-panel-counter">
              {kpiSummary.online} online / {devices.length} nodos
            </span>
          </div>

          <div className="q-it-server-list">
            {devices.map((dev) => {
              const isOnline = dev.status.current_state === "ONLINE";
              const isSelected = selectedDevice?.id === dev.id;
              const ping = isOnline ? "0.3 ms" : "offline";
              return (
                <div
                  key={dev.id}
                  className={`q-it-server-row ${isSelected ? "q-it-server-row--selected" : ""}`}
                  onClick={() => {
                    setSelectedDevice(dev);
                  }}
                >
                  <div className="q-it-server-icon-badge">
                    <Server size={15} />
                  </div>
                  <div className="q-it-server-meta">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span className="q-it-server-hostname">{dev.hostname}</span>
                      <span className="q-it-server-ip-badge" title="Dirección IP del equipo">
                        {dev.private_ip || dev.public_ip || "Sin IP"}
                      </span>
                    </div>
                    <span className="q-it-server-desc">{dev.client_area || "Sede General"}</span>
                  </div>
                  <div className="q-it-server-pills">
                    <span
                      className={`q-it-status-pill ${
                        isOnline ? "q-it-status-pill--online" : "q-it-status-pill--offline"
                      }`}
                    >
                      {isOnline ? "Connected" : "Disconnected"}
                    </span>
                    <span className="q-it-metric-pill">{ping}</span>
                  </div>
                  <div className="q-it-server-row-actions">
                    <button
                      className="q-it-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(dev);
                      }}
                      title="Ver Ficha Técnica"
                    >
                      <ExternalLink size={13} />
                    </button>
                    {isOnline && (
                      <button
                        className="q-it-action-btn q-it-action-btn--primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoteDevice(dev);
                        }}
                        title="Control Remoto WebRTC"
                      >
                        <Tv size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: Live network traffic Map + Dual Mini Charts */}
        <div className="q-it-right-stack">
          {/* Top: Live network traffic (Realistic Commercial Presentation Map, $0 Cost) */}
          <NetworkTrafficMap
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            onOpenRemote={(dev) => setRemoteDevice(dev)}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          3. FILTERS & SEARCH
      ---------------------------------------------------------------------- */}
      <section className="q-filter-bar">
        <div className="q-search-input">
          <Search size={18} color="var(--color-text-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por hostname, código o IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="q-filter-group">
          <Filter size={16} color="var(--color-text-tertiary)" />
          <select value={osFilter} onChange={(e) => setOsFilter(e.target.value)}>
            <option value="all">Todos los SO</option>
            <option value="windows">Windows</option>
            <option value="linux">Linux</option>
          </select>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="all">Todos los Estados</option>
            <option value="ONLINE">Solo Online</option>
            <option value="UNSTABLE">Solo Inestables</option>
            <option value="OFFLINE">Solo Offline</option>
          </select>
          <Button
            variant="primary"
            onClick={() => setEnrollModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            <Plus size={16} />
            <span>Vincular Dispositivo</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSummaryReportOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
            title="Generar Reporte Resumen con quiebre por Áreas o Sistemas Operativos"
          >
            <FileText size={16} />
            <span>Reporte Resumen</span>
          </Button>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          4. DATA MANAGEMENT (TABLE / CARDS)
      ---------------------------------------------------------------------- */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--color-text-secondary)" }}>
          Cargando flota de dispositivos...
        </div>
      ) : (
        <>
          <DataTable
            devices={filteredDevices}
            onSelectDevice={(d) => setSelectedDevice(d)}
            onDeleteDevice={handleDeleteDevice}
            onUpdateDeviceArea={(dev, newArea) => {
              dev.client_area = newArea;
              setDevices([...devices]);
            }}
          />
          <div className="q-cards-grid">
            {filteredDevices.map((d) => (
              <DeviceCard key={d.id} device={d} onSelect={(dev) => setSelectedDevice(dev)} />
            ))}
          </div>
        </>
      )}

      {/* Modal de Detalle */}
      <DeviceDetailModal
        device={selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onDelete={handleDeleteDevice}
      />

      {/* Modal de Control Remoto Web Directo desde el Mapa */}
      {remoteDevice && (
        <RemoteDesktopModal
          isOpen={true}
          device={remoteDevice}
          onClose={() => setRemoteDevice(null)}
        />
      )}

      {/* Modal de Vinculación */}
      <EnrollDeviceModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onDeviceEnrolled={() => {
          fetchDeviceData();
        }}
      />

      {/* Modal de Reporte Resumen Ejecutivo con Quiebre por Áreas y SO */}
      <DeviceSummaryReportModal
        devices={devices}
        isOpen={summaryReportOpen}
        onClose={() => setSummaryReportOpen(false)}
      />
    </div>
  );
};
