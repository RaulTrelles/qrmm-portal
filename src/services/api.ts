import type { Device, MobileDeviceCardData } from "../types/device";
import type { TokenResponseData, UserProfile, RegisterPayload } from "../types/auth";
import type { OrganizationItem, CreateOrganizationPayload, UpdateOrganizationPayload } from "../types/organization";

const getApiBase = (): string => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Detección prioritaria para producción en qhapana.com
    if (host === "qrmm.qhapana.com" || host.endsWith(".qhapana.com")) {
      return "https://qrmm-backend.qhapana.com/api/v1";
    }
  }

  if (import.meta.env.VITE_API_BASE) {
    const base = import.meta.env.VITE_API_BASE.replace(/\/$/, "");
    if (base.startsWith("http://") || base.startsWith("https://")) {
      return base;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}${base}`;
    }
    return `http://localhost:5173${base}`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port === "5173" ? ":8000" : (window.location.port ? `:${window.location.port}` : "");
    const proto = window.location.protocol;
    return `${proto}//${host}${port}/api/v1`;
  }
  return "http://localhost:8000/api/v1";
};

export const API_BASE = getApiBase();

export function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("q_token") : null;
}

export function setAuthToken(token: string | null): void {
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("q_token", token);
    else localStorage.removeItem("q_token");
  }
}

function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return {
    ...customHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getDevices(organizationId?: string | null): Promise<Device[]> {
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const url = new URL(API_BASE + "/devices", baseOrigin);
  if (organizationId && organizationId !== "all") {
    url.searchParams.set("organization_id", organizationId);
  }
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar dispositivos");
  return res.json();
}

export async function getDeviceById(id: string): Promise<Device> {
  const res = await fetch(API_BASE + "/devices/" + id, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar detalle del dispositivo");
  return res.json();
}

export async function getMobileCards(organizationId?: string | null): Promise<MobileDeviceCardData[]> {
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const url = new URL(API_BASE + "/devices/mobile-cards", baseOrigin);
  if (organizationId && organizationId !== "all") {
    url.searchParams.set("organization_id", organizationId);
  }
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar mobile cards");
  return res.json();
}
export async function deleteDevice(id: string): Promise<void> {
  const res = await fetch(API_BASE + "/devices/" + id, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar el dispositivo");
}

export async function rebootDevice(id: string): Promise<{ status: string; message: string }> {
  const res = await fetch(API_BASE + "/devices/" + id + "/actions/reboot", {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al despachar reinicio remoto");
  }
  return res.json();
}

export async function controlDeviceService(
  deviceId: string,
  serviceName: string,
  operation: "start" | "stop" | "restart"
): Promise<{ success: boolean; service_name: string; operation: string; status: string; message: string }> {
  const res = await fetch(API_BASE + "/devices/" + deviceId + "/actions/service", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_name: serviceName, operation }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error al ejecutar ${operation} en el servicio ${serviceName}`);
  }
  return res.json();
}

export async function searchDeviceServices(
  deviceId: string,
  query?: string
): Promise<{ services: any[] }> {
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const url = new URL(API_BASE + "/devices/" + deviceId + "/services", baseOrigin);
  if (query && query.trim()) {
    url.searchParams.set("q", query.trim());
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al consultar servicios");
  }
  return res.json();
}

export async function controlDeviceContainer(
  deviceId: string,
  containerId: string,
  operation: "start" | "stop" | "restart"
): Promise<{ success: boolean; container_id: string; operation: string; state: string; message: string }> {
  const res = await fetch(API_BASE + "/devices/" + deviceId + "/actions/container", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ container_id: containerId, operation }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error al ejecutar ${operation} en el contenedor ${containerId}`);
  }
  return res.json();
}

export async function getDeviceContainerLogs(
  deviceId: string,
  containerId: string,
  tail: number = 100
): Promise<{ container_id: string; logs: string; tail: number }> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/containers/${containerId}/logs?tail=${tail}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error al obtener logs del contenedor ${containerId}`);
  }
  return res.json();
}

export async function executeDeviceTerminalCommand(
  deviceId: string,
  command: string,
  timeout: number = 15
): Promise<{ success: boolean; output: string; exit_code: number; error?: string }> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/actions/terminal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, timeout }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al ejecutar comando en la consola remota");
  }
  return res.json();
}

export async function getDeviceSystemLogs(
  deviceId: string,
  source: string = "system",
  lines: number = 200
): Promise<{ device_id: string; logs: string; source: string; lines: number }> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/system-logs?source=${encodeURIComponent(source)}&lines=${lines}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al consultar logs del sistema remoto");
  }
  return res.json();
}

export async function terminateDeviceProcess(
  deviceId: string,
  pid: number,
  processName?: string,
  force: boolean = true
): Promise<{ success: boolean; message: string; pid: number }> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/processes/${pid}/terminate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ process_name: processName, force }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error al finalizar el proceso con PID ${pid}`);
  }
  return res.json();
}

