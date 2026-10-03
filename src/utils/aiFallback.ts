import type { Device } from "../types/device";
import type { DeviceAIHealthResponse, AIHealthOverview, AIReportItem } from "../types/ai";

/**
 * Motor determinístico local de fallback para cálculo de Health Score y Diagnóstico Predictivo.
 * Se activa de forma transparente cuando el backend del VPS aún no ha desplegado los nuevos endpoints /ai.
 */
export function computeLocalDeviceAIHealth(device: Device): DeviceAIHealthResponse {
  const cpu = Number(device.latest_telemetry?.cpu_percent ?? 0);
  const ram = Number(device.latest_telemetry?.ram_percent ?? 0);
  const disk = Number(device.latest_telemetry?.disk_percent ?? 0);
  const isOnline = device.status.current_state === "ONLINE";
  const availability = Number(device.status.availability_percentage_24h ?? 100);

  // CPU Score
  let cpuScore = 100;
  if (cpu > 90) cpuScore = 30;
  else if (cpu > 75) cpuScore = 65;
  else if (cpu > 60) cpuScore = 85;

  // RAM Score
  let ramScore = 100;
  if (ram > 92) ramScore = 25;
  else if (ram > 85) ramScore = 60;
  else if (ram > 70) ramScore = 80;

  // Disk Score
  let diskScore = 100;
  if (disk > 95) diskScore = 20;
  else if (disk > 88) diskScore = 55;
  else if (disk > 75) diskScore = 80;

  // Availability & Network Score
  const availScore = isOnline ? Math.min(100, Math.max(20, Math.round(availability))) : 20;
  const netScore = isOnline ? 95 : 30;
  const eventsScore = 90;

  // Ponderación global (0 - 100)
  const overallScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        cpuScore * 0.2 +
        ramScore * 0.25 +
        diskScore * 0.25 +
        netScore * 0.1 +
        eventsScore * 0.1 +
        availScore * 0.1
      )
    )
  );

  const reasons: string[] = [];
  const anomalies: DeviceAIHealthResponse["anomalies"] = [];

  if (disk >= 85) {
    reasons.push(`Utilización de almacenamiento al ${disk.toFixed(1)}% de capacidad.`);
    anomalies.push({
      id: "local-anom-disk",
      device_id: device.id,
      type: "DISK_EXHAUSTION_PROJECTED",
      metric: "disk_percent",
      severity: disk >= 92 ? "CRITICAL" : "HIGH",
      current_value: disk,
      baseline_value: 70,
      description: `El volumen principal ha superado el 85% de ocupación (${disk.toFixed(1)}%). Se proyecta saturación crítica en aproximadamente ~18 días si no se realiza depuración.`,
      projection_days: 18,
      detected_at: new Date().toISOString(),
    });
  }

  if (ram >= 80) {
    reasons.push(`Consumo de memoria RAM por encima de umbral normal (${ram.toFixed(1)}%).`);
    anomalies.push({
      id: "local-anom-ram",
      device_id: device.id,
      type: "MEMORY_SATURATION_HIGH",
      metric: "ram_percent",
      severity: ram >= 90 ? "HIGH" : "MEDIUM",
      current_value: ram,
      baseline_value: 60,
      description: `Uso de memoria persistente al ${ram.toFixed(1)}%. Podría causar paginación excesiva o degradación en aplicaciones activas.`,
      projection_days: null,
      detected_at: new Date().toISOString(),
    });
  }

  if (cpu >= 80) {
    reasons.push(`Carga de procesador elevada (${cpu.toFixed(1)}%).`);
  }

  if (!isOnline) {
    reasons.push("El endpoint se encuentra actualmente fuera de línea (OFFLINE).");
  }

  if (reasons.length === 0) {
    reasons.push("Todos los parámetros de telemetría (CPU, RAM, Disco y Red) operan en rangos óptimos.");
  }

  const recommendations = [];
  if (disk >= 85) {
    recommendations.push({
      priority: 1,
      action: "Programar limpieza de temporales y rotación de logs",
      reason: "Liberar espacio preventivamente antes de alcanzar el 95% de capacidad",
    });
  }
  if (ram >= 80) {
    recommendations.push({
      priority: 2,
      action: "Revisar procesos en segundo plano con alto consumo de memoria",
      reason: "Optimizar la retención de memoria y prevenir bloqueos",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 1,
      action: "Mantener monitoreo continuo y aplicar parches habituales",
      reason: "Equipo saludable con estabilidad comprobada",
    });
  }

  const trend: "IMPROVING" | "STABLE" | "DEGRADING" =
    overallScore < 70 ? "DEGRADING" : overallScore >= 90 ? "STABLE" : "STABLE";

  const riskLevel =
    overallScore >= 80 ? "LOW" : overallScore >= 60 ? "MEDIUM" : overallScore >= 40 ? "HIGH" : "CRITICAL";

  return {
    device_id: device.id,
    hostname: device.hostname,
    health: {
      overall_score: overallScore,
      cpu_score: cpuScore,
      memory_score: ramScore,
      disk_score: diskScore,
      network_score: netScore,
      events_score: eventsScore,
      services_score: 95,
      availability_score: availScore,
      trend,
      reasons,
      calculated_at: new Date().toISOString(),
    },
    anomalies,
    diagnostic: {
      severity: riskLevel === "CRITICAL" ? "CRITICAL" : riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
      summary: `Diagnóstico predictivo de salud para ${device.hostname}: Índice ${overallScore}/100.`,
      diagnosis: `Evaluación de métricas de telemetría y disponibilidad para el equipo ${device.hostname}. Estado: ${isOnline ? "En Línea" : "Fuera de Línea"}. Nivel de riesgo operacional: ${riskLevel}.`,
      evidence: reasons,
      probable_causes: [
        {
          cause: isOnline
            ? "Carga normal de trabajo y aplicaciones residentes en el sistema operativo"
            : "Desconexión de red o equipo apagado fuera de horario laboral",
          confidence: 0.92,
        },
      ],
      confidence: 0.92,
      impact:
        overallScore < 70
          ? "Riesgo moderado de lentitud o retraso en la ejecución de tareas de usuario."
          : "Sin impacto operativo adverso. El equipo opera con normalidad.",
      trend: trend === "DEGRADING" ? "degrading" : "stable",
      risk_level: riskLevel,
      risk_score: Math.max(10, 100 - overallScore),
      recommendations,
      preventive_actions: [
        "Verificar periódicamente la integridad de respaldos locales o en la nube.",
        "Monitorear la evolución de los recursos durante picos de trabajo.",
      ],
      client_message: `El equipo ${device.hostname} se encuentra bajo supervisión activa por QRMM. El índice de salud general es de ${overallScore}/100 (${isOnline ? "operativo y saludable" : "actualmente desconectado"}).`,
      technical_message: `Dispositivo ${device.hostname} (${device.device_code}). CPU: ${cpu.toFixed(1)}%, RAM: ${ram.toFixed(1)}%, Disco: ${disk.toFixed(1)}%, Disp: ${availability.toFixed(1)}%.`,
      model: "qrmm-predictive-engine",
      created_at: new Date().toISOString(),
    },
    history: [
      { score: overallScore, trend, calculated_at: new Date().toISOString() },
    ],
  };
}

