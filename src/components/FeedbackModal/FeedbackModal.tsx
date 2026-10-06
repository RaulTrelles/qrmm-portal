import React, { useState, useEffect } from "react";
import { MessageSquarePlus, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import { createSupportTicket } from "../../services/api";
import "./FeedbackModal.css";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onTicketCreated }) => {
  const { user, activeOrganization } = useAuth();

  const [category, setCategory] = useState<string>("BUG");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setContactName(user?.full_name || "");
      setContactEmail(user?.email || "");
      setIsSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Por favor completa el título y el detalle de tu reporte.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const deviceInfo = {
        current_page: window.location.pathname,
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
        user_agent: navigator.userAgent,
        organization: activeOrganization?.name || "General",
      };

      await createSupportTicket({
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        contact_name: contactName.trim() || user?.full_name || "Usuario Consola",
        contact_email: contactEmail.trim() || user?.email || undefined,
        device_info: deviceInfo,
      });

      setIsSuccess(true);
      if (onTicketCreated) onTicketCreated();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el reporte. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="q-feedback-overlay" onClick={onClose}>
      <div className="q-feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="q-feedback-header">
          <div className="q-feedback-title-group">
            <h3>💬 Reportar Problema o Sugerencia</h3>
            <p>Tu feedback nos ayuda a mejorar. El equipo de soporte (soporte@qhapana.com) te responderá directamente.</p>
          </div>
          <button className="q-feedback-close-btn" onClick={onClose} aria-label="Cerrar ventana">
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="q-feedback-success">
            <div className="q-feedback-success-icon">
              <CheckCircle2 size={32} />
            </div>
            <h4>¡Reporte recibido con éxito!</h4>
            <p>
              Hemos registrado tu incidencia y notificado inmediatamente a <strong>soporte@qhapana.com</strong>. Te
              responderemos por correo a <strong>{contactEmail || user?.email}</strong> y podrás ver el avance en la
              sección de <strong>Soporte y Sugerencias</strong> de tu consola.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setIsSuccess(false);
                setTitle("");
                setDescription("");
                onClose();
              }}
            >
              Entendido
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="q-feedback-body">
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#b91c1c",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Categoría */}
              <div className="q-feedback-form-group">
                <label className="q-feedback-label">¿Qué deseas comunicar?</label>
                <div className="q-feedback-category-grid">
                  <div
                    className={`q-feedback-cat-card ${category === "BUG" ? "active" : ""}`}
                    onClick={() => setCategory("BUG")}
                  >
                    <span className="q-feedback-cat-icon">🐛</span>
                    <div className="q-feedback-cat-text">
                      <span className="q-feedback-cat-name">Error o Problema</span>
                      <span className="q-feedback-cat-desc">Fallo técnico o desconexión</span>
                    </div>
                  </div>

                  <div
                    className={`q-feedback-cat-card ${category === "SUGGESTION" ? "active" : ""}`}
                    onClick={() => setCategory("SUGGESTION")}
                  >
                    <span className="q-feedback-cat-icon">💡</span>
                    <div className="q-feedback-cat-text">
                      <span className="q-feedback-cat-name">Sugerencia de Mejora</span>
                      <span className="q-feedback-cat-desc">Nueva función o idea</span>
                    </div>
                  </div>

                  <div
                    className={`q-feedback-cat-card ${category === "QUESTION" ? "active" : ""}`}
                    onClick={() => setCategory("QUESTION")}
                  >
                    <span className="q-feedback-cat-icon">❓</span>
                    <div className="q-feedback-cat-text">
                      <span className="q-feedback-cat-name">Duda Técnica</span>
                      <span className="q-feedback-cat-desc">Instalación o agente</span>
                    </div>
                  </div>

                  <div
                    className={`q-feedback-cat-card ${category === "BILLING" ? "active" : ""}`}
                    onClick={() => setCategory("BILLING")}
                  >
                    <span className="q-feedback-cat-icon">💳</span>
                    <div className="q-feedback-cat-text">
                      <span className="q-feedback-cat-name">Facturación / Cuenta</span>
                      <span className="q-feedback-cat-desc">Planes, pagos o recibos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Título */}
              <div className="q-feedback-form-group">
                <label className="q-feedback-label" htmlFor="feedback-title">
                  Título breve del reporte *
                </label>
                <input
                  id="feedback-title"
                  type="text"
                  className="q-feedback-input"
                  placeholder="Ej. El agente de Windows no reporta telemetría de disco secundario"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="q-feedback-form-group">
                <label className="q-feedback-label" htmlFor="feedback-desc">
                  Detalles y pasos para reproducirlo *
                </label>
                <textarea
                  id="feedback-desc"
                  className="q-feedback-textarea"
                  placeholder="Describe con el mayor detalle posible lo ocurrido, qué esperabas que pasara o qué nueva característica te gustaría ver implementada..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Prioridad y Correo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="q-feedback-form-group">
                  <label className="q-feedback-label" htmlFor="feedback-priority">
                    Prioridad estimada
                  </label>
                  <select
                    id="feedback-priority"
                    className="q-feedback-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Baja (Mejora estética / Idea)</option>
                    <option value="MEDIUM">Media (Comportamiento irregular)</option>
                    <option value="HIGH">Alta (Función bloqueada)</option>
                    <option value="CRITICAL">Urgente (Servicio no responde)</option>
                  </select>
                </div>

                <div className="q-feedback-form-group">
                  <label className="q-feedback-label" htmlFor="feedback-email">
                    Correo para notificarte respuesta
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    className="q-feedback-input"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="q-feedback-footer">
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Enviando reporte..." : "Enviar Reporte"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const FeedbackFAB: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  return (
    <button className="q-feedback-fab" onClick={onOpen} title="¿Tienes dudas o sugerencias? Reportar problema">
      <MessageSquarePlus size={18} />
      <span className="q-feedback-fab-label">Ayuda & Feedback</span>
    </button>
  );
};
