import React, { useState, useMemo, useEffect } from "react";
import type { Device } from "../types/device";
import { getDevices, deleteDevice } from "../services/api";
import { dashboardSocket } from "../services/socket";
import { Badge } from "../components/Badge/Badge";
import { Button } from "../components/Button/Button";
import { DeviceDetailModal } from "../components/DeviceDetailModal/DeviceDetailModal";
import { EnrollDeviceModal } from "../components/EnrollDeviceModal/EnrollDeviceModal";
import { useAuth } from "../context/AuthContext";
import {
  Server,
  Cpu,
  HardDrive,
  Download,
  Search,
  Laptop,
  ExternalLink,
  Plus,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { getClientAreas, updateDeviceArea } from "../services/api";
import "./InventoryView.css";

export interface InventoryViewProps {
  refreshTrigger: number;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ refreshTrigger }) => {
  const { activeOrganization } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [availableAreas, setAvailableAreas] = useState<string[]>(["General"]);
  const [editingAreaDeviceId, setEditingAreaDeviceId] = useState<string | null>(null);
  const [updatingAreaId, setUpdatingAreaId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);

  // Modal para Retirar Equipo
  const [deviceToRetire, setDeviceToRetire] = useState<Device | null>(null);
  const [retireModalOpen, setRetireModalOpen] = useState<boolean>(false);
  const [isRetiring, setIsRetiring] = useState<boolean>(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const [data, areasData] = await Promise.all([
        getDevices(activeOrganization?.id),
        getClientAreas().catch(() => ["General"]),
      ]);
      setDevices(data);
      if (areasData && areasData.length > 0) {
        setAvailableAreas(areasData);
      }
    } catch (err) {
      console.error("Error al cargar inventario:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
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
      unsubDeleted();
      unsubLocation();
    };
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.hostname.toLowerCase().includes(q) ||
        d.device_code.toLowerCase().includes(q) ||
        (d.client_area && d.client_area.toLowerCase().includes(q)) ||
        (d.private_ip && d.private_ip.includes(q)) ||
        (d.specs?.cpu_model && d.specs.cpu_model.toLowerCase().includes(q)) ||
        (d.os_version && d.os_version.toLowerCase().includes(q));

      const matchesOs = osFilter === "all" || d.os_type.toLowerCase() === osFilter.toLowerCase();
      const matchesArea = areaFilter === "all" || (d.client_area || "General").toLowerCase() === areaFilter.toLowerCase();
      return matchesSearch && matchesOs && matchesArea;
    });
  }, [devices, search, osFilter, areaFilter]);

  const handleChangeArea = async (dev: Device, newArea: string) => {
    if (dev.client_area === newArea) {
      setEditingAreaDeviceId(null);
      return;
    }
    try {
      setUpdatingAreaId(dev.id);
      dev.client_area = newArea;
      setDevices([...devices]);
      await updateDeviceArea(dev.id, newArea);
    } catch (err) {
      console.error("Error al actualizar área del equipo:", err);
    } finally {
      setUpdatingAreaId(null);
      setEditingAreaDeviceId(null);
    }
  };

  // Totales de hardware para resumen ejecutivo
  const stats = useMemo(() => {
    let totalRam = 0;
    let totalDisk = 0;
    let windowsCount = 0;
    let linuxCount = 0;

    devices.forEach((d) => {
      if (d.specs?.ram_total_gb) totalRam += d.specs.ram_total_gb;
      if (d.specs?.disk_total_gb) totalDisk += d.specs.disk_total_gb;
      if (d.os_type?.toLowerCase() === "windows") windowsCount++;
      if (d.os_type?.toLowerCase() === "linux") linuxCount++;
    });

    return {
      totalDevices: devices.length,
      totalRamGb: Math.round(totalRam),
      totalDiskGb: Math.round(totalDisk),
      windowsCount,
      linuxCount,
    };
  }, [devices]);

  const handleExportCSV = () => {
    if (devices.length === 0) return;

    const headers = [
      "Hostname",
      "Código Activo",
      "Estado",
      "Tipo de Equipo",
      "IP Privada",
      "IP Pública",
      "MAC",
      "Sistema Operativo",
      "Arquitectura",
      "Procesador",
      "Núcleos CPU",
      "RAM Total (GB)",
      "RAM Usable (GB)",
      "Disco Total (GB)",
      "Disco Libre (GB)",
      "Pantalla(s)",
      "Teclado",
      "Mouse",
      "Impresoras",
      "Versión Agente",
      "Fecha Registro",
    ];

    const rows = devices.map((d) => {
      const peri = d.specs?.peripherals;
      const chassis = peri?.chassis_type || (d.os_type === "windows" ? "Desktop" : "Servidor");
      const monitors = peri?.monitors?.join(" | ") || (d.os_type === "windows" ? "Monitor Principal (1920x1080)" : "");
      const keyboard = peri?.keyboard || (d.os_type === "windows" ? "Teclado estándar / USB HID" : "");
      const mouse = peri?.mouse || (d.os_type === "windows" ? "Mouse óptico / USB HID" : "");
      const printers = peri?.printers?.join(" | ") || (d.os_type === "windows" ? "Sin impresoras" : "");

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
    link.setAttribute("download", `inventario_qhapana_rmm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDevice = async (device: Device) => {
    try {
      await deleteDevice(device.id);
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
      setSelectedDevice(null);
    } catch (err: any) {
      alert(`Error al retirar el equipo: ${err.message}`);
    }
  };

  return (
    <div className="q-inventory-view">
      {/* Header */}
      <div className="q-inventory-header">
        <div className="q-inventory-title-group">
          <h2>
            <Server size={22} color="var(--color-brand-primary)" />
            Inventario General de Activos
          </h2>
          <p>Supervisión detallada de especificaciones de hardware, almacenamiento, licencias y red.</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="q-export-btn" onClick={handleExportCSV}>
            <Download size={15} />
            Exportar CSV
          </button>
          <Button
            variant="primary"
            onClick={() => setEnrollModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
          >
            <Plus size={15} />
            Vincular Dispositivo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="q-inventory-stats-grid">
        <div className="q-inventory-stat-card">
          <div className="q-inventory-stat-icon" style={{ color: "var(--color-brand-primary)" }}>
            <Laptop size={22} />
          </div>
          <div className="q-inventory-stat-info">
            <span className="q-inventory-stat-value">{stats.totalDevices}</span>
            <span className="q-inventory-stat-label">Equipos Registrados</span>
          </div>
        </div>

        <div className="q-inventory-stat-card">
          <div className="q-inventory-stat-icon" style={{ color: "#38bdf8" }}>
            <Cpu size={22} />
          </div>
          <div className="q-inventory-stat-info">
            <span className="q-inventory-stat-value">{stats.totalRamGb} GB</span>
            <span className="q-inventory-stat-label">RAM Total en Flota</span>
          </div>
        </div>

        <div className="q-inventory-stat-card">
          <div className="q-inventory-stat-icon" style={{ color: "#a855f7" }}>
            <HardDrive size={22} />
          </div>
          <div className="q-inventory-stat-info">
            <span className="q-inventory-stat-value">{stats.totalDiskGb} GB</span>
            <span className="q-inventory-stat-label">Almacenamiento Total</span>
          </div>
        </div>

        <div className="q-inventory-stat-card">
          <div className="q-inventory-stat-icon" style={{ color: "#22c55e" }}>
            <Server size={22} />
          </div>
          <div className="q-inventory-stat-info">
            <span className="q-inventory-stat-value">{stats.windowsCount} Win / {stats.linuxCount} Lin</span>
            <span className="q-inventory-stat-label">Sistemas Operativos</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="q-inventory-toolbar">
        <div className="q-inventory-search-wrap">
          <Search size={16} color="var(--color-text-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por hostname, código, IP, procesador o sistema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Sistema:</span>
          <select
            value={osFilter}
            onChange={(e) => setOsFilter(e.target.value)}
            style={{
              background: "var(--color-surface-muted)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
              fontSize: 13,
            }}
          >
            <option value="all">Todos los Sistemas</option>
            <option value="windows">Windows</option>
            <option value="linux">Linux</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Filtrar Área:</span>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={{
              background: "var(--color-surface-muted)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
              fontSize: 13,
            }}
          >
            <option value="all">Todas las Áreas</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="q-inventory-table-container">
        <table className="q-inventory-table">
          <thead>
            <tr>
              <th>Equipo / Código</th>
              <th>Área / Cliente</th>
              <th>Estado</th>
              <th>Procesador (CPU)</th>
              <th>Memoria RAM</th>
              <th>Almacenamiento</th>
              <th>Sistema Operativo</th>
              <th>Dirección IP</th>
              <th>Agente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 32, color: "var(--color-text-tertiary)" }}>
                  Cargando inventario de activos...
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 32, color: "var(--color-text-tertiary)" }}>
                  No se encontraron activos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredDevices.map((d) => {
                const isOnline = d.status?.current_state === "ONLINE";
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="q-asset-hostname">{d.hostname}</div>
                      <div className="q-asset-meta">{d.device_code}</div>
                    </td>
                    <td>
                      <div className="q-table-area-wrap" onClick={(e) => e.stopPropagation()}>
                        {editingAreaDeviceId === d.id ? (
                          <select
                            className="q-table-area-select"
                            value={d.client_area || "General"}
                            onChange={(e) => handleChangeArea(d, e.target.value)}
                            onBlur={() => setEditingAreaDeviceId(null)}
                            autoFocus
                            disabled={updatingAreaId === d.id}
                          >
                            {availableAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            className="q-table-area-badge"
                            onClick={() => setEditingAreaDeviceId(d.id)}
                            title="Haz clic para reasignar área"
                          >
                            <Tag size={11} />
                            <span>{d.client_area || "Sin Asignar"}</span>
                            <Edit2 size={10} className="q-table-area-edit-icon" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={isOnline ? "success" : "danger"} pulse={isOnline}>
                        {d.status?.current_state || "OFFLINE"}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.specs?.cpu_model || "Genérico"}</div>
                      <div className="q-asset-meta">{d.specs?.cpu_cores ? `${d.specs.cpu_cores} núcleos` : ""}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.specs?.ram_total_gb ? `${d.specs.ram_total_gb} GB` : "N/A"}</div>
                      <div className="q-asset-meta">
                        {d.specs?.ram_usable_gb ? `${d.specs.ram_usable_gb} GB utilizable` : ""} {d.specs?.ram_type ? `(${d.specs.ram_type})` : ""}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.specs?.disk_total_gb ? `${d.specs.disk_total_gb} GB` : "N/A"}</div>
                      <div className="q-asset-meta">
                        {d.specs?.disk_free_gb ? `${d.specs.disk_free_gb} GB libres` : ""}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.os_version || d.os_type}</div>
                      <div className="q-asset-meta">{d.architecture}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 12 }}>{d.private_ip || "N/A"}</div>
                      {d.public_ip && <div className="q-asset-meta">Ext: {d.public_ip}</div>}
                    </td>
                    <td>
                      <span className="q-asset-meta">{d.agent_version || "1.0.0"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => setSelectedDevice(d)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--color-border-default)",
                            color: "var(--color-brand-primary)",
                            borderRadius: "var(--radius-sm)",
                            padding: "5px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 500,
                          }}
                          title="Ver Ficha Técnica"
                        >
                          <ExternalLink size={12} /> Detalle
                        </button>
                        <button
                          onClick={() => {
                            setDeviceToRetire(d);
                            setRetireModalOpen(true);
                          }}
                          style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            color: "#ef4444",
                            borderRadius: "var(--radius-sm)",
                            padding: "5px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 600,
                            transition: "all var(--motion-fast)",
                          }}
                          title="Retirar o desvincular este equipo"
                        >
                          <Trash2 size={12} /> Retirar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Reutilizado para Ver o Accionar sobre el Equipo */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onDelete={handleDeleteDevice}
        />
      )}

      {/* Modal de Vinculación */}
      <EnrollDeviceModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onDeviceEnrolled={() => {
          fetchDevices();
        }}
      />

      {/* Modal de Retiro / Desvinculación de Equipo */}
      {retireModalOpen && (
        <div
          className="q-checkout-modal-overlay"
          onClick={() => !isRetiring && setRetireModalOpen(false)}
        >
          <div
            className="q-checkout-modal"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="q-modal-close"
              onClick={() => !isRetiring && setRetireModalOpen(false)}
              disabled={isRetiring}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Retirar Equipo de la Flota
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Confirmación de baja o desvinculación de activo
                </p>
              </div>
            </div>

            <div className="q-form-group" style={{ marginBottom: 16 }}>
              <label className="q-form-label">Seleccionar Equipo a Retirar:</label>
              <select
                className="q-filter-select"
                style={{ width: "100%" }}
                value={deviceToRetire ? deviceToRetire.id : (devices[0]?.id || "")}
                onChange={(e) => {
                  const found = devices.find((d) => d.id === e.target.value);
                  setDeviceToRetire(found || null);
                }}
                disabled={isRetiring}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.hostname} — {d.device_code} ({d.client_area || "Sede General"})
                  </option>
                ))}
              </select>
            </div>

            {deviceToRetire && (
              <div
                style={{
                  background: "var(--color-surface-hover)",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  border: "1px solid var(--color-border-default)",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Hostname:</span>
                  <strong style={{ color: "var(--color-text-primary)" }}>{deviceToRetire.hostname}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Código Activo:</span>
                  <code style={{ color: "var(--color-brand-primary)" }}>{deviceToRetire.device_code}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>IP:</span>
                  <span>{deviceToRetire.private_ip || deviceToRetire.public_ip || "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Área / Sede:</span>
                  <span>{deviceToRetire.client_area || "Sede General"}</span>
                </div>
              </div>
            )}

            <div
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 12,
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              ⚠️ <strong>Advertencia:</strong> Esta acción revocará de inmediato el token del agente del equipo y lo eliminará del inventario, mapa NOC y paneles de supervisión.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button
                variant="ghost"
                disabled={isRetiring}
                onClick={() => {
                  setRetireModalOpen(false);
                  setDeviceToRetire(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={isRetiring}
                onClick={async () => {
                  const target = deviceToRetire || devices[0];
                  if (!target) return;
                  setIsRetiring(true);
                  await handleDeleteDevice(target);
                  setIsRetiring(false);
                  setRetireModalOpen(false);
                  setDeviceToRetire(null);
                }}
              >
                Confirmar y Retirar Equipo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
