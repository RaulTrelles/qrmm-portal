import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Check,
  X,
  Clock,
  Layers,
  Tag,
} from "lucide-react";
import { Card } from "../components/Card/Card";
import { Button } from "../components/Button/Button";
import { Badge } from "../components/Badge/Badge";
import { KpiCard } from "../components/KpiCard/KpiCard";
import {
  getCurrentSubscription,
  getBillingPlans,
  initiateBillingCheckout,
  cancelBillingSubscription,
  resumeBillingSubscription,
  validateDiscountCode,
} from "../services/api";
import type { SubscriptionOverview, BillingPlan, DiscountValidateResult } from "../services/api";
import "./BillingView.css";

export const BillingView: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionOverview | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedProvider, setSelectedProvider] = useState<string>("lemonsqueezy");
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Cupones de descuento
  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountValidateResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const [subData, plansData] = await Promise.all([
        getCurrentSubscription(),
        getBillingPlans(),
      ]);
      setSubscription(subData);
      setPlans(plansData);
      if (subData?.billing_cycle) {
        setSelectedCycle(subData.billing_cycle);
      }
      if (subData?.provider) {
        setSelectedProvider(subData.provider);
      }
    } catch (err: any) {
      console.error("Error al cargar información de facturación:", err);
      setFeedback({ type: "error", message: err.message || "No se pudo cargar la información de facturación." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyCoupon = async () => {
    const trimmed = couponInput.trim().toUpperCase();
    if (!trimmed) return;
    try {
      setValidatingCoupon(true);
      setCouponError(null);
      const res = await validateDiscountCode(trimmed);
      if (res.valid) {
        setAppliedCoupon(res);
      } else {
        setCouponError(res.message || "Cupón no válido.");
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError(err.message || "Error al validar el cupón.");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const handleInitiateCheckout = async (planCode: string) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await initiateBillingCheckout(
        planCode,
        selectedCycle,
        selectedProvider,
        appliedCoupon?.code
      );
      if (res.status === "active" || res.checkout_url === "free_grant") {
        setShowPlanModal(false);
        setFeedback({
          type: "success",
          message: "¡Plan activado con éxito! Se aplicó tu cupón con bonificación completa.",
        });
        await fetchData();
      } else if (res.checkout_url) {
        // Redireccionar al checkout seguro de Lemon Squeezy o Paddle
        window.open(res.checkout_url, "_blank", "noopener,noreferrer");
        setShowPlanModal(false);
        setFeedback({
          type: "info",
          message: `Se ha abierto la pasarela de pago en una pestaña segura ${appliedCoupon ? `con el cupón "${appliedCoupon.code}" aplicado` : ""}. Una vez completado, el plan se actualizará automáticamente.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al iniciar la compra." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirm = window.confirm(
      "¿Estás seguro de que deseas programar la cancelación de tu suscripción? Continuarás teniendo acceso a tus funciones premium hasta el final del ciclo facturado."
    );
    if (!confirm) return;

    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await cancelBillingSubscription();
      setFeedback({ type: "success", message: res.message });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al solicitar la cancelación." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await resumeBillingSubscription();
      setFeedback({ type: "success", message: res.message });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al reactivar la suscripción." });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string, inGrace: boolean) => {
    if (inGrace) {
      return <Badge variant="warning" pulse>Período de Gracia</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge variant="success">Activa</Badge>;
      case "past_due":
        return <Badge variant="danger" pulse>Pago Pendiente</Badge>;
      case "trialing":
        return <Badge variant="info">Periodo de Prueba</Badge>;
      case "paused":
        return <Badge variant="neutral">Pausada</Badge>;
      case "cancelled":
        return <Badge variant="neutral">Cancelada</Badge>;
      case "expired":
        return <Badge variant="danger">Expirada</Badge>;
      default:
        return <Badge variant="neutral">{status.toUpperCase()}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="q-billing-loading">
        <span className="q-billing-spinner" />
        <p>Cargando información de suscripción y facturación...</p>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.code.toLowerCase() === subscription?.plan_code.toLowerCase());
  const maxDev = subscription?.max_devices;
  const devCount = subscription?.devices_count || 0;
  const devPercent = maxDev ? Math.min(100, Math.round((devCount / maxDev) * 100)) : 0;

  return (
    <div className="q-billing-page">
      {/* Cabecera Principal */}
      <div className="q-billing-header">
        <div>
          <h1 className="q-billing-title">
            <CreditCard size={26} color="var(--color-brand-primary)" />
            Suscripción & Facturación Multi-Provider
          </h1>
          <p className="q-billing-subtitle">
            Administra tu plan de suscripción empresarial, cuotas de dispositivos ({subscription?.organization_name}) y pasarelas externas.
          </p>
        </div>

        <div className="q-billing-header-actions">
          <Button variant="secondary" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw size={14} /> Actualizar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowPlanModal(true)}>
            <Zap size={14} /> Cambiar de Plan
          </Button>
        </div>
      </div>

      {/* Banners Informativos / Alertas */}
      {feedback && (
        <div className={`q-billing-banner q-billing-banner--${feedback.type}`}>
          {feedback.type === "error" && <AlertTriangle size={18} />}
          {feedback.type === "success" && <CheckCircle2 size={18} />}
          {feedback.type === "info" && <Info size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Alerta de Período de Gracia (7 días) */}
      {subscription?.is_past_due && subscription?.in_grace_period && (
        <div className="q-billing-grace-alert">
          <AlertTriangle size={22} color="#D97706" />
          <div className="q-billing-grace-content">
            <h4>Advertencia Administrativa: Pago Pendiente</h4>
            <p>
              Tu suscripción presenta un cobro no concretado. Cuentas con un <strong>período de gracia de {subscription.grace_period_days_left} días restantes</strong>.
              Tus equipos conectados y configuraciones continúan completamente operativos. Por favor actualiza tu método de pago.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowPlanModal(true)}>
            Regularizar Pago
          </Button>
        </div>
      )}

      {/* Aviso de Cancelación al fin del periodo */}
      {subscription?.cancel_at_period_end && (
        <div className="q-billing-cancel-alert">
          <Clock size={20} color="var(--color-brand-primary)" />
          <div style={{ flex: 1 }}>
            <strong>Cancelación programada:</strong> Tu suscripción continuará activa con todas sus funciones hasta el{" "}
            <strong>{formatDate(subscription.current_period_end)}</strong>.
          </div>
          <Button variant="secondary" size="sm" onClick={handleResumeSubscription} loading={actionLoading}>
            Reactivar Suscripción
          </Button>
        </div>
      )}

      {/* Fila de KPIs Principales */}
      <div className="q-billing-kpi-row">
        <KpiCard
          title="Plan Actual"
          value={subscription?.plan_name || "Starter"}
          subtitle={`${subscription?.currency || "USD"} $${subscription?.amount.toFixed(2)} / ${subscription?.billing_cycle === "yearly" ? "año" : "mes"}`}
          icon={<Layers size={20} />}
        />

        <KpiCard
          title="Equipos Utilizados"
          value={maxDev ? `${devCount} / ${maxDev}` : `${devCount} (Ilimitado)`}
          subtitle={subscription?.device_limit_reached ? "⚠️ Cupo de equipos alcanzado" : `${maxDev ? maxDev - devCount : "∞"} disponibles para enrolar`}
          icon={<Server size={20} />}
        />

        <KpiCard
          title="Próxima Renovación"
          value={formatDate(subscription?.current_period_end)}
          subtitle={subscription?.cancel_at_period_end ? "Finaliza en esta fecha" : "Renovación automática"}
          icon={<Calendar size={20} />}
        />
      </div>

      {/* Sección Detalle de la Suscripción Actual */}
      <div className="q-billing-main-grid">
        <Card className="q-billing-detail-card">
          <div className="q-billing-card-header">
            <div>
              <span className="q-billing-card-label">Estado de la cuenta</span>
              <div className="q-billing-plan-title-row">
                <h2>{subscription?.plan_name}</h2>
                {subscription && getStatusBadge(subscription.status, subscription.in_grace_period)}
              </div>
            </div>
            <div className="q-billing-price-tag">
              <span className="q-billing-price-num">${subscription?.amount.toFixed(2)}</span>
              <span className="q-billing-price-period">/ {subscription?.billing_cycle === "yearly" ? "año" : "mes"}</span>
            </div>
          </div>

          {/* Barra de progreso de equipos */}
          <div className="q-billing-progress-box">
            <div className="q-billing-progress-labels">
              <span>Capacidad de Equipos del Plan</span>
              <strong className={subscription?.device_limit_reached ? "q-text-danger" : ""}>
                {devCount} / {maxDev ? `${maxDev} equipos` : "Personalizado"} ({devPercent}%)
              </strong>
            </div>
            <div className="q-billing-progress-bar">
              <div
                className={`q-billing-progress-fill ${devPercent >= 90 ? "q-fill-danger" : ""}`}
                style={{ width: `${maxDev ? devPercent : 15}%` }}
              />
            </div>
            {subscription?.device_limit_reached && (
              <p className="q-billing-limit-warning">
                Has alcanzado el límite de equipos de tu plan. Actualiza tu suscripción para registrar más agentes.
              </p>
            )}
          </div>

          {/* Atributos del proveedor */}
          <div className="q-billing-meta-grid">
            <div className="q-billing-meta-item">
              <span className="q-billing-meta-title">Proveedor de Facturación</span>
              <span className="q-billing-meta-value">
                {subscription?.provider === "paddle" ? "Paddle Billing" : "Lemon Squeezy"}
              </span>
            </div>
            <div className="q-billing-meta-item">
              <span className="q-billing-meta-title">Ciclo de Facturación</span>
              <span className="q-billing-meta-value">
                {subscription?.billing_cycle === "yearly" ? "Anual (Ahorro aplicado)" : "Mensual recurrente"}
              </span>
            </div>
            <div className="q-billing-meta-item">
              <span className="q-billing-meta-title">Organización SaaS</span>
              <span className="q-billing-meta-value">{subscription?.organization_name}</span>
            </div>
            <div className="q-billing-meta-item">
              <span className="q-billing-meta-title">Fecha de Inicio de Periodo</span>
              <span className="q-billing-meta-value">{formatDate(subscription?.current_period_start)}</span>
            </div>
          </div>

          {/* Botonera de Gestión */}
          <div className="q-billing-card-actions">
            <Button variant="primary" onClick={() => setShowPlanModal(true)}>
              <Zap size={15} /> Administrar o Cambiar Plan
            </Button>

            {!subscription?.cancel_at_period_end ? (
              <Button variant="outline" onClick={handleCancelSubscription} loading={actionLoading}>
                Cancelar al Fin del Periodo
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleResumeSubscription} loading={actionLoading}>
                Revertir Cancelación
              </Button>
            )}
          </div>
        </Card>

        {/* Matriz de Capacidades / Entitlements Habilitadas */}
        <Card className="q-billing-caps-card">
          <div className="q-billing-card-header">
            <div>
              <span className="q-billing-card-label">Matriz de Autorización</span>
              <h3>Capacidades Habilitadas (Entitlements)</h3>
            </div>
            <ShieldCheck size={24} color="var(--color-brand-primary)" />
          </div>
          <p className="q-billing-caps-desc">
            Las funcionalidades de QRMM se verifican dinámicamente según las capacidades asignadas a tu suscripción activa.
          </p>

          <div className="q-billing-caps-grid">
            {currentPlan?.entitlements.map((ent) => (
              <div key={ent.code} className="q-billing-cap-item">
                <CheckCircle2 size={16} color="var(--color-status-success)" />
                <div>
                  <strong>{ent.name}</strong>
                  {ent.description && <span>{ent.description}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal / Selector de Planes para Upgrade / Downgrade */}
      {showPlanModal && (
        <div className="q-billing-modal-backdrop" onClick={() => setShowPlanModal(false)}>
          <div className="q-billing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="q-billing-modal-header">
              <div>
                <h2>Cambiar o Renovar Plan Comercial</h2>
                <p>Selecciona el plan que mejor se adapte al volumen de endpoints de tu organización.</p>
              </div>
              <button className="q-billing-close-btn" onClick={() => setShowPlanModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Selector de Ciclo y Proveedor */}
            <div className="q-billing-controls-bar">
              <div className="q-billing-cycle-toggle">
                <button
                  className={selectedCycle === "monthly" ? "q-active" : ""}
                  onClick={() => setSelectedCycle("monthly")}
                >
                  Mensual
                </button>
                <button
                  className={selectedCycle === "yearly" ? "q-active" : ""}
                  onClick={() => setSelectedCycle("yearly")}
                >
                  Anual <span className="q-save-tag">Ahorra ~17%</span>
                </button>
              </div>

              <div className="q-billing-provider-toggle">
                <span className="q-billing-provider-label">Pasarela:</span>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="q-billing-select"
                >
                  <option value="lemonsqueezy">Lemon Squeezy</option>
                  <option value="paddle">Paddle Billing</option>
                </select>
              </div>
            </div>

            {/* Barra de Cupón de Descuento */}
            <div className="q-billing-coupon-bar">
              <div className="q-billing-coupon-input-group">
                <Tag size={16} className="q-coupon-icon" />
                <input
                  type="text"
                  placeholder="¿Tienes un código de descuento? Ej. PROMO2026"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  disabled={validatingCoupon || !!appliedCoupon}
                  className="q-billing-coupon-input"
                />
                {appliedCoupon ? (
                  <Button variant="outline" size="sm" onClick={handleRemoveCoupon}>
                    <X size={14} /> Quitar
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={handleApplyCoupon} loading={validatingCoupon}>
                    Aplicar Cupón
                  </Button>
                )}
              </div>
              {appliedCoupon && (
                <div className="q-coupon-applied-msg">
                  <CheckCircle2 size={14} color="var(--color-status-success)" />
                  <span>
                    Cupón <strong>{appliedCoupon.code}</strong> aplicado:{" "}
                    {appliedCoupon.discount_type === "percentage"
                      ? `${appliedCoupon.value}% de descuento`
                      : `$${appliedCoupon.value} USD de descuento`}
                    {appliedCoupon.description ? ` (${appliedCoupon.description})` : ""}
                  </span>
                </div>
              )}
              {couponError && (
                <div className="q-coupon-error-msg">
                  <AlertTriangle size={14} color="var(--color-status-danger)" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Tarjetas de Planes Comerciales */}
            <div className="q-billing-plans-grid">
              {plans.map((p) => {
                const isCurrent = p.code.toLowerCase() === subscription?.plan_code.toLowerCase();
                const priceObj = p.prices.find(
                  (pr) => pr.billing_cycle === selectedCycle && pr.provider === selectedProvider
                ) || p.prices.find((pr) => pr.billing_cycle === selectedCycle) || p.prices[0];

                const amount = priceObj ? priceObj.amount : 0;

                const isCouponApplicable = appliedCoupon && (
                  !appliedCoupon.applicable_plans ||
                  appliedCoupon.applicable_plans.length === 0 ||
                  appliedCoupon.applicable_plans.includes(p.code)
                );

                let finalPrice = amount;
                if (isCouponApplicable && appliedCoupon) {
                  if (appliedCoupon.discount_type === "percentage") {
                    finalPrice = Math.max(0, Math.round((amount * (1 - appliedCoupon.value / 100)) * 100) / 100);
                  } else {
                    finalPrice = Math.max(0, Math.round((amount - appliedCoupon.value) * 100) / 100);
                  }
                }

                return (
                  <div key={p.code} className={`q-billing-plan-col ${isCurrent ? "q-plan-col--active" : ""}`}>
                    {isCurrent && <div className="q-current-badge">PLAN ACTUAL</div>}
                    <div className="q-plan-col-header">
                      <h3>{p.name}</h3>
                      <p className="q-plan-col-desc">{p.description}</p>
                    </div>

                    <div className="q-plan-col-price">
                      <span className="q-plan-currency">$</span>
                      {isCouponApplicable && finalPrice < amount ? (
                        <>
                          <span className="q-plan-amount q-plan-amount--discounted">{finalPrice}</span>
                          <span className="q-plan-amount-original">${amount}</span>
                        </>
                      ) : (
                        <span className="q-plan-amount">{amount}</span>
                      )}
                      <span className="q-plan-period">/ {selectedCycle === "yearly" ? "año" : "mes"}</span>
                    </div>

                    <div className="q-plan-col-limit">
                      <Server size={14} />
                      <span>{p.max_devices ? `Hasta ${p.max_devices} equipos` : "Límite personalizable"}</span>
                    </div>

                    <ul className="q-plan-col-features">
                      {p.entitlements.slice(0, 6).map((e) => (
                        <li key={e.code}>
                          <Check size={14} color="var(--color-status-success)" />
                          <span>{e.name}</span>
                        </li>
                      ))}
                      {p.entitlements.length > 6 && (
                        <li className="q-plan-more-caps">
                          +{p.entitlements.length - 6} capacidades adicionales
                        </li>
                      )}
                    </ul>

                    <div className="q-plan-col-action">
                      {isCurrent ? (
                        <Button variant="secondary" disabled style={{ width: "100%" }}>
                          Plan en Uso
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          style={{ width: "100%" }}
                          loading={actionLoading}
                          onClick={() => handleInitiateCheckout(p.code)}
                        >
                          Elegir Plan <ArrowRight size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="q-billing-modal-footer">
              <span>
                🔒 Transacciones seguras con cifrado SSL bancario vía {selectedProvider === "paddle" ? "Paddle" : "Lemon Squeezy"}. Puedes cancelar o modificar tu suscripción en cualquier momento.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
