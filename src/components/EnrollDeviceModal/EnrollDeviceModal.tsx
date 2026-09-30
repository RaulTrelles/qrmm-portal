import React, { useState, useEffect } from "react";
import { X, Copy, Check, Terminal, Laptop, Server, CheckCircle2, ArrowRight, ShieldCheck, Download, Building2 } from "lucide-react";
import { Button } from "../Button/Button";
import { dashboardSocket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import { copyToClipboard } from "../../utils/clipboard";
import { API_BASE } from "../../services/api";
import "./EnrollDeviceModal.css";

export interface EnrollDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceEnrolled?: (deviceData: { device_id: string; hostname: string; device_code: string }) => void;
}

export const EnrollDeviceModal: React.FC<EnrollDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceEnrolled,
}) => {
  const { user, organizationsList, activeOrganization } = useAuth();
  const [selectedOS, setSelectedOS] = useState<"windows" | "linux">("windows");
  const [copied, setCopied] = useState<boolean>(false);
  const [targetOrgId, setTargetOrgId] = useState<string>(() => {
    return activeOrganization?.id || (organizationsList[0]?.id ?? "");
  });
  const [newlyEnrolled, setNewlyEnrolled] = useState<{
    device_id: string;
    hostname: string;
    device_code: string;
    os_type?: string;
  } | null>(null);

  useEffect(() => {
    if (activeOrganization?.id) {
      setTargetOrgId(activeOrganization.id);
    } else if (organizationsList.length > 0 && !targetOrgId) {
      setTargetOrgId(organizationsList[0].id);
    }
  }, [activeOrganization, organizationsList]);

  const targetOrg = organizationsList.find((o) => o.id === targetOrgId);
  const tokenParam = targetOrg?.enrollment_token ? `?token=${targetOrg.enrollment_token}` : "";

  // Comandos One-Liner vinculados al cliente y al backend oficial
  const windowsCommand = `[Net.ServicePointManager]::SecurityProtocol = 3072; irm "${API_BASE}/install.ps1${tokenParam}" | iex`;
  const linuxCommand = `curl -sSL "${API_BASE}/install.sh${tokenParam}" | sudo bash`;

  const activeCommand = selectedOS === "windows" ? windowsCommand : linuxCommand;
  const binaryFilename = selectedOS === "windows" ? "qhapana-agent.exe" : "qhapana-agent-linux";
  const binaryDownloadUrl = `${API_BASE}/downloads/${binaryFilename}`;

  // Escuchar en tiempo real si un nuevo dispositivo se vincula mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) {
      setNewlyEnrolled(null);
      setCopied(false);
      return;
    }

    const unsub = dashboardSocket.on("device_state_changed", (data: any) => {
      if (data && data.current_state === "ONLINE") {
        setNewlyEnrolled({
          device_id: data.device_id,
          hostname: data.hostname || "Nuevo Equipo",
          device_code: data.device_code || "QR-XXXXXX",
        });
        if (onDeviceEnrolled) {
          onDeviceEnrolled({
            device_id: data.device_id,
            hostname: data.hostname,
            device_code: data.device_code,
          });
        }
      }
    });

    return () => {
      unsub();
    };
  }, [isOpen, onDeviceEnrolled]);

  const handleCopy = async () => {
    const success = await copyToClipboard(activeCommand);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="q-enroll-overlay" onClick={onClose}>
      <div
        className="q-enroll-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-modal-title"
      >
        {/* Cabecera */}
        <div className="q-enroll-header">
          <div className="q-enroll-title-group">
            <div className="q-enroll-icon-badge">
              <Terminal size={22} className="q-enroll-icon" />
            </div>
            <div>
              <h2 id="enroll-modal-title" className="q-enroll-title">
                Vincular Nuevo Dispositivo
              </h2>
              <p className="q-enroll-subtitle">
                Instale el agente Qhapana RMM en segundos mediante un comando desatendido.
              </p>
            </div>
          </div>
          <button
            className="q-enroll-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notificación de vinculación detectada en vivo */}
        {newlyEnrolled && (
          <div className="q-enroll-success-banner">
            <CheckCircle2 size={24} className="q-enroll-success-icon" />
            <div className="q-enroll-success-info">
              <span className="q-enroll-success-title">¡Nuevo Dispositivo Detectado!</span>
              <span className="q-enroll-success-desc">
                <strong>{newlyEnrolled.hostname}</strong> ({newlyEnrolled.device_code}) se ha conectado exitosamente al servidor central.
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={onClose}
              className="q-enroll-success-action"
            >
              Ver en panel <ArrowRight size={14} />
            </Button>
          </div>
        )}

        {/* Selector / Indicador de Cliente SaaS */}
        {organizationsList.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)" }}>
            <Building2 size={18} style={{ color: "var(--color-brand-primary)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Cliente / Organización Destino
              </span>
              {user?.role === "SUPERADMIN" ? (
                <select
                  value={targetOrgId}
                  onChange={(e) => setTargetOrgId(e.target.value)}
                  style={{
                    marginTop: 2,
                    height: 32,
                    padding: "0 8px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border-default)",
                    backgroundColor: "var(--color-surface-default)",
                    color: "var(--color-text-primary)",
                    fontWeight: 600,
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {organizationsList.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.plan}) — Token: {org.enrollment_token || "Default"}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ marginTop: 2, fontWeight: 700, fontSize: 13, color: "var(--color-text-primary)" }}>
                  {targetOrg?.name || activeOrganization?.name || "Mi Organización"} ({targetOrg?.plan || "PRO"}) — Token:{" "}
                  <code style={{ color: "var(--color-brand-primary)", background: "var(--color-surface-default)", padding: "2px 6px", borderRadius: "4px" }}>
                    {targetOrg?.enrollment_token || "Default"}
                  </code>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Selector de Sistema Operativo */}
        <div className="q-enroll-os-tabs">
          <button
            type="button"
            className={`q-enroll-os-tab ${selectedOS === "windows" ? "active" : ""}`}
            onClick={() => setSelectedOS("windows")}
          >
            <Laptop size={18} />
            <span>Windows (PowerShell)</span>
          </button>
          <button
            type="button"
            className={`q-enroll-os-tab ${selectedOS === "linux" ? "active" : ""}`}
            onClick={() => setSelectedOS("linux")}
          >
            <Server size={18} />
            <span>Linux (Bash / Systemd)</span>
          </button>
        </div>

        {/* Contenido según SO */}
        <div className="q-enroll-body">
          <div className="q-enroll-instructions">
            <div className="q-enroll-step">
              <span className="q-enroll-step-number">1</span>
              <span>
                {selectedOS === "windows" ? (
                  <>Abra <strong>PowerShell</strong> en el equipo cliente (como Administrador para servicio de sistema).</>
                ) : (
                  <>Abra una <strong>Terminal</strong> en el servidor o máquina Linux con permisos <code>sudo</code>.</>
                )}
              </span>
            </div>
            <div className="q-enroll-step">
              <span className="q-enroll-step-number">2</span>
              <span>Copie y pegue la siguiente línea de ejecución rápida:</span>
            </div>
          </div>

          {/* Caja de Código One-Liner */}
          <div className="q-enroll-code-container">
            <div className="q-enroll-code-header">
              <span className="q-enroll-code-label">
                {selectedOS === "windows" ? "PowerShell (Desatendido)" : "Terminal Bash"}
              </span>
              <button
                type="button"
                className={`q-enroll-copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Comando</span>
                  </>
                )}
              </button>
            </div>
            <pre className="q-enroll-code-block">
              <code>{activeCommand}</code>
            </pre>
          </div>

          {/* Características y Garantías */}
          <div className="q-enroll-features">
            <div className="q-enroll-feature-item">
              <ShieldCheck size={16} className="q-feature-icon" />
              <span>
                {selectedOS === "windows"
                  ? "Configura persistencia automática (HKLM/HKCU) y arranque invisible en segundo plano."
                  : "Crea e inicia automáticamente el servicio systemd de arranque automático."}
              </span>
            </div>
            <div className="q-enroll-feature-item" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 240px" }}>
                <Download size={18} className="q-feature-icon" style={{ flexShrink: 0, color: "var(--color-brand-primary)" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                    Descarga directa del agente ({binaryFilename})
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                    Binario nativo compilado oficial (~8.3 MB) listo para ejecución o despliegue manual.
                  </span>
                </div>
              </div>
              <a
                href={binaryDownloadUrl}
                download={binaryFilename}
                target="_blank"
                rel="noreferrer"
                className="q-enroll-direct-download-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "var(--color-brand-primary)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-md, 6px)",
                  textDecoration: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "opacity 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <Download size={14} />
                Descargar {binaryFilename}
              </a>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="q-enroll-footer">
          <span className="q-enroll-hint">
            El equipo aparecerá en su lista tan pronto como se complete la descarga (~3-5 seg).
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