export interface RemoteFileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
}

export interface AlertSettings {
  email_alerts_enabled: boolean;
  notify_on_device_offline: boolean;
  notify_on_container_crash: boolean;
  notify_on_performance_issues?: boolean;
  report_schedule?: "daily" | "weekly" | "disabled" | string;
  alert_recipients: string[];
  client_areas?: string[];
  delivery_channel: "google_oauth" | "smtp";
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password_configured: boolean;
  smtp_use_tls: boolean;
  smtp_from_email: string;
  google_oauth_configured: boolean;
  google_client_id: string;
  updated_at?: string;
}

export interface AlertSettingsUpdatePayload {
  email_alerts_enabled: boolean;
  notify_on_device_offline: boolean;
  notify_on_container_crash: boolean;
  notify_on_performance_issues?: boolean;
  report_schedule?: "daily" | "weekly" | "disabled" | string;
  alert_recipients: string[];
  client_areas?: string[];
  delivery_channel: "google_oauth" | "smtp";
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_use_tls?: boolean;
  smtp_from_email?: string;
  google_client_id?: string;
  google_client_secret?: string;
  google_refresh_token?: string;
}

export async function generateExecutiveHealthReport(options?: {
  report_type?: "DAILY" | "WEEKLY" | "EXECUTIVE" | "TECHNICAL";
  send_email?: boolean;
  language?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/reports/generate`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      report_type: options?.report_type || "DAILY",
      send_email: options?.send_email ?? true,
      language: options?.language || "es",
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al generar o enviar el informe de salud");
  }
  return res.json();
}

export async function getAlertSettings(): Promise<AlertSettings> {
  const res = await fetch(`${API_BASE}/settings/alerts`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener la configuración de alertas");
  }
  return res.json();
}

export async function updateAlertSettings(payload: AlertSettingsUpdatePayload): Promise<AlertSettings> {
  const res = await fetch(`${API_BASE}/settings/alerts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al guardar la configuración de alertas");
  }
  return res.json();
}

export async function testAlertEmail(recipients?: string[]): Promise<{ success: boolean; message: string; recipients: string[] }> {
  const res = await fetch(`${API_BASE}/settings/alerts/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipients ? { recipients } : {}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Fallo en el envío de prueba de correo");
  }
  return res.json();
}

export async function updateDeviceAlertRecipients(
  deviceId: string,
  alertRecipients: string[]
): Promise<Device> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/alert-recipients`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ alert_recipients: alertRecipients }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar destinatarios del equipo");
  }
  return res.json();
}

export async function updateDeviceArea(
  deviceId: string,
  clientArea: string
): Promise<Device> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/area`, {
    method: "PATCH",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ client_area: clientArea }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar el área o cliente del equipo");
  }
  return res.json();
}

export async function updateDeviceLocation(
  deviceId: string,
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<Device> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/location`, {
    method: "PATCH",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude,
      longitude,
      location_name: locationName,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al grabar las coordenadas GPS del equipo");
  }
  return res.json();
}

export async function getClientAreas(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/settings/areas`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // Fallback a alert settings si el endpoint dedicado no responde
      const settings = await getAlertSettings();
      return settings.client_areas || ["General"];
    }
    const data = await res.json();
    return data.areas || ["General"];
  } catch {
    return ["General"];
  }
}

export async function updateClientAreas(areas: string[]): Promise<string[]> {
  const res = await fetch(`${API_BASE}/settings/areas`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ areas }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al guardar el catálogo de áreas/clientes");
  }
  const data = await res.json();
  return data.areas || ["General"];
}

export async function listRemoteFiles(
  deviceId: string,
  path?: string
): Promise<{ success: boolean; current_path: string; parent_path: string; items: RemoteFileItem[] }> {
  const params = new URLSearchParams();
  if (path) params.append("path", path);
  const res = await fetch(`${API_BASE}/devices/${deviceId}/fs/list?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al consultar archivos en el disco remoto");
  }
  return res.json();
}

