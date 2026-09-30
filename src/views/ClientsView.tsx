import React, { useState, useEffect, useMemo } from "react";
import type { OrganizationItem } from "../types/organization";
import { createOrganization, regenerateOrgToken, API_BASE } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KpiCard } from "../components/KpiCard/KpiCard";
import { Button } from "../components/Button/Button";
import { Badge } from "../components/Badge/Badge";
import {
  Building2,
  Server,
  Monitor,
  Plus,
  Copy,
  Check,
  RefreshCw,
  X,
  Terminal,
} from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";
import "./ClientsView.css";

interface ClientsViewProps {
  onSelectClientForDevices?: (org: OrganizationItem) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onSelectClientForDevices }) => {
  const { organizationsList, refreshOrganizations, setActiveOrganization } = useAuth();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [plan, setPlan] = useState<string>("PRO");
  const [creating, setCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    refreshOrganizations();
  }, []);

  const totalClients = organizationsList.length;
  const totalMachines = useMemo(
    () => organizationsList.reduce((acc, o) => acc + (o.stats?.total_devices || 0), 0),
    [organizationsList]
  );
  const totalWindows = useMemo(
    () => organizationsList.reduce((acc, o) => acc + (o.stats?.windows_count || 0), 0),
    [organizationsList]
  );
  const totalLinux = useMemo(
    () => organizationsList.reduce((acc, o) => acc + (o.stats?.linux_count || 0), 0),
    [organizationsList]
  );

  const handleCopyCommand = async (token: string) => {
    const cmd = `[Net.ServicePointManager]::SecurityProtocol = 3072; irm "${API_BASE}/install.ps1?token=${token}" | iex`;

    const success = await copyToClipboard(cmd);
    if (success) {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("El nombre del cliente u organización es obligatorio");
      return;
    }

    try {
      setCreating(true);
      setFormError(null);
      await createOrganization({
        name: name.trim(),
        slug: slug.trim() || undefined,
        plan,
      });
      await refreshOrganizations();
      setModalOpen(false);
      setName("");
      setSlug("");
      setPlan("PRO");
    } catch (err: any) {
      setFormError(err.message || "Error al crear cliente");
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas regenerar el token de enrolamiento para este cliente?")) return;
    try {
      await regenerateOrgToken(id);
      await refreshOrganizations();
    } catch (err: any) {
      alert(err.message || "Error al regenerar token");
    }
  };

  const handleViewClientDevices = (org: OrganizationItem) => {
    setActiveOrganization(org);
    if (onSelectClientForDevices) {
      onSelectClientForDevices(org);
    }
  };

  return (
    <div className="q-clients-view">
      <div className="q-clients-header">
        <div className="q-clients-title-group">
          <h1 className="q-clients-title">Gestión de Clientes SaaS</h1>
          <p className="q-clients-desc">
            Administra los clientes de tu plataforma, sus máquinas conectadas (Windows/Linux) y tokens de instalación.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Nuevo Cliente
        </Button>
      </div>

      {/* KPI Row */}
      <div className="q-kpi-grid">
        <KpiCard
          title="Total Clientes / Tenants"
          value={totalClients}
          icon={<Building2 size={20} />}
          subtitle="Organizaciones activas en la nube"
        />
        <KpiCard
          title="Máquinas Administradas"
          value={totalMachines}
          icon={<Server size={20} />}
          subtitle="Equipos totales monitoreados"
        />
        <KpiCard
          title="Servidores Windows"
          value={totalWindows}
          icon={<Monitor size={20} />}
          subtitle="Estaciones y servidores Windows"
        />
        <KpiCard
          title="Servidores Linux"
          value={totalLinux}
          icon={<Terminal size={20} />}
          subtitle="Hosts Linux / Docker"
        />
      </div>

      {/* Table Container */}
      <div className="q-table-container">
        <table className="q-table">
          <thead>
            <tr>
              <th>Cliente / Organización</th>
              <th>Plan SaaS</th>
              <th>Equipos por SO</th>
              <th>Estado Máquinas</th>
              <th>Token de Enrolamiento</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {organizationsList.length === 0 ? (
              <tr>
                <td colSpan={6} className="q-table-empty">
                  No hay clientes registrados aún. Haz clic en "Nuevo Cliente" para comenzar.
                </td>
              </tr>
            ) : (
              organizationsList.map((org) => {
                const total = org.stats?.total_devices || 0;
                const online = org.stats?.online_devices || 0;
                const win = org.stats?.windows_count || 0;
                const lin = org.stats?.linux_count || 0;
                const isCopied = copiedToken === org.enrollment_token;

                return (
                  <tr key={org.id}>
                    <td>
                      <div className="q-table-hostname">
                        <Building2 size={16} style={{ color: "var(--color-brand-primary)" }} />
                        <span>{org.name}</span>
                      </div>
                      <div className="q-table-subtext">ID: {org.slug}</div>
                    </td>
                    <td>
                      <Badge variant={org.plan === "ENTERPRISE" ? "info" : "neutral"}>
                        {org.plan}
                      </Badge>
                    </td>
                    <td>
                      <div className="q-client-stats-badges">
                        <span className="q-stat-pill q-stat-pill--win">Win: {win}</span>
                        <span className="q-stat-pill q-stat-pill--lin">Lin: {lin}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={online > 0 ? "success" : "neutral"} pulse={online > 0}>
                        {online} / {total} Online
                      </Badge>
                    </td>
                    <td>
                      {org.enrollment_token ? (
                        <div className="q-token-badge-wrapper">
                          <span>{org.enrollment_token}</span>
                          <button
                            type="button"
                            className="q-copy-btn"
                            onClick={() => handleCopyCommand(org.enrollment_token!)}
                            title="Copiar comando PowerShell de este cliente"
                          >
                            {isCopied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>Sin token</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewClientDevices(org)}
                          title="Filtrar equipos de este cliente en el inventario"
                        >
                          Ver Equipos ({total})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw size={14} />}
                          onClick={() => handleRegenerate(org.id)}
                          title="Regenerar token de enrolamiento"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Cliente */}
      {modalOpen && (
        <div className="q-modal-overlay">
          <div className="q-client-modal">
            <div className="q-modal-header">
              <h2 className="q-modal-title">Registrar Nuevo Cliente SaaS</h2>
              <button
                type="button"
                className="q-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="q-login-error">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="q-modal-form">
              <div className="q-form-group">
                <label className="q-form-label">Nombre del Cliente / Empresa *</label>
                <div className="q-input-wrapper">
                  <input
                    type="text"
                    className="q-input-field"
                    placeholder="ej. Corporación Minera del Sur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Identificador (Slug) Opcional</label>
                <div className="q-input-wrapper">
                  <input
                    type="text"
                    className="q-input-field"
                    placeholder="ej. corp-minera (autogenerado si se omite)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Plan del Servicio</label>
                <div className="q-filter-group" style={{ width: "100%" }}>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="STARTER">Starter (Hasta 10 equipos)</option>
                    <option value="PRO">Pro (Hasta 50 equipos)</option>
                    <option value="ENTERPRISE">Enterprise (Ilimitado + Soporte 24/7)</option>
                  </select>
                </div>
              </div>

              <div className="q-modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creating}
                >
                  {creating ? "Creando..." : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
