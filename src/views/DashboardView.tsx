import React, { useEffect, useState, useMemo } from "react";
import type { Device, KpiSummary } from "../types/device";
import { getDevices, deleteDevice } from "../services/api";
import { dashboardSocket } from "../services/socket";
import { DataTable } from "../components/DataTable/DataTable";
import { DeviceCard } from "../components/DeviceCard/DeviceCard";
import { DeviceDetailModal } from "../components/DeviceDetailModal/DeviceDetailModal";
import { EnrollDeviceModal } from "../components/EnrollDeviceModal/EnrollDeviceModal";
import { RemoteDesktopModal } from "../components/RemoteDesktopModal/RemoteDesktopModal";
import { Button } from "../components/Button/Button";
import { useAuth } from "../context/AuthContext";
import {
  Server,
  Search,
  Filter,
  Plus,
  Cpu,
  HardDrive,
  Activity,
  MapPin,
  Monitor,
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

interface DeviceGeoLocation {
  city: string;
  region: string;
  country: string;
  xPercent: number; // Porcentaje relativo X en mapa SVG
  yPercent: number; // Porcentaje relativo Y en mapa SVG
}

// Función auxiliar para determinar geolocalización basada en sede, hostname, IP o distribución determinista
const PRESET_SPOTS: DeviceGeoLocation[] = [
  { city: "Callao, Lima", region: "Hub Puerto Callao", country: "PE", xPercent: 18, yPercent: 44 },
  { city: "Lima Centro, Lima", region: "Datacenter Central", country: "PE", xPercent: 42, yPercent: 24 },
  { city: "Ate, Lima Este", region: "Sede Facturación & Logística", country: "PE", xPercent: 82, yPercent: 32 },
  { city: "San Isidro, Lima", region: "Sede Financiera Las Begonias", country: "PE", xPercent: 52, yPercent: 52 },
  { city: "Miraflores, Lima", region: "Oficina Corporativa Larco", country: "PE", xPercent: 30, yPercent: 74 },
  { city: "Surco, Lima", region: "Nodo IPN Fibra Óptica", country: "PE", xPercent: 76, yPercent: 70 },
  { city: "Los Olivos, Lima", region: "Hub Lima Cono Norte", country: "PE", xPercent: 36, yPercent: 15 },
  { city: "San Miguel, Lima", region: "Sucursal Av. La Marina", country: "PE", xPercent: 22, yPercent: 58 },
  { city: "La Molina, Lima", region: "Campus Tecnológico Este", country: "PE", xPercent: 86, yPercent: 54 },
  { city: "Chorrillos, Lima", region: "Estación Terrena Sur", country: "PE", xPercent: 44, yPercent: 86 },
  { city: "San Juan de Lurigancho", region: "Nodo Troncal Metro", country: "PE", xPercent: 64, yPercent: 16 },
  { city: "Magdalena, Lima", region: "Sede Operaciones Pacífico", country: "PE", xPercent: 32, yPercent: 62 },
];

const getDeviceLocation = (device: Device, fallbackIndex: number = 0): DeviceGeoLocation => {
  const host = (device.hostname || "").toLowerCase();
  const area = (device.client_area || "").toLowerCase();

  // Mapeos específicos de alta separación por HOSTNAME
  if (host.includes("kraken")) {
    return {
      city: "Lima Centro, Lima",
      region: "Datacenter Central (Tier III)",
      country: "PE",
      xPercent: 42,
      yPercent: 24,
    };
  }
  if (host.includes("factura")) {
    return {
      city: "Ate, Lima Este",
      region: "Sede Facturación & Logística",
      country: "PE",
      xPercent: 82,
      yPercent: 32,
    };
  }
  if (host.includes("concar")) {
    return {
      city: "San Isidro, Lima",
      region: "Sede Financiera Las Begonias",
      country: "PE",
      xPercent: 52,
      yPercent: 52,
    };
  }
  if (host.includes("finanza")) {
    return {
      city: "Miraflores, Lima",
      region: "Oficina Corporativa Larco",
      country: "PE",
      xPercent: 30,
      yPercent: 74,
    };
  }
  if (host.includes("ipn")) {
    return {
      city: "Surco, Lima",
      region: "Nodo IPN Fibra Óptica",
      country: "PE",
      xPercent: 76,
      yPercent: 70,
    };
  }
  if (host.includes("desktop") || host.includes("v99")) {
    return {
      city: "Callao, Lima",
      region: "Hub Puerto & Distribución",
      country: "PE",
      xPercent: 18,
      yPercent: 44,
    };
  }

  // Mapeos secundarios por Área (para equipos adicionales)
  if (area.includes("kraken")) {
    return {
      city: "Lima Centro, Lima",
      region: "Datacenter Secundario",
      country: "PE",
      xPercent: 46,
      yPercent: 18,
    };
  }
  if (area.includes("callao")) {
    return {
      city: "Callao, Lima",
      region: "Sede Portuaria",
      country: "PE",
      xPercent: 16,
      yPercent: 50,
    };
  }

  // Si no coincide por nombre o área, se asigna uno de los spots ampliamente espaciados
  const safeIdx = Math.abs(fallbackIndex) % PRESET_SPOTS.length;
  return PRESET_SPOTS[safeIdx];
};

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

  const [mapHoveredDevice, setMapHoveredDevice] = useState<Device | null>(null);
  const [selectedMapPinId, setSelectedMapPinId] = useState<string | null>(null);
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

    return () => {
      unsubState();
      unsubHeartbeat();
      unsubDeleted();
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

  const selectedMapDevice = useMemo(() => {
    if (!selectedMapPinId) return mapHoveredDevice || devices[0] || null;
    return devices.find((d) => d.id === selectedMapPinId) || null;
  }, [selectedMapPinId, mapHoveredDevice, devices]);

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
              const isSelected = selectedMapDevice?.id === dev.id;
              const ping = isOnline ? "0.3 ms" : "offline";
              return (
                <div
                  key={dev.id}
                  className={`q-it-server-row ${isSelected ? "q-it-server-row--selected" : ""}`}
                  onClick={() => {
                    setSelectedMapPinId(dev.id);
                    setMapHoveredDevice(dev);
                  }}
                >
                  <div className="q-it-server-icon-badge">
                    <Server size={15} />
                  </div>
                  <div className="q-it-server-meta">
                    <span className="q-it-server-hostname">{dev.hostname}</span>
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
          {/* Top: Live network traffic */}
          <div className="q-it-panel q-it-panel--map">
            <div className="q-it-panel-header">
              <div className="q-it-panel-title-group">
                <Radio size={16} className="q-it-icon-pulse-blue" />
                <h3 className="q-it-panel-title">Live network traffic</h3>
              </div>
              <div className="q-it-live-badge">
                <span className="q-it-dot-pulse"></span>
                <span>LIVE TRAFFIC</span>
              </div>
            </div>

            {/* Lienzo de Mapa SVG Interactivo con Arcos de Tráfico en Vivo */}
            <div className="q-fleet-map-canvas q-it-map-canvas">
              <svg className="q-fleet-map-svg" viewBox="0 0 600 320" preserveAspectRatio="none">
                <defs>
                  {/* Degradado Océano Pacífico (NOC Dark Blue) */}
                  <linearGradient id="q-ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--q-map-ocean, #0d1527)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--q-map-ocean-deep, #090f1d)" stopOpacity="1" />
                  </linearGradient>

                  {/* Degradado Suelo / Continente */}
                  <linearGradient id="q-land-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--q-map-land, #172033)" />
                    <stop offset="100%" stopColor="var(--q-map-relief, #1e293b)" />
                  </linearGradient>

                  {/* Degradado de Arcos de Vuelo / Tráfico en Vivo */}
                  <linearGradient id="q-arc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Cuadrícula Geodésica de Navegación */}
                  <pattern id="q-map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                  </pattern>

                  {/* Sombra para el Litoral Costero */}
                  <filter id="q-coast-shadow" x="-5%" y="-5%" width="115%" height="115%">
                    <feDropShadow dx="-2" dy="2" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Capa Base: Océano Pacífico */}
                <rect width="600" height="320" fill="url(#q-ocean-gradient)" />
                <rect width="600" height="320" fill="url(#q-map-grid)" />

                {/* Líneas de Profundidad Batimétrica Marina */}
                <path
                  d="M -20,70 Q 50,90 120,60 T 170,105"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <path
                  d="M -20,160 Q 40,185 90,165 T 145,215"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <path
                  d="M -20,250 Q 50,270 125,255 T 180,305"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />

                {/* Marca de Agua Geográfica: Océano Pacífico */}
                <text x="35" y="285" className="q-map-ocean-watermark">
                  OCÉANO PACÍFICO
                </text>

                {/* Islas Frente al Callao */}
                <ellipse
                  cx="42"
                  cy="170"
                  rx="20"
                  ry="8"
                  transform="rotate(-30 42 170)"
                  className="q-map-island"
                />
                <text x="42" y="173" className="q-map-island-label">
                  I. San Lorenzo
                </text>

                <ellipse
                  cx="64"
                  cy="192"
                  rx="7"
                  ry="4"
                  transform="rotate(-15 64 192)"
                  className="q-map-island"
                />
                <text x="64" y="202" className="q-map-island-label">
                  El Frontón
                </text>

                {/* Masa Continental Principal: Región Metropolitana & Litoral */}
                <path
                  d="M 195,0 
                     Q 175,45 155,85 
                     L 125,112 
                     L 76,134 
                     Q 60,142 66,152 
                     L 92,156 
                     L 122,160 
                     Q 142,178 162,205 
                     Q 178,235 192,265 
                     Q 208,295 224,320 
                     L 235,340 
                     L 600,340 
                     L 600,0 
                     Z"
                  fill="url(#q-land-gradient)"
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.8"
                  filter="url(#q-coast-shadow)"
                  className="q-map-landmass"
                />

                {/* Cuenca Hidrográfica del Río Rímac */}
                <path
                  d="M 600,102 Q 470,110 340,120 T 205,138 T 130,152"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <text x="330" y="115" className="q-map-river-label">
                  RÍO RÍMAC
                </text>

                {/* Cordillera / Relieve Oriental */}
                <path
                  d="M 490,15 Q 530,55 550,95 T 575,170 T 590,260"
                  fill="none"
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />

                {/* Rótulos Geográficos de Zonas de Flota */}
                <text x="110" y="115" className="q-map-district-label">
                  CALLAO (PUERTO)
                </text>
                <text x="255" y="65" className="q-map-district-label">
                  LIMA CENTRO (DATACENTER)
                </text>
                <text x="312" y="188" className="q-map-district-label">
                  SAN ISIDRO (FINANCIERO)
                </text>
                <text x="178" y="260" className="q-map-district-label">
                  MIRAFLORES (COSTA)
                </text>
                <text x="495" y="85" className="q-map-district-label">
                  LIMA ESTE (ATE)
                </text>
                <text x="450" y="245" className="q-map-district-label">
                  SURCO (NODO FIBRA)
                </text>

                {/* ARCOS CURVADOS DE TRÁFICO NOC ENTRE NODOS (Estilo Flight Paths) */}
                {devices.map((dev, i) => {
                  const loc = getDeviceLocation(dev, i);
                  if (loc.xPercent === 42 && loc.yPercent === 24) return null;
                  const targetX = (loc.xPercent / 100) * 600;
                  const targetY = (loc.yPercent / 100) * 320;
                  const midX = (252 + targetX) / 2;
                  const midY = Math.min(77, targetY) - 36;
                  const isOnline = dev.status.current_state === "ONLINE";

                  return (
                    <g key={i}>
                      <path
                        d={`M 252,77 Q ${midX},${midY} ${targetX},${targetY}`}
                        fill="none"
                        stroke={isOnline ? "url(#q-arc-gradient)" : "var(--color-border-strong)"}
                        strokeWidth={isOnline ? "1.8" : "1"}
                        strokeDasharray={isOnline ? "5 4" : "2 4"}
                        opacity={isOnline ? "0.75" : "0.2"}
                        className={isOnline ? "q-it-packet-arc" : ""}
                      />
                      {isOnline && (
                        <circle
                          cx={midX}
                          cy={midY}
                          r="2.5"
                          fill="#06b6d4"
                          className="q-it-packet-dot"
                        />
                      )}
                    </g>
                  );
                })}

                {/* HUD GPS Telemetría Top-Right */}
                <g transform="translate(420, 8)">
                  <rect
                    width="172"
                    height="20"
                    rx="4"
                    fill="var(--color-surface-default)"
                    opacity="0.88"
                    stroke="var(--color-border-default)"
                    strokeWidth="0.8"
                  />
                  <text
                    x="86"
                    y="14"
                    fill="var(--color-text-secondary)"
                    fontSize="9"
                    fontWeight="650"
                    textAnchor="middle"
                    letterSpacing="0.4"
                  >
                    GPS: 12.0464° S, 77.0428° W
                  </text>
                </g>

                {/* Rosa de los Vientos / Brújula Top-Left */}
                <g transform="translate(26, 26)">
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill="var(--color-surface-default)"
                    stroke="var(--color-border-default)"
                    strokeWidth="1"
                    opacity="0.85"
                  />
                  <polygon points="0,-10 -3,-1 0,0 3,-1" fill="var(--color-brand-primary)" />
                  <polygon points="0,10 -3,1 0,0 3,1" fill="var(--color-text-tertiary)" opacity="0.6" />
                  <text x="0" y="-13" fill="var(--color-brand-primary)" fontSize="8" fontWeight="800" textAnchor="middle">
                    N
                  </text>
                </g>
              </svg>

              {/* Pines Geográficos de los Equipos Reales con Separación Óptima */}
              {devices.map((device, idx) => {
                const loc = getDeviceLocation(device, idx);
                const isOnline = device.status.current_state === "ONLINE";
                const isSelected = selectedMapDevice?.id === device.id;

                return (
                  <div
                    key={device.id}
                    className={`q-map-pin ${isOnline ? "q-map-pin--online" : "q-map-pin--offline"} ${
                      isSelected ? "q-map-pin--selected" : ""
                    }`}
                    style={{ left: `${loc.xPercent}%`, top: `${loc.yPercent}%` }}
                    onMouseEnter={() => setMapHoveredDevice(device)}
                    onClick={() => setSelectedMapPinId(device.id)}
                    title={`${device.hostname} • ${loc.city} (${loc.region})`}
                  >
                    <div className="q-map-pin-pulse"></div>
                    <div className="q-map-pin-dot">
                      <MapPin size={13} />
                    </div>
                    <div className="q-map-pin-tag">
                      <span className="q-map-pin-tag-dot"></span>
                      <span>{device.hostname}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infobar al pie del mapa */}
            {selectedMapDevice && (
              <div className="q-fleet-map-infobar">
                <div className="q-map-info-device">
                  <div className="q-map-info-status">
                    <span
                      className={`q-map-status-dot ${
                        selectedMapDevice.status.current_state === "ONLINE"
                          ? "q-map-status-dot--online"
                          : "q-map-status-dot--offline"
                      }`}
                    ></span>
                    <strong className="q-map-info-name">{selectedMapDevice.hostname}</strong>
                    <span className="q-map-info-area">{selectedMapDevice.client_area || "Sede General"}</span>
                  </div>
                  <div className="q-map-info-geo">
                    <MapPin size={12} style={{ color: "var(--color-brand-primary)" }} />
                    <span>
                      {(() => {
                        const devIndex = devices.findIndex((d) => d.id === selectedMapDevice.id);
                        return getDeviceLocation(selectedMapDevice, devIndex >= 0 ? devIndex : 0).city;
                      })()}{" "}
                      • IP:{" "}
                      <code>{selectedMapDevice.private_ip || selectedMapDevice.public_ip || "192.168.1.x"}</code>
                    </span>
                  </div>
                </div>

                <div className="q-map-info-actions">
                  <button
                    className="q-map-action-btn"
                    onClick={() => setSelectedDevice(selectedMapDevice)}
                    title="Ver Ficha Técnica"
                  >
                    <ExternalLink size={13} style={{ marginRight: 4 }} />
                    <span>Detalle</span>
                  </button>
                  <button
                    className="q-map-action-btn q-map-action-btn--primary"
                    onClick={() => setRemoteDevice(selectedMapDevice)}
                    title="Iniciar Conexión Remota"
                  >
                    <Monitor size={13} style={{ marginRight: 4 }} />
                    <span>Conectar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
};