export async function uploadRemoteFile(
  deviceId: string,
  targetPath: string,
  filename: string,
  contentBase64: string
): Promise<{ success: boolean; message: string; path: string }> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/fs/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      path: targetPath,
      filename,
      content_base64: contentBase64,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al transferir archivo hacia el equipo remoto");
  }
  return res.json();
}

export async function downloadRemoteFile(
  deviceId: string,
  path: string
): Promise<{ success: boolean; filename: string; size: number; content_base64: string }> {
  const params = new URLSearchParams({ path });
  const res = await fetch(`${API_BASE}/devices/${deviceId}/fs/download?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al descargar archivo desde el equipo remoto");
  }
  return res.json();
}

export async function deleteRemoteFile(
  deviceId: string,
  path: string
): Promise<{ success: boolean; message: string }> {
  const params = new URLSearchParams({ path });
  const res = await fetch(`${API_BASE}/devices/${deviceId}/fs/delete?${params.toString()}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al eliminar elemento en el equipo remoto");
  }
  return res.json();
}

export async function getNetworkProbes(): Promise<{ probes: any[]; active_count: number }> {
  const res = await fetch(`${API_BASE}/discovery/probes`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar sondas de red disponibles");
  return res.json();
}

export async function scanNetwork(probeDeviceId?: string, subnet?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/discovery/scan`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      probe_device_id: probeDeviceId || undefined,
      subnet: subnet || undefined,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al realizar el escaneo de red local");
  }
  return res.json();
}

export async function getDiscoveredDevices(): Promise<any> {
  const res = await fetch(`${API_BASE}/discovery/devices`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar dispositivos descubiertos");
  return res.json();
}

export async function remoteDeployAgent(params: any): Promise<any> {
  const res = await fetch(`${API_BASE}/discovery/deploy`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al despachar el despliegue remoto del agente");
  }
  return res.json();
}

// ==============================================================================
// Autenticación y Usuarios
// ==============================================================================

export async function login(payload: { email: string; password: string }): Promise<TokenResponseData> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al iniciar sesión");
  }
  return res.json();
}

export async function loginWithGoogle(credential: string): Promise<TokenResponseData> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al autenticar con Google");
  }
  return res.json();
}

export async function register(payload: RegisterPayload): Promise<TokenResponseData> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al registrar la cuenta");
  }
  return res.json();
}

export async function getGoogleClientId(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/auth/google-client-id`);
    if (res.ok) {
      const data = await res.json();
      if (data.client_id) return data.client_id;
    }
  } catch {
    // fallback seguro
  }
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "600233776099-tlqifsqopk1tu5lsncuh54fhtprfq1vu.apps.googleusercontent.com"
  );
}

export async function getMe(): Promise<{ user: UserProfile; organization: any }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Sesión inválida o expirada");
  return res.json();
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; code?: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al solicitar recuperación de contraseña");
  }
  return res.json();
}

export async function resetPassword(payload: { email: string; code: string; new_password: string }): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al restablecer contraseña");
  }
  return res.json();
}

// ==============================================================================
// Clientes y Organizaciones SaaS
// ==============================================================================

export async function getOrganizations(): Promise<OrganizationItem[]> {
  const res = await fetch(`${API_BASE}/organizations`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar clientes/organizaciones");
  return res.json();
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<OrganizationItem> {
  const res = await fetch(`${API_BASE}/organizations`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al crear cliente");
  }
  return res.json();
}

export async function updateOrganization(id: string, payload: UpdateOrganizationPayload): Promise<OrganizationItem> {
  const res = await fetch(`${API_BASE}/organizations/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar cliente");
  }
  return res.json();
}

export async function regenerateOrgToken(id: string): Promise<OrganizationItem> {
  const res = await fetch(`${API_BASE}/organizations/${id}/regenerate-token`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al regenerar token de enrolamiento");
  }
  return res.json();
}

// ==============================================================================
// Pagos y Facturación SaaS
// ==============================================================================

import type {
  Transaction,
  PaymentStats,
  OnlineUser,
  AdminUser,
  CheckoutPayload,
  CheckoutResponse,
} from "../types/payment";

export async function processCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const res = await fetch(`${API_BASE}/payments/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al procesar el pago");
  }
  return res.json();
}

export async function getLemonSqueezyCheckoutUrl(payload: {
  plan_tier: string;
  billing_cycle: string;
  customer_email?: string;
  customer_name?: string;
  organization_name?: string;
}): Promise<{ checkout_url: string; variant_id?: string }> {
  const res = await fetch(`${API_BASE}/payments/lemonsqueezy-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al generar enlace de Lemon Squeezy");
  }
  return res.json();
}


export async function verifyPromoCode(code: string, plan_tier?: string): Promise<{ valid: boolean; code: string; discount_percent: number; fixed_discount: number; label: string }> {
  const res = await fetch(`${API_BASE}/payments/verify-promo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, plan_tier }),
  });
  if (!res.ok) throw new Error("Error al verificar código promocional");
  return res.json();
}

