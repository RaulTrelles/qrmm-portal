import React, { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  Cpu,
  CheckCircle2,
  Lock,
  Sparkles,
  X,
  Check,
  Sun,
  Moon,
  Monitor,
  HardDrive,
  Download,
  Upload,
  FolderOpen,
  Radio,
  ChevronDown,
  Activity,
  Laptop,
  ArrowRight,
  LayoutDashboard,
  Layers,
  Server,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Terminal,
  Globe,
  MousePointer,
  Trash2,
  Copy,
  FileText,
  Bell,
  Box,
  List,
  Tag,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/Button/Button";
import { useAuth } from "../context/AuthContext";
import { processCheckout, verifyPromoCode } from "../services/api";
import type { PlanTier, CurrencyCode } from "../types/payment";
import "./PortalView.css";

// -----------------------------------------------------------------------------
// DICCIONARIO BILINGÜE (ESPAÑOL & ENGLISH)
// -----------------------------------------------------------------------------
type Language = "es" | "en";

interface Dictionary {
  nav: {
    features: string;
    pricing: string;
    faq: string;
    login: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    ctaLogin: string;
    platformsLabel: string;
    noCardNeeded: string;
  };
  mockup: {
    title: string;
    stateConnected: string;
    fps: string;
    latency: string;
    encryption: string;
    tabDashboard: string;
    tabDesktop: string;
    tabLogs: string;
    tabFan: string;
    tabFiles: string;
    tabTelemetry: string;
    tabDiscovery: string;
    quickKeys: string;
    ctrlAltDel: string;
    taskmgr: string;
    filesDrawer: string;
    releaseMouse: string;
  };
  features: {
    badge: string;
    title: string;
    subtitle: string;
    f1Title: string;
    f1Desc: string;
    f2Title: string;
    f2Desc: string;
    f3Title: string;
    f3Desc: string;
    f4Title: string;
    f4Desc: string;
    f5Title: string;
    f5Desc: string;
    f6Title: string;
    f6Desc: string;
  };
  ctaSec: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust1: string;
    trust2: string;
    trust3: string;
  };
  pricing: {
    badge: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    starterTitle: string;
    starterDesc: string;
    proTitle: string;
    proDesc: string;
    enterpriseTitle: string;
    enterpriseDesc: string;
    freeForever: string;
    choosePlan: string;
    popularBadge: string;
    fDevices3: string;
    fDevicesUnlim: string;
    fFileTransfer: string;
    fAlertsBasic: string;
    fAlertsSmart: string;
    fAuditLan: string;
    fDedicatedSupport: string;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
  };
  footer: {
    desc: string;
    prodTitle: string;
    legalTitle: string;
    contactTitle: string;
    terms: string;
    privacy: string;
    rights: string;
    tagline: string;
  };
}