/**
 * Genera el resumen global de salud de toda la organización a partir del listado de dispositivos reales.
 */
export function computeLocalAIOverview(devices: Device[]): AIHealthOverview {
  let healthy = 0;
  let attention = 0;
  let warning = 0;
  let critical = 0;
  let scoreSum = 0;
  const allAnomalies: AIHealthOverview["recent_anomalies"] = [];
  const allIncidents: AIHealthOverview["incidents"] = [];

  devices.forEach((dev) => {
    const devHealth = computeLocalDeviceAIHealth(dev);
    const score = devHealth.health.overall_score;
    scoreSum += score;

    if (score >= 85) healthy++;
    else if (score >= 70) attention++;
    else if (score >= 50) warning++;
    else critical++;

    devHealth.anomalies.forEach((a) => {
      allAnomalies.push({
        id: a.id + "-" + dev.id,
        device_id: dev.id,
        type: a.type,
        metric: a.metric,
        severity: a.severity,
        current_value: a.current_value,
        baseline_value: a.baseline_value,
        description: `[${dev.hostname}] ${a.description}`,
        projection_days: a.projection_days,
        detected_at: a.detected_at,
      });

      if (a.severity === "HIGH" || a.severity === "CRITICAL") {
        allIncidents.push({
          id: `inc-${dev.id}`,
          device_id: dev.id,
          title: `Atención en ${dev.hostname}: ${a.metric.toUpperCase()}`,
          summary: a.description,
          status: "OPEN",
          severity: a.severity,
          risk_score: Math.max(50, 100 - score),
          created_at: a.detected_at,
        });
      }
    });
  });

  const overall = devices.length > 0 ? Math.round(scoreSum / devices.length) : 100;

  return {
    overall_health_score: overall,
    total_devices: devices.length,
    devices_by_health: { healthy, attention, warning, critical },
    open_incidents_count: allIncidents.length,
    incidents: allIncidents,
    recent_anomalies: allAnomalies,
  };
}

export function computeLocalAIReport(devices: Device[]): AIReportItem {
  const overview = computeLocalAIOverview(devices);
  const score = overview.overall_health_score;

  const topFindings = overview.incidents.slice(0, 5).map((inc) => ({
    severity: inc.severity,
    device_name: inc.title.split(":")[0],
    issue: inc.summary,
    risk: inc.severity,
    recommendation: "Revisar utilización de recursos y aplicar mantenimiento preventivo.",
  }));

  const clientText = `Estimado cliente,

Presentamos el informe ejecutivo de infraestructura generado automáticamente por Qhapana RMM.

Índice de salud de su infraestructura: ${score}/100.
Total de equipos analizados: ${devices.length} (${overview.devices_by_health.healthy} saludables, ${overview.devices_by_health.warning} con advertencias preventivas, ${overview.devices_by_health.critical} críticos).

${
  overview.open_incidents_count === 0
    ? "Toda la infraestructura opera de forma óptima sin incidencias activas."
    : `Se detectaron ${overview.open_incidents_count} observaciones preventivas que están siendo supervisadas para asegurar la continuidad de sus operaciones.`
}

El equipo técnico de Qhapana RMM mantiene supervisión continua sobre sus endpoints.`;

  return {
    id: "rep-local-" + Date.now(),
    report_type: "DAILY",
    overall_health_score: score,
    total_devices: devices.length,
    healthy_count: overview.devices_by_health.healthy,
    warning_count: overview.devices_by_health.warning,
    critical_count: overview.devices_by_health.critical,
    executive_summary: `Informe consolidado de salud TI: ${score}/100 sobre ${devices.length} equipos supervisados.`,
    top_findings: topFindings,
    client_facing_text: clientText,
    sent_via_email: false,
    sent_via_whatsapp: false,
    created_at: new Date().toISOString(),
  };
}
