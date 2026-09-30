import React, { useEffect, useState, useMemo } from "react";
import type { Device, KpiSummary } from "../types/device";
import { getDevices, deleteDevice } from "../services/api";
import { dashboardSocket } from "../services/socket";
import { KpiCard } from "../components/KpiCard/KpiCard";
import { DataTable } from "../components/DataTable/DataTable";
import { DeviceCard } from "../components/DeviceCard/DeviceCard";
import { DeviceDetailModal } from "../components/DeviceDetailModal/DeviceDetailModal";
import { EnrollDeviceModal } from "../components/EnrollDeviceModal/EnrollDeviceModal";
import { Button } from "../components/Button/Button";
import { useAuth } from "../context/AuthContext";
import { Server, CheckCircle2, AlertTriangle, XCircle, Search, Filter, Plus } from "lucide-react";
import "./DashboardView.css";
export interface DashboardViewProps { refreshTrigger: number; }
export const DashboardView: React.FC<DashboardViewProps> = ({ refreshTrigger }) => {
  const { activeOrganization } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
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
  useEffect(() => { fetchDeviceData(); }, [refreshTrigger, activeOrganization?.id]);
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
              latest_telemetry: { cpu_percent: data.cpu_percent, ram_percent: data.ram_percent, disk_percent: data.disk_percent, telemetry: data.telemetry },
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
    return () => { unsubState(); unsubHeartbeat(); unsubDeleted(); };
  }, []);
  const kpiSummary = useMemo<KpiSummary>(() => {
    const total = devices.length;
    let online = 0; let unstable = 0; let offline = 0;
    devices.forEach((d) => {
      if (d.status.current_state === "ONLINE") online++;
      else if (d.status.current_state === "UNSTABLE") unstable++;
      else offline++;
    });
    return { total, online, unstable, offline };
  }, [devices]);
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      const matchSearch = dev.hostname.toLowerCase().includes(search.toLowerCase()) || dev.device_code.toLowerCase().includes(search.toLowerCase()) || dev.private_ip.includes(search);
      const matchOs = osFilter === "all" || dev.os_type.toLowerCase().includes(osFilter.toLowerCase());
      const matchState = stateFilter === "all" || dev.status.current_state === stateFilter;
      return matchSearch && matchOs && matchState;
    });
  }, [devices, search, osFilter, stateFilter]);

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
    <div className="q-dashboard-view">
      <section className="q-kpi-grid">
        <KpiCard title="Total Dispositivos" value={kpiSummary.total} icon={<Server size={20} />} subtitle="Enrolados en la flota" />
        <KpiCard title="Equipos Online" value={kpiSummary.online} icon={<CheckCircle2 size={20} color="var(--color-status-success)" />} subtitle="Transmitiendo heartbeats" />
        <KpiCard title="Equipos Inestables" value={kpiSummary.unstable} icon={<AlertTriangle size={20} color="var(--color-status-warning)" />} subtitle="Heartbeat retrasado" />
        <KpiCard title="Equipos Offline" value={kpiSummary.offline} icon={<XCircle size={20} color="var(--color-status-danger)" />} subtitle="Sin presencia > 30s" />
      </section>
      <section className="q-filter-bar">
        <div className="q-search-input">
          <Search size={18} color="var(--color-text-tertiary)" />
          <input type="text" placeholder="Buscar por hostname, código o IP..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--color-text-secondary)" }}>Cargando flota de dispositivos...</div>
      ) : (
        <>
          <DataTable devices={filteredDevices} onSelectDevice={(d) => setSelectedDevice(d)} onDeleteDevice={handleDeleteDevice} />
          <div className="q-cards-grid">
            {filteredDevices.map((d) => (<DeviceCard key={d.id} device={d} onSelect={(dev) => setSelectedDevice(dev)} />))}
          </div>
        </>
      )}
      <DeviceDetailModal device={selectedDevice} onClose={() => setSelectedDevice(null)} onDelete={handleDeleteDevice} />
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
