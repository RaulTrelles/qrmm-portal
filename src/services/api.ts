import type { Device, MobileDeviceCardData } from "../types/device";
import type { TokenResponseData, UserProfile } from "../types/auth";
import type { OrganizationItem, CreateOrganizationPayload, UpdateOrganizationPayload } from "../types/organization";

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Detección automática para producción en qhapana.com
    if (host === "qrmm.qhapana.com" || host.endsWith(".qhapana.com")) {
      return "https://qrmm-backend.qhapana.com/api/v1";
    }
    // Entorno local o IP de red local
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
  const url = new URL(API_BASE + "/devices");
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
  const url = new URL(API_BASE + "/devices/mobile-cards");
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
  const url = new URL(API_BASE + "/devices/" + deviceId + "/services");
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
  const res = await fetch(`${API_BASE}/devices/${deviceId}/system-logs?source=${encodeURIComponent(source)}&lines=${lines}`);
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

export interface AlertSettings {
  email_alerts_enabled: boolean;
  notify_on_device_offline: boolean;
  notify_on_container_crash: boolean;
  alert_recipients: string[];
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
  alert_recipients: string[];
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alert_recipients: alertRecipients }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Error al actualizar destinatarios del equipo");
  }
  return res.json();
}

export async function getNetworkProbes(): Promise<{ probes: any[]; active_count: number }> {
  const res = await fetch(`${API_BASE}/discovery/probes`);
  if (!res.ok) throw new Error("Error al consultar sondas de red disponibles");
  return res.json();
}

export async function scanNetwork(probeDeviceId?: string, subnet?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/discovery/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_BASE}/discovery/devices`);
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

