import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  RefreshCw,
  Edit3,
  Sliders,
  FileCode,
  X,
  ShieldCheck,
  Zap,
  Tag,
  Plus,
  Trash2,
  Copy,
  Sparkles,
} from "lucide-react";
import { Card } from "../components/Card/Card";
import { Button } from "../components/Button/Button";
import { Badge } from "../components/Badge/Badge";
import { KpiCard } from "../components/KpiCard/KpiCard";
import {
  getFinOpsOverview,
  updateFinOpsSettings,
  getFinOpsOrganizations,
  overrideOrgBilling,
  getFinOpsWebhooks,
  retryFinOpsWebhook,
  getBillingPlans,
  getAdminDiscounts,
  createAdminDiscount,
  toggleAdminDiscount,
  deleteAdminDiscount,
} from "../services/api";
import type {
  FinOpsOverview,
  SubscriptionOverview,
  FinOpsWebhookEvent,
  BillingPlan,
  DiscountCodeItem,
} from "../services/api";
import "./AdminFinOpsView.css";

export const AdminFinOpsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"tenants" | "webhooks" | "prices" | "discounts">("tenants");
  const [overview, setOverview] = useState<FinOpsOverview | null>(null);
  const [organizations, setOrganizations] = useState<SubscriptionOverview[]>([]);
  const [webhooks, setWebhooks] = useState<FinOpsWebhookEvent[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCodeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchOrg, setSearchOrg] = useState<string>("");
  const [searchDiscount, setSearchDiscount] = useState<string>("");
  const [webhookFilter, setWebhookFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Modal de Override Tenant
  const [selectedOrg, setSelectedOrg] = useState<SubscriptionOverview | null>(null);
  const [overridePlanCode, setOverridePlanCode] = useState<string>("");
  const [overrideStatus, setOverrideStatus] = useState<string>("");
  const [overrideBypass, setOverrideBypass] = useState<boolean>(false);
  const [overrideCustomLimit, setOverrideCustomLimit] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");

  // Modal de Inspección Webhook
  const [inspectedWebhook, setInspectedWebhook] = useState<FinOpsWebhookEvent | null>(null);

  // Modal de Creación de Cupón / Descuento
  const [showNewDiscountModal, setShowNewDiscountModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [newValue, setNewValue] = useState<string>("20");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newMaxRedemptions, setNewMaxRedemptions] = useState<string>("");
  const [newValidDays, setNewValidDays] = useState<string>("30");
  const [newApplicablePlans, setNewApplicablePlans] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const [ovData, orgsData, whData, plansData, discData] = await Promise.all([
        getFinOpsOverview(),
        getFinOpsOrganizations(),
        getFinOpsWebhooks(webhookFilter === "all" ? undefined : webhookFilter),
        getBillingPlans(),
        getAdminDiscounts(),
      ]);
      setOverview(ovData);
      setOrganizations(orgsData);
      setWebhooks(whData);
      setPlans(plansData);
      setDiscounts(discData);
    } catch (err: any) {
      console.error("Error cargando FinOps:", err);
      setFeedback({ type: "error", message: err.message || "Error al cargar consola FinOps." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [webhookFilter]);

  // Generador de código aleatorio para cupones
  const handleGenerateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let part = "";
    for (let i = 0; i < 6; i++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(`QRMM-${part}`);
  };

  // Manejo de Kill-Switch Global
  const handleToggleEnforcement = async () => {
    if (!overview) return;
    const current = overview.system_config.billing_enforcement_enabled;
    const confirmed = window.confirm(
      current
        ? "ADVERTENCIA: ¿Deseas DESACTIVAR la exigencia de facturación global? Ningún cliente será bloqueado por cuotas de equipos durante este período."
        : "¿Deseas ACTIVAR nuevamente la exigencia de facturación en toda la plataforma?"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await updateFinOpsSettings({ billing_enforcement_enabled: !current });
      setFeedback({
        type: "success",
        message: !current
          ? "Exigencia de facturación ACTIVADA con éxito."
          : "Exigencia de facturación DESACTIVADA. Plataforma en modo permisivo / contingencia.",
      });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al actualizar control global." });
    } finally {
      setActionLoading(false);
    }
  };

  // Cambio de Proveedor por Defecto
  const handleChangeProvider = async (provider: string) => {
    try {
      setActionLoading(true);
      await updateFinOpsSettings({ default_provider: provider });
      setFeedback({ type: "success", message: `Proveedor predeterminado cambiado a ${provider}.` });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al cambiar proveedor." });
    } finally {
      setActionLoading(false);
    }
  };

  // Guardar Override de Organización
  const handleSaveOverride = async () => {
    if (!selectedOrg) return;
    try {
      setActionLoading(true);
      const limitVal = overrideCustomLimit.trim() === "" ? undefined : parseInt(overrideCustomLimit, 10);
      await overrideOrgBilling(selectedOrg.organization_id, {
        plan_code: overridePlanCode || undefined,
        status: overrideStatus || undefined,
        billing_bypassed: overrideBypass,
        custom_device_limit: isNaN(limitVal as number) ? undefined : limitVal,
        reason: overrideReason || "Ajuste manual FinOps SuperAdmin",
      });
      setFeedback({
        type: "success",
        message: `Facturación de la organización '${selectedOrg.organization_name}' actualizada con éxito.`,
      });
      setSelectedOrg(null);
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al aplicar override." });
    } finally {
      setActionLoading(false);
    }
  };

  // Reintentar Webhook
  const handleRetryWebhook = async (eventId: string) => {
    try {
      setActionLoading(true);
      const res = await retryFinOpsWebhook(eventId);
      if (res.success) {
        setFeedback({ type: "success", message: "Webhook reintentado y procesado exitosamente." });
      } else {
        setFeedback({ type: "error", message: `Fallo al reintentar webhook: ${res.error}` });
      }
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al reintentar webhook." });
    } finally {
      setActionLoading(false);
    }
  };

  // Crear Cupón de Descuento
  const handleCreateDiscount = async () => {
    if (!newCode.trim()) {
      alert("Por favor ingresa o genera un código para el cupón.");
      return;
    }
    const numVal = parseFloat(newValue);
    if (isNaN(numVal) || numVal <= 0) {
      alert("El valor del descuento debe ser mayor a 0.");
      return;
    }

    try {
      setActionLoading(true);
      let expDate: string | null = null;
      const days = parseInt(newValidDays, 10);
      if (!isNaN(days) && days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expDate = d.toISOString();
      }

      const maxRedemp = newMaxRedemptions.trim() === "" ? null : parseInt(newMaxRedemptions, 10);

      await createAdminDiscount({
        code: newCode.trim().toUpperCase(),
        description: newDescription || undefined,
        discount_type: newDiscountType,
        value: numVal,
        currency: "USD",
        max_redemptions: isNaN(maxRedemp as number) ? null : maxRedemp,
        valid_until: expDate,
        applicable_plans: newApplicablePlans.length > 0 ? newApplicablePlans : undefined,
      });

      setFeedback({ type: "success", message: `Cupón '${newCode.trim().toUpperCase()}' creado con éxito.` });
      setShowNewDiscountModal(false);
      setNewCode("");
      setNewDescription("");
      setNewMaxRedemptions("");
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al crear código de descuento." });
    } finally {
      setActionLoading(false);
    }
  };

  // Alternar Estado Cupón
  const handleToggleDiscount = async (discountId: string) => {
    try {
      setActionLoading(true);
      await toggleAdminDiscount(discountId);
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al alternar cupón." });
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar Cupón
  const handleDeleteDiscount = async (discountId: string, code: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el cupón '${code}'?`)) return;
    try {
      setActionLoading(true);
      await deleteAdminDiscount(discountId);
      setFeedback({ type: "info", message: `Cupón '${code}' eliminado.` });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al eliminar cupón." });
    } finally {
      setActionLoading(false);
    }
  };

  // Copiar código al portapapeles
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setFeedback({ type: "info", message: `Código '${code}' copiado al portapapeles.` });
  };

  // Filtrado de organizaciones
  const filteredOrgs = organizations.filter((o) => {
    const term = searchOrg.toLowerCase();
    return o.organization_name.toLowerCase().includes(term) || o.plan_code.toLowerCase().includes(term);
  });

  // Filtrado de cupones
  const filteredDiscounts = discounts.filter((d) => {
    const term = searchDiscount.toLowerCase();
    return (
      d.code.toLowerCase().includes(term) ||
      (d.description && d.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="q-finops-view">
      {/* Banner de Feedback */}
      {feedback && (
        <div className={`q-finops-feedback q-finops-feedback--${feedback.type}`}>
          {feedback.type === "success" && <CheckCircle2 size={18} />}
          {feedback.type === "error" && <AlertTriangle size={18} />}
          {feedback.type === "info" && <ShieldAlert size={18} />}
          <span>{feedback.message}</span>
          <button className="q-finops-feedback__close" onClick={() => setFeedback(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Cabecera y Kill-Switch */}
      <div className="q-finops-header">
        <div>
          <div className="q-finops-header__title-row">
            <h1>FinOps & Operaciones de Facturación</h1>
            <Badge variant="info">SuperAdmin Hub</Badge>
            {overview?.system_config.billing_enforcement_enabled ? (
              <Badge variant="success">
                <ShieldCheck size={14} style={{ marginRight: 4 }} /> Enforcement Activo
              </Badge>
            ) : (
              <Badge variant="danger">
                <AlertTriangle size={14} style={{ marginRight: 4 }} /> Kill-Switch Activo (Permisivo)
              </Badge>
            )}
          </div>
          <p>
            Control centralizado de ingresos recurrentes (MRR/ARR), códigos de descuento, kill-switch de contingencia, overrides de límites y auditoría multi-proveedor.
          </p>
        </div>

        <div className="q-finops-header__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            loading={loading}
          >
            <RefreshCw size={14} /> Sincronizar
          </Button>

          <Button
            variant={overview?.system_config.billing_enforcement_enabled ? "danger" : "primary"}
            size="sm"
            onClick={handleToggleEnforcement}
            loading={actionLoading}
          >
            <Power size={14} />
            {overview?.system_config.billing_enforcement_enabled
              ? "Desactivar Facturación (Kill-Switch)"
              : "Reanudar Facturación Global"}
          </Button>
        </div>
      </div>

      {/* Fila de Métricas KPIs */}
      <div className="q-finops-kpi-grid">
        <KpiCard
          title="MRR (Ingresos Mensuales)"
          value={`$${(overview?.mrr || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtitle={`ARR Proyectado: $${(overview?.arr || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`}
          icon={<DollarSign size={20} />}
        />

        <KpiCard
          title="Suscripciones Activas"
          value={String(overview?.active_subscriptions || 0)}
          subtitle={`${overview?.past_due_subscriptions || 0} en mora | ${overview?.cancelled_subscriptions || 0} canceladas`}
          icon={<TrendingUp size={20} />}
        />

        <KpiCard
          title="Tenants / Organizaciones"
          value={String(overview?.total_organizations || 0)}
          subtitle={`${overview?.bypassed_organizations || 0} cuentas VIP / Bypass activo`}
          icon={<Layers size={20} />}
        />

        <KpiCard
          title="Cupones de Descuento"
          value={`${discounts.filter((d) => d.is_active).length} Activos`}
          subtitle={`${discounts.reduce((acc, d) => acc + d.times_redeemed, 0)} canjes totales realizados`}
          icon={<Tag size={20} />}
        />
      </div>

      {/* Centro de Control de Operaciones */}
      <Card className="q-finops-settings-card">
        <div className="q-finops-settings-card__header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sliders size={18} style={{ color: "var(--color-brand-primary)" }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>Configuración de Motores de Pago & Contingencia</h3>
          </div>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Última actualización: {overview?.system_config.updated_at ? new Date(overview.system_config.updated_at).toLocaleString() : "N/A"}
          </span>
        </div>

        <div className="q-finops-settings-grid">
          <div className="q-finops-setting-item">
            <span className="q-finops-setting-item__label">Pasarela Predeterminada</span>
            <div className="q-finops-provider-buttons">
              <button
                className={`q-finops-provider-btn ${overview?.system_config.default_provider === "lemonsqueezy" ? "active" : ""}`}
                onClick={() => handleChangeProvider("lemonsqueezy")}
                disabled={actionLoading}
              >
                🍋 Lemon Squeezy (MoR)
              </button>
              <button
                className={`q-finops-provider-btn ${overview?.system_config.default_provider === "paddle" ? "active" : ""}`}
                onClick={() => handleChangeProvider("paddle")}
                disabled={actionLoading}
              >
                🏓 Paddle Billing v2
              </button>
            </div>
            <span className="q-finops-setting-item__help">
              Define qué pasarela genera los nuevos checkouts de clientes.
            </span>
          </div>

          <div className="q-finops-setting-item">
            <span className="q-finops-setting-item__label">Período de Gracia (Días)</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                min="0"
                max="30"
                className="q-finops-input"
                style={{ width: "80px" }}
                defaultValue={overview?.system_config.grace_period_days || 7}
                onBlur={async (e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 0) {
                    await updateFinOpsSettings({ grace_period_days: val });
                    setFeedback({ type: "success", message: `Período de gracia actualizado a ${val} días.` });
                    fetchData();
                  }
                }}
              />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>días sin suspender telemetría</span>
            </div>
            <span className="q-finops-setting-item__help">
              Tiempo permitido para corregir tarjeta antes de pausar entitlements.
            </span>
          </div>

          <div className="q-finops-setting-item">
            <span className="q-finops-setting-item__label">Estado del Kill-Switch</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: overview?.system_config.billing_enforcement_enabled
                    ? "var(--color-status-success)"
                    : "var(--color-status-danger)",
                }}
              >
                {overview?.system_config.billing_enforcement_enabled ? "Activo (Restricciones activas)" : "Inactivo (Tolerante / Contingencia)"}
              </span>
            </div>
            <span className="q-finops-setting-item__help">
              Si hay fallas en pasarelas, desactívalo para permitir enrolar agentes sin bloqueo.
            </span>
          </div>
        </div>
      </Card>

      {/* Sub-Tabs de Navegación Operativa */}
      <div className="q-finops-subtabs">
        <button
          className={`q-finops-subtab ${activeSubTab === "tenants" ? "q-finops-subtab--active" : ""}`}
          onClick={() => setActiveSubTab("tenants")}
        >
          <Layers size={16} /> Clientes & Overrides de Límites ({organizations.length})
        </button>
        <button
          className={`q-finops-subtab ${activeSubTab === "discounts" ? "q-finops-subtab--active" : ""}`}
          onClick={() => setActiveSubTab("discounts")}
        >
          <Tag size={16} /> Cupones & Descuentos ({discounts.length})
        </button>
        <button
          className={`q-finops-subtab ${activeSubTab === "webhooks" ? "q-finops-subtab--active" : ""}`}
          onClick={() => setActiveSubTab("webhooks")}
        >
          <Zap size={16} /> Auditoría de Webhooks ({webhooks.length})
        </button>
        <button
          className={`q-finops-subtab ${activeSubTab === "prices" ? "q-finops-subtab--active" : ""}`}
          onClick={() => setActiveSubTab("prices")}
        >
          <DollarSign size={16} /> Precios & Variantes ({plans.length})
        </button>
      </div>

      {/* TAB 1: Clientes & Overrides */}
      {activeSubTab === "tenants" && (
        <Card className="q-finops-content-card">
          <div className="q-finops-filter-bar">
            <div className="q-finops-search-box">
              <Search size={16} className="q-finops-search-icon" />
              <input
                type="text"
                placeholder="Buscar por cliente o plan..."
                value={searchOrg}
                onChange={(e) => setSearchOrg(e.target.value)}
                className="q-finops-search-input"
              />
            </div>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              Mostrando {filteredOrgs.length} organizaciones
            </span>
          </div>

          <div className="q-finops-table-container">
            <table className="q-finops-table">
              <thead>
                <tr>
                  <th>Cliente / Organización</th>
                  <th>Plan Actual</th>
                  <th>Estado</th>
                  <th>Cuota de Equipos</th>
                  <th>Exoneración (Bypass)</th>
                  <th>Proveedor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-secondary)" }}>
                      No se encontraron organizaciones con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => {
                    const maxDev = org.max_devices !== null && org.max_devices !== undefined ? org.max_devices : "Ilimitado";
                    const isExceeded = org.max_devices !== null && org.max_devices !== undefined && org.devices_count >= org.max_devices;
                    return (
                      <tr key={org.organization_id}>
                        <td>
                          <strong>{org.organization_name}</strong>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{org.organization_id}</div>
                        </td>
                        <td>
                          <Badge variant="info">
                            {org.plan_name.toUpperCase()} ({org.billing_cycle === "yearly" ? "Anual" : "Mensual"})
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            variant={
                              org.status === "active"
                                ? "success"
                                : org.status === "past_due"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {org.status.toUpperCase()}
                            {org.in_grace_period && ` (${org.grace_period_days_left}d gracia)`}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: isExceeded && !org.billing_bypassed ? "var(--color-status-danger)" : "inherit" }}>
                              {org.devices_count} / {maxDev}
                            </span>
                            {org.custom_device_limit && (
                              <Badge variant="info">Límite Especial: {org.custom_device_limit}</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          {org.billing_bypassed ? (
                            <Badge variant="success">VIP / Exonerado</Badge>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Estándar</span>
                          )}
                        </td>
                        <td>
                          <span style={{ textTransform: "capitalize", fontSize: 13 }}>{org.provider || "Manual"}</span>
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org);
                              setOverridePlanCode(org.plan_code);
                              setOverrideStatus(org.status);
                              setOverrideBypass(Boolean(org.billing_bypassed));
                              setOverrideCustomLimit(org.custom_device_limit ? String(org.custom_device_limit) : "");
                              setOverrideReason("");
                            }}
                          >
                            <Edit3 size={13} /> Modificar
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: Cupones & Descuentos */}
      {activeSubTab === "discounts" && (
        <Card className="q-finops-content-card">
          <div className="q-finops-filter-bar">
            <div className="q-finops-search-box">
              <Search size={16} className="q-finops-search-icon" />
              <input
                type="text"
                placeholder="Buscar por código o descripción..."
                value={searchDiscount}
                onChange={(e) => setSearchDiscount(e.target.value)}
                className="q-finops-search-input"
              />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {filteredDiscounts.length} cupones
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleGenerateRandomCode();
                  setShowNewDiscountModal(true);
                }}
              >
                <Plus size={14} /> Crear Nuevo Cupón
              </Button>
            </div>
          </div>

          <div className="q-finops-table-container">
            <table className="q-finops-table">
              <thead>
                <tr>
                  <th>Código de Cupón</th>
                  <th>Descuento</th>
                  <th>Planes Aplicables</th>
                  <th>Canjes Realizados</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-secondary)" }}>
                      No hay cupones creados aún. Haz clic en "Crear Nuevo Cupón" para comenzar una campaña.
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((d) => {
                    const isExpired = d.valid_until && new Date(d.valid_until) < new Date();
                    const isLimitReached = Boolean(d.max_redemptions && d.times_redeemed >= d.max_redemptions);
                    return (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <code style={{ fontSize: 14, fontWeight: 700, background: "rgba(103, 58, 183, 0.08)", color: "var(--color-brand-primary)", padding: "4px 8px", borderRadius: 4 }}>
                              {d.code}
                            </code>
                            <button
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}
                              onClick={() => handleCopyCode(d.code)}
                              title="Copiar código"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                          {d.description && (
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{d.description}</div>
                          )}
                        </td>
                        <td>
                          <Badge variant="info" style={{ background: "rgba(103, 58, 183, 0.12)", color: "var(--color-brand-primary)", fontWeight: 700 }}>
                            {d.discount_type === "percentage" ? `${d.value}% OFF` : `$${d.value} ${d.currency} OFF`}
                          </Badge>
                        </td>
                        <td>
                          {d.applicable_plans && d.applicable_plans.length > 0 ? (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {d.applicable_plans.map((pl) => (
                                <Badge key={pl} variant="neutral" style={{ fontSize: 11 }}>
                                  {pl.toUpperCase()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Todos los Planes</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {d.times_redeemed} / {d.max_redemptions !== null ? d.max_redemptions : "∞"}
                          </span>
                          {isLimitReached && (
                            <div style={{ fontSize: 11, color: "var(--color-status-danger)" }}>Agotado</div>
                          )}
                        </td>
                        <td>
                          {d.valid_until ? (
                            <span style={{ fontSize: 12, color: isExpired ? "var(--color-status-danger)" : "inherit" }}>
                              {new Date(d.valid_until).toLocaleDateString()} {isExpired && "(Expirado)"}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Permanente</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={d.is_active && !isExpired && !isLimitReached ? "success" : "danger"}>
                            {d.is_active && !isExpired && !isLimitReached ? "ACTIVO" : "INACTIVO"}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleToggleDiscount(d.id)}
                              loading={actionLoading}
                            >
                              {d.is_active ? "Pausar" : "Activar"}
                            </Button>
                            <Button
                              variant="ghost-danger"
                              size="sm"
                              onClick={() => handleDeleteDiscount(d.id, d.code)}
                              loading={actionLoading}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Auditoría de Webhooks */}
      {activeSubTab === "webhooks" && (
        <Card className="q-finops-content-card">
          <div className="q-finops-filter-bar">
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "processed", "error"].map((st) => (
                <button
                  key={st}
                  className={`q-finops-filter-chip ${webhookFilter === st ? "active" : ""}`}
                  onClick={() => setWebhookFilter(st)}
                >
                  {st === "all" ? "Todos los Eventos" : st === "processed" ? "Procesados OK" : "Fallidos / Errores"}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              {webhooks.length} eventos registrados
            </span>
          </div>

          <div className="q-finops-table-container">
            <table className="q-finops-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pasarela</th>
                  <th>Tipo de Evento</th>
                  <th>ID Evento Pasarela</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-secondary)" }}>
                      No se han recibido eventos de webhook con el filtro actual.
                    </td>
                  </tr>
                ) : (
                  webhooks.map((wh) => (
                    <tr key={wh.id}>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {wh.received_at ? new Date(wh.received_at).toLocaleString() : "N/A"}
                      </td>
                      <td>
                        <Badge variant="neutral">
                          {wh.provider.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <code style={{ fontSize: 12, color: "var(--color-brand-primary)" }}>{wh.event_type}</code>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: "monospace" }}>{wh.event_id}</td>
                      <td>
                        <Badge variant={wh.status === "processed" ? "success" : "danger"}>
                          {wh.status.toUpperCase()}
                        </Badge>
                        {wh.error && (
                          <div style={{ fontSize: 11, color: "var(--color-status-danger)", marginTop: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {wh.error}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button variant="ghost" size="sm" onClick={() => setInspectedWebhook(wh)}>
                            <FileCode size={13} /> JSON
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRetryWebhook(wh.id)}
                            loading={actionLoading}
                          >
                            <RotateCcw size={13} /> Reintentar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Precios & Mapeo de Pasarelas */}
      {activeSubTab === "prices" && (
        <Card className="q-finops-content-card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-subtle)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 16 }}>Identificadores de Precios / Variantes</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
              Vincule los identificadores generados en Lemon Squeezy (Variant IDs) y Paddle (Price IDs) con los planes del sistema.
            </p>
          </div>

          <div style={{ padding: "20px", display: "grid", gap: "20px" }}>
            {plans.map((p) => (
              <div key={p.id} className="q-finops-plan-card">
                <div className="q-finops-plan-card__header">
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{p.name} ({p.code.toUpperCase()})</h4>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                      Límite base: {p.max_devices ? `${p.max_devices} equipos` : "Ilimitado"}
                    </span>
                  </div>
                  <Badge variant="info">Activo en Catálogo</Badge>
                </div>

                <div className="q-finops-prices-list">
                  {p.prices.map((pr) => (
                    <div key={pr.id} className="q-finops-price-row">
                      <div style={{ width: 140 }}>
                        <strong>{pr.provider.toUpperCase()}</strong>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          {pr.billing_cycle === "yearly" ? "Facturación Anual" : "Facturación Mensual"}
                        </div>
                      </div>

                      <div style={{ width: 100 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>${pr.amount} {pr.currency}</span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block" }}>
                          Provider Price / Variant ID:
                        </span>
                        <code style={{ fontSize: 13, background: "var(--color-surface-muted)", padding: "4px 8px", borderRadius: 4 }}>
                          {pr.provider_price_id || "(No asignado)"}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL: Crear Cupón de Descuento */}
      {showNewDiscountModal && (
        <div className="q-finops-modal-backdrop" onClick={() => setShowNewDiscountModal(false)}>
          <div className="q-finops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="q-finops-modal__header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>Generar Código de Descuento</h3>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Crea cupones para promociones, ofertas de lanzamiento o convenios especiales.
                </span>
              </div>
              <button className="q-finops-modal__close" onClick={() => setShowNewDiscountModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="q-finops-modal__body">
              <div className="q-finops-form-group">
                <label className="q-finops-label">Código del Cupón</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Ej: LANZAMIENTO50"
                    className="q-finops-input"
                    style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", flex: 1 }}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  />
                  <Button variant="secondary" size="sm" onClick={handleGenerateRandomCode}>
                    <Sparkles size={14} /> Aleatorio
                  </Button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="q-finops-form-group">
                  <label className="q-finops-label">Tipo de Descuento</label>
                  <select
                    className="q-finops-select"
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as "percentage" | "fixed")}
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo (USD $)</option>
                  </select>
                </div>

                <div className="q-finops-form-group">
                  <label className="q-finops-label">
                    Valor {newDiscountType === "percentage" ? "(%)" : "($ USD)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newDiscountType === "percentage" ? 100 : 9999}
                    className="q-finops-input"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="q-finops-form-group">
                <label className="q-finops-label">Descripción Interna (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Campaña Black Friday o descuento B2B cliente VIP"
                  className="q-finops-input"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="q-finops-form-group">
                  <label className="q-finops-label">Límite de Canjes</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Vacío = Ilimitado"
                    className="q-finops-input"
                    value={newMaxRedemptions}
                    onChange={(e) => setNewMaxRedemptions(e.target.value)}
                  />
                  <span className="q-finops-help">Máximo de veces que se puede usar.</span>
                </div>

                <div className="q-finops-form-group">
                  <label className="q-finops-label">Vigencia (Días)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 30 días"
                    className="q-finops-input"
                    value={newValidDays}
                    onChange={(e) => setNewValidDays(e.target.value)}
                  />
                  <span className="q-finops-help">Días a partir de hoy.</span>
                </div>
              </div>

              <div className="q-finops-form-group">
                <label className="q-finops-label">Planes Admitidos</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  {["starter", "professional", "business", "enterprise"].map((pCode) => (
                    <label key={pCode} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newApplicablePlans.includes(pCode)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApplicablePlans([...newApplicablePlans, pCode]);
                          } else {
                            setNewApplicablePlans(newApplicablePlans.filter((x) => x !== pCode));
                          }
                        }}
                      />
                      <span style={{ textTransform: "capitalize" }}>{pCode}</span>
                    </label>
                  ))}
                </div>
                <span className="q-finops-help">Si no seleccionas ninguno, aplicará para todos los planes.</span>
              </div>
            </div>

            <div className="q-finops-modal__footer">
              <Button variant="ghost" onClick={() => setShowNewDiscountModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreateDiscount} loading={actionLoading}>
                Guardar y Activar Cupón
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Override de Facturación por Tenant */}
      {selectedOrg && (
        <div className="q-finops-modal-backdrop" onClick={() => setSelectedOrg(null)}>
          <div className="q-finops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="q-finops-modal__header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>Gestión de Facturación & Cuotas</h3>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Organización: <strong>{selectedOrg.organization_name}</strong>
                </span>
              </div>
              <button className="q-finops-modal__close" onClick={() => setSelectedOrg(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="q-finops-modal__body">
              <div className="q-finops-form-group">
                <label className="q-finops-label">Plan Asignado</label>
                <select
                  className="q-finops-select"
                  value={overridePlanCode}
                  onChange={(e) => setOverridePlanCode(e.target.value)}
                >
                  <option value="starter">Starter (5 equipos)</option>
                  <option value="professional">Professional (25 equipos)</option>
                  <option value="business">Business (250 equipos)</option>
                  <option value="enterprise">Enterprise (Personalizado)</option>
                </select>
                <span className="q-finops-help">Ajusta el paquete de capacidades sin requerir pago inmediato.</span>
              </div>

              <div className="q-finops-form-group">
                <label className="q-finops-label">Estado de la Suscripción</label>
                <select
                  className="q-finops-select"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                >
                  <option value="active">Activa (Acceso normal)</option>
                  <option value="trialing">En Período de Prueba</option>
                  <option value="past_due">En Mora (Past Due)</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="expired">Expirada</option>
                </select>
              </div>

              <div className="q-finops-form-group">
                <label className="q-finops-label">Límite Personalizado de Equipos (Opcional)</label>
                <input
                  type="number"
                  placeholder="Ej: 50 (dejar vacío para usar el límite del plan)"
                  className="q-finops-input"
                  value={overrideCustomLimit}
                  onChange={(e) => setOverrideCustomLimit(e.target.value)}
                />
                <span className="q-finops-help">
                  Permite ampliar la cantidad máxima de equipos que puede enrolar sin cambiar su plan comercial.
                </span>
              </div>

              <div className="q-finops-form-group">
                <label className="q-finops-checkbox-label">
                  <input
                    type="checkbox"
                    checked={overrideBypass}
                    onChange={(e) => setOverrideBypass(e.target.checked)}
                  />
                  <span>
                    <strong>Exoneración Total de Facturación (Bypass VIP / Internal Lab)</strong>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 400 }}>
                      Habilita enrolamiento ilimitado y todas las capacidades sin exigir pagos ni suscripción activa.
                    </div>
                  </span>
                </label>
              </div>

              <div className="q-finops-form-group">
                <label className="q-finops-label">Motivo del Ajuste (Auditoría)</label>
                <input
                  type="text"
                  placeholder="Ej: Acuerdo comercial firmado, extensión de cortesía o cuenta demo interna"
                  className="q-finops-input"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>

            <div className="q-finops-modal__footer">
              <Button variant="ghost" onClick={() => setSelectedOrg(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveOverride} loading={actionLoading}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Inspección de Payload de Webhook */}
      {inspectedWebhook && (
        <div className="q-finops-modal-backdrop" onClick={() => setInspectedWebhook(null)}>
          <div className="q-finops-modal q-finops-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="q-finops-modal__header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>Detalle del Evento de Webhook</h3>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {inspectedWebhook.provider.toUpperCase()} — {inspectedWebhook.event_type}
                </span>
              </div>
              <button className="q-finops-modal__close" onClick={() => setInspectedWebhook(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="q-finops-modal__body">
              <pre className="q-finops-json-viewer">
                {JSON.stringify(inspectedWebhook.payload, null, 2)}
              </pre>
            </div>

            <div className="q-finops-modal__footer">
              <Button variant="secondary" onClick={() => setInspectedWebhook(null)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleRetryWebhook(inspectedWebhook.id);
                  setInspectedWebhook(null);
                }}
                loading={actionLoading}
              >
                <RotateCcw size={14} /> Reintentar Evento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
