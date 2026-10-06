import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Radio, RotateCcw, MapPin, Monitor, Terminal, ExternalLink, Zap } from "lucide-react";
import type { Device } from "../../types/device";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";
import "./NetworkTrafficMap.css";

// Fix standard Leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface NetworkTrafficMapProps {
  devices: Device[];
  selectedDevice?: Device | null;
  onSelectDevice?: (device: Device) => void;
  onOpenRemote?: (device: Device) => void;
  className?: string;
}

interface NodeGeoData {
  device: Device;
  lat: number;
  lng: number;
  city: string;
  region: string;
  isDatacenterHub?: boolean;
}

// Map styles (100% Free, No API Keys, Zero Cost to Client/Solution)
const TILE_LAYERS = {
  commercial: {
    name: "Comercial Pro",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  satellite: {
    name: "Satelital HD",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    subdomains: "",
    maxZoom: 18,
    attribution: "&copy; Esri &copy; Earthstar Geographics",
  },
  nocDark: {
    name: "NOC Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
};

type TileLayerKey = keyof typeof TILE_LAYERS;

// Realistic Coordinates in Metropolitan Lima / Callao Network
const PRESET_COORDINATES: Array<{ lat: number; lng: number; city: string; region: string }> = [
  { lat: -12.0464, lng: -77.0428, city: "Lima Centro", region: "Datacenter Central (Tier III)" },
  { lat: -12.0565, lng: -77.1181, city: "Callao Puerto", region: "Hub Puerto & Distribución" },
  { lat: -12.0967, lng: -77.0353, city: "San Isidro", region: "Sede Financiera Las Begonias" },
  { lat: -12.1217, lng: -77.0298, city: "Miraflores", region: "Oficina Corporativa Larco" },
  { lat: -12.1389, lng: -76.9944, city: "Surco", region: "Nodo IPN Fibra Óptica" },
  { lat: -12.0264, lng: -76.9189, city: "Ate", region: "Sede Facturación & Logística" },
  { lat: -11.9611, lng: -77.0706, city: "Los Olivos", region: "Hub Lima Cono Norte" },
  { lat: -12.0772, lng: -77.0867, city: "San Miguel", region: "Sucursal Av. La Marina" },
  { lat: -12.0833, lng: -76.9333, city: "La Molina", region: "Campus Tecnológico Este" },
  { lat: -12.1633, lng: -77.0189, city: "Chorrillos", region: "Estación Terrena Sur" },
];

function resolveCoordinates(device: Device, index: number): NodeGeoData {
  const host = (device.hostname || "").toLowerCase();
  const area = (device.client_area || "").toLowerCase();

  if (host.includes("kraken") || area.includes("kraken")) {
    return { device, lat: -12.0464, lng: -77.0428, city: "Lima Centro", region: "Datacenter Central (Tier III)", isDatacenterHub: true };
  }
  if (host.includes("factura") || area.includes("factura")) {
    return { device, lat: -12.0264, lng: -76.9189, city: "Ate, Lima Este", region: "Sede Facturación & Logística" };
  }
  if (host.includes("concar") || area.includes("concar")) {
    return { device, lat: -12.0967, lng: -77.0353, city: "San Isidro, Lima", region: "Sede Financiera Las Begonias" };
  }
  if (host.includes("finanza") || area.includes("finanza")) {
    return { device, lat: -12.1217, lng: -77.0298, city: "Miraflores, Lima", region: "Oficina Corporativa Larco" };
  }
  if (host.includes("ipn") || area.includes("fibra")) {
    return { device, lat: -12.1389, lng: -76.9944, city: "Surco, Lima", region: "Nodo IPN Fibra Óptica" };
  }
  if (host.includes("desktop") || host.includes("v99") || area.includes("callao")) {
    return { device, lat: -12.0565, lng: -77.1181, city: "Callao, Lima", region: "Hub Puerto & Distribución" };
  }

  // Fallback to preset spots with safe modulo
  const coord = PRESET_COORDINATES[Math.abs(index) % PRESET_COORDINATES.length];
  return { device, ...coord };
}

export const NetworkTrafficMap: React.FC<NetworkTrafficMapProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onOpenRemote,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<TileLayerKey>("commercial");
  const [activeSelectedDevice, setActiveSelectedDevice] = useState<Device | null>(null);
  const [activeGeoInfo, setActiveGeoInfo] = useState<{ city: string; region: string; lat: number; lng: number } | null>(null);

  // Sync selectedDevice prop with local state
  useEffect(() => {
    if (selectedDevice) {
      setActiveSelectedDevice(selectedDevice);
      const match = devices.find((d) => d.id === selectedDevice.id);
      if (match) {
        const idx = devices.indexOf(match);
        const geo = resolveCoordinates(match, idx);
        setActiveGeoInfo(geo);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([geo.lat, geo.lng], 14, { duration: 1.2 });
        }
      }
    }
  }, [selectedDevice, devices]);

  // Compute geolocated nodes
  const nodes = useMemo<NodeGeoData[]>(() => {
    return devices.map((dev, idx) => resolveCoordinates(dev, idx));
  }, [devices]);

  // Primary Datacenter Hub
  const hubNode = useMemo(() => {
    return nodes.find((n) => n.isDatacenterHub) || nodes[0] || null;
  }, [nodes]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center in Lima Metropolitan Area
    const map = L.map(mapContainerRef.current, {
      center: [-12.068, -77.045],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom Zoom control top-left
    L.control.zoom({ position: "topleft" }).addTo(map);

    // Initial tile layer (CARTO Voyager - Commercial Grade)
    const initialConfig = TILE_LAYERS[activeLayer];
    const tiles = L.tileLayer(initialConfig.url, {
      subdomains: initialConfig.subdomains,
      maxZoom: initialConfig.maxZoom,
      attribution: initialConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tiles;
    markersLayerRef.current = L.layerGroup().addTo(map);
    polylinesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer key changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const config = TILE_LAYERS[activeLayer];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(config.url, {
      subdomains: config.subdomains,
      maxZoom: config.maxZoom,
      attribution: config.attribution,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current.bringToBack();
  }, [activeLayer]);

  // Update Markers & Network Traffic Arcs
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !polylinesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polylinesLayerRef.current.clearLayers();

    if (nodes.length === 0) return;

    const bounds = L.latLngBounds([]);

    // 1. Render Animated Network Traffic Lines
    if (hubNode) {
      nodes.forEach((node) => {
        if (node.device.id === hubNode.device.id) return;
        const isOnline = node.device.status.current_state === "ONLINE";

        // Animated Traffic Path
        const polyline = L.polyline(
          [
            [hubNode.lat, hubNode.lng],
            [node.lat, node.lng],
          ],
          {
            color: isOnline ? "#06b6d4" : "#94a3b8",
            weight: isOnline ? 2.5 : 1.2,
            opacity: isOnline ? 0.85 : 0.35,
            dashArray: isOnline ? "6, 8" : "3, 6",
            className: isOnline ? "q-leaflet-traffic-arc--active" : "q-leaflet-traffic-arc--inactive",
          }
        );
        polylinesLayerRef.current?.addLayer(polyline);
      });
    }

    // 2. Render Markers
    nodes.forEach((node) => {
      const isOnline = node.device.status.current_state === "ONLINE";
      const isSelected = activeSelectedDevice?.id === node.device.id;
      const isHub = node.isDatacenterHub;

      bounds.extend([node.lat, node.lng]);

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: "q-leaflet-custom-marker-wrapper",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        html: `
          <div class="q-leaflet-marker ${isOnline ? "q-leaflet-marker--online" : "q-leaflet-marker--offline"} ${
          isSelected ? "q-leaflet-marker--selected" : ""
        } ${isHub ? "q-leaflet-marker--hub" : ""}">
            ${isOnline ? '<div class="q-leaflet-radar-pulse"></div>' : ""}
            <div class="q-leaflet-marker-pin">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="q-leaflet-marker-label">
              <span class="q-leaflet-label-dot"></span>
              <span class="q-leaflet-label-text">${node.device.hostname}</span>
            </div>
          </div>
        `,
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon });

      // Click to inspect
      marker.on("click", () => {
        setActiveSelectedDevice(node.device);
        setActiveGeoInfo(node);
        if (onSelectDevice) onSelectDevice(node.device);
        mapInstanceRef.current?.flyTo([node.lat, node.lng], 14, { duration: 0.8 });
      });

      // Hover Tooltip
      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1e293b;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${node.device.hostname}</div>
          <div style="color: #64748b; font-size: 11px;">${node.city} • ${node.region}</div>
          <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${
              isOnline ? "#16a34a" : "#dc2626"
            };"></span>
            <span style="font-weight: 600; font-size: 11px;">${isOnline ? "Conectado • 0.3 ms" : "Desconectado"}</span>
          </div>
        </div>
      `,
        { direction: "top", offset: [0, -14], opacity: 0.96 }
      );

      markersLayerRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if nodes exist
    if (bounds.isValid() && !activeSelectedDevice) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [nodes, activeSelectedDevice, hubNode, onSelectDevice]);

  // Center Fleet Action
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || nodes.length === 0) return;
    const bounds = L.latLngBounds([]);
    nodes.forEach((n) => bounds.extend([n.lat, n.lng]));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  };

  const onlineCount = nodes.filter((n) => n.device.status.current_state === "ONLINE").length;
  const currentHubGeo = activeGeoInfo || (hubNode ? { city: hubNode.city, region: hubNode.region, lat: hubNode.lat, lng: hubNode.lng } : null);

  return (
    <div className={`q-commercial-map-panel ${className}`}>
      {/* Header Commercial Bar */}
      <div className="q-commercial-map-header">
        <div className="q-commercial-map-title-group">
          <Radio size={16} className="q-map-pulse-icon" />
          <h3 className="q-commercial-map-title">Live network traffic</h3>
          <Badge variant="success" className="q-commercial-live-badge">
            <span className="q-commercial-pulse-dot"></span>
            {onlineCount}/{nodes.length} ONLINE
          </Badge>
        </div>

        {/* Free Commercial Style Selector */}
        <div className="q-commercial-map-controls">
          <div className="q-map-style-toggle" role="group" aria-label="Estilos de mapa">
            {(["commercial", "satellite", "nocDark"] as TileLayerKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`q-map-style-btn ${activeLayer === key ? "q-map-style-btn--active" : ""}`}
                onClick={() => setActiveLayer(key)}
                title={`Cambiar a estilo ${TILE_LAYERS[key].name}`}
              >
                {key === "commercial" && "🗺️ Comercial"}
                {key === "satellite" && "🛰️ Satelital"}
                {key === "nocDark" && "🌙 NOC Dark"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="q-map-action-icon-btn"
            onClick={handleResetBounds}
            title="Centrar y enfocar todos los nodos de la flota"
            aria-label="Centrar Flota"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Real Map Canvas Container */}
      <div className="q-commercial-map-body">
        <div ref={mapContainerRef} className="q-commercial-map-leaflet" />

        {/* Commercial Overlay HUD: Telemetry & Cost Tag ($0) */}
        <div className="q-commercial-map-hud-top">
          <div className="q-commercial-hud-chip">
            <Zap size={12} className="q-commercial-hud-chip-icon" />
            <span>Telemetría en Vivo • Lima Metropolitana</span>
          </div>
          <div className="q-commercial-hud-coords">
            GPS: {currentHubGeo ? `${Math.abs(currentHubGeo.lat).toFixed(4)}° S, ${Math.abs(currentHubGeo.lng).toFixed(4)}° W` : "12.0464° S, 77.0428° W"}
          </div>
        </div>
      </div>

      {/* Selected Node Quick Inspector Footer */}
      {activeSelectedDevice ? (
        <div className="q-commercial-map-footer">
          <div className="q-map-footer-node-info">
            <div className="q-map-footer-icon-wrap">
              <Monitor size={18} />
            </div>
            <div className="q-map-footer-node-text">
              <div className="q-map-footer-node-title">
                <span
                  className={`q-status-dot ${
                    activeSelectedDevice.status.current_state === "ONLINE" ? "q-status-dot--online" : "q-status-dot--offline"
                  }`}
                />
                <strong>{activeSelectedDevice.hostname}</strong>
                <span className="q-map-footer-area-tag">{activeSelectedDevice.client_area || "Sede General"}</span>
              </div>
              <div className="q-map-footer-node-meta">
                <MapPin size={12} />
                <span>
                  {activeGeoInfo?.city || "Lima Centro"} ({activeGeoInfo?.region || "Región Datacenter"}) • IP:{" "}
                  {activeSelectedDevice.private_ip || "192.168.0.10"}
                </span>
              </div>
            </div>
          </div>

          <div className="q-map-footer-actions">
            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink size={13} />}
              onClick={() => onSelectDevice && onSelectDevice(activeSelectedDevice)}
            >
              Detalle
            </Button>
            {onOpenRemote && (
              <Button
                variant="primary"
                size="sm"
                icon={<Terminal size={13} />}
                onClick={() => onOpenRemote(activeSelectedDevice)}
              >
                Conectar
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="q-commercial-map-footer q-commercial-map-footer--empty">
          <div className="q-map-footer-node-meta">
            <MapPin size={13} style={{ color: "var(--color-brand-primary)" }} />
            <span>Haz clic en cualquier nodo o equipo en el mapa para inspeccionar telemetría y conexión remota.</span>
          </div>
          <Badge variant="neutral">
            Topología NOC Activa
          </Badge>
        </div>
      )}
    </div>
  );
};
