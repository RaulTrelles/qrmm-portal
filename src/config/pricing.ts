import type { PlanTier, CurrencyCode } from "../types/payment";

export interface PlanBilling {
  price: number;
  periodLabelEs: string;
  periodLabelEn: string;
  billingTextEs: string;
  billingTextEn: string;
}

export interface PlanDefinition {
  id: PlanTier;
  key: "starter" | "professional" | "business" | "corporate";
  name: string;
  nameEn: string;
  badge?: string;
  badgeEn?: string;
  taglineEs: string;
  taglineEn: string;
  trialTextEs?: string;
  trialTextEn?: string;
  ctaTextEs: string;
  ctaTextEn: string;
  featured?: boolean;
  isStartingPrice?: boolean;
  requiresPaymentMethod: boolean;
  limits: {
    maxDevices: number | "unlimited";
    deviceLabelEs: string;
    deviceLabelEn: string;
    retentionDays: number;
    multiClient: boolean;
    networkDiscovery: "basic" | "full" | "enterprise";
    support: "community" | "standard" | "priority" | "dedicated";
  };
  pricing: {
    monthly: PlanBilling;
    yearly: PlanBilling;
  };
  savings: {
    amountUsd: number;
    percentEffective: number; // ~16.7% (Ahorra 2 meses)
    labelEs: string;
    labelEn: string;
  };
  featuresEs: string[];
  featuresEn: string[];
}

export interface IndustryPricingModel {
  competitor: string;
  category: "Remote Desktop" | "RMM" | "Unified";
  billingModelEs: string;
  billingModelEn: string;
  costImpactEs: string;
  costImpactEn: string;
  noteEs: string;
  noteEn: string;
}

export interface FeatureMatrixRow {
  category: string;
  feature: string;
  featureEn: string;
  anydesk: string;
  rustdesk: string;
  teamviewer: string;
  ninjaone: string;
  atera: string;
  syncro: string;
  connectwise: string;
  qrmm: string;
}

