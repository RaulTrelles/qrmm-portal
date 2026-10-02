export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "SUPERADMIN" | "ADMIN" | "OPERATOR" | "VIEWER";
  auth_provider: "local" | "google";
  avatar_url?: string | null;
  organization_id?: string | null;
  organization?: OrganizationBasic | null;
  is_active: boolean;
}

export interface OrganizationBasic {
  id: string;
  name: string;
  slug: string;
  plan: string;
  enrollment_token?: string | null;
}

export interface TokenResponseData {
  access_token: string;
  token_type: string;
  user: UserProfile;
  organization?: OrganizationBasic | null;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  organization_name?: string;
}