const DICTIONARY: Record<Language, Dictionary> = {
  es: {
    nav: {
      features: "Funcionalidades",
      pricing: "Planes y Precios",
      faq: "Preguntas Frecuentes",
      login: "Iniciar Sesión",
      getStarted: "Probar Gratis",
    },
    hero: {
      badge: "QHAPANA RMM v2.4 • El Nuevo Estándar en Escritorio Remoto y Telemetría TI",
      title1: "Rápido. Seguro.",
      title2: "Desde cualquier lugar.",
      subtitle:
        "Acceso remoto de ultrabaja latencia a 60 FPS con telemetría RMM empresarial en tiempo real, transferencia de archivos sin límites de tamaño y descubrimiento automatizado de redes LAN.",
      ctaLogin: "Acceder a la Consola",
      platformsLabel: "Compatible con Windows 11, 10, Server 2022/2019/2016, Linux y Web",
      noCardNeeded: "Instalación en 1 minuto • No requiere reiniciar el equipo • 100% Autohospedable",
    },
    mockup: {
      title: "QHAPANA RMM • Consola de Gestión Central & Acceso Remoto Enterprise",
      stateConnected: "182/186 EN LÍNEA • SOCKET EN VIVO",
      fps: "60 FPS (HW Accelerated)",
      latency: "Latencia: 11 ms",
      encryption: "Cifrado: TLS 1.2 / AES-256",
      tabDashboard: "Panel Central RMM",
      tabDesktop: "Escritorio Remoto (Windows 11)",
      tabLogs: "Diagnóstico & Logs",
      tabFan: "Abanico Multisesión",
      tabFiles: "Gestor de Archivos",
      tabTelemetry: "Telemetría TI & Servicios",
      tabDiscovery: "Auditoría de Red LAN",
      quickKeys: "Atajos Rápidos:",
      ctrlAltDel: "Ctrl+Alt+Del",
      taskmgr: "Taskmgr",
      filesDrawer: "Archivos Remotos",
      releaseMouse: "Liberar Ratón",
    },
    features: {
      badge: "¿POR QUÉ QHAPANA RMM?",
      title: "Diseñado para superar a las herramientas de escritorio convencionales",
      subtitle:
        "Una plataforma integral que combina el control remoto ultrarrápido con la administración completa y automatizada de infraestructura informática.",
      f1Title: "Escritorio Remoto de Alto Rendimiento",
      f1Desc:
        "Transmisión gráfica suave a 60 FPS adaptativa a conexiones lentas. Acceso transparente a través de firewalls y NAT sin abrir puertos.",
      f2Title: "Transferencia Bidireccional de Archivos",
      f2Desc:
        "Envíe y descargue archivos entre su navegador y el disco remoto al instante sin límites de tamaño, con motor dual WebSocket y PowerShell.",
      f3Title: "Telemetría TI y Vigilancia RMM",
      f3Desc:
        "Monitoreo continuo de CPU, memoria RAM, almacenamiento en discos, procesos en ejecución y estado de servicios críticos del sistema.",
      f4Title: "Alertas Inteligentes por PC y Cliente",
      f4Desc:
        "Notificación inmediata de desconexión o apagado repentino enviada al correo del cliente responsable o administradores globales.",
      f5Title: "Descubrimiento de Red y Sondas LAN",
      f5Desc:
        "Escaneo automatizado de subredes corporativas, detección de equipos sin gestionar y despliegue remoto desatendido de agentes.",
      f6Title: "Soberanía de Datos y Privacidad Total",
      f6Desc:
        "Arquitectura 100% privada con cifrado punto a punto TLS 1.2 / RSA 2048. Sus datos empresariales nunca pasan por nubes de terceros.",
    },
    ctaSec: {
      badge: "ACCESO INMEDIATO EN LA NUBE",
      title: "Comience a supervisar y controlar su infraestructura hoy mismo",
      subtitle:
        "Cree su espacio en 30 segundos, invite a su equipo técnico y conecte sus primeros 2 equipos 100% gratis para siempre. Sin contratos de permanencia ni tarjeta de crédito.",
      ctaPrimary: "Acceder a la Consola Gratis",
      ctaSecondary: "Ver Planes y Precios",
      trust1: "Activación inmediata en 1 minuto",
      trust2: "Sin tarjeta de crédito requerida",
      trust3: "Cifrado seguro punto a punto TLS 1.2",
    },
    pricing: {
      badge: "PLANES Y TARIFAS",
      title: "Inversión transparente adaptada a cada empresa",
      subtitle: "Elija el plan ideal para su equipo técnico o departamento de TI corporativo.",
      monthly: "Facturación Mensual",
      yearly: "Facturación Anual",
      starterTitle: "Starter",
      starterDesc: "Para técnicos independientes y soporte a pequeñas oficinas.",
      proTitle: "Profesional",
      proDesc: "Para proveedores de servicios gestionados (MSP) y empresas de TI.",
      enterpriseTitle: "Corporativo",
      enterpriseDesc: "Para organizaciones con grandes flotas y centros de datos.",
      freeForever: "Gratis para siempre",
      choosePlan: "Elegir este Plan",
      popularBadge: "MÁS POPULAR",
      fDevices3: "Hasta 2 equipos enrolados",
      fDevicesUnlim: "Equipos ilimitados en la flota",
      fFileTransfer: "Transferencia bidireccional de archivos",
      fAlertsBasic: "Alertas básicas de conexión",
      fAlertsSmart: "Alertas inteligentes por cliente/PC",
      fAuditLan: "Descubrimiento de red LAN y sondas",
      fDedicatedSupport: "Soporte prioritario 24/7 y SLA 99.9%",
    },
    faq: {
      badge: "PREGUNTAS FRECUENTES",
      title: "Todo lo que necesita saber sobre Qhapana RMM",
      subtitle: "Respuestas claras sobre seguridad, latencia, instalación y compatibilidad.",
      q1: "¿En qué se diferencia Qhapana RMM de AnyDesk o TeamViewer?",
      a1: "A diferencia de las herramientas convencionales que solo ofrecen escritorio remoto, Qhapana RMM es una suite completa que integra escritorio remoto, telemetría de hardware, monitor de servicios y procesos, alertas por apagado repentino enrutadas por cliente y descubrimiento de red local en un único agente ligero de ~8.5 MB.",
      q2: "¿Es necesario abrir puertos en el router o configurar VPN?",
      a2: "No. El agente de Qhapana establece una conexión saliente segura cifrada mediante WebSockets con TLS 1.2 hacia el servidor central. Atraviesa cortafuegos, proxies y arquitecturas NAT corporativas sin requerir configuración de puertos.",
      q3: "¿Qué sucede si una máquina se apaga inesperadamente?",
      a3: "El motor de supervisión (Watchdog) detecta la interrupción del latido de telemetría en tiempo real y despacha inmediatamente un correo de alerta con el diagnóstico del equipo al contacto del cliente asignado o al equipo de soporte.",
      q4: "¿Puedo transferir archivos pesados entre las máquinas?",
      a4: "Sí. Qhapana RMM cuenta con un motor de transferencia bidireccional con explorador de carpetas integrado en la ventana de control remoto, permitiendo enviar y descargar archivos sin límites arbitrarios de tamaño.",
    },
    footer: {
      desc: "Software especializado en escritorio remoto de alta velocidad, telemetría y observabilidad empresarial de infraestructura TI.",
      prodTitle: "Producto",
      legalTitle: "Legal y Seguridad",
      contactTitle: "Contacto & Soporte",
      terms: "Términos del Servicio",
      privacy: "Políticas de Privacidad",
      rights: "Todos los derechos reservados. Qhapana Technologies.",
      tagline: "Inteligencia empresarial para empresas que quieren evolucionar.",
    },
  },
  en: {
    nav: {
      features: "Features",
      pricing: "Plans & Pricing",
      faq: "FAQ",
      login: "Log In",
      getStarted: "Try Free",
    },
    hero: {
      badge: "QHAPANA RMM v2.4 • The New Standard in Remote Desktop & IT Fleet Telemetry",
      title1: "Fast. Secure.",
      title2: "From anywhere.",
      subtitle:
        "Ultra-low latency remote access at 60 FPS with real-time enterprise RMM telemetry, unlimited bidirectional file transfers, and automated LAN network audit.",
      ctaLogin: "Access Console",
      platformsLabel: "Compatible with Windows 11, 10, Server 2022/2019/2016, Linux & Web",
      noCardNeeded: "1-minute install • Zero reboots required • 100% Self-Hostable or Cloud",
    },
    mockup: {
      title: "QHAPANA RMM • Central SaaS Management Console & Enterprise Remote Control",
      stateConnected: "182/186 ONLINE • LIVE SOCKET",
      fps: "60 FPS (HW Accelerated)",
      latency: "Latency: 11 ms",
      encryption: "Cipher: TLS 1.2 / AES-256",
      tabDashboard: "Central RMM Dashboard",
      tabDesktop: "Remote Desktop (Windows 11)",
      tabLogs: "Diagnostics & Logs",
      tabFan: "Multi-Session Fan Deck",
      tabFiles: "File Manager",
      tabTelemetry: "IT Telemetry & Services",
      tabDiscovery: "LAN Network Audit",
      quickKeys: "Quick Keys:",
      ctrlAltDel: "Ctrl+Alt+Del",
      taskmgr: "Taskmgr",
      filesDrawer: "Remote Files",
      releaseMouse: "Release Mouse",
    },
    features: {
      badge: "WHY QHAPANA RMM?",
      title: "Engineered to surpass legacy remote desktop tools",
      subtitle:
        "A unified platform combining blazing-fast remote control with complete automated IT endpoint management.",
      f1Title: "High-Performance Remote Desktop",
      f1Desc:
        "Smooth, adaptive 60 FPS graphical streaming optimized for low-bandwidth connections. Seamless NAT & firewall traversal with zero port forwarding.",
      f2Title: "Bidirectional File Transfer",
      f2Desc:
        "Instantly send and receive files between your local browser and remote disk with no arbitrary file size limits, powered by dual WebSocket & PowerShell engines.",
      f3Title: "Full RMM Telemetry & Health Monitoring",
      f3Desc:
        "Continuous tracking of CPU, RAM, disk storage, running processes, and critical Windows/Linux background system services.",
      f4Title: "Smart Per-Device & Client Alerts",
      f4Desc:
        "Instant notification dispatched via SMTP upon unexpected power outages or connection timeouts, routed directly to the specific client.",
      f5Title: "Network Discovery & LAN Probes",
      f5Desc:
        "Automated subnet scanning, detection of unmanaged rogue endpoints, and remote silent agent deployment via native network probes.",
      f6Title: "Total Data Sovereignty & Privacy",
      f6Desc:
        "100% private architecture with end-to-end TLS 1.2 / RSA 2048 encryption. Your corporate data never transits third-party public clouds.",
    },
    ctaSec: {
      badge: "INSTANT CLOUD ACCESS",
      title: "Start monitoring and managing your infrastructure today",
      subtitle:
        "Create your workspace in 30 seconds, invite your technical team, and connect your first 2 machines 100% free forever. No long-term commitments or credit card required.",
      ctaPrimary: "Access Free Console Now",
      ctaSecondary: "Explore Plans & Pricing",
      trust1: "Instant 1-minute setup",
      trust2: "No credit card required",
      trust3: "End-to-end TLS 1.2 encryption",
    },
    pricing: {
      badge: "PLANS & PRICING",
      title: "Transparent investment tailored for every business scale",
      subtitle: "Choose the optimal plan for your technical team or corporate IT department.",
      monthly: "Monthly Billing",
      yearly: "Annual Billing",
      starterTitle: "Starter",
      starterDesc: "For freelance technicians and small office support.",
      proTitle: "Professional",
      proDesc: "For Managed Service Providers (MSPs) and modern IT teams.",
      enterpriseTitle: "Enterprise",
      enterpriseDesc: "For corporations managing large fleets and high-density servers.",
      freeForever: "Free forever",
      choosePlan: "Choose this Plan",
      popularBadge: "MOST POPULAR",
      fDevices3: "Up to 2 enrolled devices",
      fDevicesUnlim: "Unlimited fleet devices",
      fFileTransfer: "Bidirectional file manager",
      fAlertsBasic: "Basic connection alerts",
      fAlertsSmart: "Per-device client smart alerts",
      fAuditLan: "Network discovery & LAN probes",
      fDedicatedSupport: "24/7 priority support & 99.9% SLA",
    },
    faq: {
      badge: "FREQUENTLY ASKED QUESTIONS",
      title: "Everything you need to know about Qhapana RMM",
      subtitle: "Clear answers on security, performance, installation, and compliance.",
      q1: "How does Qhapana RMM differ from AnyDesk or TeamViewer?",
      a1: "Unlike legacy remote tools that only provide screen viewing, Qhapana RMM is an all-in-one suite combining remote desktop access, hardware telemetry, process & service managers, unexpected outage watchdog alerts routed per client, and LAN discovery in a single ~8.5 MB Go binary.",
      q2: "Is port forwarding or VPN configuration necessary?",
      a2: "No. The Qhapana agent initiates an outbound secure TLS 1.2 WebSocket connection to the central server, traversing enterprise firewalls, proxies, and NAT without requiring any open inbound ports.",
      q3: "What happens if a computer shuts down unexpectedly?",
      a3: "The real-time watchdog detects the missing heartbeat within seconds and immediately dispatches a detailed outage alert to the specific client's email or to global administrators.",
      q4: "Can I transfer large files between machines?",
      a4: "Yes. Qhapana RMM includes an integrated bidirectional file transfer drawer with direct disk navigation, allowing upload and download without restrictive file size limits.",
    },
    footer: {
      desc: "Specialized software in high-performance remote desktop, telemetry, and enterprise IT infrastructure observability.",
      prodTitle: "Product",
      legalTitle: "Legal & Security",
      contactTitle: "Contact & Support",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      rights: "All rights reserved. Qhapana Technologies.",
      tagline: "Enterprise intelligence for companies that choose to evolve.",
    },
  },
};

// -----------------------------------------------------------------------------
// CONFIGURACIÓN DE PAÍSES Y MONEDAS PARA PRECIOS
// -----------------------------------------------------------------------------
interface GlobalPlanConfig {
  currencySymbol: string;
  currencyCode: CurrencyCode;
  methods: { id: string; name: string; detail: string }[];
  prices: {
    STARTER: { monthly: number; yearly: number };
    PRO: { monthly: number; yearly: number };
    ENTERPRISE: { monthly: number; yearly: number };
  };
}