// -----------------------------------------------------------------------------
// FUENTE ÚNICA DE VERDAD: PLANES Y CONFIGURACIÓN COMERCIAL (2026)
// -----------------------------------------------------------------------------
export const PRICING_CONFIG = {
  currencySymbol: "$",
  currencyCode: "USD" as CurrencyCode,
  starterMaxDevices: 5,
  billingOptions: [
    { id: "monthly" as const, labelEs: "Mensual", labelEn: "Monthly" },
    { id: "yearly" as const, labelEs: "Anual", labelEn: "Yearly" },
  ],
  plans: {
    STARTER: {
      id: "STARTER" as PlanTier,
      key: "starter" as const,
      name: "Starter",
      nameEn: "Starter",
      taglineEs: "Para técnicos freelance, laboratorios y micro-redes.",
      taglineEn: "For freelance technicians, home labs, and micro-networks.",
      trialTextEs: "14 días de prueba · Sin tarjeta",
      trialTextEn: "14-day free trial · No card required",
      ctaTextEs: "Probar 14 días gratis",
      ctaTextEn: "Start 14-Day Free Trial",
      requiresPaymentMethod: false,
      featured: false,
      limits: {
        maxDevices: 5,
        deviceLabelEs: "Hasta 5 equipos",
        deviceLabelEn: "Up to 5 endpoints",
        retentionDays: 1,
        multiClient: false,
        networkDiscovery: "basic" as const,
        support: "community" as const,
      },
      pricing: {
        monthly: {
          price: 5,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Facturado mensualmente",
          billingTextEn: "Billed monthly",
        },
        yearly: {
          price: 50,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Facturado anualmente",
          billingTextEn: "Billed annually",
        },
      },
      savings: {
        amountUsd: 10,
        percentEffective: 16.7,
        labelEs: "Ahorras $10 al año",
        labelEn: "Save $10 per year",
      },
      featuresEs: [
        "Hasta 5 equipos enrolados",
        "Control remoto web desde navegador (sin visor)",
        "Acceso desatendido 24/7 con credenciales",
        "Telemetría básica en vivo (CPU, RAM, Disco)",
        "Estado en línea y desconexión en vivo",
        "Transferencia bidireccional de archivos",
        "Alertas automáticas de desconexión (Watchdog)",
        "Consola web centralizada",
      ],
      featuresEn: [
        "Up to 5 enrolled endpoints",
        "In-browser remote desktop (no local viewer)",
        "24/7 unattended access with credentials",
        "Live basic telemetry (CPU, RAM, Disk)",
        "Live online and disconnection status",
        "Bidirectional file transfer",
        "Automatic disconnection alerts (Watchdog)",
        "Centralized web console",
      ],
    },
    PRO: {
      id: "PRO" as PlanTier,
      key: "professional" as const,
      name: "Profesional",
      nameEn: "Professional",
      badge: "MÁS POPULAR",
      badgeEn: "MOST POPULAR",
      taglineEs: "Para talleres de soporte, consultores TI y pequeñas empresas.",
      taglineEn: "For repair shops, IT consultants, and small businesses.",
      ctaTextEs: "Comenzar Profesional",
      ctaTextEn: "Start Professional",
      requiresPaymentMethod: true,
      featured: true,
      limits: {
        maxDevices: 50,
        deviceLabelEs: "Hasta 50 equipos",
        deviceLabelEn: "Up to 50 endpoints",
        retentionDays: 7,
        multiClient: false,
        networkDiscovery: "basic" as const,
        support: "standard" as const,
      },
      pricing: {
        monthly: {
          price: 39,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Facturado mensualmente",
          billingTextEn: "Billed monthly",
        },
        yearly: {
          price: 390,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Facturado anualmente",
          billingTextEn: "Billed annually",
        },
      },
      savings: {
        amountUsd: 78, // 39*12 = 468 -> 468 - 390 = 78 (Ahorra 2 meses)
        percentEffective: 16.7,
        labelEs: "Ahorras $78 al año",
        labelEn: "Save $78 per year",
      },
      featuresEs: [
        "Hasta 50 equipos en la consola",
        "Hasta 3 técnicos independientes",
        "Control remoto web sin visor local",
        "Terminal remota en vivo (PowerShell y Bash)",
        "Reinicio remoto y control de servicios del SO",
        "Telemetría RMM avanzada multi-disco y red",
        "Historial de métricas de 7 días",
        "Network Discovery (Sonda LAN de subred)",
        "Fichas técnicas de inventario en PDF",
        "Enrutamiento de alertas por equipo y técnico",
      ],
      featuresEn: [
        "Up to 50 endpoints in console",
        "Up to 3 independent technician accounts",
        "Browser-based remote desktop without local viewer",
        "Live remote shell terminal (PowerShell & Bash)",
        "Remote reboot & OS background service control",
        "Advanced multi-disk and network RMM telemetry",
        "7-day telemetry metrics history",
        "Network Discovery (Subnet LAN Probe)",
        "Hardware inventory technical sheets in PDF",
        "Alert routing by endpoint and technician",
      ],
    },
    BUSINESS: {
      id: "BUSINESS" as PlanTier,
      key: "business" as const,
      name: "Business / MSP",
      nameEn: "Business / MSP",
      taglineEs: "Para proveedores de servicios gestionados (MSPs) y empresas con múltiples sedes.",
      taglineEn: "For Managed Service Providers (MSPs) and multi-site IT organizations.",
      ctaTextEs: "Comenzar Business",
      ctaTextEn: "Start Business",
      requiresPaymentMethod: true,
      featured: false,
      limits: {
        maxDevices: 250,
        deviceLabelEs: "Hasta 250 equipos",
        deviceLabelEn: "Up to 250 endpoints",
        retentionDays: 30,
        multiClient: true,
        networkDiscovery: "full" as const,
        support: "priority" as const,
      },
      pricing: {
        monthly: {
          price: 79,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Facturado mensualmente",
          billingTextEn: "Billed monthly",
        },
        yearly: {
          price: 790,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Facturado anualmente",
          billingTextEn: "Billed annually",
        },
      },
      savings: {
        amountUsd: 158, // 79*12 = 948 -> 948 - 790 = 158 (Ahorra 2 meses)
        percentEffective: 16.7,
        labelEs: "Ahorras $158 al año",
        labelEn: "Save $158 per year",
      },
      featuresEs: [
        "Hasta 250 equipos y 10 técnicos",
        "Multi-Tenant: Organizaciones y clientes aislados",
        "Tokens de enrolamiento independientes por cliente",
        "Sonda LAN continua multi-subred",
        "Módulo AI Health Score (0 - 100)",
        "Detección de anomalías y fugas de memoria",
        "Proyección predictiva de saturación de disco",
        "Gestión inteligente de incidentes sin fatiga",
        "Historial extendido de telemetría de 30 días",
        "Reportes y fichas PDF con logo personalizado",
      ],
      featuresEn: [
        "Up to 250 endpoints and 10 technicians",
        "Multi-Tenant: Isolated client organizations",
        "Independent enrollment tokens per client",
        "Continuous multi-subnet LAN probe",
        "AI Health Score module (0 - 100)",
        "Anomaly & memory leak detection",
        "Predictive disk exhaustion projection",
        "Smart incident deduplication without alert fatigue",
        "Extended 30-day telemetry history",
        "Custom-branded PDF audit sheets & reports",
      ],
    },
    ENTERPRISE: {
      id: "ENTERPRISE" as PlanTier,
      key: "corporate" as const,
      name: "Enterprise",
      nameEn: "Enterprise",
      isStartingPrice: true,
      taglineEs: "Para medianas y grandes corporaciones, flotas masivas y operaciones críticas.",
      taglineEn: "For mid to large enterprises, high-scale fleets, and mission-critical ops.",
      ctaTextEs: "Contactar / Comenzar Enterprise",
      ctaTextEn: "Contact / Start Enterprise",
      requiresPaymentMethod: true,
      featured: false,
      limits: {
        maxDevices: "unlimited",
        deviceLabelEs: "250+ equipos / Ilimitado",
        deviceLabelEn: "250+ endpoints / Custom",
        retentionDays: 365,
        multiClient: true,
        networkDiscovery: "enterprise" as const,
        support: "dedicated" as const,
      },
      pricing: {
        monthly: {
          price: 149,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Facturado mensualmente",
          billingTextEn: "Billed monthly",
        },
        yearly: {
          price: 1490,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Facturado anualmente",
          billingTextEn: "Billed annually",
        },
      },
      savings: {
        amountUsd: 298, // 149*12 = 1788 -> 1788 - 1490 = 298 (Ahorra 2 meses)
        percentEffective: 16.7,
        labelEs: "Ahorras $298 al año",
        labelEn: "Save $298 per year",
      },
      featuresEs: [
        "250+ equipos y técnicos ilimitados",
        "Multi-organización ilimitada y RBAC corporativo",
        "AIOps DeepSeek: Diagnósticos de causa raíz",
        "Informes diarios ejecutivos automáticos (07:00 AM)",
        "Doble nivel de reporte: Técnico y Ejecutivo",
        "Alertas críticas por WhatsApp corporativo",
        "Auditoría exhaustiva de sesiones remotas",
        "Retención de telemetría de 90+ días / 1 año",
        "Opción de despliegue On-Premise o Nube Privada",
        "SLA 99.9% contractual con soporte dedicado",
      ],
      featuresEn: [
        "250+ endpoints and unlimited technicians",
        "Unlimited multi-organization & corporate RBAC",
        "DeepSeek AIOps: Root Cause Analysis diagnostics",
        "Automated daily executive reports (07:00 AM)",
        "Dual-tier reporting: Technical and Executive",
        "Critical incident alerts via corporate WhatsApp",
        "Exhaustive remote session audit trails",
        "90+ days / 1-year telemetry metrics retention",
        "On-Premise or Private Cloud deployment option",
        "Contractual 99.9% SLA with dedicated support",
      ],
    },
  },
  paymentMethods: [
    {
      id: "LEMON_SQUEEZY",
      name: "Lemon Squeezy (Tarjeta, PayPal, Apple Pay)",
      detail: "Pasarela oficial con activación automática instantánea",
    },
    {
      id: "WIRE",
      name: "Transferencia Bancaria B2B",
      detail: "Facturación para empresas (Emisión de factura y activación manual)",
    },
  ],
};

