import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Monitor, 
  X, 
  Maximize, 
  Minimize, 
  Eye, 
  MousePointer, 
  Sliders, 
  RefreshCw, 
  AlertCircle,
  Zap
} from "lucide-react";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import type { Device } from "../../types/device";
import "./RemoteDesktopModal.css";

interface RemoteDesktopModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

export const RemoteDesktopModal: React.FC<RemoteDesktopModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [controlMode, setControlMode] = useState<"control" | "view">("control");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar] = useState(true);

  // Contadores de rendimiento FPS y control de saturación de cola
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastMouseMoveTimeRef = useRef(0);
  const isRenderingRef = useRef(false);
  const pendingFrameRef = useRef<{ data: string; w: number; h: number } | null>(null);

  // Conectar WebSocket de Escritorio Remoto
  const connectWebSocket = useCallback(() => {
    if (!isOpen) return;

    setConnecting(true);
    setError(null);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Si estamos en vite dev port 5173, conectar a api port 8000
    const host = window.location.port === "5173" ? `${window.location.hostname}:8000` : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/v1/desktop/${device.id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      // Enviar calidad inicial
      sendQualityConfig(ws, quality);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "desktop_frame" && msg.data) {
          renderFrame(msg.data, msg.width, msg.height);
        } else if (msg.type === "error") {
          setError(msg.message || "Error recibido del servidor");
        }
      } catch (e) {
        console.error("Error procesando frame:", e);
      }
    };

    ws.onclose = (e) => {
      setConnected(false);
      setConnecting(false);
      if (e.code !== 1000) {
        setError("La conexión con el equipo se ha cerrado.");
      }
    };

    ws.onerror = () => {
      setConnected(false);
      setConnecting(false);
      setError("No se pudo establecer la conexión de escritorio remoto con el equipo.");
    };
  }, [device.id, isOpen, quality]);

  // Enviar configuración de calidad, escala y FPS optimizados para baja latencia
  const sendQualityConfig = (ws: WebSocket | null, q: "low" | "medium" | "high") => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const settings = {
      low: { quality: 40, fps: 15, scale: 0.65 },
      medium: { quality: 55, fps: 15, scale: 0.75 },
      high: { quality: 62, fps: 12, scale: 1.0 },
    }[q];

    ws.send(JSON.stringify({
      type: "desktop_quality",
      quality: settings.quality,
      fps: settings.fps,
      scale: settings.scale,
    }));
  };

  // Renderizar frame en el Canvas con descarte inteligente de frames atrasados (Backpressure Drop)
  const renderFrame = (base64Data: string, width: number, height: number) => {
    if (isRenderingRef.current) {
      // Si el navegador aún está dibujando un frame anterior, guardamos el más reciente
      // y descartamos los intermedios para garantizar latencia cero
      pendingFrameRef.current = { data: base64Data, w: width, h: height };
      return;
    }

    isRenderingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) {
      isRenderingRef.current = false;
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isRenderingRef.current = false;
      return;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      setResolution({ w: width, h: height });
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      // Calcular FPS en vivo
      frameCountRef.current += 1;
      const now = Date.now();
      const delta = now - lastFpsTimeRef.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      isRenderingRef.current = false;
      // Si llegó un frame más nuevo mientras se dibujaba, procesar de inmediato
      if (pendingFrameRef.current) {
        const next = pendingFrameRef.current;
        pendingFrameRef.current = null;
        renderFrame(next.data, next.w, next.h);
      }
    };
    img.onerror = () => {
      isRenderingRef.current = false;
    };
    img.src = `data:image/jpeg;base64,${base64Data}`;
  };

  // Ciclo de vida: Abrir y cerrar WebSocket
  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close(1000, "Modal cerrado");
        wsRef.current = null;
      }
      setConnected(false);
      setFps(0);
      setError(null);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Unmount");
        wsRef.current = null;
      }
    };
  }, [isOpen, connectWebSocket]);

  // Cambiar calidad
  const handleQualityChange = (newQuality: "low" | "medium" | "high") => {
    setQuality(newQuality);
    sendQualityConfig(wsRef.current, newQuality);
  };

  // Enviar eventos de entrada al agente
  const sendInput = (inputData: Record<string, any>) => {
    if (controlMode !== "control") return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "desktop_input",
      ...inputData,
    }));
  };

  // Coordenadas normalizadas sobre el canvas (0.0 a 1.0) con compensación de relación de aspecto (Letterbox/Pillarbox)
  const getNormalizedCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Relación de aspecto del contenido de pantalla vs el elemento contenedor
    const canvasRatio = (canvas.width || 1) / (canvas.height || 1);
    const elemRatio = rect.width / rect.height;

    let actualWidth = rect.width;
    let actualHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (elemRatio > canvasRatio) {
      // Bandas negras laterales (Pillarbox)
      actualWidth = rect.height * canvasRatio;
      offsetX = (rect.width - actualWidth) / 2;
    } else {
      // Bandas negras superior/inferior (Letterbox)
      actualHeight = rect.width / canvasRatio;
      offsetY = (rect.height - actualHeight) / 2;
    }

    const x = Math.max(0, Math.min(1, (clientX - offsetX) / actualWidth));
    const y = Math.max(0, Math.min(1, (clientY - offsetY) / actualHeight));
    return { x, y };
  };

  // Manejadores de Mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    const now = Date.now();
    // Limitar frecuencia de mouse_move a ~30ms para fluidez y bajo tráfico
    if (now - lastMouseMoveTimeRef.current < 30) return;
    lastMouseMoveTimeRef.current = now;

    const { x, y } = getNormalizedCoordinates(e);
    sendInput({ action: "mouse_move", x, y });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    const { x, y } = getNormalizedCoordinates(e);
    const btn = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
    sendInput({ action: "mouse_down", button: btn, x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    const { x, y } = getNormalizedCoordinates(e);
    const btn = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
    sendInput({ action: "mouse_up", button: btn, x, y });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    const { x, y } = getNormalizedCoordinates(e);
    sendInput({ action: "mouse_click", button: "left", double: true, x, y });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    sendInput({ action: "mouse_scroll", delta });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Prevenir menú del navegador para permitir clic derecho en el escritorio remoto
    e.preventDefault();
  };

  // Manejador de Teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (controlMode !== "control") return;
    // Evitar propagación si es tecla especial
    if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Backspace"].includes(e.key)) {
      e.preventDefault();
    }
    sendInput({ action: "key_press", key: e.key });
  };

  // Enviar combinación especial
  const sendSpecialKey = (key: string) => {
    sendInput({ action: "key_press", key });
  };

  // Toggle Pantalla Completa
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className={`q-rd-overlay ${isFullscreen ? "q-rd-overlay--fullscreen" : ""}`}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Barra de Herramientas Flotante */}
      {showToolbar && (
        <header className="q-rd-toolbar">
          <div className="q-rd-toolbar-left">
            <div className="q-rd-device-info">
              <Monitor size={18} className="q-rd-icon-primary" />
              <span className="q-rd-hostname">{device.hostname}</span>
              <span className="q-rd-code">({device.device_code})</span>
            </div>

            {connected ? (
              <Badge variant="success" pulse>
                En Vivo • {fps} FPS
              </Badge>
            ) : connecting ? (
              <Badge variant="warning" pulse>
                Conectando...
              </Badge>
            ) : (
              <Badge variant="danger">
                Desconectado
              </Badge>
            )}

            {resolution.w > 0 && (
              <span className="q-rd-resolution">
                {resolution.w} × {resolution.h}
              </span>
            )}
          </div>

          <div className="q-rd-toolbar-center">
            {/* Control Mode Toggle */}
            <div className="q-rd-btn-group">
              <button
                className={`q-rd-toggle-btn ${controlMode === "control" ? "active" : ""}`}
                onClick={() => setControlMode("control")}
                title="Modo Interactivo (Control Total de Mouse y Teclado)"
              >
                <MousePointer size={14} />
                <span>Control</span>
              </button>
              <button
                className={`q-rd-toggle-btn ${controlMode === "view" ? "active" : ""}`}
                onClick={() => setControlMode("view")}
                title="Modo Solo Ver (Sin interacción)"
              >
                <Eye size={14} />
                <span>Solo Ver</span>
              </button>
            </div>

            {/* Quality Selector */}
            <div className="q-rd-btn-group">
              <span className="q-rd-group-label"><Sliders size={13} /> Calidad:</span>
              <button
                className={`q-rd-toggle-btn ${quality === "low" ? "active" : ""}`}
                onClick={() => handleQualityChange("low")}
                title="Baja calidad, máxima velocidad (12 FPS, 45% JPEG)"
              >
                Baja
              </button>
              <button
                className={`q-rd-toggle-btn ${quality === "medium" ? "active" : ""}`}
                onClick={() => handleQualityChange("medium")}
                title="Equilibrada (18 FPS, 65% JPEG)"
              >
                Media
              </button>
              <button
                className={`q-rd-toggle-btn ${quality === "high" ? "active" : ""}`}
                onClick={() => handleQualityChange("high")}
                title="Alta nitidez (24 FPS, 85% JPEG)"
              >
                Alta
              </button>
            </div>

            {/* Teclas Rápidas */}
            {controlMode === "control" && (
              <div className="q-rd-quick-keys">
                <button 
                  className="q-rd-key-btn" 
                  onClick={() => sendSpecialKey("Win")} 
                  title="Tecla Windows"
                >
                  <Zap size={13} /> Inicio
                </button>
                <button 
                  className="q-rd-key-btn" 
                  onClick={() => sendSpecialKey("Enter")} 
                  title="Enter"
                >
                  Enter
                </button>
                <button 
                  className="q-rd-key-btn" 
                  onClick={() => sendSpecialKey("Escape")} 
                  title="Escape"
                >
                  Esc
                </button>
              </div>
            )}
          </div>

          <div className="q-rd-toolbar-right">
            <button 
              className="q-rd-icon-btn" 
              onClick={toggleFullscreen} 
              title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
            <button 
              className="q-rd-icon-btn q-rd-icon-btn--close" 
              onClick={onClose} 
              title="Cerrar Sesión de Escritorio"
            >
              <X size={18} />
            </button>
          </div>
        </header>
      )}

      {/* Área Central: Viewport de Pantalla Remota */}
      <main className="q-rd-viewport">
        {connecting && (
          <div className="q-rd-state-box">
            <div className="q-rd-spinner" />
            <h3>Iniciando sesión gráfica con {device.hostname}...</h3>
            <p>Negociando canal de streaming seguro con el agente...</p>
          </div>
        )}

        {error && (
          <div className="q-rd-state-box q-rd-state-box--error">
            <AlertCircle size={40} className="q-rd-error-icon" />
            <h3>No se pudo conectar al escritorio</h3>
            <p>{error}</p>
            <Button 
              variant="secondary" 
              icon={<RefreshCw size={14} />} 
              onClick={connectWebSocket}
              className="q-rd-retry-btn"
            >
              Reintentar Conexión
            </Button>
          </div>
        )}

        {/* Canvas de Pantalla */}
        <canvas
          ref={canvasRef}
          className={`q-rd-canvas ${controlMode === "control" ? "q-rd-canvas--interactive" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          style={{ display: connected && !error ? "block" : "none" }}
        />
      </main>
    </div>
  );
};
