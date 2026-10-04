import React, { useState, useEffect } from "react";
import {
  Cpu,
  CheckCircle2,
  Sparkles,
  X,
  Check,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  FolderOpen,
  Radio,
  ChevronDown,
  Activity,
  Laptop,
  ArrowRight,
  LayoutDashboard,
  Server,
  AlertTriangle,
  XCircle,
  Terminal,
  Globe,
  Building,
  Users,
  ShieldCheck,
  Network,
} from "lucide-react";
import { Button } from "../components/Button/Button";
import { useAuth } from "../context/AuthContext";
import { processCheckout, verifyPromoCode } from "../services/api";
import type { PlanTier } from "../types/payment";
import {
  PRICING_CONFIG,
  QRMM_CAPABILITY_GROUPS,
  FAQS_CONFIG,
  getMonthlyEquivalent,
  formatPrice,
} from "../config/pricing";
import "./PortalView.css";

type Language = "es" | "en";

interface PortalViewProps {
  onGoToLogin?: (initialMode?: "login" | "register") => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ onGoToLogin }) => {
  const { user, register } = useAuth();

  // Estados de Idioma y Tema Qhapana (Light / Dark)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("q_portal_lang") as Language) || "es";
  });
  const [portalTheme, setPortalTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("q_portal_theme") as "light" | "dark") || "light";
  });

  // Estados de Navegación & Mockup Interactivo
  const [mockupTab, setMockupTab] = useState<"dashboard" | "desktop" | "terminal" | "files" | "discovery">("dashboard");
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true, 1: true });

  // Estados de Precios & Checkout
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutMethod, setCheckoutMethod] = useState<string>("CARD");
  const [customerName, setCustomerName] = useState<string>(user?.full_name || "");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");
  const [customerPassword, setCustomerPassword] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoDiscountPct, setPromoDiscountPct] = useState<number>(0);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("q_portal_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("q_portal_theme", portalTheme);
    document.documentElement.setAttribute("data-theme", portalTheme);
  }, [portalTheme]);

  const toggleTheme = () => {
    setPortalTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSelectPlan = (tier: PlanTier) => {
    setSelectedPlan(tier);
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setCheckoutModalOpen(true);
  };

  const handleVerifyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    try {
      const res = await verifyPromoCode(promoCodeInput.trim().toUpperCase());
      if (res.valid) {
        setPromoSuccess(
          lang === "es"
            ? `¡Código ${res.code} aplicado! ${res.discount_percent}% de descuento.`
            : `Code ${res.code} applied! ${res.discount_percent}% off.`
        );
        setPromoDiscountPct(res.discount_percent);
      } else {
        setPromoSuccess(null);
        setPromoDiscountPct(0);
        setCheckoutError(
          lang === "es"
            ? "El código de promoción no es válido o ya expiró."
            : "Promo code is invalid or expired."
        );
      }
    } catch {
      setCheckoutError(lang === "es" ? "Error al verificar cupón." : "Error verifying coupon.");
    }
  };

  const getCurrentPlanAmount = (tier: PlanTier, cycle: "monthly" | "yearly"): number => {
    const base = PRICING_CONFIG.plans[tier].pricing[cycle].price;
    if (promoDiscountPct > 0) {
      return base * (1 - promoDiscountPct / 100);
    }
    return base;
  };

  const handleExecuteCheckout = async () => {
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setCheckoutError(
        lang === "es"
          ? "Por favor ingrese un correo electrónico corporativo válido."
          : "Please enter a valid corporate email address."
      );
      return;
    }
    if (!customerPassword.trim() || customerPassword.length < 6) {
      setCheckoutError(
        lang === "es"
          ? "La contraseña debe tener al menos 6 caracteres."
          : "Password must have at least 6 characters."
      );
      return;
    }
    if (!selectedPlan) return;

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Si es STARTER ($0), se realiza el registro directo sin pasarela de pago
      if (selectedPlan === "STARTER") {
        await register({
          full_name: customerName.trim() || customerEmail.split("@")[0],
          email: customerEmail.trim(),
          password: customerPassword.trim(),
          organization_name: orgName.trim() || undefined,
        });
        setCheckoutSuccess({
          message:
            lang === "es"
              ? "Cuenta creada con éxito. Tu plan Starter gratuito ya está activo."
              : "Account created successfully. Your free Starter plan is now active.",
        });
        return;
      }

      // Si es PRO o CORPORATIVO, se procesa la orden
      const amount = getCurrentPlanAmount(selectedPlan, billingCycle);
      const res = await processCheckout({
        full_name: customerName.trim() || customerEmail.split("@")[0],
        email: customerEmail.trim(),
        password: customerPassword.trim(),
        organization_name: orgName.trim() || `${customerName || "Empresa"} Workspace`,
        plan_tier: selectedPlan,
        billing_cycle: billingCycle,
        currency: PRICING_CONFIG.currencyCode,
        amount,
        gateway: checkoutMethod,
        promo_code: promoCodeInput.trim() ? promoCodeInput.trim().toUpperCase() : undefined,
      });
      setCheckoutSuccess(res);
    } catch (err: any) {
      setCheckoutError(
        err.message || (lang === "es" ? "Error al procesar la solicitud." : "Error processing request.")
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="q-portal" data-portal-theme={portalTheme}>
      {/* ----------------------------------------------------------------------
          1. HEADER / NAVBAR PRINCIPAL
      ---------------------------------------------------------------------- */}
      <header className="q-portal-header">
        <div className="q-portal-brand">
          <div className="q-portal-brand-logo">
            <span className="q-portal-brand-glyph">Q</span>
          </div>
          <div className="q-portal-brand-text">
            <span className="q-portal-brand-name">QHAPANA</span>
            <span className="q-portal-brand-tag">RMM</span>
          </div>
        </div>

        <nav className="q-portal-nav">
          <a href="#pilares" className="q-portal-nav-link">
            {lang === "es" ? "Pilares" : "Pillars"}
          </a>
          <a href="#rd-vs-rmm" className="q-portal-nav-link">
            {lang === "es" ? "Remote Desktop vs RMM" : "Remote Desktop vs RMM"}
          </a>
          <a href="#para-quien" className="q-portal-nav-link">
            {lang === "es" ? "¿Para quién es?" : "Who is it for?"}
          </a>
          <a href="#capacidades" className="q-portal-nav-link">
            {lang === "es" ? "Capacidades" : "Capabilities"}
          </a>
          <a href="#pricing" className="q-portal-nav-link">
            {lang === "es" ? "Planes y Precios" : "Pricing"}
          </a>
          <a href="#faq" className="q-portal-nav-link">
            {lang === "es" ? "Preguntas Frecuentes" : "FAQ"}
          </a>
        </nav>

        <div className="q-portal-header-actions">
          {/* Selector de idioma */}
          <div className="q-portal-lang-switch">
            <button
              className={`q-portal-lang-btn ${lang === "es" ? "q-portal-lang-btn--active" : ""}`}
              onClick={() => setLang("es")}
              title="Español"
            >
              ES
            </button>
            <span className="q-portal-lang-divider">|</span>
            <button
              className={`q-portal-lang-btn ${lang === "en" ? "q-portal-lang-btn--active" : ""}`}
              onClick={() => setLang("en")}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Toggle de tema */}
          <button
            className="q-portal-theme-btn"
            onClick={toggleTheme}
            title={portalTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label="Cambiar tema"
          >
            {portalTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Botones de acción */}
          {onGoToLogin ? (
            <button
              onClick={() => onGoToLogin("login")}
              className="q-portal-btn-ghost"
              style={{ fontWeight: 600 }}
            >
              {lang === "es" ? "Iniciar Sesión" : "Log In"}
            </button>
          ) : (
            <a href="/login" className="q-portal-btn-ghost" style={{ fontWeight: 600 }}>
              {lang === "es" ? "Iniciar Sesión" : "Log In"}
            </a>
          )}

          {onGoToLogin ? (
            <button
              onClick={() => onGoToLogin("register")}
              className="q-portal-btn-primary"
              style={{ fontWeight: 700 }}
            >
              <span>{lang === "es" ? "Empezar gratis" : "Start for Free"}</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <a href="#pricing" className="q-portal-btn-primary" style={{ fontWeight: 700 }}>
              <span>{lang === "es" ? "Empezar gratis" : "Start for Free"}</span>
              <ArrowRight size={15} />
            </a>
          )}
        </div>
      </header>

      {/* ----------------------------------------------------------------------
          2. HERO SECTION
      ---------------------------------------------------------------------- */}
      <section className="q-portal-hero">
        <div className="q-portal-hero-content">
          <div className="q-portal-badge-pill">
            <span className="q-portal-badge-dot"></span>
            <span>QHAPANA RMM • PLATAFORMA INTEGRAL TI</span>
          </div>

          <h1 className="q-portal-hero-title">
            {lang === "es"
              ? "Control remoto y RMM en una sola plataforma."
              : "Remote Desktop and RMM in a Single Platform."}
          </h1>

          <p className="q-portal-hero-subtitle">
            {lang === "es"
              ? "Administra, monitorea y controla tu infraestructura TI desde cualquier navegador."
              : "Manage, monitor, and control your IT infrastructure directly from any web browser."}
          </p>

          {/* Copy Estratégico Resalta Diferencial */}
          <div className="q-portal-hero-strategic-box">
            <div className="q-portal-strategic-col">
              <span className="q-portal-strategic-label">CONTROL REMOTO</span>
              <span className="q-portal-strategic-desc">
                {lang === "es" ? "Resuelve problemas." : "Fix issues fast."}
              </span>
            </div>
            <div className="q-portal-strategic-sep">+</div>
            <div className="q-portal-strategic-col">
              <span className="q-portal-strategic-label">RMM</span>
              <span className="q-portal-strategic-desc">
                {lang === "es" ? "Previene problemas." : "Prevent downtime."}
              </span>
            </div>
            <div className="q-portal-strategic-sep">=</div>
            <div className="q-portal-strategic-col q-portal-strategic-col--highlight">
              <span className="q-portal-strategic-label">QRMM</span>
              <span className="q-portal-strategic-desc">
                {lang === "es" ? "Haz ambas cosas desde una sola consola." : "Do both from a unified console."}
              </span>
            </div>
          </div>

          <div className="q-portal-hero-actions">
            {onGoToLogin ? (
              <button
                onClick={() => onGoToLogin("register")}
                className="q-portal-btn-primary q-portal-btn-lg"
              >
                <span>{lang === "es" ? "Empezar gratis" : "Start Free Now"}</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <a href="#pricing" className="q-portal-btn-primary q-portal-btn-lg">
                <span>{lang === "es" ? "Empezar gratis" : "Start Free Now"}</span>
                <ArrowRight size={18} />
              </a>
            )}

            <a href="#rd-vs-rmm" className="q-portal-btn-secondary q-portal-btn-lg">
              <span>{lang === "es" ? "Ver cómo funciona" : "See How it Works"}</span>
            </a>
          </div>

          <p className="q-portal-hero-microcopy">
            <ShieldCheck size={15} style={{ verticalAlign: "middle", marginRight: 6, color: "var(--portal-accent-teal)" }} />
            {lang === "es"
              ? "Sin tarjeta de crédito requerida • Hasta 5 equipos gratis para siempre • Agente ligero (~8.5 MB)"
              : "No credit card required • Up to 5 endpoints free forever • Lightweight agent (~8.5 MB)"}
          </p>
        </div>

        {/* ----------------------------------------------------------------------
            3. PRODUCT DASHBOARD PREVIEW (MOCKUP INTERACTIVO)
        ---------------------------------------------------------------------- */}
        <div className="q-portal-mockup-wrapper">
          <div className="q-portal-mockup-window">
            {/* Barra superior de la ventana */}
            <div className="q-portal-mockup-titlebar">
              <div className="q-portal-window-dots">
                <span className="q-portal-dot q-portal-dot--red"></span>
                <span className="q-portal-dot q-portal-dot--yellow"></span>
                <span className="q-portal-dot q-portal-dot--green"></span>
              </div>
              <div className="q-portal-mockup-tab-list">
                <button
                  className={`q-portal-mockup-tab-btn ${mockupTab === "dashboard" ? "q-portal-mockup-tab-btn--active" : ""}`}
                  onClick={() => setMockupTab("dashboard")}
                >
                  <LayoutDashboard size={14} />
                  <span>{lang === "es" ? "Panel Central RMM" : "Central RMM"}</span>
                </button>
                <button
                  className={`q-portal-mockup-tab-btn ${mockupTab === "desktop" ? "q-portal-mockup-tab-btn--active" : ""}`}
                  onClick={() => setMockupTab("desktop")}
                >
                  <Monitor size={14} />
                  <span>{lang === "es" ? "Escritorio Remoto Web" : "Remote Desktop"}</span>
                </button>
                <button
                  className={`q-portal-mockup-tab-btn ${mockupTab === "terminal" ? "q-portal-mockup-tab-btn--active" : ""}`}
                  onClick={() => setMockupTab("terminal")}
                >
                  <Terminal size={14} />
                  <span>{lang === "es" ? "Terminal Remota" : "Remote Shell"}</span>
                </button>
                <button
                  className={`q-portal-mockup-tab-btn ${mockupTab === "files" ? "q-portal-mockup-tab-btn--active" : ""}`}
                  onClick={() => setMockupTab("files")}
                >
                  <FolderOpen size={14} />
                  <span>{lang === "es" ? "Archivos" : "File Transfer"}</span>
                </button>
                <button
                  className={`q-portal-mockup-tab-btn ${mockupTab === "discovery" ? "q-portal-mockup-tab-btn--active" : ""}`}
                  onClick={() => setMockupTab("discovery")}
                >
                  <Radio size={14} />
                  <span>{lang === "es" ? "Sonda de Red LAN" : "LAN Probe"}</span>
                </button>
              </div>
              <div className="q-portal-mockup-status-indicator">
                <span className="q-portal-live-beacon"></span>
                <span>182/186 {lang === "es" ? "EN LÍNEA" : "ONLINE"}</span>
              </div>
            </div>

            {/* Contenido de la ventana según pestaña seleccionada */}
            <div className="q-portal-mockup-body">
              {mockupTab === "dashboard" && (
                <div className="q-mockup-view-dashboard">
                  <div className="q-mockup-kpi-row">
                    <div className="q-mockup-kpi-card">
                      <span className="q-mockup-kpi-title">{lang === "es" ? "Organizaciones" : "Clients / Orgs"}</span>
                      <span className="q-mockup-kpi-val">14</span>
                      <span className="q-mockup-kpi-sub">MSP Multi-Tenant</span>
                    </div>
                    <div className="q-mockup-kpi-card">
                      <span className="q-mockup-kpi-title">{lang === "es" ? "Equipos Gestionados" : "Managed Endpoints"}</span>
                      <span className="q-mockup-kpi-val">186</span>
                      <span className="q-mockup-kpi-sub" style={{ color: "var(--portal-accent-teal)" }}>
                        182 {lang === "es" ? "conectados" : "online"}
                      </span>
                    </div>
                    <div className="q-mockup-kpi-card">
                      <span className="q-mockup-kpi-title">{lang === "es" ? "Alertas Activas" : "Active Alerts"}</span>
                      <span className="q-mockup-kpi-val" style={{ color: "#f59e0b" }}>3</span>
                      <span className="q-mockup-kpi-sub">{lang === "es" ? "2 advertencias, 1 crítica" : "2 warnings, 1 critical"}</span>
                    </div>
                    <div className="q-mockup-kpi-card">
                      <span className="q-mockup-kpi-title">{lang === "es" ? "Carga Promedio CPU" : "Fleet Avg CPU"}</span>
                      <span className="q-mockup-kpi-val">28.4%</span>
                      <span className="q-mockup-kpi-sub">{lang === "es" ? "Estable y saludable" : "Healthy telemetry"}</span>
                    </div>
                  </div>

                  <div className="q-mockup-table-preview">
                    <div className="q-mockup-table-header">
                      <span>{lang === "es" ? "Equipo / Hostname" : "Endpoint Hostname"}</span>
                      <span>{lang === "es" ? "Cliente / Organización" : "Client Org"}</span>
                      <span>IP / Red</span>
                      <span>CPU</span>
                      <span>RAM</span>
                      <span>{lang === "es" ? "Acción Rápida" : "Quick Action"}</span>
                    </div>
                    {[
                      { host: "SRV-DATACENTER-01", org: "Financiera Andina", ip: "192.168.10.5", cpu: "14%", ram: "42%", status: "online", os: "Win Server 2022" },
                      { host: "WS-DESIGN-04", org: "Estudio Creativo", ip: "192.168.20.18", cpu: "78%", ram: "84%", status: "warning", os: "Windows 11 Pro" },
                      { host: "SRV-BACKUP-LINUX", org: "Logística del Sur", ip: "10.0.4.12", cpu: "8%", ram: "31%", status: "online", os: "Ubuntu 22.04 LTS" },
                      { host: "POS-TIENDA-MIRAFLORES", org: "Retail Market", ip: "192.168.1.102", cpu: "19%", ram: "55%", status: "online", os: "Windows 10 IoT" },
                    ].map((row, idx) => (
                      <div key={idx} className="q-mockup-table-row">
                        <div className="q-mockup-row-host">
                          <span className={`q-mockup-status-dot q-mockup-status-dot--${row.status}`}></span>
                          <div>
                            <strong>{row.host}</strong>
                            <small>{row.os}</small>
                          </div>
                        </div>
                        <div>{row.org}</div>
                        <code style={{ fontSize: "12px", opacity: 0.85 }}>{row.ip}</code>
                        <div style={{ color: parseInt(row.cpu) > 70 ? "#f59e0b" : "inherit" }}>{row.cpu}</div>
                        <div>{row.ram}</div>
                        <div>
                          <button
                            onClick={() => setMockupTab("desktop")}
                            className="q-mockup-btn-connect"
                          >
                            <Monitor size={12} style={{ marginRight: 4 }} />
                            {lang === "es" ? "Conectar" : "Connect"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mockupTab === "desktop" && (
                <div className="q-mockup-view-desktop">
                  <div className="q-mockup-remote-bar">
                    <div className="q-mockup-remote-info">
                      <span className="q-mockup-status-dot q-mockup-status-dot--online"></span>
                      <span>SRV-DATACENTER-01 (Windows Server 2022)</span>
                    </div>
                    <div className="q-mockup-remote-controls">
                      <button className="q-mockup-ctrl-btn">Ctrl+Alt+Del</button>
                      <button className="q-mockup-ctrl-btn">{lang === "es" ? "Portapapeles" : "Clipboard"}</button>
                      <button onClick={() => setMockupTab("files")} className="q-mockup-ctrl-btn">
                        <FolderOpen size={12} style={{ marginRight: 4 }} />
                        {lang === "es" ? "Archivos" : "Files"}
                      </button>
                      <button onClick={() => setMockupTab("terminal")} className="q-mockup-ctrl-btn">
                        <Terminal size={12} style={{ marginRight: 4 }} />
                        {lang === "es" ? "Terminal" : "Shell"}
                      </button>
                    </div>
                  </div>
                  <div className="q-mockup-desktop-screen">
                    <div className="q-mockup-remote-wallpaper">
                      <div className="q-mockup-simulated-app">
                        <div className="q-sim-app-bar">Task Manager - Windows Server</div>
                        <div className="q-sim-app-body">
                          <div>CPU: Intel Xeon Gold • 2.80 GHz (14% en uso)</div>
                          <div>Memoria: 32.0 GB ECC (13.4 GB en uso)</div>
                          <div>Disco C: SSD NVMe 1TB (412 GB libres)</div>
                          <div style={{ marginTop: 8, color: "var(--portal-accent-teal)" }}>
                            ✔ Agente Qhapana RMM v2.4 activo como servicio de sistema
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mockupTab === "terminal" && (
                <div className="q-mockup-view-terminal">
                  <div className="q-mockup-term-header">
                    <span>PowerShell Remoto • SRV-DATACENTER-01 (Sin interrumpir al usuario en pantalla)</span>
                  </div>
                  <pre className="q-mockup-term-body">
                    <code>{`Windows PowerShell (Sesión Remota Segura Web)
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\\Windows\\system32> Get-Service | Where-Object {$_.Status -eq "Stopped" -and $_.StartType -eq "Automatic"}
Status   Name               DisplayName
------   ----               -----------
Stopped  Spooler            Cola de impresión

PS C:\\Windows\\system32> Start-Service Spooler
PS C:\\Windows\\system32> Get-Service Spooler
Status   Name               DisplayName
------   ----               -----------
Running  Spooler            Cola de impresión

PS C:\\Windows\\system32> # Incidencia resuelta en 15 segundos sin cerrar la sesión del usuario.`}</code>
                  </pre>
                </div>
              )}

              {mockupTab === "files" && (
                <div className="q-mockup-view-files">
                  <div className="q-mockup-files-pane">
                    <div className="q-mockup-pane-title">
                      <Laptop size={14} style={{ marginRight: 6 }} />
                      <span>{lang === "es" ? "Tu Navegador Local" : "Local Browser"}</span>
                    </div>
                    <div className="q-mockup-file-item">📁 C:\Instaladores\Agentes\</div>
                    <div className="q-mockup-file-item">📄 fix_database_script.sql</div>
                    <div className="q-mockup-file-item">📄 parche_seguridad_qrmm.zip</div>
                  </div>
                  <div className="q-mockup-files-divider">
                    <button className="q-mockup-ctrl-btn" title="Subir archivo al equipo remoto">
                      <Upload size={14} style={{ marginRight: 4 }} />
                      {lang === "es" ? "Enviar" : "Upload"}
                    </button>
                    <button className="q-mockup-ctrl-btn" title="Descargar archivo a tu equipo">
                      <Download size={14} style={{ marginRight: 4 }} />
                      {lang === "es" ? "Bajar" : "Download"}
                    </button>
                  </div>
                  <div className="q-mockup-files-pane">
                    <div className="q-mockup-pane-title">
                      <Server size={14} style={{ marginRight: 6 }} />
                      <span>{lang === "es" ? "Disco Remoto (SRV-DATACENTER-01)" : "Remote Disk"}</span>
                    </div>
                    <div className="q-mockup-file-item">📁 D:\Empresa\Backups_Diarios\</div>
                    <div className="q-mockup-file-item">📄 backup_2026_10_03.bak (4.2 GB)</div>
                    <div className="q-mockup-file-item">📁 C:\Program Files\Qhapana\Logs\</div>
                  </div>
                </div>
              )}

              {mockupTab === "discovery" && (
                <div className="q-mockup-view-discovery">
                  <div className="q-mockup-discovery-banner">
                    <Radio size={16} color="var(--portal-accent-teal)" style={{ marginRight: 8 }} />
                    <span>
                      {lang === "es"
                        ? "Sonda LAN activa en 192.168.10.0/24 • 18 dispositivos detectados en la subred"
                        : "Active LAN Probe on 192.168.10.0/24 • 18 devices discovered in subnet"}
                    </span>
                  </div>
                  <div className="q-mockup-table-preview">
                    <div className="q-mockup-table-header">
                      <span>IP</span>
                      <span>Hostname</span>
                      <span>MAC Address</span>
                      <span>Tipo Estimado</span>
                      <span>Estado en QRMM</span>
                    </div>
                    {[
                      { ip: "192.168.10.1", host: "gateway-core.empresa.lan", mac: "00:1A:2B:3C:4D:5E", type: "Router / Firewall", status: "LAN Only" },
                      { ip: "192.168.10.5", host: "SRV-DATACENTER-01", mac: "B4:2E:99:A1:C2:F0", type: "Windows Server", status: "Gestionado (Agente Activo)" },
                      { ip: "192.168.10.22", host: "HP-LaserJet-Finance", mac: "3C:D9:2B:10:88:91", type: "Impresora de Red", status: "LAN Only" },
                      { ip: "192.168.10.45", host: "LAPTOP-GERENCIA", mac: "DC:A6:32:7F:1B:40", type: "Windows 11 Laptop", status: "No Gestionado (Detectado)" },
                    ].map((dev, idx) => (
                      <div key={idx} className="q-mockup-table-row">
                        <code>{dev.ip}</code>
                        <strong>{dev.host}</strong>
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>{dev.mac}</span>
                        <span>{dev.type}</span>
                        <span style={{ color: dev.status.includes("Activo") ? "var(--portal-accent-teal)" : "#f59e0b" }}>
                          {dev.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          4. SECCIÓN EDUCATIVA: "REMOTE DESKTOP VS RMM" (SECCIÓN 15 DEL PLAN)
      ---------------------------------------------------------------------- */}
      <section id="rd-vs-rmm" className="q-portal-section q-portal-vs-section">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "EDUCACIÓN & ESTRATEGIA TI" : "IT STRATEGY & CLARITY"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es"
              ? "Remote Desktop no es lo mismo que RMM."
              : "Remote Desktop is Not the Same as RMM."}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Entender la diferencia entre reaccionar a una llamada de auxilio y evitar que la falla ocurra."
              : "Understand the difference between reacting to a fire and preventing the spark altogether."}
          </p>
        </div>

        <div className="q-portal-vs-grid">
          {/* Card 1: Remote Desktop */}
          <div className="q-portal-vs-card">
            <div className="q-portal-vs-card-header">
              <div className="q-portal-vs-icon q-portal-vs-icon--rd">
                <Monitor size={24} />
              </div>
              <div>
                <h3>REMOTE DESKTOP</h3>
                <span className="q-portal-vs-pill q-portal-vs-pill--reactive">
                  {lang === "es" ? "Enfoque Reactivo" : "Reactive Approach"}
                </span>
              </div>
            </div>
            <p className="q-portal-vs-summary">
              {lang === "es"
                ? "Te permite entrar a una máquina para resolver un problema cuando ya sucedió."
                : "Allows you to access a machine to troubleshoot a problem after it has already occurred."}
            </p>
            <div className="q-portal-vs-flow">
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">1</span>
                <span>{lang === "es" ? "Ocurre un fallo en el equipo" : "Endpoint crashes or freezes"}</span>
              </div>
              <div className="q-portal-vs-arrow">↓</div>
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">2</span>
                <span>{lang === "es" ? "El usuario interrumpe su trabajo y reporta" : "User stops work and reports ticket"}</span>
              </div>
              <div className="q-portal-vs-arrow">↓</div>
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">3</span>
                <span>{lang === "es" ? "El técnico pide ID y contraseña para conectar" : "Tech asks for session code to connect"}</span>
              </div>
              <div className="q-portal-vs-arrow">↓</div>
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">4</span>
                <span>{lang === "es" ? "Diagnostica y repara el equipo" : "Diagnoses and repairs endpoint"}</span>
              </div>
            </div>
            <div className="q-portal-vs-footer">
              <small>
                {lang === "es"
                  ? "Enfoque reactivo tradicional: control de pantalla cuando el incidente ya ocurrió"
                  : "Traditional reactive model: screen takeover after incident occurred"}
              </small>
            </div>
          </div>

          {/* Card 2: RMM */}
          <div className="q-portal-vs-card">
            <div className="q-portal-vs-card-header">
              <div className="q-portal-vs-icon q-portal-vs-icon--rmm">
                <Activity size={24} />
              </div>
              <div>
                <h3>RMM (MONITOREO & GESTIÓN)</h3>
                <span className="q-portal-vs-pill q-portal-vs-pill--proactive">
                  {lang === "es" ? "Enfoque Proactivo" : "Proactive Approach"}
                </span>
              </div>
            </div>
            <p className="q-portal-vs-summary">
              {lang === "es"
                ? "Permite saber que existe una anomalía antes de que el usuario lo reporte o sufra una parada."
                : "Detects degradation and issues before the end-user notices downtime or files a ticket."}
            </p>
            <div className="q-portal-vs-flow">
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">1</span>
                <span>{lang === "es" ? "Telemetría continua de CPU, RAM, discos y servicios" : "Continuous telemetry of CPU, RAM, disk, services"}</span>
              </div>
              <div className="q-portal-vs-arrow">↓</div>
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">2</span>
                <span>{lang === "es" ? "Alerta automática ante umbrales o desconexión" : "Automated trigger on threshold or disconnect"}</span>
              </div>
              <div className="q-portal-vs-arrow">↓</div>
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">3</span>
                <span>{lang === "es" ? "Diagnóstico temprano con métricas y logs" : "Early diagnosis with metrics and logs"}</span>
              </div>
              <div className="q-portal-vs-arrow">↓</div>
              <div className="q-portal-vs-step">
                <span className="q-portal-step-num">4</span>
                <span>{lang === "es" ? "Remediación preventiva silenciosa" : "Preventive silent remediation"}</span>
              </div>
            </div>
            <div className="q-portal-vs-footer">
              <small>
                {lang === "es"
                  ? "Enfoque preventivo tradicional: métricas y monitoreo continuo de endpoints"
                  : "Traditional proactive model: continuous endpoint health monitoring"}
              </small>
            </div>
          </div>

          {/* Card 3: QRMM UNIFICADO */}
          <div className="q-portal-vs-card q-portal-vs-card--unified">
            <div className="q-portal-vs-card-header">
              <div className="q-portal-vs-icon q-portal-vs-icon--unified">
                <Sparkles size={24} />
              </div>
              <div>
                <h3>QRMM (UNIFICADO)</h3>
                <span className="q-portal-vs-pill q-portal-vs-pill--unified">
                  {lang === "es" ? "La Combinación Completa" : "The Full Synergy"}
                </span>
              </div>
            </div>
            <p className="q-portal-vs-summary">
              {lang === "es"
                ? "Combina ambos mundos: telemetría continua para prevenir, y control remoto en navegador para resolver al instante."
                : "Combines both worlds: 24/7 telemetry to anticipate, and browser-based remote control to fix immediately."}
            </p>
            <div className="q-portal-vs-unified-box">
              <div className="q-portal-vs-unified-item">
                <Check size={18} color="var(--portal-accent-teal)" />
                <span>
                  {lang === "es"
                    ? "Telemetría RMM alerta sobre un fallo antes de que interrumpa la operación."
                    : "RMM telemetry alerts you before an outage interrupts business."}
                </span>
              </div>
              <div className="q-portal-vs-unified-item">
                <Check size={18} color="var(--portal-accent-teal)" />
                <span>
                  {lang === "es"
                    ? "Abres escritorio remoto o terminal en 1 clic directamente desde el navegador."
                    : "Launch remote desktop or shell in 1 click right inside your browser."}
                </span>
              </div>
              <div className="q-portal-vs-unified-item">
                <Check size={18} color="var(--portal-accent-teal)" />
                <span>
                  {lang === "es"
                    ? "Sin pagar dos suscripciones separadas ni alternar entre consolas incompatibles."
                    : "No paying two separate bills or juggling disconnected consoles."}
                </span>
              </div>
            </div>
            <div className="q-portal-vs-footer">
              <strong>
                {lang === "es"
                  ? "Control remoto para resolver. RMM para prevenir. QRMM para ambas cosas."
                  : "Remote desktop to fix. RMM to prevent. QRMM for both."}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          5. 4 PILARES PRINCIPALES (SECCIÓN 3 DEL PLAN)
      ---------------------------------------------------------------------- */}
      <section id="pilares" className="q-portal-section">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "ARQUITECTURA DEL PRODUCTO" : "PRODUCT ARCHITECTURE"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es"
              ? "Cuatro pilares para el control total de TI"
              : "Four Pillars for Complete IT Fleet Governance"}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Todo lo que un técnico, consultor o departamento de sistemas necesita en una sola consola web."
              : "Everything an IT technician, consultant, or systems department needs in one console."}
          </p>
        </div>

        <div className="q-portal-pillars-grid">
          {/* Pilar A: REMOTE DESKTOP */}
          <div className="q-portal-pillar-card">
            <div className="q-portal-pillar-icon">
              <Monitor size={28} />
            </div>
            <h3>A. Remote Desktop</h3>
            <p className="q-portal-pillar-desc">
              {lang === "es"
                ? "Escritorio remoto ágil operado directamente desde el navegador, sin instalar visores locales pesados."
                : "Agile remote desktop running in browser with zero operator viewer installation."}
            </p>
            <ul className="q-portal-pillar-list">
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Escritorio remoto web sin software visor" : "Web remote desktop with no client viewer"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Acceso asistido y desatendido 24/7" : "Attended & 24/7 unattended access"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Control fluido de teclado, ratón y Ctrl+Alt+Del" : "Keyboard, mouse & Ctrl+Alt+Del control"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Transferencia de archivos y terminal en segundo plano" : "File transfer & background shell terminal"}</li>
            </ul>
          </div>

          {/* Pilar B: RMM */}
          <div className="q-portal-pillar-card">
            <div className="q-portal-pillar-icon">
              <Cpu size={28} />
            </div>
            <h3>B. RMM & Telemetría</h3>
            <p className="q-portal-pillar-desc">
              {lang === "es"
                ? "Observabilidad profunda de hardware, software, servicios y procesos en tiempo real."
                : "Deep hardware, software, services, and live processes fleet telemetry."}
            </p>
            <ul className="q-portal-pillar-list">
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Telemetría de CPU, RAM, discos y adaptadores de red" : "CPU, RAM, storage disk & network telemetry"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Estado de conexión online/offline continuo" : "Continuous live online/offline heartbeat"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Supervisión de procesos y servicios del sistema" : "OS process & system service supervision"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Alertas automáticas por correo electrónico" : "Automated email notifications on issues"}</li>
            </ul>
          </div>

          {/* Pilar C: NETWORK DISCOVERY */}
          <div className="q-portal-pillar-card">
            <div className="q-portal-pillar-icon">
              <Network size={28} />
            </div>
            <h3>C. Network Discovery</h3>
            <p className="q-portal-pillar-desc">
              {lang === "es"
                ? "Sondas inteligentes que auditan la subred local y descubren equipos no gestionados."
                : "Smart probes that scan local subnets and map unmanaged network endpoints."}
            </p>
            <ul className="q-portal-pillar-list">
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Escaneo automatizado de subredes corporativas" : "Automated corporate LAN subnet scan"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Mapeo de IP, Hostname, MAC y fabricante" : "IP, Hostname, MAC & vendor identification"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Sonda LAN ligera ejecutada por cualquier agente" : "Lightweight LAN probe run by any agent"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Detección de equipos no registrados en la red" : "Discovery of rogue or unmanaged hardware"}</li>
            </ul>
          </div>

          {/* Pilar D: WEB CONSOLE */}
          <div className="q-portal-pillar-card">
            <div className="q-portal-pillar-icon">
              <Globe size={28} />
            </div>
            <h3>D. Web Console</h3>
            <p className="q-portal-pillar-desc">
              {lang === "es"
                ? "Consola centralizada multi-cliente para gestionar todas tus operaciones desde cualquier lugar."
                : "Centralized multi-tenant console to manage operations from anywhere."}
            </p>
            <ul className="q-portal-pillar-list">
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Acceso universal desde navegadores modernos" : "Universal access on modern browsers"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Organización jerárquica por clientes y sedes" : "Client, site, and department hierarchy"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Roles y permisos para equipos técnicos" : "Technician roles, scopes & permission policies"}</li>
              <li><Check size={15} color="var(--portal-accent-teal)" /> {lang === "es" ? "Dashboard de métricas y auditoría de eventos" : "Central metrics dashboard & event audit trail"}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          6. SECCIÓN DIFERENCIAL & MENSAJE COMERCIAL (SECCIONES 13 & 20)
      ---------------------------------------------------------------------- */}
      <section className="q-portal-section q-portal-diff-section">
        <div className="q-portal-diff-container">
          <div className="q-portal-diff-text">
            <span className="q-portal-section-badge">
              {lang === "es" ? "SIMPLIFICACIÓN OPERATIVA" : "OPERATIONAL SIMPLIFICATION"}
            </span>
            <h2 className="q-portal-section-title" style={{ textAlign: "left" }}>
              {lang === "es"
                ? "Una consola. Toda tu infraestructura."
                : "One Console. Your Entire Fleet."}
            </h2>
            <p className="q-portal-diff-quote">
              {lang === "es"
                ? "“Menos herramientas. Menos consolas. Más control.”"
                : "“Fewer tools. Fewer consoles. Complete control.”"}
            </p>
            <p className="q-portal-diff-desc">
              {lang === "es"
                ? "Históricamente, los departamentos de TI se han visto obligados a pagar una herramienta para entrar a ver la pantalla de los usuarios, otra herramienta para saber si los discos están llenos, y otra para escanear la red. QRMM consolida estas tres funciones bajo una única cuota predecible y una sola interfaz."
                : "Historically, IT departments had to pay for one tool for remote screen control, another for server health monitoring, and another for network discovery. QRMM unifies all three under one transparent subscription."}
            </p>
          </div>

          <div className="q-portal-diff-visual">
            <div className="q-portal-diff-card q-portal-diff-card--before">
              <div className="q-portal-diff-badge-status">
                <XCircle size={15} color="#ef4444" />
                <span>{lang === "es" ? "ANTES (HERRAMIENTAS DISPERSAS)" : "BEFORE (FRAGMENTED)"}</span>
              </div>
              <ul className="q-portal-diff-checklist">
                <li>❌ Licencia de acceso remoto por usuario/sesión</li>
                <li>❌ Plataforma RMM separada con cobro por equipo</li>
                <li>❌ Software adicional para escanear redes LAN</li>
                <li>❌ 3 agentes diferentes instalados en cada equipo</li>
                <li>❌ Múltiples contraseñas y facturas dispersas</li>
              </ul>
            </div>

            <div className="q-portal-diff-card q-portal-diff-card--after">
              <div className="q-portal-diff-badge-status q-portal-diff-badge-status--after">
                <CheckCircle2 size={15} color="var(--portal-accent-teal)" />
                <span>{lang === "es" ? "AHORA (QRMM UNIFICADO)" : "NOW (UNIFIED QRMM)"}</span>
              </div>
              <ul className="q-portal-diff-checklist">
                <li>✔ Remote Desktop web sin visor local instalado</li>
                <li>✔ Telemetría RMM continua y alertas de salud</li>
                <li>✔ Sonda de red LAN (Network Discovery) integrada</li>
                <li>✔ Un solo agente ultra ligero (~8.5 MB)</li>
                <li>✔ Una sola consola web y una cuota transparente</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          7. CÓMO FUNCIONA (DESPLIEGUE EN 3 PASOS)
      ---------------------------------------------------------------------- */}
      <section className="q-portal-section">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "DESPLIEGUE INMEDIATO" : "INSTANT DEPLOYMENT"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es"
              ? "En marcha en tres pasos sencillos"
              : "Up and Running in Three Simple Steps"}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Sin configurar firewalls, sin abrir puertos en el router y sin reiniciar los equipos."
              : "No firewall port-forwarding, no NAT hassles, zero endpoint reboots required."}
          </p>
        </div>

        <div className="q-portal-steps-grid">
          <div className="q-portal-step-card">
            <div className="q-portal-step-bubble">1</div>
            <h3>{lang === "es" ? "Crea tu cuenta gratuita" : "Create Free Account"}</h3>
            <p>
              {lang === "es"
                ? "Regístrate en 30 segundos sin introducir tarjeta de crédito y obtén tu espacio de trabajo de inmediato."
                : "Sign up in 30 seconds with no credit card required and enter your ready-to-use workspace."}
            </p>
          </div>

          <div className="q-portal-step-card">
            <div className="q-portal-step-bubble">2</div>
            <h3>{lang === "es" ? "Descarga el agente ligero" : "Deploy Lightweight Agent"}</h3>
            <p>
              {lang === "es"
                ? "Instala el ejecutable de ~8.5 MB en tus equipos Windows o Linux. Se conecta de forma saliente segura por WebSockets TLS."
                : "Install the ~8.5 MB binary on your Windows or Linux machines. It connects outbound securely via TLS WebSockets."}
            </p>
          </div>

          <div className="q-portal-step-card">
            <div className="q-portal-step-bubble">3</div>
            <h3>{lang === "es" ? "Monitorea y da soporte" : "Monitor & Support Instantly"}</h3>
            <p>
              {lang === "es"
                ? "Ve tus equipos en línea, analiza telemetría en tiempo real y abre sesiones de control remoto directamente desde tu navegador."
                : "Watch machines come online, inspect telemetry, and launch remote control straight from your browser."}
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          8. SECCIÓN "¿PARA QUIÉN ES QRMM?" (SECCIÓN 14 DEL PLAN)
      ---------------------------------------------------------------------- */}
      <section id="para-quien" className="q-portal-section q-portal-audience-section">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "CASOS DE USO" : "TARGET AUDIENCE"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es" ? "¿Para quién es QRMM?" : "Who is QRMM Built For?"}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Diseñado específicamente para profesionales que necesitan resolver problemas técnicos sin fricción."
              : "Tailored for IT professionals who demand reliable management without overhead."}
          </p>
        </div>

        <div className="q-portal-audience-grid">
          {/* Perfil 1 */}
          <div className="q-portal-audience-card">
            <div className="q-portal-audience-icon">
              <Laptop size={28} />
            </div>
            <h3>{lang === "es" ? "Técnicos y Consultores TI" : "IT Consultants & Techs"}</h3>
            <p className="q-portal-audience-quote">
              {lang === "es"
                ? "“Administra tus equipos y clientes desde cualquier navegador.”"
                : "“Manage your client devices directly from any browser.”"}
            </p>
            <p className="q-portal-audience-desc">
              {lang === "es"
                ? "Ideal para técnicos independientes que necesitan dar soporte remoto desatendido y conocer el estado de los equipos de sus clientes sin pagar suscripciones prohibitivas por operador."
                : "Ideal for independent technicians delivering unattended support without expensive per-operator licensing."}
            </p>
          </div>

          {/* Perfil 2 */}
          <div className="q-portal-audience-card q-portal-audience-card--highlight">
            <div className="q-portal-audience-icon">
              <Building size={28} />
            </div>
            <h3>{lang === "es" ? "MSPs y Proveedores de Servicios TI" : "MSPs & IT Service Providers"}</h3>
            <p className="q-portal-audience-quote">
              {lang === "es"
                ? "“Gestiona múltiples clientes y equipos desde una sola consola.”"
                : "“Manage multiple clients and fleets from a single pane of glass.”"}
            </p>
            <p className="q-portal-audience-desc">
              {lang === "es"
                ? "Estructura tus clientes en organizaciones separadas, asigna técnicos con permisos específicos, recibe alertas de salud automatizadas y descubre dispositivos en sus redes LAN."
                : "Organize clients in distinct organizations, assign technician roles, receive proactive alerts, and discover unmanaged LAN devices."}
            </p>
          </div>

          {/* Perfil 3 */}
          <div className="q-portal-audience-card">
            <div className="q-portal-audience-icon">
              <Users size={28} />
            </div>
            <h3>{lang === "es" ? "PyMEs y Equipos Internos de TI" : "SMBs & In-House IT Teams"}</h3>
            <p className="q-portal-audience-quote">
              {lang === "es"
                ? "“Monitorea y administra tu infraestructura sin montar una plataforma RMM propia.”"
                : "“Monitor and control your fleet without hosting complex RMM servers.”"}
            </p>
            <p className="q-portal-audience-desc">
              {lang === "es"
                ? "Centraliza el soporte de las computadoras de tu empresa, servidores locales y sedes remotas en un servicio seguro en la nube sin requerir personal dedicado a mantener servidores."
                : "Centralize corporate workstations and remote office servers on a turn-key cloud platform without dedicated maintenance staff."}
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          9. CAPACIDADES Y CARACTERÍSTICAS INTEGRALES DE QRMM
      ---------------------------------------------------------------------- */}
      <section id="capacidades" className="q-portal-section q-portal-capabilities-section">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "SUITE INTEGRAL QRMM" : "COMPREHENSIVE QRMM SUITE"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es"
              ? "Capacidades y Características Integrales de QRMM"
              : "Comprehensive QRMM Capabilities & Architecture"}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Todo lo que tu equipo técnico y de soporte necesita para controlar y mantener tu infraestructura desde una sola consola web."
              : "Everything your technical and support team needs to govern and maintain infrastructure from a unified web console."}
          </p>
        </div>

        <div className="q-portal-cap-groups-container">
          {QRMM_CAPABILITY_GROUPS.map((group) => {
            const IconComponent =
              group.icon === "monitor"
                ? Monitor
                : group.icon === "activity"
                ? Activity
                : group.icon === "network"
                ? Network
                : ShieldCheck;

            return (
              <div key={group.id} className="q-portal-cap-group-card">
                <div className="q-portal-cap-group-header">
                  <div className="q-portal-cap-icon-box">
                    <IconComponent size={26} />
                  </div>
                  <div>
                    <span className="q-portal-cap-category-tag">
                      {lang === "es" ? group.categoryEs : group.categoryEn}
                    </span>
                    <h3 className="q-portal-cap-group-title">
                      {lang === "es" ? group.titleEs : group.titleEn}
                    </h3>
                  </div>
                </div>

                <p className="q-portal-cap-group-desc">
                  {lang === "es" ? group.descEs : group.descEn}
                </p>

                <div className="q-portal-cap-items-grid">
                  {group.items.map((item, idx) => (
                    <div key={idx} className="q-portal-cap-item">
                      <div className="q-portal-cap-item-top">
                        <div className="q-portal-cap-check-icon">
                          <Check size={14} />
                        </div>
                        <h4 className="q-portal-cap-item-title">
                          {lang === "es" ? item.titleEs : item.titleEn}
                        </h4>
                        {(item.badgeEs || item.badgeEn) && (
                          <span className="q-portal-cap-item-badge">
                            {lang === "es" ? item.badgeEs : item.badgeEn}
                          </span>
                        )}
                      </div>
                      <p className="q-portal-cap-item-desc">
                        {lang === "es" ? item.descEs : item.descEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          12. SECCIÓN DE PLANES Y PRECIOS (SECCIONES 4, 5, 6, 7, 17, 26, 27)
      ---------------------------------------------------------------------- */}
      <section id="pricing" className="q-portal-pricing">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "PRECIOS TRANSPARENTES" : "TRANSPARENT PRICING"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es"
              ? "Comienza gratis. Escala cuando lo necesites."
              : "Start Free. Scale as You Grow."}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Planes simples y sin sorpresas. Sin costos ocultos por cada computadora que agregues."
              : "Clear, predictable plans. No per-endpoint penalty fees."}
          </p>
        </div>

        {/* Selector Mensual / Anual Interactivo con Ahorra 2 Meses */}
        <div className="q-portal-pricing-toggle-row">
          <div className="q-portal-toggle-pill">
            <button
              className={`q-portal-pill-btn ${billingCycle === "monthly" ? "q-portal-pill-btn--active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              {lang === "es" ? "Mensual" : "Monthly"}
            </button>
            <button
              className={`q-portal-pill-btn ${billingCycle === "yearly" ? "q-portal-pill-btn--active" : ""}`}
              onClick={() => setBillingCycle("yearly")}
            >
              {lang === "es" ? "Anual" : "Yearly"}
            </button>
          </div>
        </div>

        {/* Grid de 4 Planes Centralizados */}
        <div className="q-portal-pricing-grid">
          {/* 1. PLAN STARTER */}
          <div className="q-portal-plan-card">
            <div className="q-portal-plan-header">
              <h3 className="q-portal-plan-name">{PRICING_CONFIG.plans.STARTER.name}</h3>
              <p className="q-portal-plan-tagline">
                {lang === "es"
                  ? PRICING_CONFIG.plans.STARTER.taglineEs
                  : PRICING_CONFIG.plans.STARTER.taglineEn}
              </p>
            </div>

            <div className="q-portal-plan-price-box">
              <div className="q-portal-plan-price-row">
                <span className="q-portal-plan-price">
                  {formatPrice(PRICING_CONFIG.plans.STARTER.pricing[billingCycle].price)}
                </span>
                <span className="q-portal-plan-period">
                  USD / {billingCycle === "yearly" ? (lang === "es" ? "año" : "year") : (lang === "es" ? "mes" : "month")}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <div className="q-portal-annual-calc-box">
                  <span className="q-portal-monthly-equivalent">
                    ≈ $4.17 USD/{lang === "es" ? "mes" : "mo"}
                  </span>
                  <span className="q-portal-savings-tag">
                    {lang === "es" ? "Ahorras $10 al año" : "Save $10/year"}
                  </span>
                </div>
              )}
              <div className="q-portal-plan-limit-badge">
                {lang === "es"
                  ? PRICING_CONFIG.plans.STARTER.limits.deviceLabelEs
                  : PRICING_CONFIG.plans.STARTER.limits.deviceLabelEn}
              </div>
            </div>

            <ul className="q-portal-plan-features">
              {(lang === "es"
                ? PRICING_CONFIG.plans.STARTER.featuresEs
                : PRICING_CONFIG.plans.STARTER.featuresEn
              ).map((f, idx) => (
                <li key={idx}>
                  <Check size={16} color="var(--portal-accent-teal)" style={{ flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="q-portal-plan-cta-box">
              <button
                onClick={() => handleSelectPlan("STARTER")}
                className="q-portal-btn-secondary"
                style={{ width: "100%", justifyContent: "center", height: "44px", fontWeight: 700 }}
              >
                {lang === "es"
                  ? PRICING_CONFIG.plans.STARTER.ctaTextEs
                  : PRICING_CONFIG.plans.STARTER.ctaTextEn}
              </button>
              <small className="q-portal-cta-microcopy">
                {lang === "es"
                  ? PRICING_CONFIG.plans.STARTER.trialTextEs
                  : PRICING_CONFIG.plans.STARTER.trialTextEn}
              </small>
            </div>
          </div>

          {/* 2. PLAN PROFESIONAL (DESTACADO - MÁS POPULAR) */}
          <div className="q-portal-plan-card q-portal-plan-card--featured">
            <span className="q-portal-plan-badge-top">
              {PRICING_CONFIG.plans.PRO.badge}
            </span>

            <div className="q-portal-plan-header">
              <h3 className="q-portal-plan-name">{PRICING_CONFIG.plans.PRO.name}</h3>
              <p className="q-portal-plan-tagline">
                {lang === "es"
                  ? PRICING_CONFIG.plans.PRO.taglineEs
                  : PRICING_CONFIG.plans.PRO.taglineEn}
              </p>
            </div>

            <div className="q-portal-plan-price-box">
              <div className="q-portal-plan-price-row">
                <span className="q-portal-plan-price">
                  {formatPrice(PRICING_CONFIG.plans.PRO.pricing[billingCycle].price)}
                </span>
                <span className="q-portal-plan-period">
                  USD / {billingCycle === "yearly" ? (lang === "es" ? "año" : "year") : (lang === "es" ? "mes" : "month")}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <div className="q-portal-annual-calc-box">
                  <span className="q-portal-monthly-equivalent">
                    ≈ $32.50 USD/{lang === "es" ? "mes" : "mo"}
                  </span>
                  <span className="q-portal-savings-tag">
                    {lang === "es" ? "Ahorras $78 al año" : "Save $78/year"}
                  </span>
                </div>
              )}
              <div className="q-portal-plan-limit-badge q-portal-plan-limit-badge--highlight">
                {lang === "es"
                  ? PRICING_CONFIG.plans.PRO.limits.deviceLabelEs
                  : PRICING_CONFIG.plans.PRO.limits.deviceLabelEn}
              </div>
            </div>

            <ul className="q-portal-plan-features">
              {(lang === "es"
                ? PRICING_CONFIG.plans.PRO.featuresEs
                : PRICING_CONFIG.plans.PRO.featuresEn
              ).map((f, idx) => (
                <li key={idx}>
                  <Check size={16} color="var(--portal-brand)" style={{ flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="q-portal-plan-cta-box">
              <button
                onClick={() => handleSelectPlan("PRO")}
                className="q-portal-btn-primary"
                style={{ width: "100%", justifyContent: "center", height: "46px", fontWeight: 700 }}
              >
                {lang === "es"
                  ? PRICING_CONFIG.plans.PRO.ctaTextEs
                  : PRICING_CONFIG.plans.PRO.ctaTextEn}
              </button>
              <small className="q-portal-cta-microcopy">
                {billingCycle === "yearly"
                  ? (lang === "es" ? "$390 USD facturados anualmente" : "$390 USD billed annually")
                  : (lang === "es" ? "$39 USD al mes • Cancela cuando quieras" : "$39 USD/month • Cancel anytime")}
              </small>
            </div>
          </div>

          {/* 3. PLAN BUSINESS / MSP */}
          <div className="q-portal-plan-card">
            <div className="q-portal-plan-header">
              <h3 className="q-portal-plan-name">{PRICING_CONFIG.plans.BUSINESS.name}</h3>
              <p className="q-portal-plan-tagline">
                {lang === "es"
                  ? PRICING_CONFIG.plans.BUSINESS.taglineEs
                  : PRICING_CONFIG.plans.BUSINESS.taglineEn}
              </p>
            </div>

            <div className="q-portal-plan-price-box">
              <div className="q-portal-plan-price-row">
                <span className="q-portal-plan-price">
                  {formatPrice(PRICING_CONFIG.plans.BUSINESS.pricing[billingCycle].price)}
                </span>
                <span className="q-portal-plan-period">
                  USD / {billingCycle === "yearly" ? (lang === "es" ? "año" : "year") : (lang === "es" ? "mes" : "month")}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <div className="q-portal-annual-calc-box">
                  <span className="q-portal-monthly-equivalent">
                    ≈ $65.83 USD/{lang === "es" ? "mes" : "mo"}
                  </span>
                  <span className="q-portal-savings-tag">
                    {lang === "es" ? "Ahorras $158 al año" : "Save $158/year"}
                  </span>
                </div>
              )}
              <div className="q-portal-plan-limit-badge">
                {lang === "es"
                  ? PRICING_CONFIG.plans.BUSINESS.limits.deviceLabelEs
                  : PRICING_CONFIG.plans.BUSINESS.limits.deviceLabelEn}
              </div>
            </div>

            <ul className="q-portal-plan-features">
              {(lang === "es"
                ? PRICING_CONFIG.plans.BUSINESS.featuresEs
                : PRICING_CONFIG.plans.BUSINESS.featuresEn
              ).map((f, idx) => (
                <li key={idx}>
                  <Check size={16} color="var(--portal-accent-teal)" style={{ flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="q-portal-plan-cta-box">
              <button
                onClick={() => handleSelectPlan("BUSINESS")}
                className="q-portal-btn-secondary"
                style={{ width: "100%", justifyContent: "center", height: "44px", fontWeight: 700 }}
              >
                {lang === "es"
                  ? PRICING_CONFIG.plans.BUSINESS.ctaTextEs
                  : PRICING_CONFIG.plans.BUSINESS.ctaTextEn}
              </button>
              <small className="q-portal-cta-microcopy">
                {billingCycle === "yearly"
                  ? (lang === "es" ? "$790 USD facturados anualmente" : "$790 USD billed annually")
                  : (lang === "es" ? "$79 USD al mes • Cancela cuando quieras" : "$79 USD/month • Cancel anytime")}
              </small>
            </div>
          </div>

          {/* 4. PLAN ENTERPRISE */}
          <div className="q-portal-plan-card">
            <div className="q-portal-plan-header">
              <h3 className="q-portal-plan-name">{PRICING_CONFIG.plans.ENTERPRISE.name}</h3>
              <p className="q-portal-plan-tagline">
                {lang === "es"
                  ? PRICING_CONFIG.plans.ENTERPRISE.taglineEs
                  : PRICING_CONFIG.plans.ENTERPRISE.taglineEn}
              </p>
            </div>

            <div className="q-portal-plan-price-box">
              <div className="q-portal-plan-price-row">
                <span className="q-portal-plan-price" style={{ fontSize: "36px" }}>
                  {lang === "es" ? "Desde " : "From "}
                  {formatPrice(PRICING_CONFIG.plans.ENTERPRISE.pricing[billingCycle].price)}
                </span>
                <span className="q-portal-plan-period">
                  USD / {billingCycle === "yearly" ? (lang === "es" ? "año" : "year") : (lang === "es" ? "mes" : "month")}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <div className="q-portal-annual-calc-box">
                  <span className="q-portal-monthly-equivalent">
                    ≈ {lang === "es" ? "Desde" : "From"} $124.17 USD/{lang === "es" ? "mes" : "mo"}
                  </span>
                  <span className="q-portal-savings-tag">
                    {lang === "es" ? "Ahorras $298 al año" : "Save $298/year"}
                  </span>
                </div>
              )}
              <div className="q-portal-plan-limit-badge">
                {lang === "es"
                  ? PRICING_CONFIG.plans.ENTERPRISE.limits.deviceLabelEs
                  : PRICING_CONFIG.plans.ENTERPRISE.limits.deviceLabelEn}
              </div>
            </div>

            <ul className="q-portal-plan-features">
              {(lang === "es"
                ? PRICING_CONFIG.plans.ENTERPRISE.featuresEs
                : PRICING_CONFIG.plans.ENTERPRISE.featuresEn
              ).map((f, idx) => (
                <li key={idx}>
                  <Check size={16} color="var(--portal-accent-teal)" style={{ flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="q-portal-plan-cta-box">
              <button
                onClick={() => handleSelectPlan("ENTERPRISE")}
                className="q-portal-btn-secondary"
                style={{ width: "100%", justifyContent: "center", height: "44px", fontWeight: 700 }}
              >
                {lang === "es"
                  ? PRICING_CONFIG.plans.ENTERPRISE.ctaTextEs
                  : PRICING_CONFIG.plans.ENTERPRISE.ctaTextEn}
              </button>
              <small className="q-portal-cta-microcopy">
                {lang === "es" ? "Volumen y condiciones personalizadas" : "Custom volume & terms"}
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          13. PREGUNTAS FRECUENTES (FAQ - 12 PREGUNTAS EXIGIDAS EN SECCIÓN 25)
      ---------------------------------------------------------------------- */}
      <section id="faq" className="q-portal-faq">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">
            {lang === "es" ? "DUDAS COMUNES" : "FREQUENTLY ASKED QUESTIONS"}
          </span>
          <h2 className="q-portal-section-title">
            {lang === "es"
              ? "Preguntas Frecuentes sobre QRMM"
              : "Frequently Asked Questions About QRMM"}
          </h2>
          <p className="q-portal-section-subtitle">
            {lang === "es"
              ? "Respuestas claras sobre compatibilidad, seguridad, licencias y arquitectura técnica."
              : "Straightforward answers regarding compatibility, security, licensing, and architecture."}
          </p>
        </div>

        <div className="q-portal-faq-list">
          {FAQS_CONFIG.map((item, idx) => (
            <div key={idx} className="q-portal-faq-item">
              <button className="q-portal-faq-question" onClick={() => toggleFaq(idx)}>
                <span>{lang === "es" ? item.qEs : item.qEn}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaq[idx] ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                  }}
                />
              </button>
              {openFaq[idx] && (
                <div className="q-portal-faq-answer">
                  <p>{lang === "es" ? item.aEs : item.aEn}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          14. CTA FINAL (SECCIÓN 22 DEL PLAN)
      ---------------------------------------------------------------------- */}
      <section className="q-portal-section q-portal-final-cta-section">
        <div className="q-portal-final-cta-box">
          <span className="q-portal-section-badge">
            {lang === "es" ? "PRUÉBALO HOY MISMO" : "START TODAY"}
          </span>
          <h2 className="q-portal-final-cta-title">
            {lang === "es" ? (
              <>
                Control remoto para resolver problemas.
                <br />
                RMM para prevenirlos.
                <br />
                <span style={{ color: "var(--portal-brand)" }}>QRMM para hacer ambas cosas.</span>
              </>
            ) : (
              <>
                Remote Desktop to fix issues.
                <br />
                RMM to prevent downtime.
                <br />
                <span style={{ color: "var(--portal-brand)" }}>QRMM to achieve both seamlessly.</span>
              </>
            )}
          </h2>
          <p className="q-portal-final-cta-subtitle">
            {lang === "es"
              ? "Únete a los técnicos y administradores que gestionan su infraestructura desde una sola consola web."
              : "Join IT technicians and fleet admins managing their endpoints from a unified web console."}
          </p>

          <div className="q-portal-final-cta-actions">
            {onGoToLogin ? (
              <button
                onClick={() => onGoToLogin("register")}
                className="q-portal-btn-primary q-portal-btn-lg"
                style={{ fontWeight: 800 }}
              >
                <span>{lang === "es" ? "Empieza gratis" : "Start for Free"}</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <a
                href="#pricing"
                className="q-portal-btn-primary q-portal-btn-lg"
                style={{ fontWeight: 800 }}
              >
                <span>{lang === "es" ? "Empieza gratis" : "Start for Free"}</span>
                <ArrowRight size={18} />
              </a>
            )}
          </div>
          <span className="q-portal-final-cta-subtext">
            {lang === "es" ? "Sin tarjeta de crédito." : "No credit card required."}
          </span>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          15. FOOTER (QHAPANA TECHNOLOGIES & CONTACTO)
      ---------------------------------------------------------------------- */}
      <footer className="q-portal-footer">
        <div className="q-portal-footer-container">
          <div className="q-portal-footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  background: "var(--portal-brand)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 16,
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                Q
              </span>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>QHAPANA RMM</h4>
            </div>
            <p>
              {lang === "es"
                ? "Plataforma integral de control remoto combinada con la administración completa y automatizada de infraestructura informática."
                : "Unified remote desktop platform combined with automated IT infrastructure monitoring and management."}
            </p>
            <p style={{ marginTop: 12, fontSize: "13px", opacity: 0.85 }}>
              Qhapana Technologies • Lima, Perú • Tel: +51 926 896 030
            </p>
          </div>

          <div className="q-portal-footer-col">
            <h5>{lang === "es" ? "Plataforma" : "Platform"}</h5>
            <ul>
              <li><a href="#pilares">{lang === "es" ? "4 Pilares" : "4 Pillars"}</a></li>
              <li><a href="#rd-vs-rmm">Remote Desktop vs RMM</a></li>
              <li><a href="#para-quien">{lang === "es" ? "¿Para quién es?" : "Target Audience"}</a></li>
              <li><a href="#capacidades">{lang === "es" ? "Capacidades de la Suite" : "Suite Capabilities"}</a></li>
              <li><a href="#pricing">{lang === "es" ? "Planes y Precios" : "Pricing"}</a></li>
            </ul>
          </div>

          <div className="q-portal-footer-col">
            <h5>{lang === "es" ? "Legal & Empresa" : "Company & Legal"}</h5>
            <ul>
              <li><a href="#faq">{lang === "es" ? "Términos del Servicio" : "Terms of Service"}</a></li>
              <li><a href="#faq">{lang === "es" ? "Políticas de Privacidad" : "Privacy Policy"}</a></li>
              <li><a href="https://qhapana.com/" target="_blank" rel="noreferrer">Qhapana Ecosystem</a></li>
            </ul>
          </div>

          <div className="q-portal-footer-col">
            <h5>{lang === "es" ? "Contacto Directo" : "Direct Contact"}</h5>
            <ul>
              <li><a href="mailto:contacto@qhapana.com">contacto@qhapana.com</a></li>
              <li><a href="tel:+51926896030">+51 926 896 030</a></li>
              <li><a href="https://qhapana.com/" target="_blank" rel="noreferrer">qhapana.com</a></li>
            </ul>
          </div>
        </div>

        <div className="q-portal-footer-bottom">
          <span>© {new Date().getFullYear()} Qhapana Technologies. Todos los derechos reservados.</span>
          <span style={{ fontStyle: "italic" }}>
            {lang === "es"
              ? "Tecnología profesional para la gestión de infraestructura TI."
              : "Professional grade technology for IT fleet operations."}
          </span>
        </div>
      </footer>

      {/* ----------------------------------------------------------------------
          16. MODAL DE CHECKOUT / ALTA DE PLAN REDISEÑADO (SECCIÓN 8 DEL PLAN)
      ---------------------------------------------------------------------- */}
      {checkoutModalOpen && selectedPlan && (
        <div className="q-portal-modal-overlay" onClick={() => setCheckoutModalOpen(false)}>
          <div className="q-portal-checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="q-portal-modal-close"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            {checkoutSuccess ? (
              <div className="q-checkout-success-view">
                <CheckCircle2 size={56} color="var(--portal-accent-teal)" style={{ margin: "0 auto 16px" }} />
                <h3>{lang === "es" ? "¡Operación Exitosa!" : "Success!"}</h3>
                <p>
                  {checkoutSuccess.message ||
                    (lang === "es"
                      ? `Hemos activado tu suscripción al plan ${PRICING_CONFIG.plans[selectedPlan].name}. Se enviaron los detalles de acceso a ${customerEmail}.`
                      : `Your ${PRICING_CONFIG.plans[selectedPlan].name} plan is now active. Access details sent to ${customerEmail}.`)}
                </p>
                <div style={{ marginTop: 24 }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      if (onGoToLogin) onGoToLogin("login");
                    }}
                  >
                    {lang === "es" ? "Ir a la Consola de Administración" : "Go to Management Console"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="q-checkout-form-container">
                {/* Cabecera del Checkout con jerarquía visual clara */}
                <div className="q-checkout-header">
                  <div className="q-checkout-plan-tag">
                    <span>{PRICING_CONFIG.plans[selectedPlan].name}</span>
                  </div>
                  <h3 className="q-checkout-title">
                    {selectedPlan === "STARTER"
                      ? (lang === "es" ? "Crea tu cuenta gratuita Starter" : "Create Free Starter Account")
                      : (lang === "es" ? `Suscripción al Plan ${PRICING_CONFIG.plans[selectedPlan].name}` : `Subscribe to ${PRICING_CONFIG.plans[selectedPlan].name} Plan`)}
                  </h3>

                  {/* Resumen de periodicidad, precio y ahorro */}
                  {selectedPlan === "STARTER" ? (
                    <div className="q-checkout-price-banner q-checkout-price-banner--free">
                      <div>
                        <span className="q-checkout-main-price">$0 USD</span>
                        <span className="q-checkout-cycle-label">
                          {lang === "es" ? "Gratis para siempre • Hasta 5 equipos" : "Free forever • Up to 5 endpoints"}
                        </span>
                      </div>
                      <span className="q-checkout-badge-nocard">
                        {lang === "es" ? "Sin tarjeta de crédito" : "No credit card needed"}
                      </span>
                    </div>
                  ) : (
                    <div className="q-checkout-price-banner">
                      <div>
                        <span className="q-checkout-main-price">
                          ${getCurrentPlanAmount(selectedPlan, billingCycle).toFixed(2)} USD
                        </span>
                        <span className="q-checkout-cycle-label">
                          {billingCycle === "yearly"
                            ? (lang === "es" ? "Facturado anualmente" : "Billed annually")
                            : (lang === "es" ? "Facturado mensualmente" : "Billed monthly")}
                        </span>
                      </div>
                      {billingCycle === "yearly" && (
                        <div className="q-checkout-savings-box">
                          <span className="q-checkout-savings-badge">
                            {lang === "es"
                              ? PRICING_CONFIG.plans[selectedPlan].savings.labelEs
                              : PRICING_CONFIG.plans[selectedPlan].savings.labelEn}
                          </span>
                          <small>
                            ≈ ${getMonthlyEquivalent(PRICING_CONFIG.plans[selectedPlan].pricing.yearly.price)} USD/
                            {lang === "es" ? "mes" : "mo"}
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mensaje de error si ocurre */}
                {checkoutError && (
                  <div className="q-checkout-alert-error">
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Formulario */}
                <div className="q-checkout-fields">
                  {/* Selector rápido de ciclo dentro del modal para planes de pago */}
                  {selectedPlan !== "STARTER" && (
                    <div className="q-checkout-field-row">
                      <label className="q-checkout-label">
                        {lang === "es" ? "Modalidad de Facturación:" : "Billing Term:"}
                      </label>
                      <div className="q-checkout-cycle-selector">
                        <button
                          type="button"
                          className={`q-checkout-cycle-btn ${billingCycle === "monthly" ? "q-checkout-cycle-btn--active" : ""}`}
                          onClick={() => setBillingCycle("monthly")}
                        >
                          {lang === "es"
                            ? `Mensual ($${PRICING_CONFIG.plans[selectedPlan].pricing.monthly.price}/mes)`
                            : `Monthly ($${PRICING_CONFIG.plans[selectedPlan].pricing.monthly.price}/mo)`}
                        </button>
                        <button
                          type="button"
                          className={`q-checkout-cycle-btn ${billingCycle === "yearly" ? "q-checkout-cycle-btn--active" : ""}`}
                          onClick={() => setBillingCycle("yearly")}
                        >
                          {lang === "es"
                            ? `Anual ($${PRICING_CONFIG.plans[selectedPlan].pricing.yearly.price}/año — Ahorras $${PRICING_CONFIG.plans[selectedPlan].savings.amountUsd})`
                            : `Yearly ($${PRICING_CONFIG.plans[selectedPlan].pricing.yearly.price}/yr — Save $${PRICING_CONFIG.plans[selectedPlan].savings.amountUsd})`}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="q-checkout-form-grid">
                    <div>
                      <label className="q-checkout-label">
                        {lang === "es" ? "Nombre Completo:" : "Full Name:"}
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={lang === "es" ? "Ej: Carlos Rojas" : "e.g. John Doe"}
                        className="q-checkout-input"
                      />
                    </div>

                    <div>
                      <label className="q-checkout-label">
                        {lang === "es" ? "Correo Corporativo:" : "Work Email:"}
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="admin@tuempresa.com"
                        className="q-checkout-input"
                      />
                    </div>
                  </div>

                  <div className="q-checkout-form-grid">
                    <div>
                      <label className="q-checkout-label">
                        {lang === "es" ? "Contraseña para la Consola:" : "Console Password:"}
                      </label>
                      <input
                        type="password"
                        required
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="q-checkout-input"
                      />
                    </div>

                    <div>
                      <label className="q-checkout-label">
                        {lang === "es" ? "Empresa / Organización:" : "Company / Workspace Name:"}
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder={lang === "es" ? "Ej: Soporte TI SAC" : "e.g. Acme Tech"}
                        className="q-checkout-input"
                      />
                    </div>
                  </div>

                  {/* Método de pago SOLO si es un plan con cobro (PRO o CORPORATIVO) */}
                  {selectedPlan !== "STARTER" && (
                    <>
                      <div>
                        <label className="q-checkout-label">
                          {lang === "es" ? "Método de Pago:" : "Payment Method:"}
                        </label>
                        <select
                          value={checkoutMethod}
                          onChange={(e) => setCheckoutMethod(e.target.value)}
                          className="q-checkout-input"
                        >
                          {PRICING_CONFIG.paymentMethods.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.detail}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cupón de descuento */}
                      <div className="q-checkout-coupon-row">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder={lang === "es" ? "Cupón de descuento (opcional)" : "Coupon code (optional)"}
                          className="q-checkout-input"
                          style={{ flex: 1 }}
                        />
                        <Button variant="secondary" size="md" onClick={handleVerifyPromo}>
                          {lang === "es" ? "Aplicar" : "Apply"}
                        </Button>
                      </div>
                      {promoSuccess && (
                        <span className="q-checkout-promo-badge">
                          <Check size={14} style={{ marginRight: 4 }} />
                          {promoSuccess}
                        </span>
                      )}
                    </>
                  )}

                  {/* Resumen de características del plan */}
                  <div className="q-checkout-summary-box">
                    <span className="q-checkout-summary-title">
                      {lang === "es" ? "Resumen de lo que obtienes:" : "Plan Summary:"}
                    </span>
                    <ul className="q-checkout-summary-list">
                      <li>✔ {lang === "es" ? PRICING_CONFIG.plans[selectedPlan].limits.deviceLabelEs : PRICING_CONFIG.plans[selectedPlan].limits.deviceLabelEn}</li>
                      <li>✔ {lang === "es" ? "Acceso a escritorio remoto desde navegador" : "Browser-based remote desktop access"}</li>
                      <li>✔ {lang === "es" ? "Telemetría continua y alertas automáticas" : "Continuous telemetry & automated alerts"}</li>
                      {selectedPlan !== "STARTER" && (
                        <li>✔ {lang === "es" ? "Sonda de red LAN (Network Discovery)" : "Network Discovery LAN Probe"}</li>
                      )}
                    </ul>
                  </div>

                  {/* Botón de confirmación */}
                  <div style={{ marginTop: 8 }}>
                    <Button
                      variant="primary"
                      disabled={checkoutLoading}
                      onClick={handleExecuteCheckout}
                      style={{ width: "100%", justifyContent: "center", height: "46px", fontSize: "15px" }}
                    >
                      {checkoutLoading
                        ? (lang === "es" ? "Procesando..." : "Processing...")
                        : selectedPlan === "STARTER"
                        ? (lang === "es" ? "Crear Cuenta Gratis y Acceder" : "Create Free Account & Access")
                        : (lang === "es"
                            ? `Confirmar y Activar Plan ($${getCurrentPlanAmount(selectedPlan, billingCycle).toFixed(2)} USD)`
                            : `Confirm & Activate Plan ($${getCurrentPlanAmount(selectedPlan, billingCycle).toFixed(2)} USD)`)}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