// -----------------------------------------------------------------------------
// MAPEO OFICIAL DE VARIANTES DE LEMON SQUEEZY (PRODUCCIÓN / TEST)
// -----------------------------------------------------------------------------
export const LEMON_SQUEEZY_VARIANTS: Record<string, { monthly: string; yearly: string }> = {
  STARTER: { monthly: "2198401", yearly: "2198372" },
  PRO: { monthly: "2211274", yearly: "2211285" },
  BUSINESS: { monthly: "2211293", yearly: "2211291" },
  CORPORATE: { monthly: "2211301", yearly: "2211297" },
  ENTERPRISE: { monthly: "2211301", yearly: "2211297" },
};

export const LEMON_SQUEEZY_SLUGS: Record<string, { monthly: string; yearly: string }> = {
  STARTER: {
    monthly: "4e9df3bb-7ba0-4cd0-8ac2-effe131f2392",
    yearly: "6cdcba8d-5322-4c8a-a614-b8af532cfa6a",
  },
  PRO: {
    monthly: "83e0b5d2-1eff-4d6e-b99c-88b364a25c86",
    yearly: "d910c7e0-8ce0-4428-9f30-3fc96c08a1f6",
  },
  BUSINESS: {
    monthly: "f77629f0-9bcf-46be-8da3-d10a0956e6e3",
    yearly: "7d7ed32c-28c3-47c9-8ff2-ad7c23c70615",
  },
  CORPORATE: {
    monthly: "25fcada0-21b9-4c8d-bcd0-d11cff2c7ada",
    yearly: "b4a6d957-4262-4557-aeb7-8164ec64b5b1",
  },
  ENTERPRISE: {
    monthly: "25fcada0-21b9-4c8d-bcd0-d11cff2c7ada",
    yearly: "b4a6d957-4262-4557-aeb7-8164ec64b5b1",
  },
};

