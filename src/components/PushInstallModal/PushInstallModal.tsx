import React, { useState, useRef, useEffect } from "react";
import type { DiscoveredDevice, RemoteDeployResponse } from "../../types/device";
import { Button } from "../Button/Button";
import { remoteDeployAgent } from "../../services/api";
import {
  X,
  Shield,
  Server,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Terminal,
  ArrowRight,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import { copyToClipboard } from "../../utils/clipboard";
import "./PushInstallModal.css";

export interface PushInstallModalProps {
  device: DiscoveredDevice | null;
  probeId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PushInstallModal: React.FC<PushInstallModalProps> = ({
  device,
  probeId,
  onClose,
  onSuccess,
}) => {
  if (!device) return null;

  const defaultOS =
    device.os_family?.toLowerCase().includes("linux") ||
    device.device_type === "LINUX_SERVER" ||
    device.device_type === "LINUX_HOST"
      ? "linux"
      : "windows";

  const [osType, setOsType] = useState<"windows" | "linux">(defaultOS);
  const [username, setUsername] = useState<string>(defaultOS === "linux" ? "root" : "Administrator");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [port, setPort] = useState<number>(defaultOS === "linux" ? 22 : 445);
  const [serverUrl, setServerUrl] = useState<string>("http://192.168.1.42:8000");

  const [deploying, setDeploying] = useState<boolean>(false);
  const [deployResult, setDeployResult] = useState<RemoteDeployResponse | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const consolePreRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (deployResult?.logs && consolePreRef.current) {
      consolePreRef.current.scrollTop = consolePreRef.current.scrollHeight;
    }
  }, [deployResult?.logs]);

  const handleCopyLogs = async () => {
    if (!deployResult?.logs) return;
    const success = await copyToClipboard(deployResult.logs.join("\n"));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOSChange = (newOS: "windows" | "linux") => {
    setOsType(newOS);
    if (newOS === "linux") {
      setUsername("root");
      setPort(22);
    } else {
      setUsername("Administrator");
      setPort(445);
    }
  };

  const handleStartDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setDeployError("Por favor ingresa la contraseña de administración del equipo destino.");
      return;
    }

    setDeploying(true);
    setDeployError(null);
    setDeployResult(null);

    try {
      const res = await remoteDeployAgent({
        probe_device_id: probeId,
        target_ip: device.ip,
        os_type: osType,
        username: username.trim(),
        password: password,
        port: port,
        server_url: serverUrl.trim(),
      });

      setDeployResult(res);
      if (res.success && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setDeployError(err.message || "Error al despachar el despliegue remoto");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="q-push-overlay" onClick={onClose}>
      <div className="q-push-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="q-push-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="q-push-icon-wrap">
              <Shield size={20} color="var(--color-brand-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Despliegue Remoto de Agente Qhapana
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Instalación desatendida mediante credenciales de administración
              </div>
            </div>
          </div>
          <button className="q-push-close-btn" onClick={onClose} title="Cerrar modal">
            <X size={16} />
          </button>
        </div>

        {/* Host Summary Card */}
        <div className="q-push-target-card">
          <div>
            <span className="q-push-target-label">Equipo Destino:</span>
            <span className="q-push-target-host">{device.hostname || "Sin Hostname"}</span>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div>
              <span className="q-push-target-label">IP: </span>
              <strong style={{ fontFamily: "var(--font-family-mono)" }}>{device.ip}</strong>
            </div>
            <div>
              <span className="q-push-target-label">MAC: </span>
              <span style={{ fontFamily: "var(--font-family-mono)", color: "var(--color-text-secondary)" }}>
                {device.mac}
              </span>
            </div>
            <div>
              <span className="q-push-target-label">Fabricante: </span>
              <span>{device.vendor}</span>
            </div>
          </div>
        </div>

        {/* Notificación informativa para dispositivos móviles Android */}
        {(device.os_family?.toLowerCase().includes("android") || device.device_type === "ANDROID_DEVICE") && (
          <div
            style={{
              margin: "0 24px 16px",
              padding: "12px 16px",
              background: "rgba(52, 211, 153, 0.08)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <Smartphone size={20} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "#d1fae5", lineHeight: 1.45 }}>
              <strong style={{ color: "#34d399", display: "block", marginBottom: 2 }}>
                Dispositivo Móvil Android Detectado
              </strong>
              Los smartphones no disponen de servicios de red abiertos como SSH o SMB para despliegue remoto desatendido.
              Para gestionar este dispositivo en Qhapana RMM, instale el agente mediante el paquete de aplicación (APK).
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleStartDeploy} className="q-push-body">
          {/* Selector de SO */}
          <div className="q-push-field">
            <label className="q-push-label">Sistema Operativo Destino</label>
            <div className="q-push-os-selector">
              <button
                type="button"
                className={`q-push-os-btn ${osType === "windows" ? "q-push-os-btn--active" : ""}`}
                onClick={() => handleOSChange("windows")}
                disabled={deploying}
              >
                <span>🪟 Windows (SMB / WinRM / WMI)</span>
              </button>
              <button
                type="button"
                className={`q-push-os-btn ${osType === "linux" ? "q-push-os-btn--active" : ""}`}
                onClick={() => handleOSChange("linux")}
                disabled={deploying}
              >
                <span>🐧 Linux (SSH / systemd)</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Usuario Administrador */}
            <div className="q-push-field">
              <label className="q-push-label">
                <User size={13} style={{ display: "inline", marginRight: 4 }} />
                Usuario Administrador
              </label>
              <input
                type="text"
                className="q-push-input"
                placeholder={osType === "windows" ? "Administrator o DOMAIN\\admin" : "root o usuario sudo (ej: raul)"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={deploying}
              />
              {osType === "linux" && (
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2, lineHeight: 1.3 }}>
                  * En Linux distingue mayúsculas/minúsculas (ej: <span style={{ color: "#a5b4fc", fontWeight: 600 }}>raul</span>). Si no es root, debe tener sudo.
                </span>
              )}
            </div>

            {/* Puerto de conexión */}
            <div className="q-push-field">
              <label className="q-push-label">
                <Server size={13} style={{ display: "inline", marginRight: 4 }} />
                Puerto de Conexión
              </label>
              <input
                type="number"
                className="q-push-input"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                required
                disabled={deploying}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="q-push-field">
            <label className="q-push-label">
              <Lock size={13} style={{ display: "inline", marginRight: 4 }} />
              Contraseña de Administración
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="q-push-input"
                placeholder="Ingresa la contraseña del usuario remoto"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={deploying}
                autoFocus
              />
              <button
                type="button"
                className="q-push-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4, display: "block" }}>
              🔒 La contraseña se transmite cifrada en memoria y nunca se almacena en la base de datos.
            </span>
          </div>

          {/* URL Servidor Central */}
          <div className="q-push-field">
            <label className="q-push-label">URL del Servidor Central Qhapana</label>
            <input
              type="text"
              className="q-push-input"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              required
              disabled={deploying}
            />
          </div>

          {/* Error Message */}
          {deployError && (
            <div className="q-push-alert q-push-alert--error">
              <AlertTriangle size={16} />
              <span>{deployError}</span>
            </div>
          )}

          {/* Success Message */}
          {deployResult?.success && (
            <div className="q-push-alert q-push-alert--success">
              <CheckCircle2 size={16} />
              <span>{deployResult.message}</span>
            </div>
          )}

          {/* Consola de logs de despliegue con scroll y botón de copia */}
          {deployResult?.logs && deployResult.logs.length > 0 && (
            <div className="q-push-console">
              <div className="q-push-console-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Terminal size={13} color="var(--color-brand-primary)" />
                  <span style={{ fontWeight: 600 }}>Registro de Ejecución Remota ({deployResult.duration_ms} ms)</span>
                </div>
                <button
                  type="button"
                  className="q-push-console-copy"
                  onClick={handleCopyLogs}
                  title="Copiar registro completo al portapapeles"
                >
                  {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                  <span>{copied ? "Copiado" : "Copiar Registro"}</span>
                </button>
              </div>
              <pre ref={consolePreRef} className="q-push-console-pre">
                {deployResult.logs.map((line, idx) => (
                  <div key={idx} className="q-push-log-line">
                    <span className="q-push-log-num">{idx + 1}</span>
                    <span className="q-push-log-text">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          )}

          {/* Footer Actions */}
          <div className="q-push-footer">
            <Button variant="secondary" onClick={onClose} disabled={deploying}>
              {deployResult?.success ? "Cerrar" : "Cancelar"}
            </Button>
            {!deployResult?.success ? (
              <Button
                variant="primary"
                type="submit"
                disabled={deploying}
                icon={deploying ? <Loader2 size={16} className="q-spin" /> : <ArrowRight size={16} />}
              >
                {deploying ? "Desplegando agente..." : "Iniciar Despliegue Remoto"}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={onClose}
              >
                Listo
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
