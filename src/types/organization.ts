export interface OrganizationStats {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  windows_count: number;
  linux_count: number;
}

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  enrollment_token?: string | null;
  created_at: string;
  stats?: OrganizationStats;
}

export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  plan?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  plan?: string;
}
