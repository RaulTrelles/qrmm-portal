/**
 * Utilidades de formateo, localización e internacionalización (ES / EN)
 * para el módulo de Salud IA, Diagnóstico Predictivo y AIOps.
 */

export type AppLanguage = "es" | "en";

export function getAppLanguage(): AppLanguage {
  if (typeof window !== "undefined") {
    const saved =
      localStorage.getItem("q_portal_lang") ||
      localStorage.getItem("qrmm_lang") ||
      localStorage.getItem("language");
    if (saved === "en" || saved === "es") return saved;
    if (document.documentElement.lang === "es") return "es";
    if (document.documentElement.lang === "en") return "en";
    if (navigator.language && navigator.language.toLowerCase().startsWith("en")) {
      return "en";
    }
  }
  return "es";
}

const ANOMALY_TITLES_ES: Record<string, string> = {
  CRITICAL_EVENT_BURST: "Ráfaga de Eventos Críticos",
  DISK_CAPACITY_CRITICAL: "Capacidad Crítica de Almacenamiento",
  DISK_SATURATION_CRITICAL: "Saturación Crítica de Almacenamiento",
  DISK_EXHAUSTION_PROJECTED: "Agotamiento Proyectado de Disco",
  DISK_GROWTH_PROJECTION: "Proyección de Crecimiento de Disco",
  MEMORY_SATURATION_HIGH: "Alta Saturación de Memoria RAM",
  MEMORY_LEAK_SUSPECTED: "Sospecha de Fuga de Memoria (Leak)",
  CPU_LOAD_PERSISTENT: "Sobrecarga Sostenida de Procesador",
  HEARTBEAT_UNSTABLE: "Inestabilidad de Enlace (Heartbeat)",
  AGENT_OFFLINE_PROLONGED: "Desconexión Prolongada del Agente",
  HIGH_RISK_INCIDENT: "Incidente de Alto Riesgo Operativo",
  CONTAINER_CRASH_LOOP: "Bucle de Caídas en Contenedores",
};

const ANOMALY_TITLES_EN: Record<string, string> = {
  CRITICAL_EVENT_BURST: "Critical Event Burst",
  DISK_CAPACITY_CRITICAL: "Critical Disk Capacity",
  DISK_SATURATION_CRITICAL: "Critical Disk Saturation",
  DISK_EXHAUSTION_PROJECTED: "Projected Disk Exhaustion",
  DISK_GROWTH_PROJECTION: "Disk Growth Projection",
  MEMORY_SATURATION_HIGH: "High RAM Saturation",
  MEMORY_LEAK_SUSPECTED: "Suspected Memory Leak",
  CPU_LOAD_PERSISTENT: "Persistent High CPU Load",
  HEARTBEAT_UNSTABLE: "Unstable Agent Heartbeat",
  AGENT_OFFLINE_PROLONGED: "Prolonged Agent Disconnection",
  HIGH_RISK_INCIDENT: "High-Risk Operational Incident",
  CONTAINER_CRASH_LOOP: "Container Crash Loop",
};

const TREND_LABELS_ES: Record<string, string> = {
  STABLE: "Estable",
  IMPROVING: "En Mejora",
  DEGRADING: "En Degradación",
  UNKNOWN: "Desconocida",
};

const TREND_LABELS_EN: Record<string, string> = {
  STABLE: "Stable",
  IMPROVING: "Improving",
  DEGRADING: "Degrading",
  UNKNOWN: "Unknown",
};

const RISK_LEVELS_ES: Record<string, string> = {
  CRITICAL: "Crítico",
  HIGH: "Alto",
  MEDIUM: "Medio",
  LOW: "Bajo",
  INFO: "Informativo",
};

const RISK_LEVELS_EN: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFO: "Informative",
};

const STATUS_LABELS_ES: Record<string, string> = {
  OPEN: "Abierto",
  ACKNOWLEDGED: "Reconocido",
  RESOLVED: "Resuelto",
};

const STATUS_LABELS_EN: Record<string, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
};