const GLOBAL_PRICING: GlobalPlanConfig = {
  currencySymbol: "$",
  currencyCode: "USD",
  methods: [
    { id: "CARD", name: "Tarjeta de Crédito / Débito Internacional", detail: "Visa, Mastercard, Amex" },
    { id: "STRIPE", name: "Stripe Checkout", detail: "Pasarela global segura" },
    { id: "WIRE", name: "Transferencia B2B Internacional", detail: "Facturación corporativa USD" },
  ],
  prices: {
    STARTER: { monthly: 0, yearly: 0 },
    PRO: { monthly: 19, yearly: 190 },
    ENTERPRISE: { monthly: 69, yearly: 690 },
  },
};

interface PortalViewProps {
  onGoToLogin?: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ onGoToLogin }) => {
  const { user } = useAuth();

  // Estados de Idioma y Tema Qhapana (Light / Dark)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("q_portal_lang") as Language) || "es";
  });
  const [portalTheme, setPortalTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("q_portal_theme") as "light" | "dark") || "light";
  });

  // Estados de Navegación & Mockup Interactivo
  const [mockupTab, setMockupTab] = useState<"dashboard" | "desktop" | "logs" | "fan" | "telemetry" | "files">("dashboard");
  const [detailSubTab, setDetailSubTab] = useState<"overview" | "processes" | "services" | "logs">("logs");
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true });

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

  const t = DICTIONARY[lang];

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
        setPromoSuccess(`¡Código ${res.code} aplicado! ${res.discount_percent}% de descuento.`);
        setPromoDiscountPct(res.discount_percent);
      } else {
        setPromoSuccess(null);
        setPromoDiscountPct(0);
        setCheckoutError("El código de promoción no es válido o ya expiró.");
      }
    } catch {
      setCheckoutError("Error al verificar cupón.");
    }
  };

  const handleExecuteCheckout = async () => {
    if (!customerEmail.trim()) {
      setCheckoutError("Por favor ingrese su correo electrónico para recibir su licencia.");
      return;
    }
    if (!customerPassword.trim()) {
      setCheckoutError("Por favor ingrese una contraseña para su cuenta de administrador.");
      return;
    }
    if (!selectedPlan) return;

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const res = await processCheckout({
        full_name: customerName.trim() || customerEmail.split("@")[0],
        email: customerEmail.trim(),
        password: customerPassword.trim(),
        organization_name: orgName.trim() || `${customerName || "Empresa"} Workspace`,
        plan_tier: selectedPlan,
        billing_cycle: billingCycle,
        currency: GLOBAL_PRICING.currencyCode,
        amount: getPrice(selectedPlan),
        gateway: checkoutMethod,
        promo_code: promoCodeInput.trim() ? promoCodeInput.trim().toUpperCase() : undefined,
      });
      setCheckoutSuccess(res);
    } catch (err: any) {
      setCheckoutError(err.message || "Error al procesar el pago.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getPrice = (tier: PlanTier) => {
    const base = GLOBAL_PRICING.prices[tier][billingCycle];
    if (promoDiscountPct > 0) {
      return base * (1 - promoDiscountPct / 100);
    }
    return base;
  };

  return (
    <div className="q-portal" data-portal-theme={portalTheme}>
      {/* ----------------------------------------------------------------------
          HEADER PRINCIPAL (STICKY CON BLUR & CONTROLES)
      ---------------------------------------------------------------------- */}
      <header className="q-portal-header">
        <div className="q-portal-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="q-portal-logo-icon">Q</div>
          <span className="q-portal-brand-title">
            QHAPANA <span style={{ color: "var(--portal-brand)" }}>RMM</span>
            <span className="q-portal-brand-badge">SaaS</span>
          </span>
        </div>

        <nav className="q-portal-nav">
          <a href="#features" className="q-portal-nav-link">{t.nav.features}</a>
          <a href="#pricing" className="q-portal-nav-link">{t.nav.pricing}</a>
          <a href="#faq" className="q-portal-nav-link">{t.nav.faq}</a>
        </nav>

        <div className="q-portal-actions">
          {/* Switch de Idioma */}
          <div className="q-portal-ctrl-group">
            <button
              className={`q-portal-pill-btn ${lang === "es" ? "q-portal-pill-btn--active" : ""}`}
              onClick={() => setLang("es")}
              title="Español"
            >
              ES
            </button>
            <button
              className={`q-portal-pill-btn ${lang === "en" ? "q-portal-pill-btn--active" : ""}`}
              onClick={() => setLang("en")}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Switch de Tema Claro / Oscuro */}
          <button
            className="q-portal-icon-toggle"
            onClick={toggleTheme}
            title={portalTheme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {portalTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Botón de Inicio de Sesión / Consola */}
          {onGoToLogin && (
            <Button variant="secondary" size="sm" onClick={onGoToLogin}>
              {t.nav.login}
            </Button>
          )}

          <a href="#pricing" className="q-portal-btn-primary" style={{ padding: "8px 18px", fontSize: "13.5px" }}>
            {t.nav.getStarted}
          </a>
        </div>
      </header>

      {/* ----------------------------------------------------------------------
          HERO SECTION (ESTILO ANYDESK: TITULAR DIRECTO, MOCKUP INTERACTIVO)
      ---------------------------------------------------------------------- */}
      <section className="q-portal-hero">
        <div className="q-portal-hero-tag">
          <Sparkles size={14} />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="q-portal-hero-title">
          {t.hero.title1} <br />
          {t.hero.title2}
        </h1>

        <p className="q-portal-hero-desc">
          {t.hero.subtitle}
        </p>

        <div className="q-portal-hero-cta-row">
          {onGoToLogin ? (
            <button
              onClick={onGoToLogin}
              className="q-portal-btn-primary"
              style={{
                fontSize: "16px",
                padding: "16px 36px",
                boxShadow: "0 10px 30px rgba(99, 102, 241, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <Laptop size={20} />
              <span style={{ fontWeight: 700 }}>{t.hero.ctaLogin}</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <a
              href="/login"
              className="q-portal-btn-primary"
              style={{
                fontSize: "16px",
                padding: "16px 36px",
                boxShadow: "0 10px 30px rgba(99, 102, 241, 0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Laptop size={20} />
              <span style={{ fontWeight: 700 }}>{t.hero.ctaLogin}</span>
              <ArrowRight size={18} />
            </a>
          )}

          <a
            href="#pricing"
            className="q-portal-btn-secondary"
            style={{ fontSize: "15px", padding: "16px 30px" }}
          >
            <span>{t.nav.pricing}</span>
          </a>
        </div>

        <div className="q-portal-platforms">
          <span>{t.hero.platformsLabel}</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <span className="q-portal-platform-chip">Windows</span>
            <span className="q-portal-platform-chip">Linux</span>
            <span className="q-portal-platform-chip">Android</span>
            <span className="q-portal-platform-chip">Web</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            MOCKUP INTERACTIVO DE ESCRITORIO REMOTO Y RMM
        ------------------------------------------------------------------ */}
        <div className="q-portal-mockup-wrapper">
          {/* Barra de Título de la Ventana */}
          <div className="q-portal-mockup-titlebar">
            <div className="q-portal-mockup-dots">
              <div className="q-portal-mockup-dot q-portal-mockup-dot--red" />
              <div className="q-portal-mockup-dot q-portal-mockup-dot--yellow" />
              <div className="q-portal-mockup-dot q-portal-mockup-dot--green" />
            </div>
            <div className="q-portal-mockup-title">
              <Monitor size={15} color="var(--portal-brand)" />
              <span>{t.mockup.title}</span>
            </div>
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 700, letterSpacing: "0.04em" }}>
              ● {t.mockup.stateConnected}
            </span>
          </div>

          {/* Pestañas de Navegación del Simulador */}
          <div className="q-portal-mockup-tabs">
            <button
              className={`q-portal-mockup-tab ${mockupTab === "dashboard" ? "q-portal-mockup-tab--active" : ""}`}
              onClick={() => setMockupTab("dashboard")}
            >
              <LayoutDashboard size={14} /> {t.mockup.tabDashboard}
            </button>
            <button
              className={`q-portal-mockup-tab ${mockupTab === "desktop" ? "q-portal-mockup-tab--active" : ""}`}
              onClick={() => setMockupTab("desktop")}
            >
              <Monitor size={14} /> {t.mockup.tabDesktop}
            </button>
            <button
              className={`q-portal-mockup-tab ${mockupTab === "logs" ? "q-portal-mockup-tab--active" : ""}`}
              onClick={() => setMockupTab("logs")}
            >
              <FileText size={14} /> {t.mockup.tabLogs}
            </button>
            <button
              className={`q-portal-mockup-tab ${mockupTab === "fan" ? "q-portal-mockup-tab--active" : ""}`}
              onClick={() => setMockupTab("fan")}
            >
              <Layers size={14} /> {t.mockup.tabFan}
            </button>
            <button
              className={`q-portal-mockup-tab ${mockupTab === "files" ? "q-portal-mockup-tab--active" : ""}`}
              onClick={() => setMockupTab("files")}
            >
              <FolderOpen size={14} /> {t.mockup.tabFiles}
            </button>
          </div>

          {/* Cuerpo del Simulador */}
          <div className="q-portal-mockup-body" style={{ padding: "16px" }}>
            {/* --------------------------------------------------------------
                VISTA 1: DASHBOARD CENTRAL SAAS (SOLICITADO POR EL USUARIO)
            -------------------------------------------------------------- */}
            {mockupTab === "dashboard" && (
              <div className="q-portal-dash-container">
                {/* Sidebar izquierdo estilo consola Qhapana RMM */}
                <div className="q-portal-dash-sidebar">
                  <div className="q-portal-dash-brand">
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                      Q
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Qhapana RMM</div>
                      <div style={{ fontSize: 9, color: "#818cf8", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>SaaS Platform</div>
                    </div>
                  </div>

                  <div>
                    <div className="q-portal-dash-nav-section-title">Operaciones</div>
                    <div className="q-portal-dash-nav-item q-portal-dash-nav-item--active">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LayoutDashboard size={14} /> Dashboard
                      </span>
                    </div>
                    <div className="q-portal-dash-nav-item">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Server size={14} /> Inventario
                      </span>
                      <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 10, color: "#94a3b8" }}>186</span>
                    </div>
                    <div className="q-portal-dash-nav-item">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Radio size={14} /> Auditoría LAN
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="q-portal-dash-nav-section-title">Administración SaaS</div>
                    <div className="q-portal-dash-nav-item">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Shield size={14} /> Clientes & Sedes
                      </span>
                      <span style={{ fontSize: 10, background: "rgba(99,102,241,0.2)", padding: "1px 6px", borderRadius: 10, color: "#a5b4fc" }}>12</span>
                    </div>
                    <div className="q-portal-dash-nav-item">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Laptop size={14} /> Técnicos en Línea
                      </span>
                      <span style={{ fontSize: 10, color: "#34d399", fontWeight: 700 }}>● 6</span>
                    </div>
                    <div className="q-portal-dash-nav-item">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Lock size={14} /> Seguridad & Alertas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Área principal del Dashboard */}
                <div className="q-portal-dash-main">
                  {/* Topbar del panel */}
                  <div className="q-portal-dash-topbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                        Panel de Supervisión (Global)
                      </h3>
                      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 10px", fontSize: 11.5, color: "#cbd5e1" }}>
                        🏢 Todos los Clientes (Corporación Global) ▼
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(52, 211, 153, 0.12)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                        Socket En Vivo
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "#a5b4fc", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                        Administrador • SUPERADMIN
                      </span>
                    </div>
                  </div>

                  {/* 4 Tarjetas KPI */}
                  <div className="q-portal-dash-kpis">
                    <div className="q-portal-dash-kpi">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Total Dispositivos</span>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Layers size={13} color="#818cf8" />
                        </div>
                      </div>
                      <div className="q-portal-dash-kpi-val" style={{ color: "#fff" }}>186</div>
                      <span style={{ fontSize: 10.5, color: "#64748b" }}>Enrolados en la flota</span>
                    </div>

                    <div className="q-portal-dash-kpi">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Equipos Online</span>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle2 size={13} color="#34d399" />
                        </div>
                      </div>
                      <div className="q-portal-dash-kpi-val" style={{ color: "#34d399" }}>182</div>
                      <span style={{ fontSize: 10.5, color: "#34d399" }}>Transmitiendo heartbeats (98%)</span>
                    </div>

                    <div className="q-portal-dash-kpi">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Inestables / Lag</span>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <AlertTriangle size={13} color="#f59e0b" />
                        </div>
                      </div>
                      <div className="q-portal-dash-kpi-val" style={{ color: "#f59e0b" }}>1</div>
                      <span style={{ fontSize: 10.5, color: "#64748b" }}>Heartbeat retrasado &gt; 15s</span>
                    </div>

                    <div className="q-portal-dash-kpi">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Equipos Offline</span>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(244,63,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <XCircle size={13} color="#f43f5e" />
                        </div>
                      </div>
                      <div className="q-portal-dash-kpi-val" style={{ color: "#f43f5e" }}>3</div>
                      <span style={{ fontSize: 10.5, color: "#64748b" }}>Notificación SMTP enviada</span>
                    </div>
                  </div>

                  {/* Fila de Búsqueda y Filtros */}
                  <div className="q-portal-dash-filter-row">
                    <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 12px", fontSize: 12 }}>
                      <Search size={14} color="#64748b" />
                      <span style={{ color: "#64748b" }}>Buscar por hostname, código o IP...</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, color: "#cbd5e1" }}>
                        Todos los SO ▼
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, color: "#cbd5e1" }}>
                        Todos los Estados ▼
                      </div>
                      <button style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <Plus size={14} /> Vincular Dispositivo
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Dispositivos (Nombres Profesionales & Marketeros) */}
                  <div className="q-portal-dash-table-wrap">
                    <table className="q-portal-dash-table">
                      <thead>
                        <tr>
                          <th>Equipo</th>
                          <th>Área / Cliente</th>
                          <th>Estado</th>
                          <th>SO / Arquitectura</th>
                          <th>IP Privada / Pública</th>
                          <th>Disponibilidad</th>
                          <th>Última Conexión</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            host: "SRV-SAP-HANA-PROD",
                            code: "QR-9014A8",
                            client: "Finanzas & Operaciones",
                            status: "ONLINE",
                            os: "Windows Server 2022 x64",
                            ip: "10.0.1.15 / 190.237.45.10",
                            uptime: "99.99%",
                            last: "Hace 2s",
                          },
                          {
                            host: "POS-RETAIL-MIRAFLORES",
                            code: "QR-3382F1",
                            client: "Retail & Sucursales",
                            status: "ONLINE",
                            os: "Windows 11 Pro 23H2",
                            ip: "192.168.10.42 / 200.48.81.19",
                            uptime: "100%",
                            last: "Hace 1s",
                          },
                          {
                            host: "SRV-DATA-WAREHOUSE",
                            code: "QR-7719D2",
                            client: "Business Intelligence",
                            status: "ONLINE",
                            os: "Ubuntu Server 22.04 LTS",
                            ip: "10.0.0.8 / 190.237.45.12",
                            uptime: "100%",
                            last: "Hace 1s",
                          },
                          {
                            host: "WS-AUDITORIA-LEGAL",
                            code: "QR-4491C3",
                            client: "Legal & Compliance",
                            status: "ONLINE",
                            os: "Windows 11 Pro 23H2",
                            ip: "192.168.1.88 / 181.65.22.4",
                            uptime: "99.95%",
                            last: "Hace 4s",
                          },
                          {
                            host: "SRV-BACKUP-OFFSITE",
                            code: "QR-8820B9",
                            client: "Infraestructura TI",
                            status: "ONLINE",
                            os: "Windows Server 2019 x64",
                            ip: "10.0.5.21 / 190.237.45.24",
                            uptime: "100%",
                            last: "Hace 3s",
                          },
                          {
                            host: "WS-INGENIERIA-CAD",
                            code: "QR-1205E4",
                            client: "I+D & Diseño Industrial",
                            status: "OFFLINE",
                            os: "Windows 11 Pro 23H2",
                            ip: "192.168.20.15 / 200.48.81.33",
                            uptime: "98.4%",
                            last: "Hace 4m",
                          },
                        ].map((dev, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Monitor size={15} color={dev.status === "ONLINE" ? "#818cf8" : "#94a3b8"} />
                                <div>
                                  <div style={{ fontWeight: 700, color: "#fff" }}>{dev.host}</div>
                                  <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{dev.code}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 4, color: "#cbd5e1", fontSize: 11 }}>
                                {dev.client}
                              </span>
                            </td>
                            <td>
                              {dev.status === "ONLINE" ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#34d399", fontWeight: 700, background: "rgba(52,211,153,0.12)", padding: "3px 8px", borderRadius: 4, fontSize: 10.5 }}>
                                  ● ONLINE
                                </span>
                              ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#f43f5e", fontWeight: 700, background: "rgba(244,63,94,0.12)", padding: "3px 8px", borderRadius: 4, fontSize: 10.5 }}>
                                  ● OFFLINE
                                </span>
                              )}
                            </td>
                            <td style={{ color: "#94a3b8", fontSize: 11 }}>{dev.os}</td>
                            <td style={{ fontFamily: "monospace", color: "#64748b", fontSize: 10.5 }}>{dev.ip}</td>
                            <td style={{ color: dev.status === "ONLINE" ? "#34d399" : "#f59e0b", fontWeight: 600 }}>{dev.uptime}</td>
                            <td style={{ color: "#64748b", fontSize: 10.5 }}>{dev.last}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => setMockupTab("desktop")}
                                  title="Conectar a escritorio remoto"
                                  style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", padding: "3px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <Zap size={11} /> Conectar
                                </button>
                                <button
                                  onClick={() => setMockupTab("logs")}
                                  title="Ver detalle y logs del equipo"
                                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "3px 8px", borderRadius: 4, fontSize: 10.5, cursor: "pointer" }}
                                >
                                  Detalle
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                VISTA 2: ESCRITORIO REMOTO LIMPIO (WINDOWS 11 SIN MARCAS)
            -------------------------------------------------------------- */}
            {mockupTab === "desktop" && (
              <div className="q-portal-win-wrapper">
                {/* Barra de control superior de sesión remota */}
                <div className="q-portal-win-topbar">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                      <Monitor size={14} color="#818cf8" /> SRV-SAP-HANA-PROD (QR-9014A8)
                    </span>
                    <span style={{ fontSize: 11, color: "#34d399", background: "rgba(52,211,153,0.15)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                      ● En Vivo • 60 FPS
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>1920 × 1080 • Latencia: 11 ms</span>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <button style={{ background: "#2563eb", border: "none", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                      <MousePointer size={12} /> Control Activo
                    </button>
                    <button style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                      Modo Monitor
                    </button>
                    <button style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                      Ctrl+Alt+Del
                    </button>
                    <button style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                      Taskmgr
                    </button>
                    <button
                      onClick={() => setMockupTab("files")}
                      style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <FolderOpen size={12} /> Archivos
                    </button>
                    <button style={{ background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#fcd34d", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                      Liberar Ratón
                    </button>
                  </div>
                </div>

                {/* Lienzo del Escritorio Windows 11 Limpio */}
                <div className="q-portal-win-desktop">
                  {/* Iconos de Escritorio Genéricos Corporativos (Sin marcas comerciales) */}
                  <div className="q-portal-win-desktop-icons">
                    <div className="q-portal-win-desktop-icon">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(37,99,235,0.25)", border: "1px solid rgba(56,189,248,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Monitor size={22} color="#38bdf8" />
                      </div>
                      <span>Este Equipo</span>
                    </div>

                    <div className="q-portal-win-desktop-icon">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(99,102,241,0.25)", border: "1px solid rgba(129,140,248,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Globe size={22} color="#818cf8" />
                      </div>
                      <span>Red Local</span>
                    </div>

                    <div className="q-portal-win-desktop-icon">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(16,185,129,0.25)", border: "1px solid rgba(52,211,153,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FolderOpen size={22} color="#34d399" />
                      </div>
                      <span>Archivos TI</span>
                    </div>

                    <div className="q-portal-win-desktop-icon">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(168,85,247,0.25)", border: "1px solid rgba(192,132,252,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Terminal size={22} color="#c084fc" />
                      </div>
                      <span>PowerShell</span>
                    </div>

                    <div className="q-portal-win-desktop-icon">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(244,63,94,0.25)", border: "1px solid rgba(251,113,133,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Shield size={22} color="#fb7185" />
                      </div>
                      <span>Seguridad</span>
                    </div>
                  </div>

                  {/* Banner flotante informativo en el centro del escritorio */}
                  <div style={{ alignSelf: "center", background: "rgba(15,23,42,0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 24px", borderRadius: 30, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    <Zap size={16} color="#34d399" />
                    <span style={{ fontSize: 12.5, color: "#f8fafc", fontWeight: 600 }}>
                      Transmisión gráfica fluida a 60 FPS • Cifrado TLS 1.2 AES-256 • Latencia de 11 ms
                    </span>
                  </div>

                  {/* Barra de Tareas Windows 11 Centrada */}
                  <div className="q-portal-win-taskbar">
                    {/* Inicio y Apps centradas */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #0284c7, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                          <span style={{ width: 4, height: 4, background: "#fff", borderRadius: 1 }} />
                          <span style={{ width: 4, height: 4, background: "#fff", borderRadius: 1 }} />
                          <span style={{ width: 4, height: 4, background: "#fff", borderRadius: 1 }} />
                          <span style={{ width: 4, height: 4, background: "#fff", borderRadius: 1 }} />
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, width: 140 }}>
                        <Search size={11} /> Buscar...
                      </div>

                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <FolderOpen size={14} color="#fcd34d" />
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Terminal size={14} color="#38bdf8" />
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Globe size={14} color="#818cf8" />
                      </div>
                    </div>

                    {/* Bandeja del sistema derecha */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#cbd5e1" }}>
                      <span>ESP</span>
                      <Radio size={12} color="#34d399" />
                      <span>11:42 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                VISTA 3: DETALLE Y LOGS DEL SISTEMA REMOTO (SRV-SAP-HANA-PROD)
            -------------------------------------------------------------- */}
            {mockupTab === "logs" && (
              <div className="q-portal-detail-view">
                {/* Cabecera del modal de detalle */}
                <div className="q-portal-detail-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>SRV-SAP-HANA-PROD</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>(QR-9014A8)</span>
                    </div>

                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      ● ONLINE
                    </span>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 10px", fontSize: 11.5, color: "#cbd5e1" }}>
                      <Tag size={12} color="#818cf8" />
                      <span>Finanzas & Operaciones ▼</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setMockupTab("desktop")}
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                        color: "#fff",
                        border: "none",
                        padding: "7px 16px",
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                      }}
                    >
                      <Monitor size={14} /> Escritorio Remoto
                    </button>
                    <button
                      onClick={() => setMockupTab("dashboard")}
                      title="Volver al Dashboard"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub-navegación de pestañas del equipo */}
                <div className="q-portal-detail-nav">
                  <button
                    className={`q-portal-detail-tab-btn ${detailSubTab === "overview" ? "q-portal-detail-tab-btn--active" : ""}`}
                    onClick={() => setDetailSubTab("overview")}
                  >
                    <Activity size={13} /> Resumen & Hardware
                  </button>
                  <button
                    className={`q-portal-detail-tab-btn ${detailSubTab === "processes" ? "q-portal-detail-tab-btn--active" : ""}`}
                    onClick={() => setDetailSubTab("processes")}
                  >
                    <List size={13} /> Procesos (15)
                  </button>
                  <button
                    className={`q-portal-detail-tab-btn ${detailSubTab === "services" ? "q-portal-detail-tab-btn--active" : ""}`}
                    onClick={() => setDetailSubTab("services")}
                  >
                    <Server size={13} /> Servicios (8)
                  </button>
                  <button
                    className="q-portal-detail-tab-btn"
                    style={{ opacity: 0.6 }}
                  >
                    <Box size={13} /> Contenedores (0)
                  </button>
                  <button
                    className="q-portal-detail-tab-btn"
                    onClick={() => setMockupTab("desktop")}
                  >
                    <Terminal size={13} /> Control Remoto
                  </button>
                  <button
                    className={`q-portal-detail-tab-btn ${detailSubTab === "logs" ? "q-portal-detail-tab-btn--active" : ""}`}
                    onClick={() => setDetailSubTab("logs")}
                  >
                    <FileText size={13} /> Logs del Sistema
                  </button>
                  <div style={{ marginLeft: "auto", paddingRight: 10, display: "flex", alignItems: "center" }}>
                    <Bell size={14} color="#64748b" />
                  </div>
                </div>

                {/* Contenido según pestaña */}
                <div className="q-portal-detail-body">
                  {detailSubTab === "logs" ? (
                    <div className="q-portal-log-card">
                      {/* Cabecera del log */}
                      <div className="q-portal-log-topbar">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <FileText size={16} color="#818cf8" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                            Registro de Eventos del Sistema Remoto - SRV-SAP-HANA-PROD
                          </span>
                          <span style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "2px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700 }}>
                            ● En Vivo
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "4px 10px", borderRadius: 6, fontSize: 11.5, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <RefreshCw size={12} /> Actualizar
                          </button>
                          <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "4px 10px", borderRadius: 6, fontSize: 11.5, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <Copy size={12} /> Copiar
                          </button>
                        </div>
                      </div>

                      {/* Filtros de Logs */}
                      <div className="q-portal-log-filterbar">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Origen del Log:</span>
                          <span style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600 }}>
                            Eventos del Sistema (System)
                          </span>
                          <span style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", padding: "3px 10px", borderRadius: 6, fontSize: 11.5 }}>
                            Eventos de Aplicación (Application)
                          </span>
                        </div>

                        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 10px", fontSize: 11.5 }}>
                          <Search size={13} color="#64748b" />
                          <span style={{ color: "#64748b" }}>Filtrar eventos del sistema... (ej: error, failed, warning, systemd, sshd, suc)</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            ⚠️ Solo Errores 0
                          </span>
                          <span style={{ color: "#64748b", fontSize: 11 }}>252 / 252 eventos</span>
                        </div>
                      </div>

                      {/* Consola de Logs con numeración de líneas */}
                      <div className="q-portal-log-console">
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">1</span>
                          <span style={{ color: "#64748b" }}>#&lt; CLIXML - Remote PowerShell Host Protocol v2.4</span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">2</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 05:32:56]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#818cf8" }}>[Microsoft-Windows-WindowsUpdateClient]</span> Instalación correcta: Windows instaló la actualización de inteligencia de seguridad para Defender Antivirus (versión 1.459.514.0) - Canal actual
                          </span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">3</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 05:32:42]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#818cf8" }}>[Microsoft-Windows-WindowsUpdateClient]</span> Instalación iniciada en segundo plano con prioridad estándar.
                          </span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">4</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 02:19:28]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#f59e0b" }}>[Service Control Manager]</span> El tipo de inicio del servicio BITS se cambió a inicio por solicitud automático.
                          </span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">5</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 02:17:23]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#38bdf8" }}>[QhapanaAgent]</span> Heartbeat emitido con éxito vía TLS 1.2 WebSocket. Latencia: 11 ms. 0 paquetes perdidos.
                          </span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">6</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 01:49:12]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#a855f7" }}>[Kernel-General]</span> Auditoría de integridad de memoria RAM y almacenamiento NVMe completada. Estado: 100% saludable.
                          </span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">7</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 01:15:04]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#38bdf8" }}>[Security-Auditing]</span> Conexión autorizada por token de enrolamiento (Organización: Corporación Andina).
                          </span>
                        </div>
                        <div className="q-portal-log-line">
                          <span className="q-portal-log-num">8</span>
                          <span>
                            <span style={{ color: "#94a3b8" }}>[2026-10-02 00:48:30]</span> <span style={{ color: "#34d399" }}>[Información]</span> <span style={{ color: "#64748b" }}>[PowerShell-Engine]</span> Tarea desatendida de optimización y telemetría RMM ejecutada satisfactoriamente.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="q-portal-sim-grid">
                      <div className="q-portal-sim-card">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                          <span style={{ color: "#94a3b8" }}>CPU Intel Xeon E-2288G</span>
                          <span style={{ color: "#34d399", fontWeight: 700 }}>24.5%</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                          <div style={{ width: "24.5%", height: "100%", background: "#34d399" }} />
                        </div>
                      </div>
                      <div className="q-portal-sim-card">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                          <span style={{ color: "#94a3b8" }}>RAM Corporativa</span>
                          <span style={{ color: "#818cf8", fontWeight: 700 }}>5.13 / 7.79 GB</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                          <div style={{ width: "65%", height: "100%", background: "#818cf8" }} />
                        </div>
                      </div>
                      <div className="q-portal-sim-card">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                          <span style={{ color: "#94a3b8" }}>Disco C: (NVMe PCIe)</span>
                          <span style={{ color: "#38bdf8", fontWeight: 700 }}>51.69 GB Libres</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                          <div style={{ width: "81%", height: "100%", background: "#38bdf8" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acciones del pie del modal */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <Trash2 size={13} /> Retirar Equipo
                    </button>
                    <button
                      onClick={() => setMockupTab("dashboard")}
                      style={{ background: "#1e293b", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------
                VISTA 4: ABANICO MULTISESIÓN (SOLICITADO POR EL USUARIO)
            -------------------------------------------------------------- */}
            {mockupTab === "fan" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <p style={{ color: "#94a3b8", fontSize: "13.5px", margin: "0 0 20px" }}>
                  Vista combinada en abanico: Supervise el estado de todos sus servidores y salte a la sesión remota gráfica con un clic.
                </p>

                <div className="q-portal-fan-container">
                  {/* Tarjeta 1 (Izquierda / Atrás): Dashboard Resumen */}
                  <div
                    className="q-portal-fan-card"
                    onClick={() => setMockupTab("dashboard")}
                    style={{
                      width: "360px",
                      background: "#090e1a",
                      border: "1px solid rgba(99,102,241,0.3)",
                      transform: "rotate(-5deg) translateY(12px) scale(0.94)",
                      zIndex: 1,
                      padding: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", display: "flex", alignItems: "center", gap: 6 }}>
                        <LayoutDashboard size={14} /> Panel Central RMM
                      </span>
                      <span style={{ fontSize: 10, color: "#34d399", fontWeight: 700 }}>182 / 186 ONLINE</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 6, textAlign: "left" }}>
                        <div style={{ fontSize: 10, color: "#64748b" }}>Flota Activa</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>186 PC</div>
                      </div>
                      <div style={{ background: "rgba(52,211,153,0.08)", padding: 10, borderRadius: 6, textAlign: "left" }}>
                        <div style={{ fontSize: 10, color: "#34d399" }}>SLA Global</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#34d399" }}>99.98%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", textAlign: "center" }}>
                      Click para abrir Dashboard completo →
                    </div>
                  </div>

                  {/* Tarjeta 2 (Centro / Elevada): Sesión Remota Activa Windows 11 */}
                  <div
                    className="q-portal-fan-card"
                    onClick={() => setMockupTab("desktop")}
                    style={{
                      width: "440px",
                      background: "#020617",
                      border: "1px solid rgba(56,189,248,0.5)",
                      transform: "rotate(0deg) translateY(-8px) scale(1.04)",
                      zIndex: 3,
                      boxShadow: "0 25px 60px rgba(99,102,241,0.45)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ background: "#060a14", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                        <Monitor size={14} color="#38bdf8" /> SRV-SAP-HANA-PROD
                      </span>
                      <span style={{ fontSize: 10.5, color: "#34d399", fontWeight: 700, background: "rgba(52,211,153,0.15)", padding: "2px 6px", borderRadius: 4 }}>
                        ● 60 FPS Activo
                      </span>
                    </div>

                    <div style={{ height: 200, background: "radial-gradient(circle at 50% 40%, #1e3a8a 0%, #0b1329 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 14 }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Monitor size={16} color="#38bdf8" />
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Terminal size={16} color="#818cf8" />
                        </div>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#f8fafc", background: "rgba(0,0,0,0.6)", padding: "4px 14px", borderRadius: 20 }}>
                          ⚡ Control Remoto en Ultra-Baja Latencia
                        </span>
                      </div>

                      <div style={{ background: "rgba(15,23,42,0.85)", height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <span style={{ width: 4, height: 4, background: "#38bdf8", borderRadius: 1 }} />
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Windows 11 Limpio • TLS 1.2</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta 3 (Derecha / Atrás): Diagnóstico & Logs Remotos */}
                  <div
                    className="q-portal-fan-card"
                    onClick={() => setMockupTab("logs")}
                    style={{
                      width: "360px",
                      background: "#090e1a",
                      border: "1px solid rgba(129,140,248,0.3)",
                      transform: "rotate(5deg) translateY(12px) scale(0.94)",
                      zIndex: 2,
                      padding: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={14} /> Diagnóstico & Logs
                      </span>
                      <span style={{ fontSize: 10, color: "#34d399", fontWeight: 700 }}>SRV-SAP-HANA</span>
                    </div>

                    <div style={{ background: "#050811", padding: 10, borderRadius: 6, fontFamily: "monospace", fontSize: 10.5, color: "#94a3b8", lineHeight: 1.5, marginBottom: 12 }}>
                      <div style={{ color: "#34d399" }}>● En Vivo • 0 Errores</div>
                      <div style={{ color: "#cbd5e1", marginTop: 4 }}>[Defender Antivirus] Instalación OK</div>
                      <div style={{ color: "#64748b" }}>[QhapanaAgent] Heartbeat 11 ms</div>
                    </div>

                    <div style={{ fontSize: 11, color: "#64748b", textAlign: "center" }}>
                      Click para ver visor de logs completo →
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TELEMETRÍA TI */}
            {mockupTab === "telemetry" && (
              <div className="q-portal-sim-grid">
                <div className="q-portal-sim-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>CPU (Intel Xeon E-2288G @ 3.70GHz)</span>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>24.5%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: "24.5%", height: "100%", background: "#34d399" }} />
                  </div>
                </div>
                <div className="q-portal-sim-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>RAM Corporativa</span>
                    <span style={{ color: "#818cf8", fontWeight: 700 }}>5.13 / 7.79 GB</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: "65%", height: "100%", background: "#818cf8" }} />
                  </div>
                </div>
                <div className="q-portal-sim-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>Disco C: (NVMe PCIe 4.0)</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>51.69 GB Libres</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: "81%", height: "100%", background: "#38bdf8" }} />
                  </div>
                </div>
                <div className="q-portal-sim-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>Servicio QhapanaAgent Watchdog</span>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>RUNNING</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Monitoreo continuo activo • Alertas configuradas</span>
                </div>
              </div>
            )}

            {/* TAB 5: GESTOR DE ARCHIVOS */}
            {mockupTab === "files" && (
              <div className="q-portal-sim-desktop">
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input
                    type="text"
                    readOnly
                    value="C:\Corporativo\Archivos_TI"
                    style={{ flex: 1, background: "#111827", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 4, padding: "6px 12px", fontSize: 12, fontFamily: "monospace" }}
                  />
                  <button style={{ background: "var(--portal-brand)", border: "none", color: "#fff", borderRadius: 4, padding: "6px 14px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <Upload size={13} /> Subir Archivo
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <HardDrive size={15} color="#38bdf8" /> backup_database_2026.sql
                    </span>
                    <span style={{ color: "#94a3b8" }}>142.8 MB • <Download size={13} style={{ cursor: "pointer", verticalAlign: "middle" }} /></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <HardDrive size={15} color="#38bdf8" /> config_production.json
                    </span>
                    <span style={{ color: "#94a3b8" }}>24.2 KB • <Download size={13} style={{ cursor: "pointer", verticalAlign: "middle" }} /></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <HardDrive size={15} color="#38bdf8" /> politicas_seguridad_ti.pdf
                    </span>
                    <span style={{ color: "#94a3b8" }}>1.8 MB • <Download size={13} style={{ cursor: "pointer", verticalAlign: "middle" }} /></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          CARACTERÍSTICAS / WHY QHAPANA RMM (GRID 6 CARDS)
      ---------------------------------------------------------------------- */}
      <section id="features" className="q-portal-features">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">{t.features.badge}</span>
          <h2 className="q-portal-section-title">{t.features.title}</h2>
          <p className="q-portal-section-subtitle">{t.features.subtitle}</p>
        </div>

        <div className="q-portal-features-grid">
          <div className="q-portal-feature-card">
            <div className="q-portal-feature-icon"><Monitor size={26} /></div>
            <h3>{t.features.f1Title}</h3>
            <p>{t.features.f1Desc}</p>
          </div>

          <div className="q-portal-feature-card">
            <div className="q-portal-feature-icon"><FolderOpen size={26} /></div>
            <h3>{t.features.f2Title}</h3>
            <p>{t.features.f2Desc}</p>
          </div>

          <div className="q-portal-feature-card">
            <div className="q-portal-feature-icon"><Cpu size={26} /></div>
            <h3>{t.features.f3Title}</h3>
            <p>{t.features.f3Desc}</p>
          </div>

          <div className="q-portal-feature-card">
            <div className="q-portal-feature-icon"><Zap size={26} /></div>
            <h3>{t.features.f4Title}</h3>
            <p>{t.features.f4Desc}</p>
          </div>

          <div className="q-portal-feature-card">
            <div className="q-portal-feature-icon"><Radio size={26} /></div>
            <h3>{t.features.f5Title}</h3>
            <p>{t.features.f5Desc}</p>
          </div>

          <div className="q-portal-feature-card">
            <div className="q-portal-feature-icon"><Shield size={26} /></div>
            <h3>{t.features.f6Title}</h3>
            <p>{t.features.f6Desc}</p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          SECCIÓN DE CONVERSIÓN COMERCIAL (MARKETING CALL TO ACTION)
      ---------------------------------------------------------------------- */}
      <section id="cta" className="q-portal-download-box">
        <div className="q-portal-download-content">
          <span className="q-portal-section-badge">{t.ctaSec.badge}</span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "10px 0", color: "var(--portal-text-primary)", letterSpacing: "-0.02em" }}>
            {t.ctaSec.title}
          </h2>
          <p style={{ color: "var(--portal-text-secondary)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }}>
            {t.ctaSec.subtitle}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--portal-text-secondary)" }}>
              <CheckCircle2 size={16} color="var(--portal-accent-teal)" />
              <span style={{ fontWeight: 500 }}>{t.ctaSec.trust1}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--portal-text-secondary)" }}>
              <CheckCircle2 size={16} color="var(--portal-accent-teal)" />
              <span style={{ fontWeight: 500 }}>{t.ctaSec.trust2}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--portal-text-secondary)" }}>
              <CheckCircle2 size={16} color="var(--portal-accent-teal)" />
              <span style={{ fontWeight: 500 }}>{t.ctaSec.trust3}</span>
            </div>
          </div>
        </div>

        <div className="q-portal-download-btns">
          {onGoToLogin ? (
            <button
              onClick={onGoToLogin}
              className="q-portal-btn-primary"
              style={{ justifyContent: "center", height: "48px", fontSize: "15px", fontWeight: 700 }}
            >
              <Laptop size={18} />
              <span>{t.ctaSec.ctaPrimary}</span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <a
              href="/login"
              className="q-portal-btn-primary"
              style={{ justifyContent: "center", height: "48px", fontSize: "15px", fontWeight: 700 }}
            >
              <Laptop size={18} />
              <span>{t.ctaSec.ctaPrimary}</span>
              <ArrowRight size={17} />
            </a>
          )}
          <a
            href="#pricing"
            className="q-portal-btn-secondary"
            style={{ justifyContent: "center", height: "44px", fontSize: "14px", fontWeight: 600 }}
          >
            <span>{t.ctaSec.ctaSecondary}</span>
          </a>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          SECCIÓN DE PLANES Y PRECIOS (CON CHECKOUT SAAS MULTIMONEDA)
      ---------------------------------------------------------------------- */}
      <section id="pricing" className="q-portal-pricing">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">{t.pricing.badge}</span>
          <h2 className="q-portal-section-title">{t.pricing.title}</h2>
          <p className="q-portal-section-subtitle">{t.pricing.subtitle}</p>
        </div>

        {/* Toggle Mensual / Anual */}
        <div className="q-portal-pricing-toggle-row">
          <div className="q-portal-toggle-pill">
            <button
              className={`q-portal-pill-btn ${billingCycle === "monthly" ? "q-portal-pill-btn--active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              {t.pricing.monthly}
            </button>
            <button
              className={`q-portal-pill-btn ${billingCycle === "yearly" ? "q-portal-pill-btn--active" : ""}`}
              onClick={() => setBillingCycle("yearly")}
            >
              {t.pricing.yearly}
            </button>
          </div>
        </div>

        {/* Grid de 3 Planes */}
        <div className="q-portal-pricing-grid">
          {/* STARTER */}
          <div className="q-portal-plan-card">
            <h3 className="q-portal-plan-name">{t.pricing.starterTitle}</h3>
            <p className="q-portal-plan-desc">{t.pricing.starterDesc}</p>
            <div className="q-portal-plan-price-row">
              <span className="q-portal-plan-price">$0</span>
              <span className="q-portal-plan-period">USD / {t.pricing.freeForever}</span>
            </div>
            <ul className="q-portal-plan-features">
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fDevices3}</li>
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fFileTransfer}</li>
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fAlertsBasic}</li>
            </ul>
            <button onClick={() => handleSelectPlan("STARTER")} className="q-portal-btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              {t.pricing.choosePlan}
            </button>
          </div>

          {/* PRO (DESTACADO) */}
          <div className="q-portal-plan-card q-portal-plan-card--featured">
            <span className="q-portal-plan-badge-top">{t.pricing.popularBadge}</span>
            <h3 className="q-portal-plan-name">{t.pricing.proTitle}</h3>
            <p className="q-portal-plan-desc">{t.pricing.proDesc}</p>
            <div className="q-portal-plan-price-row">
              <span className="q-portal-plan-price">${getPrice("PRO")}</span>
              <span className="q-portal-plan-period">USD / {billingCycle === "yearly" ? (lang === "es" ? "año" : "year") : (lang === "es" ? "mes" : "month")}</span>
            </div>
            <ul className="q-portal-plan-features">
              <li><Check size={16} color="var(--portal-brand)" /> {t.pricing.fDevicesUnlim}</li>
              <li><Check size={16} color="var(--portal-brand)" /> {t.pricing.fFileTransfer}</li>
              <li><Check size={16} color="var(--portal-brand)" /> {t.pricing.fAlertsSmart}</li>
              <li><Check size={16} color="var(--portal-brand)" /> {t.pricing.fAuditLan}</li>
            </ul>
            <button onClick={() => handleSelectPlan("PRO")} className="q-portal-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {t.pricing.choosePlan}
            </button>
          </div>

          {/* ENTERPRISE */}
          <div className="q-portal-plan-card">
            <h3 className="q-portal-plan-name">{t.pricing.enterpriseTitle}</h3>
            <p className="q-portal-plan-desc">{t.pricing.enterpriseDesc}</p>
            <div className="q-portal-plan-price-row">
              <span className="q-portal-plan-price">${getPrice("ENTERPRISE")}</span>
              <span className="q-portal-plan-period">USD / {billingCycle === "yearly" ? (lang === "es" ? "año" : "year") : (lang === "es" ? "mes" : "month")}</span>
            </div>
            <ul className="q-portal-plan-features">
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fDevicesUnlim}</li>
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fAlertsSmart}</li>
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fAuditLan}</li>
              <li><Check size={16} color="var(--portal-accent-teal)" /> {t.pricing.fDedicatedSupport}</li>
            </ul>
            <button onClick={() => handleSelectPlan("ENTERPRISE")} className="q-portal-btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              {t.pricing.choosePlan}
            </button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          PREGUNTAS FRECUENTES (FAQ)
      ---------------------------------------------------------------------- */}
      <section id="faq" className="q-portal-faq">
        <div className="q-portal-section-header">
          <span className="q-portal-section-badge">{t.faq.badge}</span>
          <h2 className="q-portal-section-title">{t.faq.title}</h2>
          <p className="q-portal-section-subtitle">{t.faq.subtitle}</p>
        </div>

        <div className="q-portal-faq-list">
          {[
            { q: t.faq.q1, a: t.faq.a1 },
            { q: t.faq.q2, a: t.faq.a2 },
            { q: t.faq.q3, a: t.faq.a3 },
            { q: t.faq.q4, a: t.faq.a4 },
          ].map((item, idx) => (
            <div key={idx} className="q-portal-faq-item">
              <button className="q-portal-faq-question" onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                <ChevronDown size={18} style={{ transform: openFaq[idx] ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {openFaq[idx] && <div className="q-portal-faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          FOOTER (QHAPANA TECHNOLOGIES BRANDING & CONTACTO)
      ---------------------------------------------------------------------- */}
      <footer className="q-portal-footer">
        <div className="q-portal-footer-container">
          <div className="q-portal-footer-brand">
            <h4>QHAPANA RMM</h4>
            <p>{t.footer.desc}</p>
            <p style={{ marginTop: 8, fontSize: "12px", opacity: 0.75 }}>
              Lima, Perú • Tel: +51 926 896 030
            </p>
          </div>

          <div className="q-portal-footer-col">
            <h5>{t.footer.prodTitle}</h5>
            <ul>
              <li><a href="#features">{t.nav.features}</a></li>
              <li><a href="#pricing">{t.nav.pricing}</a></li>
              <li><a href="#faq">{t.nav.faq}</a></li>
            </ul>
          </div>

          <div className="q-portal-footer-col">
            <h5>{t.footer.legalTitle}</h5>
            <ul>
              <li><a href="#faq">{t.footer.terms}</a></li>
              <li><a href="#faq">{t.footer.privacy}</a></li>
              <li><a href="https://qhapana.com/" target="_blank" rel="noreferrer">Qhapana Ecosystem</a></li>
            </ul>
          </div>

          <div className="q-portal-footer-col">
            <h5>{t.footer.contactTitle}</h5>
            <ul>
              <li><a href="mailto:contacto@qhapana.com">contacto@qhapana.com</a></li>
              <li><a href="tel:+51926896030">+51 926 896 030</a></li>
              <li><a href="https://qhapana.com/" target="_blank" rel="noreferrer">qhapana.com</a></li>
            </ul>
          </div>
        </div>

        <div className="q-portal-footer-bottom">
          <span>© {new Date().getFullYear()} {t.footer.rights}</span>
          <span style={{ fontStyle: "italic" }}>{t.footer.tagline}</span>
        </div>
      </footer>

      {/* ----------------------------------------------------------------------
          MODAL DE CHECKOUT SAAS (CUANDO SE SELECCIONA UN PLAN)
      ---------------------------------------------------------------------- */}
      {checkoutModalOpen && selectedPlan && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--portal-surface)", border: "1px solid var(--portal-card-border)", borderRadius: 16, width: "100%", maxWidth: 520, padding: 32, boxShadow: "0 25px 60px rgba(0,0,0,0.5)", position: "relative" }}>
            <button
              onClick={() => setCheckoutModalOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "var(--portal-text-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            {checkoutSuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={48} color="#34d399" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Suscripción Procesada!</h3>
                <p style={{ color: "var(--portal-text-secondary)", fontSize: 14, marginBottom: 20 }}>
                  Hemos enviado las credenciales de acceso y licencia a <strong>{customerEmail}</strong>.
                </p>
                <Button variant="primary" onClick={() => { setCheckoutModalOpen(false); if (onGoToLogin) onGoToLogin(); }}>
                  Ir a Iniciar Sesión
                </Button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                  Suscripción al Plan {selectedPlan}
                </h3>
                <p style={{ color: "var(--portal-text-muted)", fontSize: 13, marginBottom: 20 }}>
                  {lang === "es" ? "Ciclo:" : "Cycle:"} {billingCycle === "yearly" ? (lang === "es" ? "Anual" : "Annual") : (lang === "es" ? "Mensual" : "Monthly")} • Total: ${getPrice(selectedPlan)} USD
                </p>

                {checkoutError && (
                  <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: 12.5, borderRadius: 6, marginBottom: 16 }}>
                    {checkoutError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Nombre Completo:</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Juan Pérez"
                      style={{ width: "100%", padding: "8px 12px", background: "var(--portal-surface-muted)", border: "1px solid var(--portal-card-border)", borderRadius: 6, color: "var(--portal-text-primary)", outline: "none", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Correo Electrónico:</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="admin@tuempresa.com"
                      style={{ width: "100%", padding: "8px 12px", background: "var(--portal-surface-muted)", border: "1px solid var(--portal-card-border)", borderRadius: 6, color: "var(--portal-text-primary)", outline: "none", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Contraseña de Acceso:</label>
                    <input
                      type="password"
                      required
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{ width: "100%", padding: "8px 12px", background: "var(--portal-surface-muted)", border: "1px solid var(--portal-card-border)", borderRadius: 6, color: "var(--portal-text-primary)", outline: "none", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Nombre de Organización / Empresa:</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Ej: Consorcio TI SAC"
                      style={{ width: "100%", padding: "8px 12px", background: "var(--portal-surface-muted)", border: "1px solid var(--portal-card-border)", borderRadius: 6, color: "var(--portal-text-primary)", outline: "none", fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                      {lang === "es" ? "Método de Pago:" : "Payment Method:"}
                    </label>
                    <select
                      value={checkoutMethod}
                      onChange={(e) => setCheckoutMethod(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: "var(--portal-surface-muted)", border: "1px solid var(--portal-card-border)", borderRadius: 6, color: "var(--portal-text-primary)", outline: "none", fontSize: 13 }}
                    >
                      {GLOBAL_PRICING.methods.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} - {m.detail}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Cupón de Descuento (ej: QHAPANA2026)"
                      style={{ flex: 1, padding: "8px 12px", background: "var(--portal-surface-muted)", border: "1px solid var(--portal-card-border)", borderRadius: 6, color: "var(--portal-text-primary)", outline: "none", fontSize: 12.5 }}
                    />
                    <Button variant="secondary" size="sm" onClick={handleVerifyPromo}>
                      Aplicar
                    </Button>
                  </div>

                  {promoSuccess && (
                    <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>{promoSuccess}</span>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <Button
                      variant="primary"
                      disabled={checkoutLoading}
                      onClick={handleExecuteCheckout}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {checkoutLoading
                        ? (lang === "es" ? "Procesando Orden..." : "Processing Order...")
                        : (lang === "es"
                            ? `Confirmar y Activar Plan ($${getPrice(selectedPlan)} USD)`
                            : `Confirm & Activate Plan ($${getPrice(selectedPlan)} USD)`)}
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
