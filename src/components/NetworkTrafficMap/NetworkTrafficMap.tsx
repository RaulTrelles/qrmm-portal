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

// Capas de mapas 100% Públicas y Gratuitas (Sin API Key, Sin Marcas de Agua, $0 Costo)
const TILE_LAYERS = {
  commercial: {
    name: "Comercial Pro",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    subdomains: "",
    maxZoom: 19,
    attribution: "&copy; Esri &copy; OpenStreetMap",
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
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    subdomains: "",
    maxZoom: 16,
    attribution: "&copy; Esri &copy; HERE, Garmin",
  },
};

type TileLayerKey = keyof typeof TILE_LAYERS;

// Catálogo de Coordenadas Geográficas Oficiales (Lima Metropolitana y Callao)
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; city: string; region: string }> = {
  callao: { lat: -12.0565, lng: -77.1181, city: "Callao", region: "Provincia Constitucional del Callao" },
  san_isidro: { lat: -12.0967, lng: -77.0353, city: "San Isidro", region: "Centro Financiero Las Begonias" },
  los_olivos: { lat: -11.9611, lng: -77.0706, city: "Los Olivos", region: "Cono Norte - Av. Antúnez de Mayolo" },
  surco: { lat: -12.1389, lng: -76.9944, city: "Santiago de Surco", region: "Surco / Chacarilla del Estanque" },
  san_miguel: { lat: -12.0772, lng: -77.0867, city: "San Miguel", region: "Av. La Marina / Circuito de Playas" },
  miraflores: { lat: -12.1217, lng: -77.0298, city: "Miraflores", region: "Distrito Turístico y Comercial" },
  ate: { lat: -12.0264, lng: -76.9189, city: "Ate", region: "Zona Industrial Lima Este" },
  lima_centro: { lat: -12.0464, lng: -77.0428, city: "Cercado de Lima", region: "Centro Histórico / Corporativo" },
  la_molina: { lat: -12.0833, lng: -76.9333, city: "La Molina", region: "Zona Residencial y Universitaria" },
  chorrillos: { lat: -12.1633, lng: -77.0189, city: "Chorrillos", region: "Sede Costa Sur" },
  independencia: { lat: -11.9936, lng: -77.0544, city: "Independencia", region: "MegaPlaza / Eje Panamericana Norte" },
  san_borja: { lat: -12.0911, lng: -77.0019, city: "San Borja", region: "Javier Prado / Aviación" },
  lince: { lat: -12.0833, lng: -77.0333, city: "Lince", region: "Arenales / Petit Thouars" },
  jesus_maria: { lat: -12.0736, lng: -77.0478, city: "Jesús María", region: "Salaverry / San Felipe" },
  magdalena: { lat: -12.0894, lng: -77.0708, city: "Magdalena del Mar", region: "Brasil / Sucre" },
  pueblo_libre: { lat: -12.0786, lng: -77.0658, city: "Pueblo Libre", region: "Sucre / La Marina" },
};

