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
  key: "starter" | "professional" | "corporate";
  name: string;
  nameEn: string;
  badge?: string;
  badgeEn?: string;
  taglineEs: string;
  taglineEn: string;
  ctaTextEs: string;
  ctaTextEn: string;
  featured?: boolean;
  requiresPaymentMethod: boolean;
  limits: {
    maxDevices: number | "unlimited";
    deviceLabelEs: string;
    deviceLabelEn: string;
    retentionDays: number;
    multiClient: boolean;
    networkDiscovery: "basic" | "full" | "enterprise";
    support: "community" | "standard" | "priority";
  };
  pricing: {
    monthly: PlanBilling;
    yearly: PlanBilling;
  };
  savings: {
    amountUsd: number;
    percentEffective: number; // ~16.7%
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
// FUENTE ÚNICA DE VERDAD: PLANES Y CONFIGURACIÓN COMERCIAL
// -----------------------------------------------------------------------------
export const PRICING_CONFIG = {
  currencySymbol: "$",
  currencyCode: "USD" as CurrencyCode,
  starterMaxDevices: 5, // Configurable sin rediseñar la interfaz
  billingOptions: [
    { id: "monthly" as const, labelEs: "Mensual", labelEn: "Monthly" },
    { id: "yearly" as const, labelEs: "Anual", labelEn: "Yearly" },
  ],
  plans: {
    STARTER: {
      id: "STARTER" as PlanTier,
      key: "starter",
      name: "Starter",
      nameEn: "Starter",
      taglineEs: "Prueba QRMM con tus primeros equipos. Gratis para siempre.",
      taglineEn: "Try QRMM with your first endpoints. Free forever.",
      ctaTextEs: "Empezar gratis",
      ctaTextEn: "Start for Free",
      requiresPaymentMethod: false,
      featured: false,
      limits: {
        maxDevices: 5,
        deviceLabelEs: "Hasta 5 equipos",
        deviceLabelEn: "Up to 5 endpoints",
        retentionDays: 7,
        multiClient: false,
        networkDiscovery: "basic",
        support: "community",
      },
      pricing: {
        monthly: {
          price: 0,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Gratis para siempre",
          billingTextEn: "Free forever",
        },
        yearly: {
          price: 0,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Gratis para siempre",
          billingTextEn: "Free forever",
        },
      },
      savings: {
        amountUsd: 0,
        percentEffective: 0,
        labelEs: "",
        labelEn: "",
      },
      featuresEs: [
        "Hasta 5 equipos enrolados",
        "Control remoto desde el navegador",
        "Acceso desatendido 24/7",
        "Telemetría básica (CPU, RAM, Disco)",
        "Estado en línea y desconexión en vivo",
        "Transferencia bidireccional de archivos",
        "Alertas básicas de conexión por correo",
        "Consola web centralizada",
      ],
      featuresEn: [
        "Up to 5 enrolled endpoints",
        "Browser-based remote desktop",
        "24/7 unattended access",
        "Basic telemetry (CPU, RAM, Disk)",
        "Live online/offline status",
        "Bidirectional file transfer",
        "Basic connection email alerts",
        "Centralized web console",
      ],
    },
    PRO: {
      id: "PRO" as PlanTier,
      key: "professional",
      name: "Profesional",
      nameEn: "Professional",
      badge: "MÁS POPULAR",
      badgeEn: "MOST POPULAR",
      taglineEs: "Para técnicos, consultores TI, MSP y pequeñas empresas.",
      taglineEn: "For IT consultants, MSPs, and growing IT teams.",
      ctaTextEs: "Comenzar Profesional",
      ctaTextEn: "Start Professional",
      requiresPaymentMethod: true,
      featured: true,
      limits: {
        maxDevices: "unlimited",
        deviceLabelEs: "Equipos ilimitados",
        deviceLabelEn: "Unlimited endpoints",
        retentionDays: 90,
        multiClient: true,
        networkDiscovery: "full",
        support: "standard",
      },
      pricing: {
        monthly: {
          price: 19,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Facturado mensualmente",
          billingTextEn: "Billed monthly",
        },
        yearly: {
          price: 190,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Facturado anualmente",
          billingTextEn: "Billed annually",
        },
      },
      savings: {
        amountUsd: 38, // 19*12 = 228 -> 228 - 190 = 38
        percentEffective: 16.7,
        labelEs: "Ahorras $38 al año",
        labelEn: "Save $38 per year",
      },
      featuresEs: [
        "Equipos ilimitados en la consola",
        "Control remoto desde navegador sin visor local",
        "Acceso no asistido con credenciales protegidas",
        "Telemetría RMM avanzada de hardware y procesos",
        "Alertas inteligentes configurables por equipo y cliente",
        "Transferencia de archivos y terminal remota",
        "Network Discovery y sondeo de red local (LAN Probe)",
        "Administración multi-cliente y multi-organización",
        "Agrupación por sitios, etiquetas y técnicos",
        "Historial y diagnóstico de eventos",
      ],
      featuresEn: [
        "Unlimited endpoints in console",
        "Browser-based remote desktop without local viewer",
        "Unattended access with secured credentials",
        "Advanced hardware & process RMM telemetry",
        "Smart per-endpoint & client configurable alerts",
        "File transfer and remote shell terminal",
        "Network Discovery and LAN Subnet Probe",
        "Multi-client and multi-organization management",
        "Site, tags, and technician grouping",
        "Historical audit & event diagnostics",
      ],
    },
    ENTERPRISE: {
      id: "ENTERPRISE" as PlanTier,
      key: "corporate",
      name: "Corporativo",
      nameEn: "Corporate",
      taglineEs: "Para organizaciones con múltiples sedes y altos requisitos de gestión.",
      taglineEn: "For organizations with multi-site fleets and high governance.",
      ctaTextEs: "Contactar / Comenzar Corporativo",
      ctaTextEn: "Contact / Start Corporate",
      requiresPaymentMethod: true,
      featured: false,
      limits: {
        maxDevices: "unlimited",
        deviceLabelEs: "Equipos ilimitados",
        deviceLabelEn: "Unlimited endpoints",
        retentionDays: 365,
        multiClient: true,
        networkDiscovery: "enterprise",
        support: "priority",
      },
      pricing: {
        monthly: {
          price: 69,
          periodLabelEs: "mes",
          periodLabelEn: "month",
          billingTextEs: "Facturado mensualmente",
          billingTextEn: "Billed monthly",
        },
        yearly: {
          price: 690,
          periodLabelEs: "año",
          periodLabelEn: "year",
          billingTextEs: "Facturado anualmente",
          billingTextEn: "Billed annually",
        },
      },
      savings: {
        amountUsd: 138, // 69*12 = 828 -> 828 - 690 = 138
        percentEffective: 16.7,
        labelEs: "Ahorras $138 al año",
        labelEn: "Save $138 per year",
      },
      featuresEs: [
        "Todo lo incluido en el plan Profesional",
        "Equipos ilimitados y organizaciones ilimitadas",
        "Gestión granular de roles, técnicos y permisos",
        "Network Discovery avanzado con políticas de red",
        "Historial extendido de telemetría y auditoría de sesiones",
        "Automatizaciones de despliegue silencioso",
        "Soporte prioritario con atención técnica directa",
      ],
      featuresEn: [
        "Everything included in Professional",
        "Unlimited endpoints and organizations",
        "Granular technician roles & permission policies",
        "Advanced Network Discovery with subnet policies",
        "Extended telemetry history & session audit trail",
        "Silent deployment push automations",
        "Priority support with direct technical contact",
      ],
    },
  },
  paymentMethods: [
    { id: "CARD", name: "Tarjeta de Crédito / Débito Internacional", detail: "Visa, Mastercard, Amex" },
    { id: "STRIPE", name: "Stripe Checkout", detail: "Pasarela global segura" },
    { id: "WIRE", name: "Transferencia Bancaria B2B", detail: "Facturación para empresas" },
  ],
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
    aEs: "El plan Starter incluye hasta 5 equipos para siempre sin costo. Los planes Profesional y Corporativo permiten administrar equipos ilimitados en tu organización sin pagar recargos por dispositivo.",
    aEn: "The Starter plan includes up to 5 endpoints free forever. Professional and Corporate plans support unlimited endpoints with no per-device penalties.",
  },
  {
    qEs: "¿Puedo usar QRMM gratis?",
    qEn: "Can I use QRMM for free?",
    aEs: "Sí. El plan Starter es 100% gratuito para siempre. No requiere tarjeta de crédito ni compromiso de permanencia. Puedes crear tu cuenta, descargar el agente e iniciar soporte en tus primeros 5 equipos de inmediato.",
    aEn: "Yes. The Starter plan is 100% free forever with no credit card required. Create an account, install the agent, and support your first 5 endpoints immediately.",
  },
  {
    qEs: "¿Puedo cambiar de mensual a anual?",
    qEn: "Can I switch between monthly and annual billing?",
    aEs: "Sí, puedes cambiar la modalidad de facturación en cualquier momento desde tu panel de pagos. Al elegir la modalidad anual ahorras aproximadamente un 17% ($38 USD/año en Profesional y $138 USD/año en Corporativo).",
    aEn: "Yes, switch anytime in your billing panel. Annual billing saves ~17% ($38 USD/year on Professional and $138 USD/year on Corporate).",
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
    aEs: "Sí. Los planes Profesional y Corporativo permiten estructurar tu inventario en múltiples clientes, sedes y grupos, asignando técnicos y configurando alertas personalizadas para cada cuenta.",
    aEn: "Yes. Professional and Corporate plans let you organize inventory across multiple clients, sites, and groups with role-based technician assignments.",
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
