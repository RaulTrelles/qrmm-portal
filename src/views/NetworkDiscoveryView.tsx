import React, { useState, useEffect, useMemo } from "react";
import type { DiscoveredDevice, NetworkProbe, NetworkScanResponse, Device } from "../types/device";
import { Button } from "../components/Button/Button";
import { PushInstallModal } from "../components/PushInstallModal/PushInstallModal";
import {
  getDiscoveredDevices,
  scanNetwork,
  getNetworkProbes,
} from "../services/api";
import {
  Radio,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Server,
  Printer,
  Router as RouterIcon,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  DownloadCloud,
  Layers,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import "./NetworkDiscoveryView.css";

export interface NetworkDiscoveryViewProps {
  onOpenDeviceDetail?: (device: Device) => void;
  registeredDevices?: Device[];
}

export const NetworkDiscoveryView: React.FC<NetworkDiscoveryViewProps> = ({
  onOpenDeviceDetail,
  registeredDevices = [],
}) => {
  const [scanData, setScanData] = useState<NetworkScanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [probes, setProbes] = useState<NetworkProbe[]>([]);
  const [selectedProbeId, setSelectedProbeId] = useState<string>("");
  const [targetSubnet, setTargetSubnet] = useState<string>("192.168.1.0/24");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<
    "ALL" | "UNMANAGED" | "MANAGED" | "WINDOWS" | "LINUX" | "ANDROID" | "NETWORK"
  >("ALL");

  const [deployDevice, setDeployDevice] = useState<DiscoveredDevice | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 1. Cargar sondas y datos del último escaneo
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [probesRes, devRes] = await Promise.all([
        getNetworkProbes().catch(() => ({ probes: [], active_count: 0 })),
        getDiscoveredDevices().catch(() => null),
      ]);

      setProbes(probesRes.probes);
      const activeProbe = probesRes.probes.find((p) => p.is_connected);
      if (activeProbe) {
        setSelectedProbeId(activeProbe.id);
      } else if (probesRes.probes.length > 0) {
        setSelectedProbeId(probesRes.probes[0].id);
      }

      if (devRes) {
        setScanData(devRes);
        if (devRes.subnet) {
          setTargetSubnet(devRes.subnet);
        }
      }
    } catch (err: any) {
      console.error("Error al cargar datos de descubrimiento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Ejecutar escaneo en vivo
  const handleExecuteScan = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await scanNetwork(selectedProbeId || undefined, targetSubnet.trim() || undefined);
      setScanData(res);
      setScanMessage({
        text: `Escaneo completado con éxito: ${res.total_hosts} dispositivos detectados en ${res.scan_duration_ms} ms.`,
        type: "success",
      });
    } catch (err: any) {
      setScanMessage({
        text: err.message || "Error al realizar el escaneo en vivo",
        type: "error",
      });
    } finally {
      setScanning(false);
    }
  };

  // 3. Filtrado reactivo de dispositivos
  const filteredDevices = useMemo(() => {
    if (!scanData || !scanData.devices) return [];
    let list = [...scanData.devices];

    // Filtro por tipo o estado
    if (filterType === "UNMANAGED") {
      list = list.filter((d) => !d.is_managed);
    } else if (filterType === "MANAGED") {
      list = list.filter((d) => d.is_managed);
    } else if (filterType === "WINDOWS") {
      list = list.filter((d) => d.os_family === "Windows" || d.device_type === "WINDOWS_PC");
    } else if (filterType === "LINUX") {
      list = list.filter(
        (d) =>
          d.os_family?.toLowerCase().includes("linux") ||
          d.device_type === "LINUX_SERVER" ||
          d.device_type === "LINUX_HOST"
      );
    } else if (filterType === "ANDROID") {
      list = list.filter(
        (d) =>
          d.device_type === "ANDROID_DEVICE" ||
          d.device_type === "MOBILE_DEVICE" ||
          d.os_family?.toLowerCase().includes("android")
      );
    } else if (filterType === "NETWORK") {
      list = list.filter(
        (d) => d.device_type === "ROUTER_SWITCH" || d.device_type === "PRINTER" || d.device_type === "NETWORK_DEVICE"
      );
    }

    // Búsqueda de texto libre
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.ip.toLowerCase().includes(q) ||
          d.hostname.toLowerCase().includes(q) ||
          d.mac.toLowerCase().includes(q) ||
          d.vendor.toLowerCase().includes(q) ||
          d.device_type.toLowerCase().includes(q) ||
          d.os_family?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [scanData, filterType, searchQuery]);

  // Contadores para KPIs
  const totalCount = scanData?.devices?.length || 0;
  const managedCount = scanData?.devices?.filter((d) => d.is_managed).length || 0;
  const unmanagedCount = scanData?.devices?.filter((d) => !d.is_managed).length || 0;
  const networkDevicesCount =
    scanData?.devices?.filter(
      (d) => d.device_type === "ROUTER_SWITCH" || d.device_type === "PRINTER" || d.device_type === "NETWORK_DEVICE"
    ).length || 0;
  const androidCount =
    scanData?.devices?.filter(
      (d) =>
        d.device_type === "ANDROID_DEVICE" ||
        d.device_type === "MOBILE_DEVICE" ||
        d.os_family?.toLowerCase().includes("android")
    ).length || 0;

  const renderDeviceIcon = (dev: DiscoveredDevice) => {
    switch (dev.device_type) {
      case "WINDOWS_PC":
        return <Laptop size={16} color="#60a5fa" />;
      case "LINUX_SERVER":
      case "LINUX_HOST":
        return <Server size={16} color="#4ade80" />;
      case "ANDROID_DEVICE":
      case "MOBILE_DEVICE":
        return <Smartphone size={16} color="#34d399" />;
      case "PRINTER":
        return <Printer size={16} color="#f59e0b" />;
      case "ROUTER_SWITCH":
        return <RouterIcon size={16} color="#a78bfa" />;
      default:
        return <Layers size={16} color="#94a3b8" />;
    }
  };

  const getPortBadge = (port: number) => {
    switch (port) {
      case 22:
        return <span key={port} className="q-port-chip q-port-chip--ssh">22 SSH</span>;
      case 445:
        return <span key={port} className="q-port-chip q-port-chip--smb">445 SMB</span>;
      case 3389:
        return <span key={port} className="q-port-chip q-port-chip--rdp">3389 RDP</span>;
      case 80:
      case 443:
        return <span key={port} className="q-port-chip q-port-chip--web">{port} Web</span>;
      case 9100:
        return <span key={port} className="q-port-chip q-port-chip--print">9100 JetDirect</span>;
      default:
        return <span key={port} className="q-port-chip">{port}</span>;
    }
  };

  return (
    <div className="q-discovery-view">
      {/* Header */}
      <div className="q-discovery-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="q-discovery-icon-badge">
              <Radio size={22} color="var(--color-brand-primary)" />
            </div>
            <div>
              <h1 className="q-discovery-title">Descubrimiento de Red Local (Network Discovery)</h1>
              <p className="q-discovery-subtitle">
                Escaneo y mapeo de equipos en la subred LAN mediante sondas telemétricas Qhapana.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button
            variant="primary"
            icon={<RefreshCw size={16} className={scanning ? "q-spin" : ""} />}
            onClick={handleExecuteScan}
            disabled={scanning || probes.length === 0}
          >
            {scanning ? "Escaneando Subred..." : "Escanear Red Ahora"}
          </Button>
        </div>
      </div>

      {/* Alertas / Mensajes de Escaneo */}
      {scanMessage && (
        <div className={`q-discovery-msg q-discovery-msg--${scanMessage.type}`}>
          {scanMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{scanMessage.text}</span>
          <button className="q-discovery-msg-close" onClick={() => setScanMessage(null)}>
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="q-discovery-kpis">
        <div className="q-discovery-kpi-card">
          <div className="q-discovery-kpi-label">Total Detectados</div>
          <div className="q-discovery-kpi-val">{totalCount}</div>
          <div className="q-discovery-kpi-sub">Dispositivos en {scanData?.subnet || "la red"}</div>
        </div>

        <div className="q-discovery-kpi-card q-discovery-kpi-card--managed">
          <div className="q-discovery-kpi-label">Equipos Gestionados</div>
          <div className="q-discovery-kpi-val" style={{ color: "var(--color-status-success)" }}>
            {managedCount}
          </div>
          <div className="q-discovery-kpi-sub">Con agente Qhapana activo</div>
        </div>

        <div className="q-discovery-kpi-card q-discovery-kpi-card--unmanaged">
          <div className="q-discovery-kpi-label">Equipos Sin Agente</div>
          <div className="q-discovery-kpi-val" style={{ color: "var(--color-status-warning)" }}>
            {unmanagedCount}
          </div>
          <div className="q-discovery-kpi-sub">Candidatos a enrolamiento remoto</div>
        </div>

        <div className="q-discovery-kpi-card">
          <div className="q-discovery-kpi-label">Infraestructura / Impresoras</div>
          <div className="q-discovery-kpi-val" style={{ color: "var(--color-brand-primary)" }}>
            {networkDevicesCount}
          </div>
          <div className="q-discovery-kpi-sub">Switches, routers y periféricos</div>
        </div>
      </div>

      {/* Toolbar / Controles de Escaneo */}
      <div className="q-discovery-toolbar">
        {/* Selector de Sonda */}
        <div className="q-discovery-control-group">
          <label className="q-discovery-control-label">Sonda de Red:</label>
          <select
            className="q-discovery-select"
            value={selectedProbeId}
            onChange={(e) => setSelectedProbeId(e.target.value)}
            disabled={scanning}
          >
            {probes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.hostname} ({p.private_ip}) {p.is_connected ? "🟢 Online" : "🔴 Offline"}
              </option>
            ))}
          </select>
        </div>

        {/* Subred */}
        <div className="q-discovery-control-group">
          <label className="q-discovery-control-label">Subred:</label>
          <input
            type="text"
            className="q-discovery-input"
            value={targetSubnet}
            onChange={(e) => setTargetSubnet(e.target.value)}
            placeholder="192.168.1.0/24"
            disabled={scanning}
            style={{ width: 150 }}
          />
        </div>

        {/* Buscador */}
        <div className="q-discovery-search-wrap">
          <Search size={14} className="q-discovery-search-icon" />
          <input
            type="text"
            className="q-discovery-search-input"
            placeholder="Filtrar por IP, MAC, Hostname, Fabricante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chips de filtro */}
      <div className="q-discovery-filter-chips">
        <button
          className={`q-chip ${filterType === "ALL" ? "q-chip--active" : ""}`}
          onClick={() => setFilterType("ALL")}
        >
          Todos ({totalCount})
        </button>
        <button
          className={`q-chip ${filterType === "UNMANAGED" ? "q-chip--active-warning" : ""}`}
          onClick={() => setFilterType("UNMANAGED")}
        >
          🟡 Solo Sin Agente ({unmanagedCount})
        </button>
        <button
          className={`q-chip ${filterType === "MANAGED" ? "q-chip--active-success" : ""}`}
          onClick={() => setFilterType("MANAGED")}
        >
          🟢 Gestionados ({managedCount})
        </button>
        <button
          className={`q-chip ${filterType === "WINDOWS" ? "q-chip--active" : ""}`}
          onClick={() => setFilterType("WINDOWS")}
        >
          🪟 Windows
        </button>
        <button
          className={`q-chip ${filterType === "LINUX" ? "q-chip--active" : ""}`}
          onClick={() => setFilterType("LINUX")}
        >
          🐧 Linux
        </button>
        <button
          className={`q-chip ${filterType === "ANDROID" ? "q-chip--active" : ""}`}
          onClick={() => setFilterType("ANDROID")}
        >
          📱 Android ({androidCount})
        </button>
        <button
          className={`q-chip ${filterType === "NETWORK" ? "q-chip--active" : ""}`}
          onClick={() => setFilterType("NETWORK")}
        >
          🖨️ Red / Impresoras ({networkDevicesCount})
        </button>
      </div>

      {/* Tabla de Dispositivos */}
      <div className="q-discovery-table-card">
        {loading ? (
          <div className="q-discovery-loading">
            <RefreshCw size={24} className="q-spin" color="var(--color-brand-primary)" />
            <span>Consultando dispositivos en la red local...</span>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="q-discovery-empty">
            <Search size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-secondary)" }}>
              No se encontraron dispositivos coincidentes
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              Intenta con otro término de búsqueda o presiona "Escanear Red Ahora".
            </div>
          </div>
        ) : (
          <div className="q-discovery-table-wrap">
            <table className="q-discovery-table">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Estado</th>
                  <th>Equipo / Hostname</th>
                  <th>Dirección IP</th>
                  <th>MAC Address</th>
                  <th>Tipo / SO</th>
                  <th>Puertos Abiertos</th>
                  <th style={{ textAlign: "right", width: 180 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((dev) => (
                  <tr key={`${dev.ip}-${dev.mac}`} className={dev.is_managed ? "q-row--managed" : "q-row--unmanaged"}>
                    {/* Estado */}
                    <td>
                      {dev.is_managed ? (
                        <span className="q-badge-status q-badge-status--managed">
                          <ShieldCheck size={13} /> Gestionado
                        </span>
                      ) : (
                        <span className="q-badge-status q-badge-status--unmanaged">
                          <ShieldAlert size={13} /> Sin Agente
                        </span>
                      )}
                    </td>

                    {/* Hostname & Fabricante */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {renderDeviceIcon(dev)}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                            {dev.hostname}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                            {dev.vendor}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* IP */}
                    <td>
                      <span className="q-ip-text">{dev.ip}</span>
                      {dev.response_time_ms > 0 && (
                        <span className="q-latency-text">{dev.response_time_ms.toFixed(1)} ms</span>
                      )}
                    </td>

                    {/* MAC */}
                    <td>
                      <span className="q-mac-text">{dev.mac}</span>
                    </td>

                    {/* Tipo / SO */}
                    <td>
                      <div style={{ fontSize: 12 }}>{dev.os_family}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                        {dev.device_type}
                      </div>
                    </td>

                    {/* Puertos Abiertos */}
                    <td>
                      <div className="q-ports-wrap">
                        {dev.open_ports && dev.open_ports.length > 0 ? (
                          dev.open_ports.map((p) => getPortBadge(p))
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Sin puertos abiertos</span>
                        )}
                      </div>
                    </td>

                    {/* Acción */}
                    <td style={{ textAlign: "right" }}>
                      {!dev.is_managed ? (
                        <button
                          className="q-btn-install-agent"
                          onClick={() => setDeployDevice(dev)}
                          title="Instalar agente remotamente en este equipo mediante credenciales de administrador"
                        >
                          <DownloadCloud size={13} />
                          <span>Instalar Agente</span>
                        </button>
                      ) : (
                        <button
                          className="q-btn-view-device"
                          onClick={() => {
                            if (onOpenDeviceDetail && dev.managed_device_id) {
                              const found = registeredDevices.find((rd) => rd.id === dev.managed_device_id);
                              if (found) {
                                onOpenDeviceDetail(found);
                              }
                            }
                          }}
                          title="Ver telemetría y detalles del equipo en el RMM"
                        >
                          <span>Ver Detalle</span>
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Despliegue Remoto de Agente */}
      {deployDevice && (
        <PushInstallModal
          device={deployDevice}
          probeId={selectedProbeId}
          onClose={() => setDeployDevice(null)}
          onSuccess={() => {
            // Recargar datos tras despliegue exitoso
            handleExecuteScan();
          }}
        />
      )}
    </div>
  );
};
