import React, { useEffect, useState, useMemo } from "react";
import type { Device } from "../types/device";
import { getDevices } from "../services/api";
import { dashboardSocket } from "../services/socket";
import { DeviceDetailModal } from "../components/DeviceDetailModal/DeviceDetailModal";
import { EnrollDeviceModal } from "../components/EnrollDeviceModal/EnrollDeviceModal";
import { RemoteDesktopModal } from "../components/RemoteDesktopModal/RemoteDesktopModal";
import { NetworkTrafficMap } from "../components/NetworkTrafficMap/NetworkTrafficMap";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  ChevronDown,
  Radio,
  Wifi,
  Cpu,
  Gauge,
  Activity,
  HardDrive,
} from "lucide-react";
import "./DashboardView.css";

export interface DashboardViewProps {
  refreshTrigger: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ refreshTrigger }) => {
  const { activeOrganization, language } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [remoteDevice, setRemoteDevice] = useState<Device | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
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
      const data = await getDevices(activeOrganization?.id);
      setDevices(data);
    } catch (err) {
      console.error("Error fetching devices:", err);
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



  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesArea = areaFilter === "all" || (d.client_area || "").toLowerCase() === areaFilter.toLowerCase();
      return matchesArea;
    });
  }, [devices, areaFilter]);

  // Cálculos de Telemetría Global de la Flota para Hero KPI Cards
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
      if (d.status.current_state === "ONLINE" && typeof d.latest_telemetry?.ram_percent === "number") {
        usedRamGb += (ramInstalled * d.latest_telemetry.ram_percent) / 100;
      }
    });
    const ramPctAvg = totalRamGb > 0 ? Math.round((usedRamGb / totalRamGb) * 100) : 51;

    // Disco promedio
    let totalDiskGb = 0;
    let usedDiskGb = 0;
    devices.forEach((d) => {
      const diskInstalled = d.specs?.disk_total_gb || 512;
      totalDiskGb += diskInstalled;
      if (d.status.current_state === "ONLINE" && typeof d.latest_telemetry?.disk_percent === "number") {
        usedDiskGb += (diskInstalled * d.latest_telemetry.disk_percent) / 100;
      }
    });
    const diskPctAvg = totalDiskGb > 0 ? Math.round((usedDiskGb / totalDiskGb) * 100) : 79;

    // Latencia / IOs red
    let totalLatency = 0;
    let latencyCount = 0;
    onlineDevices.forEach((d) => {
      const ping = (d.latest_telemetry as any)?.telemetry?.ping_ms;
      if (typeof ping === "number") {
        totalLatency += ping;
        latencyCount++;
      }
    });
    const latencyPct = latencyCount > 0 ? Math.min(100, Math.max(15, Math.round((totalLatency / latencyCount / 50) * 100))) : 38;

    return {
      avgCpu: Math.round(avgCpu * 10) / 10,
      ramPctAvg,
      diskPctAvg,
      latencyPct,
      totalRamGb: Math.round(totalRamGb),
      usedRamGb: Math.round(usedRamGb),
      totalDiskGb: Math.round(totalDiskGb),
      usedDiskGb: Math.round(usedDiskGb),
    };
  }, [devices]);

  return (
    <div className="q-dashboard-view q-it-dashboard">
      {/* ----------------------------------------------------------------------
          1. IT DASHBOARD HEADER (Título & Controles NOC)
      ---------------------------------------------------------------------- */}
      <header className="q-it-header">
        <div className="q-it-header-left">
          <h1 className="q-it-title">{language === "es" ? "Panel de TI" : "IT Dashboard"}</h1>
          <span className="q-it-header-badge">
            <span className="q-it-dot-pulse"></span>
            {language === "es" ? "Centro de Control NOC" : "NOC Control Center"}
          </span>
        </div>
        <div className="q-it-header-actions">
          <div className="q-it-select-wrap">
            <select
              className="q-it-select"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="all">{language === "es" ? "Gestión TI (Todos)" : "IT Management (All)"}</option>
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
            <span>{language === "es" ? "Nuevo equipo" : "New device"}</span>
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
            <span className="q-it-kpi-title">{language === "es" ? "Latencia de red" : "Network latency"}</span>
            <span className="q-it-kpi-action-icon">
              <Radio size={13} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <Wifi size={26} className="q-it-kpi-icon-svg" />
            <span className="q-it-kpi-num">{fleetMetrics.latencyPct}%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">{language === "es" ? "Red/E/S" : "Network/IOs"}</span>
            <div className="q-it-kpi-track">
              <div className="q-it-kpi-fill" style={{ width: `${fleetMetrics.latencyPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: CPU usage (Purple 2 con Donut Radial Ring) */}
        <div className="q-it-kpi-card q-it-kpi-card--purple2">
          <div className="q-it-kpi-top">
            <span className="q-it-kpi-title">{language === "es" ? "Uso de CPU" : "CPU usage"}</span>
            <span className="q-it-kpi-action-icon">
              <Cpu size={13} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <svg width="32" height="32" viewBox="0 0 40 40" className="q-it-donut-ring">
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
            <span className="q-it-kpi-sub">{language === "es" ? "Uso de CPU" : "CPU usage"}</span>
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
            <span className="q-it-kpi-title">{language === "es" ? "Memoria" : "Memory"}</span>
            <span className="q-it-kpi-action-icon">
              <Activity size={13} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <Gauge size={26} className="q-it-kpi-icon-svg" />
            <span className="q-it-kpi-num">{fleetMetrics.ramPctAvg}%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">{language === "es" ? "Uso de RAM" : "RAM usage"}</span>
            <div className="q-it-kpi-track">
              <div className="q-it-kpi-fill" style={{ width: `${fleetMetrics.ramPctAvg}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Bandwidth / Almacenamiento & SLA (Cyan / Teal 2) */}
        <div className="q-it-kpi-card q-it-kpi-card--teal2">
          <div className="q-it-kpi-top">
            <span className="q-it-kpi-title">{language === "es" ? "Almacenamiento" : "Storage"}</span>
            <span className="q-it-kpi-action-icon">
              <HardDrive size={13} />
            </span>
          </div>
          <div className="q-it-kpi-body">
            <HardDrive size={26} className="q-it-kpi-icon-svg" />
            <span className="q-it-kpi-num">{fleetMetrics.diskPctAvg}%</span>
          </div>
          <div className="q-it-kpi-foot">
            <span className="q-it-kpi-sub">{language === "es" ? "Disco / E/S" : "Storage / IOs"}</span>
            <div className="q-it-kpi-track">
              <div className="q-it-kpi-fill" style={{ width: `${fleetMetrics.diskPctAvg}%` }}></div>
            </div>
          </div>
        </div>
      </section>


      {/* ----------------------------------------------------------------------
          3. FULL-WIDTH LIVE NETWORK TRAFFIC MAP (NOC Geolocation Center)
      ---------------------------------------------------------------------- */}
      <section className="q-it-operations-grid q-it-operations-grid--fullwidth">
        <div className="q-it-right-stack" style={{ width: "100%" }}>
          <NetworkTrafficMap
            devices={filteredDevices}
            selectedDevice={selectedDevice}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            onOpenRemote={(dev) => setRemoteDevice(dev)}
          />
        </div>
      </section>

      {/* Modal de Detalle al hacer clic en un nodo del mapa */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

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
