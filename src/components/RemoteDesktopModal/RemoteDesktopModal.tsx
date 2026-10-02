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
  Zap,
  Unlock,
  Folder,
  File as FileIcon,
  Upload,
  Download,
  ArrowUp,
  FolderOpen,
  Trash2,
  CheckCircle2,
  HardDrive,
  Loader2,
} from "lucide-react";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import type { Device } from "../../types/device";
import {
  listRemoteFiles,
  uploadRemoteFile,
  downloadRemoteFile,
  deleteRemoteFile,
} from "../../services/api";
import type { RemoteFileItem } from "../../services/api";
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

  // Estados para Gestor y Transferencia Bidireccional de Archivos
  const isWin = device.os_type?.toLowerCase().includes("win");
  const [showFileManager, setShowFileManager] = useState<boolean>(false);
  const [remotePath, setRemotePath] = useState<string>(isWin ? "C:\\" : "/");
  const [parentPath, setParentPath] = useState<string>("");
  const [fileItems, setFileItems] = useState<RemoteFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccessMsg, setFileSuccessMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [pathInputText, setPathInputText] = useState<string>(isWin ? "C:\\" : "/");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Contadores de rendimiento FPS y control de saturación de cola
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastMouseMoveTimeRef = useRef(0);
  const isMouseDownRef = useRef(false);
  const isRenderingRef = useRef(false);
  const pendingFrameRef = useRef<{ data: string; w: number; h: number } | null>(null);

  const fetchRemoteFiles = useCallback(async (path?: string) => {
    try {
      setLoadingFiles(true);
      setFileError(null);
      const res = await listRemoteFiles(device.id, path);
      setRemotePath(res.current_path);
      setPathInputText(res.current_path);
      setParentPath(res.parent_path);
      setFileItems(res.items || []);
    } catch (err: any) {
      setFileError(err.message || "Error al explorar archivos en el disco remoto");
    } finally {
      setLoadingFiles(false);
    }
  }, [device.id]);

  useEffect(() => {
    if (showFileManager && fileItems.length === 0) {
      fetchRemoteFiles(remotePath);
    }
  }, [showFileManager, fetchRemoteFiles, fileItems.length, remotePath]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFileError("El archivo excede el tamaño máximo permitido de 50 MB.");
      return;
    }

    try {
      setUploading(true);
      setFileError(null);
      setFileSuccessMsg(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          const base64Content = result.split(",")[1];
          await uploadRemoteFile(device.id, remotePath, file.name, base64Content);
          setFileSuccessMsg(`✓ Archivo "${file.name}" enviado exitosamente al disco remoto.`);
          setTimeout(() => setFileSuccessMsg(null), 4000);
          fetchRemoteFiles(remotePath);
        } catch (uploadErr: any) {
          setFileError(uploadErr.message || "Error al transferir archivo al disco remoto");
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        setFileError("Error al leer el archivo local.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFileError(err.message || "Error en la subida");
      setUploading(false);
    }
  };

  const handleDownloadFile = async (item: RemoteFileItem) => {
    try {
      setDownloadingPath(item.path);
      setFileError(null);
      const res = await downloadRemoteFile(device.id, item.path);
      if (res.content_base64) {
        const link = document.createElement("a");
        link.href = `data:application/octet-stream;base64,${res.content_base64}`;
        link.download = res.filename || item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setFileError(err.message || `Error al descargar ${item.name}`);
    } finally {
      setDownloadingPath(null);
    }
  };

  const handleDeleteFile = async (item: RemoteFileItem) => {
    if (!confirm(`¿Eliminar "${item.name}" permanentemente del disco remoto?`)) return;
    try {
      setFileError(null);
      await deleteRemoteFile(device.id, item.path);
      fetchRemoteFiles(remotePath);
    } catch (err: any) {
      setFileError(err.message || "Error al eliminar archivo");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Conectar WebSocket de Escritorio Remoto
  const connectWebSocket = useCallback(() => {
    if (!isOpen) return;

    setConnecting(true);
    setError(null);

    let wsUrl = "";
    if (import.meta.env.VITE_WS_BASE) {
      const base = import.meta.env.VITE_WS_BASE.replace(/\/dashboard\/?$/, "").replace(/\/$/, "");
      wsUrl = `${base}/desktop/${device.id}`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Si estamos en vite dev port 5173, conectar a api port 8000
      const host = window.location.port === "5173" ? `${window.location.hostname}:8000` : window.location.host;
      wsUrl = `${protocol}//${host}/ws/v1/desktop/${device.id}`;
    }

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
  const getNormalizedCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
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

  // Manejadores de Ratón con Pointer Capture (Soporta Arrastre/Drag de Ventanas sin perder el foco)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    e.preventDefault();
    isMouseDownRef.current = true;

    // Capturar puntero para que no se pierdan eventos al arrastrar ventanas rápidamente
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const { x, y } = getNormalizedCoordinates(e);
    const btn = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
    sendInput({ action: "mouse_down", button: btn, x, y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    e.preventDefault();

    // Auto-recuperación: si el usuario soltó físicamente el botón pero el navegador no registró el up
    if (isMouseDownRef.current && e.buttons === 0) {
      isMouseDownRef.current = false;
      const { x, y } = getNormalizedCoordinates(e);
      sendInput({ action: "mouse_up", button: "left", x, y });
    }

    const now = Date.now();
    // 20ms de throttle para máxima suavidad al mover o arrastrar ventanas
    if (now - lastMouseMoveTimeRef.current < 20) return;
    lastMouseMoveTimeRef.current = now;

    const { x, y } = getNormalizedCoordinates(e);
    sendInput({ action: "mouse_move", x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    e.preventDefault();
    isMouseDownRef.current = false;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const { x, y } = getNormalizedCoordinates(e);
    const btn = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
    sendInput({ action: "mouse_up", button: btn, x, y });
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    isMouseDownRef.current = false;
    const { x, y } = getNormalizedCoordinates(e);
    sendInput({ action: "mouse_up", button: "left", x, y });
    sendInput({ action: "mouse_up", button: "right", x, y });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== "control") return;
    e.preventDefault();
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
    // Prevenir menú contextual del navegador
    e.preventDefault();
  };

  // Restablecer cualquier botón o tecla pegada
  const resetInput = () => {
    isMouseDownRef.current = false;
    sendInput({ action: "mouse_up", button: "left" });
    sendInput({ action: "mouse_up", button: "right" });
    sendInput({ action: "mouse_up", button: "middle" });
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

            {/* Teclas Rápidas y Herramientas */}
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
                  onClick={() => sendSpecialKey("Ctrl+Shift+Esc")} 
                  title="Abrir Administrador de Tareas"
                >
                  Taskmgr
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
                <button 
                  className="q-rd-key-btn q-rd-key-btn--warning" 
                  onClick={resetInput} 
                  title="Liberar clics o botones que hayan quedado pegados"
                >
                  <Unlock size={13} /> Liberar Ratón
                </button>
                <button 
                  className={`q-rd-key-btn ${showFileManager ? "q-rd-key-btn--active" : ""}`}
                  onClick={() => setShowFileManager((prev) => !prev)} 
                  title="Gestor y Transferencia Bidireccional de Archivos con el Disco Remoto"
                  style={{
                    background: showFileManager ? "var(--color-brand-primary, #6366f1)" : undefined,
                    color: showFileManager ? "#fff" : undefined,
                    borderColor: showFileManager ? "var(--color-brand-primary, #6366f1)" : undefined,
                  }}
                >
                  <FolderOpen size={13} /> Archivos
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          style={{ display: connected && !error ? "block" : "none" }}
        />

        {/* Gestor y Transferencia Bidireccional de Archivos Drawer */}
        {showFileManager && (
          <div className="q-rd-file-drawer">
            {/* Header */}
            <div className="q-rd-file-header">
              <div className="q-rd-file-title">
                <HardDrive size={18} style={{ color: "var(--color-brand-primary, #6366f1)" }} />
                <span>Explorador de Disco Remoto</span>
              </div>
              <button
                className="q-rd-icon-btn"
                onClick={() => setShowFileManager(false)}
                title="Cerrar Explorador de Archivos"
              >
                <X size={16} />
              </button>
            </div>

            {/* Pathbar */}
            <div className="q-rd-file-pathbar">
              <button
                className="q-rd-path-btn"
                disabled={!parentPath || loadingFiles}
                onClick={() => parentPath && fetchRemoteFiles(parentPath)}
                title="Subir de nivel (Carpeta superior)"
              >
                <ArrowUp size={14} />
              </button>
              <input
                type="text"
                className="q-rd-path-input"
                value={pathInputText}
                onChange={(e) => setPathInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchRemoteFiles(pathInputText);
                  }
                }}
                placeholder="Ruta absoluta..."
              />
              <button
                className="q-rd-path-btn"
                disabled={loadingFiles}
                onClick={() => fetchRemoteFiles(pathInputText)}
                title="Actualizar / Ir a ruta"
              >
                <RefreshCw size={13} className={loadingFiles ? "q-rd-spin" : ""} />
              </button>
            </div>

            {/* Shortcuts */}
            <div className="q-rd-file-shortcuts">
              {isWin ? (
                <>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("C:\\")}>C:\</button>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("C:\\Users")}>Users</button>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("C:\\Program Files")}>Program Files</button>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("C:\\Windows\\Temp")}>Temp</button>
                </>
              ) : (
                <>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("/")}>/</button>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("/home")}>/home</button>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("/var/log")}>/var/log</button>
                  <button className="q-rd-shortcut-chip" onClick={() => fetchRemoteFiles("/tmp")}>/tmp</button>
                </>
              )}
            </div>

            {/* Notificaciones de error o éxito */}
            {fileError && (
              <div style={{ padding: "8px 18px", background: "rgba(239, 68, 68, 0.15)", borderBottom: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={14} />
                <span style={{ flex: 1 }}>{fileError}</span>
                <button onClick={() => setFileError(null)} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>×</button>
              </div>
            )}
            {fileSuccessMsg && (
              <div style={{ padding: "8px 18px", background: "rgba(34, 197, 94, 0.15)", borderBottom: "1px solid rgba(34, 197, 94, 0.3)", color: "#86efac", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} />
                <span style={{ flex: 1 }}>{fileSuccessMsg}</span>
              </div>
            )}

            {/* Lista de Archivos */}
            <div className="q-rd-file-list">
              {loadingFiles ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af" }}>
                  <Loader2 size={24} className="q-rd-spin" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "13px" }}>Consultando sistema de archivos remoto...</p>
                </div>
              ) : fileItems.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#6b7280" }}>
                  <Folder size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  <p style={{ fontSize: "13px" }}>Directorio vacío o sin acceso.</p>
                </div>
              ) : (
                fileItems.map((item) => (
                  <div
                    key={item.path}
                    className="q-rd-file-row"
                    onClick={() => {
                      if (item.is_dir) {
                        fetchRemoteFiles(item.path);
                      }
                    }}
                  >
                    <div className="q-rd-file-row-main">
                      {item.is_dir ? (
                        <Folder size={17} style={{ color: "#38bdf8", flexShrink: 0 }} />
                      ) : (
                        <FileIcon size={17} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      )}
                      <span className="q-rd-file-name" title={item.name}>
                        {item.name}
                      </span>
                      {!item.is_dir && (
                        <span className="q-rd-file-meta">
                          {formatBytes(item.size)}
                        </span>
                      )}
                    </div>

                    <div className="q-rd-file-actions" onClick={(e) => e.stopPropagation()}>
                      {!item.is_dir && (
                        <button
                          className="q-rd-file-action-btn"
                          title="Descargar este archivo al equipo local"
                          disabled={downloadingPath === item.path}
                          onClick={() => handleDownloadFile(item)}
                        >
                          {downloadingPath === item.path ? (
                            <Loader2 size={14} className="q-rd-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                      )}
                      <button
                        className="q-rd-file-action-btn q-rd-file-action-btn--delete"
                        title="Eliminar permanentemente"
                        onClick={() => handleDeleteFile(item)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con Subida de Archivo */}
            <div className="q-rd-file-footer">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleUploadFile}
              />
              <span style={{ fontSize: "11.5px", color: "#9ca3af" }}>
                {fileItems.length} elemento{fileItems.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={uploading ? <Loader2 size={14} className="q-rd-spin" /> : <Upload size={14} />}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Subiendo..." : "Enviar Archivo al Disco"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
