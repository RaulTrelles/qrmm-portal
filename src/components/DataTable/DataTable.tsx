import React, { useState, useMemo, useEffect } from "react";
import type { Device } from "../../types/device";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Monitor, Server, ExternalLink, Activity, Trash2, Tag, Edit2 } from "lucide-react";
import { getClientAreas, updateDeviceArea } from "../../services/api";
import "./DataTable.css";

export interface DataTableProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onDeleteDevice?: (device: Device) => void;
  onUpdateDeviceArea?: (device: Device, newArea: string) => void;
  areas?: string[];
}

type DeviceSortField = "hostname" | "area" | "status" | "os" | "ip" | "availability" | "last_seen";

export const DataTable: React.FC<DataTableProps> = ({
  devices,
  onSelectDevice,
  onDeleteDevice,
  onUpdateDeviceArea,
  areas,
}) => {
  const [sortField, setSortField] = useState<DeviceSortField>("hostname");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [availableAreas, setAvailableAreas] = useState<string[]>(areas || ["General"]);
  const [editingAreaDeviceId, setEditingAreaDeviceId] = useState<string | null>(null);
  const [updatingAreaId, setUpdatingAreaId] = useState<string | null>(null);

  useEffect(() => {
    if (areas && areas.length > 0) {
      setAvailableAreas(areas);
    } else {
      getClientAreas()
        .then((fetched) => {
          if (fetched && fetched.length > 0) setAvailableAreas(fetched);
        })
        .catch(() => {});
    }
  }, [areas]);

  const handleChangeArea = async (dev: Device, newArea: string) => {
    if (dev.client_area === newArea) {
      setEditingAreaDeviceId(null);
      return;
    }
    try {
      setUpdatingAreaId(dev.id);
      dev.client_area = newArea;
      await updateDeviceArea(dev.id, newArea);
      if (onUpdateDeviceArea) {
        onUpdateDeviceArea(dev, newArea);
      }
    } catch (err) {
      console.error("Error al actualizar área del equipo:", err);
    } finally {
      setUpdatingAreaId(null);
      setEditingAreaDeviceId(null);
    }
  };

  const handleSort = (field: DeviceSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "availability" || field === "last_seen" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (field: DeviceSortField) => {
    if (sortField !== field) {
      return <span className="q-sort-indicator" style={{ opacity: 0.35 }}>↕</span>;
    }
    return (
      <span className="q-sort-indicator" style={{ color: "var(--color-brand-primary)", fontWeight: "bold" }}>
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const sortedDevices = useMemo(() => {
    const list = [...devices];
    list.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortField) {
        case "hostname":
          valA = a.hostname.toLowerCase();
          valB = b.hostname.toLowerCase();
          break;
        case "area":
          valA = (a.client_area || "General").toLowerCase();
          valB = (b.client_area || "General").toLowerCase();
          break;
        case "status":
          valA = a.status.current_state;
          valB = b.status.current_state;
          break;
        case "os":
          valA = (a.os_version || a.os_type).toLowerCase();
          valB = (b.os_version || b.os_type).toLowerCase();
          break;
        case "ip":
          valA = a.private_ip || "";
          valB = b.private_ip || "";
          break;
        case "availability":
          valA = a.status.availability_percentage_24h ?? 0;
          valB = b.status.availability_percentage_24h ?? 0;
          break;
        case "last_seen":
          valA = a.status.last_seen ? new Date(a.status.last_seen).getTime() : 0;
          valB = b.status.last_seen ? new Date(b.status.last_seen).getTime() : 0;
          break;
      }

      if (typeof valA === "string") {
        const cmp = valA.localeCompare(String(valB));
        return sortOrder === "asc" ? cmp : -cmp;
      }
      return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return list;
  }, [devices, sortField, sortOrder]);

  if (devices.length === 0) {
    return (
      <div className="q-table-container">
        <div className="q-table-empty">
          <Activity size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p>No se encontraron equipos bajo los filtros seleccionados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="q-table-container">
      <table className="q-table">
        <thead>
          <tr>
            <th className="q-sortable-th" onClick={() => handleSort("hostname")} title="Ordenar por Nombre de Equipo">
              <div className="q-th-inner">
                <span>Equipo</span>
                {renderSortIndicator("hostname")}
              </div>
            </th>
            <th className="q-sortable-th" onClick={() => handleSort("area")} title="Ordenar por Área o Cliente">
              <div className="q-th-inner">
                <span>Área / Cliente</span>
                {renderSortIndicator("area")}
              </div>
            </th>
            <th className="q-sortable-th" onClick={() => handleSort("status")} title="Ordenar por Estado">
              <div className="q-th-inner">
                <span>Estado</span>
                {renderSortIndicator("status")}
              </div>
            </th>
            <th className="q-sortable-th" onClick={() => handleSort("os")} title="Ordenar por Sistema Operativo">
              <div className="q-th-inner">
                <span>SO / Arquitectura</span>
                {renderSortIndicator("os")}
              </div>
            </th>
            <th className="q-sortable-th" onClick={() => handleSort("ip")} title="Ordenar por Dirección IP">
              <div className="q-th-inner">
                <span>IP Privada / Pública</span>
                {renderSortIndicator("ip")}
              </div>
            </th>
            <th className="q-sortable-th" onClick={() => handleSort("availability")} title="Ordenar por Disponibilidad">
              <div className="q-th-inner">
                <span>Disponibilidad 24h</span>
                {renderSortIndicator("availability")}
              </div>
            </th>
            <th className="q-sortable-th" onClick={() => handleSort("last_seen")} title="Ordenar por Última Conexión">
              <div className="q-th-inner">
                <span>Última Conexión</span>
                {renderSortIndicator("last_seen")}
              </div>
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedDevices.map((dev) => {
            const isOnline = dev.status.current_state === "ONLINE";
            const isUnstable = dev.status.current_state === "UNSTABLE";
            const badgeVariant = isOnline ? "success" : isUnstable ? "warning" : "danger";
            const OsIcon = dev.os_type.toLowerCase().includes("win") ? Monitor : Server;
            return (
              <tr key={dev.id}>
                <td>
                  <div className="q-table-hostname">
                    <OsIcon size={20} color="var(--color-brand-primary)" />
                    <div>
                      <div>{dev.hostname}</div>
                      <div className="q-table-subtext">{dev.device_code}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="q-table-area-wrap" onClick={(e) => e.stopPropagation()}>
                    {editingAreaDeviceId === dev.id ? (
                      <select
                        className="q-table-area-select"
                        value={dev.client_area || "General"}
                        onChange={(e) => handleChangeArea(dev, e.target.value)}
                        onBlur={() => setEditingAreaDeviceId(null)}
                        autoFocus
                        disabled={updatingAreaId === dev.id}
                      >
                        {availableAreas.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        className="q-table-area-badge"
                        onClick={() => setEditingAreaDeviceId(dev.id)}
                        title="Haz clic para cambiar el Área o Cliente"
                      >
                        <Tag size={12} style={{ opacity: 0.7 }} />
                        <span>{dev.client_area || "General"}</span>
                        <Edit2 size={11} className="q-table-area-edit-icon" />
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <Badge variant={badgeVariant} pulse={isOnline}>
                    {dev.status.current_state}
                  </Badge>
                </td>
                <td>
                  <div>{dev.os_version || dev.os_type}</div>
                  <div className="q-table-subtext">{dev.architecture}</div>
                </td>
                <td>
                  <div>{dev.private_ip}</div>
                  <div className="q-table-subtext">{dev.public_ip}</div>
                </td>
                <td><strong>{dev.status.availability_percentage_24h}%</strong></td>
                <td>
                  <div style={{ fontSize: 13 }}>{dev.status.last_seen ? new Date(dev.status.last_seen).toLocaleTimeString() : "N/A"}</div>
                  <div className="q-table-subtext">{dev.status.last_seen ? new Date(dev.status.last_seen).toLocaleDateString() : ""}</div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <Button variant="ghost" icon={<ExternalLink size={16} />} onClick={() => onSelectDevice(dev)}>Detalle</Button>
                    {onDeleteDevice && (
                      <Button
                        variant="ghost-danger"
                        icon={<Trash2 size={16} />}
                        title="Eliminar dispositivo"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de que deseas retirar y eliminar permanentemente el equipo "${dev.hostname}" (${dev.device_code})?`)) {
                            onDeleteDevice(dev);
                          }
                        }}
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