export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/payments/transactions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener transacciones");
  return res.json();
}

export async function getPaymentStats(): Promise<PaymentStats> {
  const res = await fetch(`${API_BASE}/payments/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener estadísticas de facturación");
  return res.json();
}

// ==============================================================================
// Administración de Usuarios & Monitor en Línea
// ==============================================================================

export async function getAdminUsers(organization_id?: string): Promise<AdminUser[]> {
  const url = organization_id
    ? `${API_BASE}/users?organization_id=${encodeURIComponent(organization_id)}`
    : `${API_BASE}/users`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al listar usuarios");
  return res.json();
}

export async function getOnlineUsers(): Promise<OnlineUser[]> {
  const res = await fetch(`${API_BASE}/users/online`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al consultar usuarios en línea");
  return res.json();
}

export async function createAdminUser(payload: {
  email: string;
  full_name: string;
  password: string;
  role: string;
  organization_id?: string;
  is_active?: boolean;
}): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al crear usuario");
  }
  return res.json();
}

export async function updateAdminUser(
  userId: string,
  payload: {
    full_name?: string;
    role?: string;
    organization_id?: string;
    is_active?: boolean;
    password?: string;
  }
): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar usuario");
  }
  return res.json();
}

// -----------------------------------------------------------------------------
// QRMM AI HEALTH & PREDICTIVE DIAGNOSTICS API CLIENT
// -----------------------------------------------------------------------------
import type {
  AIHealthOverview,
  DeviceAIHealthResponse,
  AIIncidentItem,
  AIReportItem,
} from "../types/ai";

export async function getAIOverview(): Promise<AIHealthOverview> {
  const res = await fetch(`${API_BASE}/ai/overview`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al cargar resumen de salud IA");
  }
  return res.json();
}

export async function getDeviceAIHealth(deviceId: string): Promise<DeviceAIHealthResponse> {
  const res = await fetch(`${API_BASE}/ai/devices/${deviceId}/health`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al consultar salud IA del dispositivo");
  }
  return res.json();
}

export async function triggerDeviceAIDiagnosis(
  deviceId: string,
  forceAi: boolean = true,
  language: string = "es"
): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/devices/${deviceId}/diagnose`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ force_ai: forceAi, language }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al ejecutar diagnóstico IA");
  }
  return res.json();
}

export async function getAIIncidents(filters?: {
  status?: string;
  severity?: string;
  deviceId?: string;
}): Promise<AIIncidentItem[]> {
  const url = new URL(`${API_BASE}/ai/incidents`, window.location.origin);
  if (filters?.status) url.searchParams.set("status", filters.status);
  if (filters?.severity) url.searchParams.set("severity", filters.severity);
  if (filters?.deviceId) url.searchParams.set("device_id", filters.deviceId);

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al listar incidentes IA");
  }
  return res.json();
}

export async function acknowledgeIncident(incidentId: string, note?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/incidents/${incidentId}/acknowledge`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al reconocer incidente");
  }
  return res.json();
}

export async function resolveIncident(incidentId: string, note?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/incidents/${incidentId}/resolve`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al resolver incidente");
  }
  return res.json();
}

export async function getAIReports(reportType?: string): Promise<AIReportItem[]> {
  const url = new URL(`${API_BASE}/ai/reports`, window.location.origin);
  if (reportType) url.searchParams.set("report_type", reportType);

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al listar informes de salud");
  }
  return res.json();
}

export async function generateAIReport(payload: {
  report_type?: string;
  language?: string;
  send_email?: boolean;
}): Promise<AIReportItem> {
  const res = await fetch(`${API_BASE}/ai/reports/generate`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      report_type: payload.report_type || "DAILY",
      language: payload.language || "es",
      send_email: payload.send_email ?? false,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al generar informe de IA");
  }
  return res.json();
}

