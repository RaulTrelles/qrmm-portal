export interface AIHealthOverview {
  overall_health_score: number;
  total_devices: number;
  devices_by_health: {
    healthy: number;
    attention: number;
    warning: number;
    critical: number;
  };
  open_incidents_count: number;
  incidents: AIIncidentItem[];
  recent_anomalies: AIAnomalyItem[];
}

export interface AIIncidentItem {
  id: string;
  device_id: string;
  title: string;
  summary: string;
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  correlated_anomalies_count?: number;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AIAnomalyItem {
  id: string;
  device_id: string;
  type: string;
  metric: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  current_value?: number;
  baseline_value?: number;
  description: string;
  projection_days?: number | null;
  detected_at: string;
}

export interface AIDiagnosticDetail {
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  diagnosis: string;
  evidence: string[];
  probable_causes: Array<{ cause: string; confidence: number }>;
  confidence: number;
  impact: string;
  trend: "improving" | "stable" | "degrading";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  recommendations: Array<{ priority: number; action: string; reason: string }>;
  preventive_actions: string[];
  client_message: string;
  technical_message: string;
  model: string;
  created_at: string;
}

export interface DeviceAIHealthResponse {
  device_id: string;
  hostname: string;
  health: {
    overall_score: number;
    cpu_score: number;
    memory_score: number;
    disk_score: number;
    network_score: number;
    events_score: number;
    services_score: number;
    availability_score: number;
    trend: "IMPROVING" | "STABLE" | "DEGRADING";
    reasons: string[];
    calculated_at: string;
  };
  anomalies: AIAnomalyItem[];
  diagnostic?: AIDiagnosticDetail | null;
  history: Array<{
    score: number;
    trend: string;
    calculated_at: string;
  }>;
}

export interface AIReportItem {
  id: string;
  report_type: "DAILY" | "WEEKLY" | "EXECUTIVE" | "TECHNICAL";
  overall_health_score: number;
  total_devices: number;
  healthy_count: number;
  warning_count: number;
  critical_count: number;
  executive_summary: string;
  top_findings: Array<{
    severity: string;
    device_name: string;
    issue: string;
    risk: string;
    recommendation: string;
  }>;
  client_facing_text: string;
  sent_via_email: boolean;
  sent_via_whatsapp: boolean;
  created_at: string;
}
