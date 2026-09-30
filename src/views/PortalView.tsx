import React, { useState } from "react";
import {
  Shield,
  Zap,
  Terminal,
  Cpu,
  Globe,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  X,
  Star,
  Check,
  Flame,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../components/Button/Button";
import { useAuth } from "../context/AuthContext";
import { processCheckout, verifyPromoCode } from "../services/api";
import type { PlanTier, CurrencyCode } from "../types/payment";
import "./PortalView.css";

interface CountryPlanConfig {
  name: string;
  flag: string;
  currencySymbol: string;
  currencyCode: CurrencyCode;
  methods: { id: string; name: string; detail: string }[];
  prices: {
    STARTER: { monthly: number; yearly: number };
    PRO: { monthly: number; yearly: number };
    ENTERPRISE: { monthly: number; yearly: number };
  };
}

const COUNTRIES: Record<string, CountryPlanConfig> = {
  PE: {
    name: "Perú",
    flag: "🇵🇪",
    currencySymbol: "S/",
    currencyCode: "PEN",
    methods: [
      { id: "CARD", name: "Tarjeta de Crédito / Débito", detail: "Visa, Mastercard, Amex" },
      { id: "YAPE", name: "Yape / PLIN", detail: "Transferencia instantánea QR" },
      { id: "STRIPE", name: "Stripe Checkout", detail: "Pasarela internacional segura" },
    ],
    prices: {
      STARTER: { monthly: 0, yearly: 0 },
      PRO: { monthly: 19, yearly: 190 },
      ENTERPRISE: { monthly: 69, yearly: 690 },
    },
  },
  ES: {
    name: "España",
    flag: "🇪🇸",
    currencySymbol: "€",
    currencyCode: "EUR",
    methods: [
      { id: "CARD", name: "Tarjeta Bancaria", detail: "Visa, Mastercard, Maestro" },
      { id: "BIZUM", name: "Bizum", detail: "Pago móvil instantáneo" },
      { id: "STRIPE", name: "Stripe Checkout", detail: "Pasarela europea certificada" },
    ],
    prices: {
      STARTER: { monthly: 0, yearly: 0 },
      PRO: { monthly: 5, yearly: 50 },
      ENTERPRISE: { monthly: 19, yearly: 190 },
    },
  },
  MX: {
    name: "México",
    flag: "🇲🇽",
    currencySymbol: "$",
    currencyCode: "MXN",
    methods: [
      { id: "CARD", name: "Tarjeta de Crédito / Débito", detail: "Visa, Mastercard, Carnet" },
      { id: "MERCADOPAGO", name: "Mercado Pago", detail: "Saldo o tarjeta en cuotas" },
      { id: "STRIPE", name: "Stripe Checkout", detail: "Pasarela segura internacional" },
    ],
    prices: {
      STARTER: { monthly: 0, yearly: 0 },
      PRO: { monthly: 99, yearly: 990 },
      ENTERPRISE: { monthly: 399, yearly: 3990 },
    },
  },
  US: {
    name: "Internacional (USD)",
    flag: "🌐",
    currencySymbol: "$",
    currencyCode: "USD",
    methods: [
      { id: "CARD", name: "International Credit Card", detail: "Visa, Mastercard, Amex" },
      { id: "STRIPE", name: "Stripe Checkout", detail: "Global secure processing" },
    ],
    prices: {
      STARTER: { monthly: 0, yearly: 0 },
      PRO: { monthly: 5, yearly: 50 },
      ENTERPRISE: { monthly: 19, yearly: 190 },
    },
  },
};

interface PortalViewProps {
  onGoToLogin?: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ onGoToLogin }) => {
  const { loginWithCustomToken } = useAuth();

  const [selectedCountryKey, setSelectedCountryKey] = useState<string>("PE");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // Estado del Modal de Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<PlanTier>("PRO");
  const [selectedGateway, setSelectedGateway] = useState<string>("CARD");

  // Campos de Formulario
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [organizationName, setOrganizationName] = useState<string>("");

  // Datos de Tarjeta
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardHolder, setCardHolder] = useState<string>("");
  const [cardExp, setCardExp] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [cardBrand, setCardBrand] = useState<string>("CARD");

  // Cupones
  const [promoInput, setPromoInput] = useState<string>("QRMMPRO50");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; label: string } | null>({
    code: "QRMMPRO50",
    percent: 50,
    label: "50% OFF en Plan Pro RMM (Oferta de Lanzamiento)",
  });
  const [promoError, setPromoError] = useState<string | null>(null);

  // Estados de proceso
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const country = COUNTRIES[selectedCountryKey] || COUNTRIES["PE"];

  // Formateador de tarjeta de crédito
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    // Detección de marca
    if (val.startsWith("4")) setCardBrand("Visa");
    else if (val.startsWith("51") || val.startsWith("52") || val.startsWith("55") || val.startsWith("22"))
      setCardBrand("Mastercard");
    else if (val.startsWith("34") || val.startsWith("37")) setCardBrand("Amex");
    else setCardBrand("CARD");

    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleCardExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    setCardExp(val);
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    try {
      const res = await verifyPromoCode(promoInput.trim(), selectedTier);
      if (res.valid) {
        setAppliedDiscount({
          code: res.code,
          percent: res.discount_percent || 0,
          label: res.label,
        });
        setPromoError(null);
      } else {
        setAppliedDiscount(null);
        setPromoError(res.label);
      }
    } catch {
      setPromoError("No se pudo verificar el cupón");
    }
  };

  const openCheckout = (tier: PlanTier) => {
    setSelectedTier(tier);
    setIsCheckoutOpen(true);
    setErrorMessage(null);
  };

  // Cálculo del precio
  const basePrice = country.prices[selectedTier][billingCycle];
  let finalPrice = basePrice;
  if (appliedDiscount && appliedDiscount.percent > 0) {
    finalPrice = Math.max(0, basePrice * (1 - appliedDiscount.percent / 100));
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !organizationName) {
      setErrorMessage("Por favor completa todos los campos de cuenta y empresa.");
      return;
    }
    if (selectedGateway === "CARD" && selectedTier !== "STARTER") {
      if (cardNumber.replace(/\s/g, "").length < 15 || !cardExp || !cardCvv) {
        setErrorMessage("Por favor ingresa los datos completos de tu tarjeta de crédito o débito.");
        return;
      }
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await processCheckout({
        full_name: fullName,
        email: email,
        password: password,
        organization_name: organizationName,
        plan_tier: selectedTier,
        billing_cycle: billingCycle,
        currency: country.currencyCode,
        amount: Math.round(finalPrice * 100) / 100,
        gateway: selectedGateway,
        card_number: cardNumber.replace(/\s/g, ""),
        card_exp: cardExp,
        card_cvv: cardCvv,
        card_holder: cardHolder || fullName,
        promo_code: appliedDiscount?.code,
      });

      // Login automático con el token emitido
      loginWithCustomToken(res.access_token, res.user, res.organization);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al procesar la suscripción");
      setIsProcessing(false);
    }
  };

  return (
    <div className="q-portal">
      {/* 1. Banner de Oferta de Lanzamiento */}
      <div className="q-promo-banner">
        <span className="q-promo-badge">
          <Flame size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} /> OFERTA LIMITADA
        </span>
        <span>
          50% de Descuento en planes Pro Anuales usando el cupón{" "}
          <span className="q-promo-code">QRMMPRO50</span> al momento de afiliarte.
        </span>
        <button className="q-promo-btn" onClick={() => openCheckout("PRO")}>
          Aprovechar Oferta
        </button>
      </div>

      {/* 2. Header Institucional */}
      <header className="q-portal-header">
        <div className="q-portal-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="q-portal-logo">Q</div>
          <span className="q-portal-brand-text">Qhapana RMM</span>
        </div>

        <nav className="q-portal-nav">
          <a href="#caracteristicas">Características</a>
          <a href="#planes">Planes & Precios</a>
          <a href="#seguridad">Seguridad</a>
        </nav>

        <div className="q-portal-actions">
          {/* Selector de País / Moneda */}
          <div className="q-country-select-box">
            <Globe size={15} color="var(--color-brand-primary)" />
            <select
              className="q-country-select"
              value={selectedCountryKey}
              onChange={(e) => setSelectedCountryKey(e.target.value)}
            >
              {Object.keys(COUNTRIES).map((k) => (
                <option key={k} value={k}>
                  {COUNTRIES[k].flag} {COUNTRIES[k].name} ({COUNTRIES[k].currencyCode})
                </option>
              ))}
            </select>
          </div>

          {onGoToLogin && (
            <Button variant="secondary" size="sm" onClick={onGoToLogin}>
              Iniciar Sesión
            </Button>
          )}

          <Button variant="primary" size="sm" onClick={() => openCheckout("PRO")}>
            Comenzar Ahora
          </Button>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="q-portal-hero">
        <div className="q-hero-tag">
          <Sparkles size={14} /> Solución RMM Multi-Tenant para Proveedores de TI y Empresas
        </div>
        <h1>
          Supervisión y Control Remoto <span>Enterprise</span> para Servidores y Estaciones
        </h1>
        <p className="q-hero-sub">
          Monitorea telemetría en tiempo real, gestiona procesos, ejecuta terminales remotas interactivas
          y despliega agentes en Windows y Linux en un solo comando sin complicaciones de firewall.
        </p>
        <div className="q-hero-actions">
          <Button variant="primary" size="lg" onClick={() => openCheckout("PRO")}>
            Comenzar Prueba Gratuita <ArrowRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              const el = document.getElementById("planes");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ver Planes & Comparativa
          </Button>
        </div>

        <div className="q-hero-features-chips">
          <div className="q-hero-chip">
            <CheckCircle2 size={16} color="#10b981" /> Enrolamiento con 1 Comando
          </div>
          <div className="q-hero-chip">
            <CheckCircle2 size={16} color="#10b981" /> Windows & Linux Soportados
          </div>
          <div className="q-hero-chip">
            <CheckCircle2 size={16} color="#10b981" /> Sin Reenvío de Puertos
          </div>
          <div className="q-hero-chip">
            <CheckCircle2 size={16} color="#10b981" /> 100% Multi-Cliente Aislado
          </div>
        </div>
      </section>

      {/* 4. Sección de Planes & Precios */}
      <section id="planes" className="q-portal-pricing">
        <div className="q-pricing-header">
          <h2>Planes Diseñados para Escalar con tu Operación</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Precios transparentes en tu moneda local. Cancela o cambia de plan cuando lo necesites.
          </p>

          <div className="q-pricing-cycle-switch">
            <button
              className={`q-cycle-btn ${billingCycle === "monthly" ? "active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              Facturación Mensual
            </button>
            <button
              className={`q-cycle-btn ${billingCycle === "yearly" ? "active" : ""}`}
              onClick={() => setBillingCycle("yearly")}
            >
              Anual (2 Meses Gratis / -20%)
            </button>
          </div>
        </div>

        <div className="q-pricing-grid">
          {/* Plan Starter */}
          <div className="q-price-card">
            <div>
              <div className="q-card-tier-name">Starter / Gratuito</div>
              <div className="q-price-amount-box">
                <span className="q-currency">{country.currencySymbol}</span>
                <span className="q-amount">0</span>
                <span className="q-period">/ para siempre</span>
              </div>
              <p className="q-tier-desc">Ideal para probar la consola y monitorear hasta 3 servidores de prueba.</p>
              <ul className="q-feature-list">
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Hasta 3 máquinas conectadas
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Telemetría básica (CPU, RAM, Disco)
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Script de instalación Windows / Linux
                </li>
                <li className="q-feature-item" style={{ color: "var(--color-text-muted)" }}>
                  <Lock size={14} /> Sin terminal remota interactiva
                </li>
              </ul>
            </div>
            <Button variant="secondary" onClick={() => openCheckout("STARTER")}>
              Crear Cuenta Gratis
            </Button>
          </div>

          {/* Plan Pro (Destacado) */}
          <div className="q-price-card q-price-card--featured">
            <div className="q-popular-badge">
              <Star size={12} fill="#ffffff" /> Más Elegido
            </div>
            <div>
              <div className="q-card-tier-name" style={{ color: "var(--color-brand-primary)" }}>
                Pro RMM
              </div>
              <div className="q-price-amount-box">
                <span className="q-currency">{country.currencySymbol}</span>
                <span className="q-amount">
                  {billingCycle === "yearly"
                    ? country.prices.PRO.yearly
                    : country.prices.PRO.monthly}
                </span>
                <span className="q-period">{billingCycle === "yearly" ? "/ año" : "/ mes"}</span>
              </div>
              <p className="q-tier-desc">
                Potencia total para MSPs y administradores que gestionan infraestructura activa.
              </p>
              <ul className="q-feature-list">
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> <strong>Hasta 50 servidores gestionados</strong>
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Telemetría en tiempo real por WebSocket
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> <strong>Terminal remota interactiva</strong>
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Monitor de procesos y servicios
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Alertas por correo y Google OAuth
                </li>
              </ul>
            </div>
            <Button variant="primary" onClick={() => openCheckout("PRO")}>
              <Zap size={16} /> Elegir Pro RMM (50% OFF)
            </Button>
          </div>

          {/* Plan Enterprise */}
          <div className="q-price-card">
            <div>
              <div className="q-card-tier-name">Enterprise</div>
              <div className="q-price-amount-box">
                <span className="q-currency">{country.currencySymbol}</span>
                <span className="q-amount">
                  {billingCycle === "yearly"
                    ? country.prices.ENTERPRISE.yearly
                    : country.prices.ENTERPRISE.monthly}
                </span>
                <span className="q-period">{billingCycle === "yearly" ? "/ año" : "/ mes"}</span>
              </div>
              <p className="q-tier-desc">
                Para corporaciones con requerimientos de soporte 24/7 y multi-tenancy masivo.
              </p>
              <ul className="q-feature-list">
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> <strong>Máquinas y servidores ilimitados</strong>
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Clientes y organizaciones ilimitadas
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Soporte prioritario SLA 99.9%
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> Auditoría de sesiones en tiempo real
                </li>
                <li className="q-feature-item">
                  <Check size={16} className="q-check-icon" /> API REST para integraciones
                </li>
              </ul>
            </div>
            <Button variant="outline" onClick={() => openCheckout("ENTERPRISE")}>
              Contactar / Iniciar Enterprise
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Características Clave */}
      <section id="caracteristicas" style={{ padding: "60px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 800, marginBottom: "40px" }}>
          ¿Por qué nuestros clientes eligen Qhapana RMM?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-surface-default)" }}>
            <Terminal size={32} color="var(--color-brand-primary)" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Instalación Desatendida</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Un solo comando en PowerShell para Windows o Bash en Linux enrola el equipo con su token asignado.
            </p>
          </div>

          <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-surface-default)" }}>
            <Cpu size={32} color="var(--color-brand-primary)" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Agente Ultra Liviano en Go</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Consume menos de 15MB de RAM y 0.5% de CPU. No requiere dependencias de runtime externas.
            </p>
          </div>

          <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-surface-default)" }}>
            <Shield size={32} color="var(--color-brand-primary)" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Aislamiento Multi-Tenant</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Cada cliente u organización dispone de su propio espacio aislado, usuarios, métricas y equipos.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Modal de Checkout con Pago con Tarjeta (Inspirado en Yayay) */}
      {isCheckoutOpen && (
        <div className="q-checkout-modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="q-checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="q-modal-close" onClick={() => setIsCheckoutOpen(false)}>
              <X size={20} />
            </button>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-brand-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CHECKOUT SEGURO & REGISTRO
              </span>
              <h2 style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>
                Activar Suscripción: Plan {selectedTier}
              </h2>
            </div>

            <div className="q-checkout-grid">
              {/* Resumen del Pedido & Descuentos */}
              <div className="q-checkout-summary">
                <span className="q-summary-title">Resumen de Compra</span>
                <div className="q-summary-row">
                  <span>Plan:</span>
                  <strong>{selectedTier === "PRO" ? "Pro RMM (Recomendado)" : selectedTier === "ENTERPRISE" ? "Enterprise Corporativo" : "Starter"}</strong>
                </div>
                <div className="q-summary-row">
                  <span>Ciclo:</span>
                  <span>{billingCycle === "yearly" ? "Anual (Ahorro -20%)" : "Mensual"}</span>
                </div>
                <div className="q-summary-row">
                  <span>País / Moneda:</span>
                  <span>{country.flag} {country.name} ({country.currencyCode})</span>
                </div>
                <div className="q-summary-row">
                  <span>Precio Base:</span>
                  <span>{country.currencySymbol} {basePrice.toFixed(2)}</span>
                </div>

                {appliedDiscount && (
                  <div className="q-summary-row" style={{ color: "#10b981", fontWeight: 600 }}>
                    <span>Descuento ({appliedDiscount.code}):</span>
                    <span>-{appliedDiscount.percent}%</span>
                  </div>
                )}

                <div className="q-summary-row q-summary-total">
                  <span>Total a Pagar:</span>
                  <span>{country.currencySymbol} {finalPrice.toFixed(2)}</span>
                </div>

                {/* Input de Cupón */}
                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                    ¿Tienes un código promocional?
                  </label>
                  <div className="q-coupon-box">
                    <input
                      type="text"
                      className="q-coupon-input"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="EJ: QRMMPRO50"
                    />
                    <Button variant="secondary" size="sm" onClick={handleApplyPromo}>
                      Aplicar
                    </Button>
                  </div>
                  {appliedDiscount && (
                    <p style={{ fontSize: "11px", color: "#10b981", marginTop: "4px", fontWeight: 600 }}>
                      ✓ {appliedDiscount.label}
                    </p>
                  )}
                  {promoError && (
                    <p style={{ fontSize: "11px", color: "var(--color-danger)", marginTop: "4px" }}>
                      {promoError}
                    </p>
                  )}
                </div>
              </div>

              {/* Formulario de Registro y Datos de Tarjeta */}
              <form className="q-checkout-form" onSubmit={handleCheckoutSubmit}>
                {errorMessage && (
                  <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    {errorMessage}
                  </div>
                )}

                <div className="q-form-group">
                  <label className="q-form-label">Nombre de tu Empresa / Organización</label>
                  <input
                    type="text"
                    required
                    className="q-form-input"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Ej. Acme Corp o Mi Negocio TI"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="q-form-group">
                    <label className="q-form-label">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      className="q-form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div className="q-form-group">
                    <label className="q-form-label">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      className="q-form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@empresa.com"
                    />
                  </div>
                </div>

                <div className="q-form-group">
                  <label className="q-form-label">Contraseña para la Consola</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="q-form-input"
                      style={{ width: "100%", paddingRight: "40px" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      style={{
                        position: "absolute",
                        right: "10px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        padding: "4px",
                      }}
                      title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Métodos de Pago */}
                {selectedTier !== "STARTER" && (
                  <>
                    <div className="q-gateways-tabs">
                      {country.methods.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`q-gateway-tab ${selectedGateway === m.id ? "active" : ""}`}
                          onClick={() => setSelectedGateway(m.id)}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>

                    {selectedGateway === "CARD" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div className="q-form-group">
                          <label className="q-form-label">Nombre del Titular de la Tarjeta</label>
                          <input
                            type="text"
                            required
                            className="q-form-input"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Como aparece en la tarjeta"
                          />
                        </div>

                        <div className="q-form-group">
                          <label className="q-form-label">Número de Tarjeta de Crédito / Débito</label>
                          <div className="q-card-input-box">
                            <input
                              type="text"
                              required
                              className="q-form-input"
                              style={{ width: "100%", paddingRight: "60px" }}
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="4500 0000 0000 0000"
                            />
                            <span className="q-card-brand-tag">{cardBrand}</span>
                          </div>
                        </div>

                        <div className="q-card-sub-fields">
                          <div className="q-form-group">
                            <label className="q-form-label">Expiración (MM/AA)</label>
                            <input
                              type="text"
                              required
                              className="q-form-input"
                              value={cardExp}
                              onChange={handleCardExpChange}
                              placeholder="12/28"
                            />
                          </div>

                          <div className="q-form-group">
                            <label className="q-form-label">Código CVC / CVV</label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              className="q-form-input"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "16px", backgroundColor: "var(--color-surface-muted)", borderRadius: "8px", fontSize: "13px", textAlign: "center" }}>
                        <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                          Pasarela seleccionada: {country.methods.find((m) => m.id === selectedGateway)?.name}
                        </p>
                        <p style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                          Se generará una referencia de pago segura inmediata y se activará tu acceso de forma automática.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Button variant="primary" size="lg" type="submit" loading={isProcessing} style={{ marginTop: "12px" }}>
                  {selectedTier === "STARTER" ? (
                    "Crear Cuenta Gratuita"
                  ) : (
                    <>
                      <Lock size={15} /> Pagar {country.currencySymbol} {finalPrice.toFixed(2)} y Activar Consola
                    </>
                  )}
                </Button>

                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center" }}>
                  🔒 Transacción encriptada con SSL de 256 bits. Activación instantánea.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer */}
      <footer className="q-portal-footer">
        <p>© {new Date().getFullYear()} Qhapana RMM. Plataforma SaaS Enterprise para Monitoreo y Gestión Remota.</p>
      </footer>
    </div>
  );
};