export async function sendReportEmail(reportId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/reports/${reportId}/send-email`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al despachar informe por correo");
  }
  return res.json();
}

// =============================================================================
// BILLING MULTI-PROVIDER (LEMON SQUEEZY & PADDLE)
// =============================================================================

export interface PlanPriceItem {
  id: string;
  provider: string;
  provider_price_id: string;
  billing_cycle: "monthly" | "yearly";
  currency: string;
  amount: number;
}

export interface EntitlementItem {
  code: string;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
  limit_value?: number;
}

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  max_devices?: number | null;
  active: boolean;
  sort_order: number;
  prices: PlanPriceItem[];
  entitlements: EntitlementItem[];
}

export interface SubscriptionOverview {
  id?: string;
  organization_id: string;
  organization_name: string;
  plan_code: string;
  plan_name: string;
  status: "trialing" | "active" | "past_due" | "paused" | "cancelled" | "expired";
  billing_cycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  provider: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  is_past_due: boolean;
  past_due_since?: string;
  in_grace_period: boolean;
  grace_period_days_left?: number;
  devices_count: number;
  max_devices?: number | null;
  device_limit_reached: boolean;
  billing_bypassed?: boolean;
  custom_device_limit?: number | null;
  enforcement_enabled?: boolean;
  capabilities: string[];
}

export interface CheckoutInitiateResult {
  success: boolean;
  checkout_url: string;
  provider: string;
  plan_code: string;
  billing_cycle: string;
  provider_price_id: string;
  status?: string;
}

export async function getBillingPlans(): Promise<BillingPlan[]> {
  const res = await fetch(`${API_BASE}/billing/plans`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener planes comerciales");
  }
  return res.json();
}

export async function getCurrentSubscription(): Promise<SubscriptionOverview> {
  const res = await fetch(`${API_BASE}/billing/subscription`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener el estado de la suscripción");
  }
  return res.json();
}

export async function initiateBillingCheckout(
  planCode: string,
  billingCycle: "monthly" | "yearly",
  provider?: string,
  discountCode?: string,
): Promise<CheckoutInitiateResult> {
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      plan_code: planCode,
      billing_cycle: billingCycle,
      provider: provider || undefined,
      discount_code: discountCode || undefined,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al iniciar el proceso de checkout");
  }
  return res.json();
}

export async function cancelBillingSubscription(): Promise<{ success: boolean; message: string; cancel_at_period_end: boolean }> {
  const res = await fetch(`${API_BASE}/billing/subscription/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al cancelar la suscripción");
  }
  return res.json();
}