// -----------------------------------------------------------------------------
// HELPERS DE CÁLCULO DE PRICING
// -----------------------------------------------------------------------------
export function getMonthlyEquivalent(yearlyPrice: number): number {
  if (yearlyPrice <= 0) return 0;
  return Number((yearlyPrice / 12).toFixed(2));
}

export function formatPrice(amount: number, _currency = "USD"): string {
  if (amount === 0) return "$0";
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export interface CapabilityItem {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  badgeEs?: string;
  badgeEn?: string;
}

export interface CapabilityGroup {
  id: string;
  categoryEs: string;
  categoryEn: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  icon: "monitor" | "activity" | "network" | "shield";
  items: CapabilityItem[];
}

// -----------------------------------------------------------------------------
// CATÁLOGO INTEGRAL DE CAPACIDADES Y CARACTERÍSTICAS DE QRMM
// -----------------------------------------------------------------------------
export const QRMM_CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    id: "remote-control",
    categoryEs: "ACCESO REMOTO NATIVO",
    categoryEn: "NATIVE REMOTE CONTROL",
    titleEs: "Control y Soporte Remoto Web Sin Fricción",
    titleEn: "Frictionless Browser-Based Remote Support",
    descEs: "Conéctate de inmediato desde cualquier navegador sin obligar al operador técnico a instalar aplicaciones de escritorio pesadas.",
    descEn: "Instantly connect from any modern browser with zero client viewer installation for the technician.",
    icon: "monitor",
    items: [
      {
        titleEs: "Escritorio Remoto 100% en Navegador",
        titleEn: "100% In-Browser Remote Desktop",
        descEs: "Visor interactivo rápido con aceleración gráfica que opera en Chrome, Edge, Firefox y Safari sin plugins ni software adicional.",
        descEn: "Hardware-accelerated web viewer running seamlessly on Chrome, Edge, Firefox, and Safari without extra plugins.",
        badgeEs: "Sin visor local",
        badgeEn: "Zero local viewer",
      },
      {
        titleEs: "Acceso Asistido y Desatendido 24/7",
        titleEn: "Attended & 24/7 Unattended Access",
        descEs: "Ingresa en cualquier momento a servidores, oficinas cerradas o terminales de usuario con credenciales encriptadas de alta seguridad.",
        descEn: "Access remote servers and unattended workstations anytime with high-grade encrypted credentials.",
        badgeEs: "Acceso total",
        badgeEn: "Full access",
      },
      {
        titleEs: "Control Completo de Teclado, Ratón y Atajos",
        titleEn: "Full Keyboard, Mouse & System Hotkeys",
        descEs: "Soporte para combinaciones de teclas de sistema (Ctrl+Alt+Del, Alt+Tab, Tecla Windows) y portapapeles bidireccional.",
        descEn: "Full injection of system key combinations (Ctrl+Alt+Del, Windows Key) and synchronized bidirectional clipboard.",
      },
      {
        titleEs: "Transferencia Bidireccional de Archivos",
        titleEn: "Bidirectional File Transfer",
        descEs: "Explorador de directorios remoto embebido en la sesión para enviar y descargar instaladores, logs o scripts sin límites arbitrarios.",
        descEn: "Integrated remote file explorer to upload and download installers, patches, and logs with no arbitrary size limits.",
      },
      {
        titleEs: "Terminal Remota en Segundo Plano",
        titleEn: "Silent Remote Shell Terminal",
        descEs: "Consola interactiva PowerShell y Bash para resolver incidencias por línea de comandos sin interrumpir la pantalla ni distraer al usuario.",
        descEn: "Interactive remote PowerShell and Bash shell to troubleshoot background issues without taking over the user's screen.",
      },
    ],
  },
  {
    id: "rmm-telemetry",
    categoryEs: "OBSERVABILIDAD Y SALUD",
    categoryEn: "HEALTH & OBSERVABILITY",
    titleEs: "Monitoreo RMM Continuo y Alertas Proactivas",
    titleEn: "Continuous RMM Telemetry & Proactive Alerts",
    descEs: "Vigila la salud de toda tu flota en tiempo real para detectar cuellos de botella antes de que afecten la productividad de la empresa.",
    descEn: "Track fleet health continuously to diagnose and resolve bottlenecks before they impact business uptime.",
    icon: "activity",
    items: [
      {
        titleEs: "Telemetría de Hardware en Vivo",
        titleEn: "Live Hardware Telemetry",
        descEs: "Monitoreo permanente de consumo de procesador (CPU), memoria RAM, almacenamiento en discos y tráfico de red.",
        descEn: "Real-time metrics tracking CPU workload, RAM usage, disk storage thresholds, and network interface traffic.",
      },
      {
        titleEs: "Detección Instantánea de Estado Online/Offline",
        titleEn: "Live Online/Offline Heartbeat",
        descEs: "Heartbeat de telemetría continuo que identifica apagados, cortes de energía o caídas de conexión a internet al segundo.",
        descEn: "High-frequency telemetry heartbeat pinpointing unexpected shutdowns and connection outages immediately.",
        badgeEs: "Tiempo real",
        badgeEn: "Real-time",
      },
      {
        titleEs: "Supervisión de Procesos y Servicios del SO",
        titleEn: "Process & System Service Management",
        descEs: "Lista detallada de procesos en ejecución con consumo de recursos y capacidad para arrancar o reiniciar servicios del sistema en vivo.",
        descEn: "Inspect live running processes and start, stop, or restart critical background OS services with one click.",
      },
      {
        titleEs: "Alertas Inteligentes Automatizadas",
        titleEn: "Automated Smart Alerts",
        descEs: "Despacho automático de notificaciones por correo electrónico personalizadas por equipo y por cliente ante incidencias críticas.",
        descEn: "Automated email notifications routed to designated technicians and client managers upon system emergencies.",
      },
      {
        titleEs: "Historial de Eventos y Diagnósticos",
        titleEn: "Audit Trail & Event History",
        descEs: "Registro cronológico de alertas, reconexiones y estados históricos para análisis de causa raíz y auditorías de TI.",
        descEn: "Comprehensive timeline of alerts, telemetry metrics, and reconnection history for incident root-cause analysis.",
      },
    ],
  },
  {
    id: "network-discovery",
    categoryEs: "DESCUBRIMIENTO DE RED",
    categoryEn: "NETWORK DISCOVERY",
    titleEs: "Auditoría de Subredes LAN y Detección de Dispositivos",
    titleEn: "Subnet LAN Audit & Rogue Device Discovery",
    descEs: "Descubre toda la infraestructura conectada a la red local sin requerir hardware sensor especializado ni complejas sondas externas.",
    descEn: "Map connected infrastructure in corporate local subnets with zero specialized probe hardware required.",
    icon: "network",
    items: [
      {
        titleEs: "Escaneo Automatizado de Subredes LAN",
        titleEn: "Automated Subnet Scanning",
        descEs: "Auditorías de red ejecutadas silenciosamente en rangos IP locales para mapear con precisión todos los nodos activos.",
        descEn: "Subnet scans run silently across local IP ranges to discover all active networked devices and equipment.",
        badgeEs: "Sonda nativa",
        badgeEn: "Native probe",
      },
      {
        titleEs: "Identificación de Hostname, IP y Dirección MAC",
        titleEn: "IP, Hostname & MAC Mapping",
        descEs: "Inventario automático con dirección IP asignada, nombre DNS en la red, dirección MAC física y fabricante estimado.",
        descEn: "Accurate registry containing IP address, local network hostname, hardware MAC, and vendor classification.",
      },
      {
        titleEs: "Sonda LAN Ligera Embebida en Agentes",
        titleEn: "Lightweight Agent-Embedded LAN Probe",
        descEs: "Cualquier computadora con agente QRMM activo puede actuar como sonda de red sin sobrecargar el procesador ni la red.",
        descEn: "Any workstation or server with QRMM installed can act as a lightweight network probe with negligible footprint.",
      },
      {
        titleEs: "Detección de Dispositivos No Gestionados",
        titleEn: "Rogue & Unmanaged Device Detection",
        descEs: "Detecta laptops, impresoras, switches o dispositivos desconocidos conectados a la LAN que aún no tienen agente instalado.",
        descEn: "Identify printers, switches, access points, and unmanaged endpoints connected to the corporate LAN.",
      },
    ],
  },
  {
    id: "multi-tenant",
    categoryEs: "GESTIÓN EMPRESARIAL",
    categoryEn: "ENTERPRISE MANAGEMENT",
    titleEs: "Consola Multi-Cliente, Seguridad y Despliegue Ágil",
    titleEn: "Multi-Tenant Console, Governance & Agile Rollout",
    descEs: "Estructura tus operaciones para atender a múltiples empresas o sucursales con aislamiento seguro y gobernanza integral.",
    descEn: "Structure operations across clients, offices, and subsidiaries with strict data isolation and permission controls.",
    icon: "shield",
    items: [
      {
        titleEs: "Consola Web Centralizada Multi-Cliente",
        titleEn: "Centralized Multi-Tenant Web Console",
        descEs: "Administra múltiples organizaciones, clientes o sedes en una sola sesión sin mezclar datos ni credenciales.",
        descEn: "Manage isolated organizations and clients from a single admin account without cross-tenant pollution.",
        badgeEs: "Listo para MSP",
        badgeEn: "MSP-Ready",
      },
      {
        titleEs: "Organización por Sitios, Grupos y Etiquetas",
        titleEn: "Site, Group & Tag Taxonomy",
        descEs: "Filtra y agrupa servidores, equipos de desarrollo o puntos de venta (POS) por sedes geográficas o tipos de negocio.",
        descEn: "Filter and organize machines by geographic sites, server tiers, or departments for instant batch operations.",
      },
      {
        titleEs: "Roles y Permisos para Equipos Técnicos",
        titleEn: "Granular Technician Roles & Permissions",
        descEs: "Asigna permisos específicos a cada técnico limitando qué clientes, sedes o acciones de control remoto pueden ejecutar.",
        descEn: "Define granular operator permissions controlling which clients and remote actions technicians can perform.",
      },
      {
        titleEs: "Agente Ultra Ligero (~8.5 MB) Sin Reinicios",
        titleEn: "Lightweight Agent (~8.5 MB) Zero-Reboot",
        descEs: "Instalación silenciosa en segundos como servicio de fondo de bajo consumo de memoria, sin requerir reinicio del equipo.",
        descEn: "Installs in seconds as a tiny background system service with negligible memory footprint and zero reboots.",
        badgeEs: "~8.5 MB",
        badgeEn: "~8.5 MB",
      },
      {
        titleEs: "Arquitectura Segura y Cifrada TLS",
        titleEn: "TLS Secured Outbound Architecture",
        descEs: "Conexiones salientes cifradas de extremo a extremo que atraviesan firewalls y NAT corporativo sin abrir puertos de red.",
        descEn: "End-to-end encrypted outbound WebSocket communication traversing firewalls and NAT without port forwarding.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// PREGUNTAS FRECUENTES (FAQ - 12 PREGUNTAS EXIGIDAS EN LA SECCIÓN 25)
// -----------------------------------------------------------------------------
export interface FaqItem {
  qEs: string;
  qEn: string;
  aEs: string;
  aEn: string;
}

export const FAQS_CONFIG: FaqItem[] = [
  {
    qEs: "¿QRMM es un escritorio remoto?",
    qEn: "Is QRMM a remote desktop software?",
    aEs: "Sí, QRMM incluye acceso a escritorio remoto de alto rendimiento operado directamente desde tu navegador web, sin obligarte a instalar un software visor local en la máquina del operador. Soporta teclado, ratón, atajos del sistema (Ctrl+Alt+Del), portapapeles y transferencia de archivos.",
    aEn: "Yes, QRMM includes high-performance remote desktop operated straight from your web browser, with no local viewer required. It supports keyboard, mouse, system hotkeys (Ctrl+Alt+Del), clipboard, and file transfer.",
  },
  {
    qEs: "¿QRMM es un RMM?",
    qEn: "Is QRMM an RMM?",
    aEs: "Sí. A diferencia de las herramientas que solo ofrecen control de pantalla, QRMM recopila telemetría de hardware continua (CPU, RAM, uso de discos, red), lista procesos y servicios del sistema operativo, registra eventos y despacha alertas automáticas cuando un equipo se desconecta o sufre incidencias.",
    aEn: "Yes. Unlike tools that only provide screen control, QRMM continuously collects hardware telemetry (CPU, RAM, disk, network), monitors OS processes and services, logs events, and fires alerts upon outages.",
  },
  {
    qEs: "¿Necesito instalar software en mi PC para controlar otros equipos?",
    qEn: "Do I need to install software on my PC to control other computers?",
    aEs: "No. El operador técnico solo necesita un navegador web moderno (Chrome, Edge, Firefox, Safari). Toda la consola de gestión, el visor de escritorio remoto, la terminal y la transferencia de archivos corren 100% en la consola web de QRMM.",
    aEn: "No. The technician only needs a modern browser. The entire console, remote viewer, terminal, and file manager run 100% in the QRMM web console.",
  },
  {
    qEs: "¿Cuántos equipos puedo administrar?",
    qEn: "How many endpoints can I manage?",
    aEs: "El plan Starter permite administrar hasta 5 equipos. El plan Profesional cubre hasta 50 equipos, el plan Business/MSP hasta 250 equipos y el plan Enterprise está diseñado para organizaciones con más de 250 equipos o flotas ilimitadas.",
    aEn: "The Starter plan covers up to 5 endpoints. The Professional plan covers up to 50 endpoints, Business/MSP covers up to 250 endpoints, and Enterprise is tailored for 250+ endpoints or custom unlimited fleets.",
  },
  {
    qEs: "¿Puedo usar QRMM gratis?",
    qEn: "Can I try QRMM for free?",
    aEs: "Sí. Ofrecemos 14 días de prueba gratuita completa en el plan Starter (hasta 5 equipos) sin solicitar tarjeta de crédito. Después del periodo de prueba, puedes continuar con Starter por solo $5 USD/mes o actualizar a Profesional.",
    aEn: "Yes. We offer a full 14-day free trial on the Starter plan (up to 5 endpoints) with no credit card required. After the trial, continue with Starter for just $5 USD/month or upgrade to Professional.",
  },
  {
    qEs: "¿Puedo cambiar de mensual a anual?",
    qEn: "Can I switch between monthly and annual billing?",
    aEs: "Sí, puedes cambiar la modalidad de facturación en cualquier momento. La modalidad anual ofrece tarifas reducidas equivalentes a pagar 10 meses por 12 meses de servicio completo, con ahorros desde $10 hasta $298 USD/año según el plan.",
    aEn: "Yes, switch anytime from your billing panel. Annual billing offers reduced rates equivalent to paying 10 months for 12 months of full service, saving from $10 up to $298 USD/year depending on your plan.",
  },
  {
    qEs: "¿Puedo cancelar mi suscripción?",
    qEn: "Can I cancel my subscription?",
    aEs: "Sí, no existen contratos forzosos. Puedes cancelar tu suscripción con un solo clic y mantendrás el acceso a las funciones del plan pagado hasta que finalice el periodo facturado.",
    aEn: "Yes, there are no lock-in contracts. Cancel anytime and keep plan features until the end of your billing cycle.",
  },
  {
    qEs: "¿QRMM funciona en Windows?",
    qEn: "Does QRMM work on Windows?",
    aEs: "Sí, el agente de QRMM es totalmente compatible con Windows 11, Windows 10, y Windows Server (2022, 2019, 2016). Se instala como un servicio seguro y ligero en segundo plano.",
    aEn: "Yes, the agent supports Windows 11, 10, and Windows Server (2022, 2019, 2016), running as a secure, lightweight background service.",
  },
  {
    qEs: "¿QRMM funciona en Linux?",
    qEn: "Does QRMM work on Linux?",
    aEs: "Sí, disponemos de agente compatible con las principales distribuciones Linux (Ubuntu, Debian, CentOS, Rocky Linux) para monitoreo de telemetría, servicios del sistema y acceso por consola remota.",
    aEn: "Yes, we support major Linux distributions (Ubuntu, Debian, CentOS, Rocky Linux) for telemetry monitoring, services, and remote shell access.",
  },
  {
    qEs: "¿Puedo administrar varios clientes y organizaciones?",
    qEn: "Can I manage multiple clients and organizations?",
    aEs: "Sí. Los planes Business/MSP y Enterprise incluyen arquitectura Multi-Tenant aislada, permitiendo gestionar múltiples empresas clientes con tokens de enrolamiento independientes, roles de técnicos y reportes de marca blanca.",
    aEn: "Yes. Business/MSP and Enterprise plans include isolated Multi-Tenant architecture, allowing you to manage multiple client organizations with independent tokens, technician roles, and custom-branded reports.",
  },
  {
    qEs: "¿QRMM requiere un VPS propio?",
    qEn: "Does QRMM require my own VPS server?",
    aEs: "No. QRMM opera como un servicio SaaS totalmente gestionado en la nube de Qhapana Technologies. No necesitas aprovisionar servidores, configurar bases de datos ni abrir puertos en cortafuegos.",
    aEn: "No. QRMM operates as a turnkey SaaS on Qhapana Cloud. You don't need to provision servers, databases, or forward firewall ports.",
  },
  {
    qEs: "¿Puedo descubrir dispositivos de una red LAN?",
    qEn: "Can I discover devices on a local LAN?",
    aEs: "Sí. Mediante la funcionalidad Network Discovery (LAN Probe), un agente instalado en la red puede escanear la subred local, mapear direcciones IP, hostnames, direcciones MAC y detectar dispositivos no gestionados.",
    aEn: "Yes. Through the Network Discovery LAN Probe, any enrolled agent can scan the subnet, mapping IPs, hostnames, MAC addresses, and rogue devices.",
  },
];