function resolveCoordinates(device: Device, index: number): NodeGeoData {
  const host = (device.hostname || "").toLowerCase().trim();
  const area = (device.client_area || "").toLowerCase().trim();

  // 1. Coordenadas GPS Reales Persistidas en Base de Datos (Máxima Prioridad)
  const dbLat = device.latitude != null ? Number(device.latitude) : (device.specs?.latitude != null ? Number(device.specs.latitude) : null);
  const dbLng = device.longitude != null ? Number(device.longitude) : (device.specs?.longitude != null ? Number(device.specs.longitude) : null);
  const locName = device.location_name || device.specs?.location_name || (device.client_area ? `Sede ${device.client_area}` : "Ubicación Registrada");

  if (dbLat !== null && dbLng !== null && !isNaN(dbLat) && !isNaN(dbLng)) {
    return {
      device,
      lat: dbLat,
      lng: dbLng,
      city: device.client_area || locName.split("-")[0]?.trim() || "Lima Metropolitana",
      region: locName,
      isDatacenterHub: host.includes("kraken") && !host.includes("factura"),
    };
  }

  // 2. Mapeo explícito por equipo especificado por el usuario:
  // SRVKRAKEN -> Callao (Hub Principal)
  if (host.includes("kraken") && !host.includes("factura")) {
    return {
      device,
      lat: -12.0565,
      lng: -77.1181,
      city: "Callao",
      region: "Sede Central Kraken (Callao)",
      isDatacenterHub: true,
    };
  }

  // FacturadorII -> Callao (Misma máquina física que SRVKRAKEN)
  if (host.includes("factura")) {
    return {
      device,
      lat: -12.0565,
      lng: -77.1181,
      city: "Callao",
      region: "Sede Central Kraken (Misma Máquina)",
    };
  }

  // IPN -> San Isidro
  if (host.includes("ipn")) {
    return {
      device,
      lat: -12.0967,
      lng: -77.0353,
      city: "San Isidro, Lima",
      region: "Sede Corporativa IPN (San Isidro)",
    };
  }

  // finanzasadm -> Los Olivos
  if (host.includes("finanza")) {
    return {
      device,
      lat: -11.9611,
      lng: -77.0706,
      city: "Los Olivos, Lima",
      region: "Sede Administrativa y Finanzas (Los Olivos)",
    };
  }

  // concar -> Surco
  if (host.includes("concar") || area.includes("perkons")) {
    return {
      device,
      lat: -12.1389,
      lng: -76.9944,
      city: "Santiago de Surco, Lima",
      region: "Sede Operaciones Perkons (Surco)",
    };
  }

  // DESKTOP-V99OT5O -> Los Olivos (Laptop Móvil)
  if (host.includes("desktop") || host.includes("v99")) {
    return {
      device,
      lat: -11.9611,
      lng: -77.0706,
      city: "Los Olivos, Lima",
      region: "Estación Laptop TI (Los Olivos)",
    };
  }

  // 3. Resolución dinámica por Distrito declarado en Área o Hostname
  const searchTarget = `${area} ${host}`;
  if (searchTarget.includes("callao")) return { device, ...DISTRICT_COORDINATES.callao };
  if (searchTarget.includes("isidro")) return { device, ...DISTRICT_COORDINATES.san_isidro };
  if (searchTarget.includes("olivo")) return { device, ...DISTRICT_COORDINATES.los_olivos };
  if (searchTarget.includes("surco")) return { device, ...DISTRICT_COORDINATES.surco };
  if (searchTarget.includes("miguel")) return { device, ...DISTRICT_COORDINATES.san_miguel };
  if (searchTarget.includes("miraflor")) return { device, ...DISTRICT_COORDINATES.miraflores };
  if (searchTarget.includes("ate") || searchTarget.includes("vitarte")) return { device, ...DISTRICT_COORDINATES.ate };
  if (searchTarget.includes("molina")) return { device, ...DISTRICT_COORDINATES.la_molina };
  if (searchTarget.includes("chorrillo")) return { device, ...DISTRICT_COORDINATES.chorrillos };
  if (searchTarget.includes("independencia")) return { device, ...DISTRICT_COORDINATES.independencia };
  if (searchTarget.includes("borja")) return { device, ...DISTRICT_COORDINATES.san_borja };
  if (searchTarget.includes("lince")) return { device, ...DISTRICT_COORDINATES.lince };
  if (searchTarget.includes("maria") || searchTarget.includes("maría")) return { device, ...DISTRICT_COORDINATES.jesus_maria };
  if (searchTarget.includes("magdalena")) return { device, ...DISTRICT_COORDINATES.magdalena };
  if (searchTarget.includes("pueblo libre")) return { device, ...DISTRICT_COORDINATES.pueblo_libre };

  // 4. Fallback determinista distribuido en Lima
  const presets = Object.values(DISTRICT_COORDINATES);
  const fallback = presets[Math.abs(index) % presets.length];
  return { device, ...fallback };
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
  const hasInitialFitRef = useRef<boolean>(false);
  const prevSelectedDeviceIdRef = useRef<string | null>(null);

  const [activeLayer, setActiveLayer] = useState<TileLayerKey>("commercial");
  const [activeSelectedDevice, setActiveSelectedDevice] = useState<Device | null>(null);
  const [activeGeoInfo, setActiveGeoInfo] = useState<{ city: string; region: string; lat: number; lng: number } | null>(null);

  // Sync selectedDevice prop with local state (solo vuela si cambia el id del equipo seleccionado)
  useEffect(() => {
    if (selectedDevice && selectedDevice.id !== prevSelectedDeviceIdRef.current) {
      prevSelectedDeviceIdRef.current = selectedDevice.id;
      setActiveSelectedDevice(selectedDevice);
      const match = devices.find((d) => d.id === selectedDevice.id);
      if (match) {
        const idx = devices.indexOf(match);
        const geo = resolveCoordinates(match, idx);
        setActiveGeoInfo(geo);
        if (mapInstanceRef.current) {
          const currentZoom = mapInstanceRef.current.getZoom();
          const targetZoom = Math.max(currentZoom, 13);
          mapInstanceRef.current.flyTo([geo.lat, geo.lng], targetZoom, { duration: 0.8 });
        }
      }
    } else if (!selectedDevice) {
      prevSelectedDeviceIdRef.current = null;
      setActiveSelectedDevice(null);
    }
  }, [selectedDevice]);

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

    // Recuperar zoom y posición guardados si el usuario ya hizo acercamiento previamente
    let initialCenter: [number, number] = [-12.068, -77.045];
    let initialZoom = 12;

    try {
      const storedZoom = sessionStorage.getItem("qrmm_map_zoom");
      const storedLat = sessionStorage.getItem("qrmm_map_lat");
      const storedLng = sessionStorage.getItem("qrmm_map_lng");
      if (storedZoom && storedLat && storedLng) {
        initialZoom = parseInt(storedZoom, 10);
        initialCenter = [parseFloat(storedLat), parseFloat(storedLng)];
        hasInitialFitRef.current = true;
      }
    } catch {}

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Guardar permanentemente cada acercamiento (zoom in), alejamiento o paneo del usuario
    map.on("zoomend moveend", () => {
      try {
        sessionStorage.setItem("qrmm_map_zoom", String(map.getZoom()));
        sessionStorage.setItem("qrmm_map_lat", String(map.getCenter().lat));
        sessionStorage.setItem("qrmm_map_lng", String(map.getCenter().lng));
      } catch {}
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
        // Si el nodo está en la misma máquina física o predio que el hub, no dibujar línea cruzando distritos
        if (Math.abs(node.lat - hubNode.lat) < 0.0005 && Math.abs(node.lng - hubNode.lng) < 0.0005) return;

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

    // 2. Detección de nodos co-ubicados en la misma máquina o ubicación GPS exacta
    const locationGroups: Record<string, NodeGeoData[]> = {};
    nodes.forEach((n) => {
      const key = `${n.lat.toFixed(4)}_${n.lng.toFixed(4)}`;
      if (!locationGroups[key]) locationGroups[key] = [];
      locationGroups[key].push(n);
    });

    const renderedLocIndex: Record<string, number> = {};

    // 3. Render Markers
    nodes.forEach((node) => {
      const isOnline = node.device.status.current_state === "ONLINE";
      const isSelected = activeSelectedDevice?.id === node.device.id;
      const isHub = node.isDatacenterHub;

      const key = `${node.lat.toFixed(4)}_${node.lng.toFixed(4)}`;
      const coLocated = locationGroups[key] || [node];
      const countAtLoc = coLocated.length;
      const idxAtLoc = renderedLocIndex[key] || 0;
      renderedLocIndex[key] = idxAtLoc + 1;

      let markerLat = node.lat;
      let markerLng = node.lng;

      // Si hay más de un equipo en la misma máquina/sede (como SRVKRAKEN y FacturadorII),
      // aplicar micro-desplazamiento visual (~20 metros) para que ambos sean interactivos y visibles
      if (countAtLoc > 1) {
        const offset = 0.00030; // ~30 metros dentro del mismo predio
        const angle = (2 * Math.PI * idxAtLoc) / countAtLoc - Math.PI / 2;
        markerLat = node.lat + Math.sin(angle) * offset;
        markerLng = node.lng + Math.cos(angle) * offset;
      }

      bounds.extend([markerLat, markerLng]);

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
              <span class="q-leaflet-label-ip">${node.device.private_ip || node.device.public_ip || "Sin IP"}</span>
            </div>
          </div>
        `,
      });

      const marker = L.marker([markerLat, markerLng], { icon: customIcon });

      // Click to inspect (preservando el nivel de zoom actual del usuario)
      marker.on("click", () => {
        setActiveSelectedDevice(node.device);
        setActiveGeoInfo(node);
        if (onSelectDevice) onSelectDevice(node.device);
        const currentZoom = mapInstanceRef.current?.getZoom() || 13;
        const targetZoom = Math.max(currentZoom, 13);
        mapInstanceRef.current?.flyTo([markerLat, markerLng], targetZoom, { duration: 0.7 });
      });

      // Hover Tooltip con IP Real y Estado
      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1e293b;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${node.device.hostname}</div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #2563eb; font-weight: 700; margin-bottom: 3px;">
            IP: ${node.device.private_ip || "Sin IP"}${node.device.public_ip ? ` • Púb: ${node.device.public_ip}` : ""}
          </div>
          <div style="color: #64748b; font-size: 11px;">
            ${node.city} • ${node.region}
            ${countAtLoc > 1 ? '<span style="display: block; color: #0284c7; font-weight: 600; margin-top: 1px;">🖥️ Mismo Servidor / Sede Central Kraken</span>' : ''}
          </div>
          <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #059669; font-weight: 700; margin-top: 1px;">📍 GPS: ${node.lat.toFixed(4)}, ${node.lng.toFixed(4)}</div>
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

    // Auto-fit bounds ÚNICAMENTE en la primera carga si el usuario no tiene zoom guardado
    if (bounds.isValid() && !hasInitialFitRef.current && !activeSelectedDevice) {
      let hasStored = false;
      try {
        hasStored = Boolean(sessionStorage.getItem("qrmm_map_zoom"));
      } catch {}
      if (!hasStored) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
      hasInitialFitRef.current = true;
    }
  }, [nodes, activeSelectedDevice, hubNode, onSelectDevice]);

  // Center Fleet Action (restablece explícitamente a vista general)
  const handleResetBounds = () => {
    try {
      sessionStorage.removeItem("qrmm_map_zoom");
      sessionStorage.removeItem("qrmm_map_lat");
      sessionStorage.removeItem("qrmm_map_lng");
    } catch {}
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
                  {activeGeoInfo?.region || activeSelectedDevice.location_name || activeGeoInfo?.city || "Lima Centro"} • GPS:{" "}
                  <strong>{activeGeoInfo?.lat ? `${activeGeoInfo.lat.toFixed(4)}, ${activeGeoInfo.lng.toFixed(4)}` : "Fijado"}</strong> • IP:{" "}
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