export async function resumeBillingSubscription(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/billing/subscription/resume`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al reactivar la suscripción");
  }
  return res.json();
}

// ==============================================================================
// FinOps & SuperAdmin Operations Hub
// ==============================================================================

export interface FinOpsSystemConfig {
  billing_enforcement_enabled: boolean;
  default_provider: string;
  grace_period_days: number;
  maintenance_mode: boolean;
  maintenance_message?: string;
  updated_at?: string;
}

export interface FinOpsOverview {
  mrr: number;
  arr: number;
  currency: string;
  total_organizations: number;
  bypassed_organizations: number;
  total_devices: number;
  active_subscriptions: number;
  past_due_subscriptions: number;
  cancelled_subscriptions: number;
  total_webhooks: number;
  failed_webhooks: number;
  system_config: FinOpsSystemConfig;
}

export interface FinOpsWebhookEvent {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  status: string;
  error?: string;
  received_at?: string;
  processed_at?: string;
  payload?: any;
}

export interface OrgBillingOverridePayload {
  plan_code?: string;
  status?: string;
  billing_bypassed?: boolean;
  custom_device_limit?: number;
  reason?: string;
}

export async function getFinOpsOverview(): Promise<FinOpsOverview> {
  const res = await fetch(`${API_BASE}/billing/admin/overview`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener métricas FinOps");
  }
  return res.json();
}

export async function updateFinOpsSettings(payload: Partial<FinOpsSystemConfig>): Promise<FinOpsSystemConfig> {
  const res = await fetch(`${API_BASE}/billing/admin/settings`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar configuración global de facturación");
  }
  return res.json();
}

export async function getFinOpsOrganizations(search?: string): Promise<SubscriptionOverview[]> {
  const url = new URL(`${API_BASE}/billing/admin/organizations`);
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al listar organizaciones FinOps");
  }
  return res.json();
}

export async function overrideOrgBilling(
  orgId: string,
  payload: OrgBillingOverridePayload,
): Promise<SubscriptionOverview> {
  const res = await fetch(`${API_BASE}/billing/admin/organizations/${orgId}/override`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al modificar facturación de la organización");
  }
  return res.json();
}

export async function getFinOpsWebhooks(status?: string, limit = 50): Promise<FinOpsWebhookEvent[]> {
  const url = new URL(`${API_BASE}/billing/admin/webhooks`);
  url.searchParams.set("limit", String(limit));
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener registro de webhooks");
  }
  return res.json();
}

export async function retryFinOpsWebhook(eventId: string): Promise<{ success: boolean; result?: any; error?: string }> {
  const res = await fetch(`${API_BASE}/billing/admin/webhooks/${eventId}/retry`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al reintentar webhook");
  }
  return res.json();
}

export async function updatePlanPrices(
  planId: string,
  prices: Array<{ provider: string; billing_cycle: string; provider_price_id: string; amount?: number }>,
): Promise<any> {
  const res = await fetch(`${API_BASE}/billing/admin/plans/${planId}/prices`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prices }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar precios del plan");
  }
  return res.json();
}

// ==============================================================================
// Motor de Cupones y Códigos de Descuento
// ==============================================================================

export interface DiscountValidateResult {
  valid: boolean;
  code: string;
  discount_type: "percentage" | "fixed";
  value: number;
  currency: string;
  description?: string;
  applicable_plans?: string[];
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export interface DiscountCodeItem {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percentage" | "fixed";
  value: number;
  currency: string;
  max_redemptions?: number | null;
  times_redeemed: number;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
  applicable_plans: string[];
  created_at: string;
}

export interface CreateDiscountPayload {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  value: number;
  currency?: string;
  max_redemptions?: number | null;
  valid_until?: string | null;
  applicable_plans?: string[];
}

export async function validateDiscountCode(
  code: string,
  planCode?: string,
  billingCycle = "monthly",
): Promise<DiscountValidateResult> {
  const res = await fetch(`${API_BASE}/billing/discounts/validate`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      code,
      plan_code: planCode || undefined,
      billing_cycle: billingCycle,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al validar el cupón");
  }
  return res.json();
}

export async function getAdminDiscounts(activeOnly = false): Promise<DiscountCodeItem[]> {
  const url = new URL(`${API_BASE}/billing/admin/discounts`);
  if (activeOnly) url.searchParams.set("active_only", "true");

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener códigos de descuento");
  }
  return res.json();
}

export async function createAdminDiscount(payload: CreateDiscountPayload): Promise<DiscountCodeItem> {
  const res = await fetch(`${API_BASE}/billing/admin/discounts`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al crear código de descuento");
  }
  return res.json();
}

export async function toggleAdminDiscount(discountId: string): Promise<DiscountCodeItem> {
  const res = await fetch(`${API_BASE}/billing/admin/discounts/${discountId}/toggle`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al cambiar estado del cupón");
  }
  return res.json();
}

export async function deleteAdminDiscount(discountId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/billing/admin/discounts/${discountId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al eliminar código de descuento");
  }
  return res.json();
}

// =============================================================================
// MODALIDADES DE PAGO Y SOPORTE / FEEDBACK DE USUARIOS
// =============================================================================

export interface PaymentSettings {
  enable_lemon_squeezy: boolean;
  enable_b2b_wire: boolean;
  allow_beta_free_trial: boolean;
  beta_badge_text: string;
  beta_description: string;
}

export interface SupportTicket {
  id: string;
  organization_id?: string | null;
  organization_name?: string | null;
  user_id?: string | null;
  category: "BUG" | "SUGGESTION" | "QUESTION" | "BILLING" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  title: string;
  description: string;
  contact_name?: string | null;
  contact_email?: string | null;
  device_info?: Record<string, any> | null;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED" | string;
  admin_response?: string | null;
  responded_at?: string | null;
  responded_by_name?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const res = await fetch(`${API_BASE}/support/payment-settings`);
  if (!res.ok) {
    return {
      enable_lemon_squeezy: true,
      enable_b2b_wire: true,
      allow_beta_free_trial: true,
      beta_badge_text: "Programa Beta Qhapana",
      beta_description: "Acceso 100% bonificado e inmediato para empresas que prueben la plataforma y nos envíen sus sugerencias.",
    };
  }
  return res.json();
}

export async function updatePaymentSettings(payload: Partial<PaymentSettings>): Promise<PaymentSettings> {
  const res = await fetch(`${API_BASE}/support/payment-settings`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar configuración de pagos");
  }
  return res.json();
}

export async function createSupportTicket(payload: {
  category: string;
  priority: string;
  title: string;
  description: string;
  contact_name?: string;
  contact_email?: string;
  device_info?: Record<string, any>;
}): Promise<SupportTicket> {
  const res = await fetch(`${API_BASE}/support/tickets`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al enviar el reporte de soporte");
  }
  return res.json();
}

export async function getClientTickets(): Promise<SupportTicket[]> {
  const res = await fetch(`${API_BASE}/support/tickets`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener los tickets de soporte");
  }
  return res.json();
}

export async function getAdminTickets(statusFilter?: string, categoryFilter?: string): Promise<SupportTicket[]> {
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const url = new URL(`${API_BASE}/support/tickets/admin`, baseOrigin);
  if (statusFilter && statusFilter !== "ALL") url.searchParams.set("status_filter", statusFilter);
  if (categoryFilter && categoryFilter !== "ALL") url.searchParams.set("category_filter", categoryFilter);

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al listar tickets administrativos");
  }
  return res.json();
}

export async function respondToTicket(
  ticketId: string,
  payload: { admin_response: string; status: string }
): Promise<SupportTicket> {
  const res = await fetch(`${API_BASE}/support/tickets/${ticketId}/respond`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al enviar la respuesta al ticket");
  }
  return res.json();
}

export interface MaintenanceSettings {
  maintenance_mode: boolean;
  title: string;
  message: string;
  estimated_end: string;
  contact_email: string;
  updated_at?: string | null;
}

export async function getMaintenanceStatus(): Promise<MaintenanceSettings> {
  const res = await fetch(`${API_BASE}/settings/maintenance`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener estado de mantenimiento");
  }
  return res.json();
}

export async function updateMaintenanceStatus(payload: Partial<MaintenanceSettings>): Promise<MaintenanceSettings> {
  const res = await fetch(`${API_BASE}/settings/maintenance`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar estado de mantenimiento");
  }
  return res.json();
}

// ----------------------------------------------------
// REPORTES E INCIDENCIAS
// ----------------------------------------------------

export interface IncidentReportItem {
  id: string;
  source: string;
  device_id: string;
  hostname: string;
  organization_name: string;
  organization_id: string;
  typology: string;
  typology_label: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "MUTED";
  occurred_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  risk_score: number;
}

export interface TypologyMeta {
  key: string;
  label: string;
  description?: string;
  count: number;
  color: string;
  icon: string;
}

export interface IncidentReportStats {
  total_incidents: number;
  disconnections_count: number;
  critical_active: number;
  resolved_rate: number;
  by_typology: Record<string, number>;
  by_severity: Record<string, number>;
  top_affected_devices: Array<{ hostname: string; count: number }>;
}

export interface IncidentsReportResponse {
  items: IncidentReportItem[];
  total: number;
  limit: number;
  offset: number;
  stats: IncidentReportStats;
  typologies: TypologyMeta[];
}

export interface GetIncidentsParams {
  organization_id?: string;
  typology?: string;
  severity?: string;
  status?: string;
  time_range?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getIncidentsReport(params: GetIncidentsParams = {}): Promise<IncidentsReportResponse> {
  const query = new URLSearchParams();
  if (params.organization_id) query.append("organization_id", params.organization_id);
  if (params.typology) query.append("typology", params.typology);
  if (params.severity) query.append("severity", params.severity);
  if (params.status) query.append("status", params.status);
  if (params.time_range) query.append("time_range", params.time_range);
  if (params.search) query.append("search", params.search);
  if (params.limit) query.append("limit", String(params.limit));
  if (params.offset) query.append("offset", String(params.offset));

  const res = await fetch(`${API_BASE}/reports/incidents?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al obtener reporte de incidencias");
  }
  return res.json();
}

export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  resolutionNotes?: string
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/reports/incidents/${incidentId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      status,
      resolution_notes: resolutionNotes,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar estado de la incidencia");
  }
  return res.json();
}