export function formatAnomalyType(type?: string, lang?: AppLanguage): string {
  const currentLang = lang || getAppLanguage();
  if (!type) return currentLang === "es" ? "Anomalía Detectada" : "Detected Anomaly";

  const key = type.toUpperCase().replace(/\s+/g, "_");
  if (currentLang === "es") {
    return ANOMALY_TITLES_ES[key] || type.replace(/_/g, " ");
  }
  return ANOMALY_TITLES_EN[key] || type.replace(/_/g, " ");
}

export function formatTrend(trend?: string, lang?: AppLanguage): string {
  const currentLang = lang || getAppLanguage();
  if (!trend) return "";
  const key = trend.toUpperCase();
  if (currentLang === "es") {
    return TREND_LABELS_ES[key] || trend;
  }
  return TREND_LABELS_EN[key] || trend;
}

export function formatRiskLevel(risk?: string, lang?: AppLanguage): string {
  const currentLang = lang || getAppLanguage();
  if (!risk) return "";
  const key = risk.toUpperCase();
  if (currentLang === "es") {
    return RISK_LEVELS_ES[key] || risk;
  }
  return RISK_LEVELS_EN[key] || risk;
}

export function formatIncidentStatus(status?: string, lang?: AppLanguage): string {
  const currentLang = lang || getAppLanguage();
  if (!status) return "";
  const key = status.toUpperCase();
  if (currentLang === "es") {
    return STATUS_LABELS_ES[key] || status;
  }
  return STATUS_LABELS_EN[key] || status;
}

/**
 * Traduce descripciones determinísticas comunes entre ES y EN
 */
export function formatAnomalyDescription(desc?: string, lang?: AppLanguage): string {
  if (!desc) return "";
  const currentLang = lang || getAppLanguage();

  if (currentLang === "en") {
    // Traducciones ES -> EN
    let text = desc;
    text = text.replace(/Se han registrado (\d+) eventos críticos en el registro del sistema operativo recientemente\./i,
      "$1 critical events have been logged in the operating system registry recently.");
    text = text.replace(/Ocupación de almacenamiento en nivel elevado \(([\d.]+)%\)\. Se proyecta saturación a corto plazo si no se realiza depuración\./i,
      "High storage usage ($1%). Critical saturation projected shortly unless cleaned up.");
    text = text.replace(/Uso de memoria RAM por encima de umbral de seguridad \(([\d.]+)%\)\. Riesgo de pérdida de rendimiento o cierre forzado de servicios\./i,
      "RAM usage above safety threshold ($1%). Risk of performance degradation or forced service termination.");
    text = text.replace(/Carga sostenida de procesador al ([\d.]+)%\. Procesos en ejecución consumen la mayor parte de la capacidad de cómputo\./i,
      "Sustained CPU load at $1%. Active processes consume most compute capacity.");
    text = text.replace(/El volumen principal ha superado el 85% de ocupación \(([\d.]+)%\)\. Se proyecta saturación crítica en aproximadamente ~(\d+) días si no se realiza depuración\./i,
      "Main volume exceeded 85% utilization ($1%). Critical saturation projected in ~$2 days unless cleaned up.");
    text = text.replace(/Uso de memoria persistente al ([\d.]+)%\. Podría causar paginación excesiva o degradación en aplicaciones activas\./i,
      "Persistent memory usage at $1%. May cause excessive paging or degradation in active applications.");
    return text;
  }

  // Traducciones EN -> ES (si vinieran en inglés)
  let text = desc;
  text = text.replace(/(\d+) critical events (?:have been logged|recorded) in the (?:operating system registry|OS log) recently\./i,
    "Se han registrado $1 eventos críticos en el registro del sistema operativo recientemente.");
  text = text.replace(/High storage usage \(([\d.]+)%\)\. Critical saturation projected shortly unless cleaned up\./i,
    "Ocupación de almacenamiento en nivel elevado ($1%). Se proyecta saturación a corto plazo si no se realiza depuración.");
  text = text.replace(/RAM usage above safety threshold \(([\d.]+)%\)\. Risk of performance degradation or forced service termination\./i,
    "Uso de memoria RAM por encima de umbral de seguridad ($1%). Riesgo de pérdida de rendimiento o cierre forzado de servicios.");
  text = text.replace(/Sustained CPU load at ([\d.]+)%\. Active processes consume most compute capacity\./i,
    "Carga sostenida de procesador al $1%. Procesos en ejecución consumen la mayor parte de la capacidad de cómputo.");
  return text;
}

