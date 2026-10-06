import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  X,
  Building2,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KpiCard } from "../components/KpiCard/KpiCard";
import { Badge } from "../components/Badge/Badge";
import { Button } from "../components/Button/Button";
import { FeedbackModal } from "../components/FeedbackModal/FeedbackModal";
import {
  getClientTickets,
  getAdminTickets,
  respondToTicket,
  type SupportTicket,
} from "../services/api";
import "./SupportView.css";

export const SupportView: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const canReport = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedTicketForResponse, setSelectedTicketForResponse] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState<string>("");
  const [responseStatus, setResponseStatus] = useState<string>("RESOLVED");
  const [submittingResponse, setSubmittingResponse] = useState<boolean>(false);

  const fetchTickets = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = isSuperAdmin
        ? await getAdminTickets(statusFilter, categoryFilter)
        : await getClientTickets();
      setTickets(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al cargar los tickets de soporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, isSuperAdmin]);

  const handleOpenResponseModal = (ticket: SupportTicket) => {
    setSelectedTicketForResponse(ticket);
    setResponseText(ticket.admin_response || "");
    setResponseStatus(ticket.status === "OPEN" ? "RESOLVED" : ticket.status);
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForResponse || !responseText.trim()) return;

    setSubmittingResponse(true);
    try {
      await respondToTicket(selectedTicketForResponse.id, {
        admin_response: responseText.trim(),
        status: responseStatus,
      });
      setSelectedTicketForResponse(null);
      setResponseText("");
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || "Error al enviar la respuesta.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  // KPIs
  const totalTickets = tickets.length;
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inReviewCount = tickets.filter((t) => t.status === "IN_REVIEW").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  // Filtrado local por término de búsqueda
  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      (t.contact_name && t.contact_name.toLowerCase().includes(term)) ||
      (t.contact_email && t.contact_email.toLowerCase().includes(term)) ||
      (t.organization_name && t.organization_name.toLowerCase().includes(term))
    );
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "BUG":
        return { label: "🐛 Error / Problema", color: "danger" as const };
      case "SUGGESTION":
        return { label: "💡 Sugerencia", color: "brand" as const };
      case "QUESTION":
        return { label: "❓ Duda Técnica", color: "info" as const };
      case "BILLING":
        return { label: "💳 Facturación", color: "warning" as const };
      default:
        return { label: cat, color: "neutral" as const };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "RESOLVED":
        return <Badge variant="success">Resuelto</Badge>;
      case "IN_REVIEW":
        return <Badge variant="warning">En Revisión</Badge>;
      case "CLOSED":
        return <Badge variant="neutral">Cerrado</Badge>;
      default:
        return <Badge variant="info">Abierto</Badge>;
    }
  };

  return (
    <div className="q-support-view">
      {/* KPI Cards */}
      <div className="q-support-kpi-grid">
        <KpiCard
          title="Total de Reportes"
          value={totalTickets}
          icon={<LifeBuoy size={20} color="var(--color-brand-primary)" />}
          subtitle={isSuperAdmin ? "Histórico global" : "Tus reportes y consultas"}
        />
        <KpiCard
          title="Abiertos (Pendientes)"
          value={openCount}
          icon={<AlertCircle size={20} color="#3b82f6" />}
          subtitle="Aguardando revisión"
        />
        <KpiCard
          title="En Revisión"
          value={inReviewCount}
          icon={<Clock size={20} color="#f59e0b" />}
          subtitle="En proceso de análisis"
        />
        <KpiCard
          title="Resueltos / Solucionados"
          value={resolvedCount}
          icon={<CheckCircle2 size={20} color="#16a34a" />}
          subtitle="Con respuesta oficial"
        />
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "10px 14px", color: "#b91c1c", fontSize: "13px" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="q-support-toolbar">
        <div className="q-support-filters">
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={15} style={{ position: "absolute", left: 10, color: "var(--color-text-secondary)" }} />
            <input
              type="text"
              className="q-support-search"
              style={{ paddingLeft: 32 }}
              placeholder="Buscar por título, contenido o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="q-support-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="OPEN">Abiertos</option>
            <option value="IN_REVIEW">En Revisión</option>
            <option value="RESOLVED">Resueltos</option>
          </select>

          <select
            className="q-support-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="BUG">Errores y Fallas</option>
            <option value="SUGGESTION">Sugerencias de Mejora</option>
            <option value="QUESTION">Dudas Técnicas</option>
            <option value="BILLING">Facturación y Planes</option>
          </select>

          <Button variant="ghost" size="sm" onClick={fetchTickets} disabled={loading} title="Actualizar lista">
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </Button>
        </div>

        {canReport && (
          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Nuevo Reporte / Sugerencia
          </Button>
        )}
      </div>

      {/* List of Tickets */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-secondary)" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Cargando reportes y tickets de soporte...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="q-support-empty-state">
          <MessageSquare size={48} color="var(--color-brand-primary)" style={{ opacity: 0.5 }} />
          <h4>No hay reportes registrados</h4>
          <p>
            {searchTerm || statusFilter !== "ALL" || categoryFilter !== "ALL"
              ? "No se encontraron tickets con los filtros seleccionados."
              : "Si experimentas algún fallo técnico, tienes una idea o necesitas asistencia con un equipo, crea un reporte aquí y el equipo te responderá de inmediato."}
          </p>
          {canReport && (
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Enviar mi primer reporte
            </Button>
          )}
        </div>
      ) : (
        <div className="q-support-ticket-list">
          {filteredTickets.map((ticket) => {
            const catInfo = getCategoryLabel(ticket.category);
            return (
              <div key={ticket.id} className="q-support-ticket-card">
                <div className="q-support-ticket-card-header">
                  <div className="q-support-ticket-title-row">
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(99, 102, 241, 0.08)",
                        color: "var(--color-brand-primary)",
                      }}
                    >
                      {catInfo.label}
                    </span>
                    <h4 className="q-support-ticket-title">{ticket.title}</h4>
                    {getStatusBadge(ticket.status)}
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                      #{ticket.id.slice(0, 8)}
                    </span>
                  </div>

                  {isSuperAdmin && (
                    <Button variant="outline" size="sm" onClick={() => handleOpenResponseModal(ticket)}>
                      {ticket.admin_response ? "Editar Respuesta / Estado" : "Responder al Cliente"}
                    </Button>
                  )}
                </div>

                <div className="q-support-ticket-meta">
                  {ticket.organization_name && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Building2 size={13} /> {ticket.organization_name}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <UserIcon size={13} /> {ticket.contact_name} ({ticket.contact_email})
                  </span>
                  <span>📅 {new Date(ticket.created_at).toLocaleString()}</span>
                  <span>Prioridad: <strong>{ticket.priority}</strong></span>
                </div>

                <p className="q-support-ticket-desc">{ticket.description}</p>

                {/* Respuesta oficial de soporte si existe */}
                {ticket.admin_response && (
                  <div className="q-support-response-box">
                    <div className="q-support-response-header">
                      <span>
                        💬 Respuesta Oficial {ticket.responded_by_name ? `(${ticket.responded_by_name})` : ""}
                      </span>
                      {ticket.responded_at && (
                        <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>
                          {new Date(ticket.responded_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="q-support-response-text">{ticket.admin_response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Reporte */}
      <FeedbackModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={fetchTickets}
      />

      {/* Modal para que el Administrador responda al ticket */}
      {selectedTicketForResponse && (
        <div className="q-support-respond-modal" onClick={() => setSelectedTicketForResponse(null)}>
          <div className="q-support-respond-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="q-feedback-header">
              <div className="q-feedback-title-group">
                <h3>Responder al Cliente y Actualizar Estado</h3>
                <p>
                  Ticket #{selectedTicketForResponse.id.slice(0, 8)} &bull; {selectedTicketForResponse.contact_name}
                </p>
              </div>
              <button
                className="q-feedback-close-btn"
                onClick={() => setSelectedTicketForResponse(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendResponse}>
              <div className="q-feedback-body">
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                  <strong>Reporte del cliente:</strong> {selectedTicketForResponse.title}
                  <div style={{ color: "#475569", marginTop: 4 }}>{selectedTicketForResponse.description}</div>
                </div>

                <div className="q-feedback-form-group">
                  <label className="q-feedback-label">Nuevo Estado del Reporte</label>
                  <select
                    className="q-feedback-select"
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                  >
                    <option value="RESOLVED">✅ Resuelto (Problema solucionado / Sugerencia adoptada)</option>
                    <option value="IN_REVIEW">⏳ En Revisión (En investigación por ingeniería)</option>
                    <option value="OPEN">🔵 Mantener Abierto</option>
                    <option value="CLOSED">⚪ Cerrado / No procede</option>
                  </select>
                </div>

                <div className="q-feedback-form-group">
                  <label className="q-feedback-label">Respuesta Oficial para el Cliente *</label>
                  <textarea
                    className="q-feedback-textarea"
                    placeholder="Escribe la solución detallada, corrección implementada o explicación técnica que se enviará al correo del cliente..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                    📧 Se despachará una notificación por correo electrónico a{" "}
                    <strong>{selectedTicketForResponse.contact_email}</strong> de forma automática.
                  </span>
                </div>
              </div>

              <div className="q-feedback-footer">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setSelectedTicketForResponse(null)}
                  disabled={submittingResponse}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={submittingResponse}>
                  {submittingResponse ? "Enviando respuesta..." : "Enviar Respuesta y Notificar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
