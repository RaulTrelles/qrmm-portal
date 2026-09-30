import React from "react";
import type { Device } from "../../types/device";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Monitor, Server, ChevronRight } from "lucide-react";
import "./DeviceCard.css";
export interface DeviceCardProps { device: Device; onSelect: (device: Device) => void; }
export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onSelect }) => {
  const isOnline = device.status.current_state === "ONLINE";
  const isUnstable = device.status.current_state === "UNSTABLE";
  const badgeVariant = isOnline ? "success" : isUnstable ? "warning" : "danger";
  const OsIcon = device.os_type.toLowerCase().includes("win") ? Monitor : Server;
  return (
    <div className="q-device-card" onClick={() => onSelect(device)}>
      <div className="q-device-card-header">
        <div>
          <div className="q-device-card-title">
            <OsIcon size={18} color="var(--color-brand-primary)" />
            {device.hostname}
          </div>
          <div className="q-device-card-code">{device.device_code}</div>
        </div>
        <Badge variant={badgeVariant} pulse={isOnline}>{device.status.current_state}</Badge>
      </div>
      <div className="q-device-card-body">
        <div className="q-device-card-item"><span className="q-device-card-label">IP Privada</span><span className="q-device-card-val">{device.private_ip}</span></div>
        <div className="q-device-card-item"><span className="q-device-card-label">SO</span><span className="q-device-card-val">{device.os_type}</span></div>
        <div className="q-device-card-item"><span className="q-device-card-label">Disponibilidad</span><span className="q-device-card-val">{device.status.availability_percentage_24h}%</span></div>
        <div className="q-device-card-item"><span className="q-device-card-label">Último Visto</span><span className="q-device-card-val">{device.status.last_seen ? new Date(device.status.last_seen).toLocaleTimeString() : "N/A"}</span></div>
      </div>
      <div className="q-device-card-footer"><Button variant="ghost" icon={<ChevronRight size={16} />}>Telemetría</Button></div>
    </div>
  );
};