/**
 * Traduce razones y evidencias de salud entre ES y EN
 */
export function formatReason(reason?: string, lang?: AppLanguage): string {
  if (!reason) return "";
  const currentLang = lang || getAppLanguage();

  if (currentLang === "en") {
    let text = reason;
    text = text.replace(/Carga de CPU elevada \(([\d.]+)%\)/i, "Elevated CPU load ($1%)");
    text = text.replace(/CPU en nivel de alerta \(([\d.]+)%\)/i, "CPU in alert level ($1%)");
    text = text.replace(/CPU saturada críticamente \(([\d.]+)%\)/i, "CPU critically saturated ($1%)");
    text = text.replace(/Memoria RAM al ([\d.]+)% de capacidad/i, "RAM at $1% capacity");
    text = text.replace(/Memoria RAM crítica \(([\d.]+)%\) con riesgo de congelamiento/i, "Critical RAM ($1%) with freezing risk");
    text = text.replace(/Saturación severa de memoria RAM \(([\d.]+)%\)/i, "Severe RAM saturation ($1%)");
    text = text.replace(/Espacio en disco ocupado al ([\d.]+)%/i, "Disk space utilized at $1%");
    text = text.replace(/Almacenamiento en umbral crítico \(([\d.]+)% ocupado\)/i, "Storage at critical threshold ($1% used)");
    text = text.replace(/Disco casi sin espacio disponible \(([\d.]+)%\)/i, "Disk almost out of available space ($1%)");
    text = text.replace(/Detectados (\d+) eventos críticos recientes del sistema operativo/i, "Detected $1 recent critical OS events");
    text = text.replace(/(\d+) advertencias registradas en los logs/i, "$1 warnings recorded in logs");
    text = text.replace(/Dispositivo actualmente fuera de línea \(OFFLINE\)/i, "Device currently offline (OFFLINE)");
    text = text.replace(/Disponibilidad reducida en 24h: ([\d.]+)%/i, "Reduced 24h availability: $1%");
    text = text.replace(/Disponibilidad baja en 24h \(([\d.]+)%\) con desconexiones frecuentes/i, "Low 24h availability ($1%) with frequent disconnects");
    text = text.replace(/Todos los parámetros operativos se encuentran en rango óptimo\./i, "All operational parameters are within optimal range.");
    text = text.replace(/Utilización de almacenamiento al ([\d.]+)% de capacidad\./i, "Storage utilization at $1% of capacity.");
    text = text.replace(/Consumo de memoria RAM por encima de umbral normal \(([\d.]+)%\)\./i, "RAM consumption above normal threshold ($1%).");
    text = text.replace(/El endpoint se encuentra actualmente fuera de línea \(OFFLINE\)\./i, "Endpoint is currently offline (OFFLINE).");
    text = text.replace(/Todos los parámetros de telemetría \(CPU, RAM, Disco y Red\) operan en rangos óptimos\./i, "All telemetry parameters (CPU, RAM, Disk and Network) operate in optimal ranges.");
    return text;
  }

  // Traducción EN -> ES
  let text = reason;
  text = text.replace(/Elevated CPU load \(([\d.]+)%\)/i, "Carga de CPU elevada ($1%)");
  text = text.replace(/RAM at ([\d.]+)% capacity/i, "Memoria RAM al $1% de capacidad");
  text = text.replace(/Disk space (?:utilized|used) at ([\d.]+)%/i, "Espacio en disco ocupado al $1%");
  text = text.replace(/Detected (\d+) recent critical OS events/i, "Detectados $1 eventos críticos recientes del sistema operativo");
  text = text.replace(/Device currently offline \(OFFLINE\)/i, "Dispositivo actualmente fuera de línea (OFFLINE)");
  text = text.replace(/All operational parameters are within optimal range\./i, "Todos los parámetros operativos se encuentran en rango óptimo.");
  return text;
}
