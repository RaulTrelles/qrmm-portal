export type DeviceState = "ONLINE" | "OFFLINE" | "UNSTABLE";
export interface DeviceStatus {
  current_state: DeviceState;
  last_seen: string | null;
  last_connection: string | null;
  last_disconnect: string | null;
  disconnect_reason: string | null;
  availability_percentage_24h: number;
}
export interface DiskSpec { mount: string; total_gb: number; free_gb: number; }
export interface PeripheralSpecs {
  chassis_type?: "Desktop" | "Laptop" | "Server" | "All in One" | string;
  monitors?: string[];
  keyboard?: string;
  mouse?: string;
  printers?: string[];
}
export interface DeviceSpecs {
  cpu_model?: string;
  cpu_cores?: number;
  cpu_mhz?: number;
  ram_total_gb?: number;
  ram_usable_gb?: number;
  ram_type?: string;
  disk_total_gb?: number;
  disk_free_gb?: number;
  disks?: DiskSpec[];
  peripherals?: PeripheralSpecs;
}
export interface DockerContainer {
  id?: string;
  name: string;
  image?: string;
  status: string;
  state?: string;
  health?: string;
  ports?: string;
  cpu_percent?: number;
  memory_mb?: number;
  mem_percent?: string;
  net_io?: string;
}
export interface ProcessItem {
  pid: number;
  name: string;
  cpu_percent: number;
  ram_mb: number;
  ram_percent: number;
  status: string;
}
export interface ServiceItem {
  name: string;
  display_name: string;
  status: string;
}
export interface HeartbeatTelemetry {
  cpu_percent?: number;
  ram_percent?: number;
  disk_percent?: number;
  uptime_seconds?: number;
  telemetry?: {
    docker_installed?: boolean;
    containers_count?: number;
    containers?: DockerContainer[];
    processes?: ProcessItem[];
    services?: ServiceItem[];
    ram_total_gb?: number;
    ram_used_gb?: number;
    disk_total_gb?: number;
    disk_free_gb?: number;
  };
}
export interface Device {
  id: string;
  device_code: string;
  hostname: string;
  os_type: string;
  os_version: string;
  architecture: string;
  agent_version: string;
  public_ip: string;
  private_ip: string;
  mac_address?: string;
  enrollment_status: string;
  tags: string[];
  client_area?: string;
  specs?: DeviceSpecs;
  alert_recipients?: string[];
  registered_at: string;
  status: DeviceStatus;
  latest_telemetry?: HeartbeatTelemetry;
}
export interface MobileDeviceCardData {
  id: string;
  device_code: string;
  hostname: string;
  os_type: string;
  current_state: DeviceState;
  client_area?: string;
  last_seen: string | null;
  ip: string;
  cpu_percent: number | null;
  ram_percent: number | null;
}
export interface KpiSummary { total: number; online: number; unstable: number; offline: number; }

export interface DiscoveredDevice {
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  device_type: "WINDOWS_PC" | "LINUX_SERVER" | "PRINTER" | "ROUTER_SWITCH" | "CAMERA_IOT" | "APPLE_DEVICE" | "UNKNOWN" | string;
  os_family: string;
  open_ports: number[];
  response_time_ms: number;
  is_managed: boolean;
  managed_device_id?: string;
  managed_device_hostname?: string;
}

export interface NetworkScanResponse {
  success: boolean;
  subnet: string;
  probe_ip: string;
  probe_hostname: string;
  scan_duration_ms: number;
  total_hosts: number;
  managed_count: number;
  unmanaged_count: number;
  devices: DiscoveredDevice[];
}

export interface NetworkProbe {
  id: string;
  hostname: string;
  private_ip: string;
  mac_address?: string;
  os_type: string;
  is_connected: boolean;
  status: string;
}

export interface RemoteDeployParams {
  probe_device_id?: string;
  target_ip: string;
  os_type: "windows" | "linux";
  username: string;
  password: string;
  port?: number;
  server_url?: string;
}

export interface RemoteDeployResponse {
  success: boolean;
  target_ip: string;
  message: string;
  logs: string[];
  duration_ms: number;
}
