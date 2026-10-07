import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserProfile, OrganizationBasic, RegisterPayload } from "../types/auth";
import type { OrganizationItem } from "../types/organization";
import {
  getAuthToken,
  setAuthToken,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  register as apiRegister,
  getMe,
  getOrganizations,
} from "../services/api";

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  organization: OrganizationBasic | null;
  organizationsList: OrganizationItem[];
  activeOrganization: OrganizationItem | null; // null significa "Todos los Clientes"
  setActiveOrganization: (org: OrganizationItem | null) => void;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithCustomToken: (newToken: string, newUser?: any, newOrg?: any) => void;
  logout: () => void;
  refreshOrganizations: () => Promise<void>;
  language: "es" | "en";
  setLanguage: (lang: "es" | "en") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<OrganizationBasic | null>(null);
  const [organizationsList, setOrganizationsList] = useState<OrganizationItem[]>([]);
  const [activeOrganization, setActiveOrganizationState] = useState<OrganizationItem | null>(() => {
    const saved = localStorage.getItem("q_active_org");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<"es" | "en">(() => {
    return (localStorage.getItem("q_language") as "es" | "en") || "es";
  });

  const setLanguage = (lang: "es" | "en") => {
    setLanguageState(lang);
    localStorage.setItem("q_language", lang);
  };

  const setActiveOrganization = (org: OrganizationItem | null) => {
    if (user && user.role !== "SUPERADMIN") {
      // Bloquear cambio de cliente si no es superadmin
      return;
    }
    setActiveOrganizationState(org);
    if (org) {
      localStorage.setItem("q_active_org", JSON.stringify(org));
    } else {
      localStorage.removeItem("q_active_org");
    }
  };

  const loadProfileAndOrgs = async () => {
    try {
      setIsLoading(true);
      const data = await getMe();
      setUser(data.user);
      setOrganization(data.organization);

      if (data.user.role !== "SUPERADMIN") {
        // Para usuarios de cliente (ADMIN/OPERATOR), fijar estrictamente su organización
        if (data.organization) {
          const clientOrgItem: OrganizationItem = {
            id: data.organization.id,
            name: data.organization.name,
            slug: data.organization.slug,
            plan: data.organization.plan,
            enrollment_token: data.organization.enrollment_token,
            created_at: new Date().toISOString(),
          };
          setActiveOrganizationState(clientOrgItem);
          setOrganizationsList([clientOrgItem]);
          localStorage.setItem("q_active_org", JSON.stringify(clientOrgItem));
        } else {
          setActiveOrganizationState(null);
          setOrganizationsList([]);
        }
      } else {
        // Cargar lista completa de organizaciones solo para SUPERADMIN
        const orgs = await getOrganizations().catch(() => []);
        setOrganizationsList(orgs);

        if (orgs.length > 0 && activeOrganization) {
          const stillExists = orgs.find((o) => o.id === activeOrganization.id);
          if (!stillExists) {
            setActiveOrganizationState(null);
            localStorage.removeItem("q_active_org");
          }
        }
      }
    } catch (err) {
      console.warn("Sesión inválida o error cargando perfil:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfileAndOrgs();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await apiLogin({ email, password: pass });
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setOrganization(res.organization || null);
    if (res.user.role !== "SUPERADMIN" && res.organization) {
      const clientOrgItem: OrganizationItem = {
        id: res.organization.id,
        name: res.organization.name,
        slug: res.organization.slug,
        plan: res.organization.plan,
        enrollment_token: res.organization.enrollment_token,
        created_at: new Date().toISOString(),
      };
      setActiveOrganizationState(clientOrgItem);
      setOrganizationsList([clientOrgItem]);
      localStorage.setItem("q_active_org", JSON.stringify(clientOrgItem));
    } else {
      await refreshOrganizations();
    }
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await apiLoginWithGoogle(credential);
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setOrganization(res.organization || null);
    if (res.user.role !== "SUPERADMIN" && res.organization) {
      const clientOrgItem: OrganizationItem = {
        id: res.organization.id,
        name: res.organization.name,
        slug: res.organization.slug,
        plan: res.organization.plan,
        enrollment_token: res.organization.enrollment_token,
        created_at: new Date().toISOString(),
      };
      setActiveOrganizationState(clientOrgItem);
      setOrganizationsList([clientOrgItem]);
      localStorage.setItem("q_active_org", JSON.stringify(clientOrgItem));
    } else {
      await refreshOrganizations();
    }
  };

  const register = async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setOrganization(res.organization || null);
    if (res.organization) {
      const clientOrgItem: OrganizationItem = {
        id: res.organization.id,
        name: res.organization.name,
        slug: res.organization.slug,
        plan: res.organization.plan,
        enrollment_token: res.organization.enrollment_token,
        created_at: new Date().toISOString(),
      };
      setActiveOrganizationState(clientOrgItem);
      setOrganizationsList([clientOrgItem]);
      localStorage.setItem("q_active_org", JSON.stringify(clientOrgItem));
    }
  };

  const loginWithCustomToken = (newToken: string, newUser?: any, newOrg?: any) => {
    setAuthToken(newToken);
    setTokenState(newToken);
    if (newUser) setUser(newUser);
    if (newOrg) {
      setOrganization(newOrg);
      setActiveOrganizationState(newOrg);
      localStorage.setItem("q_active_org", JSON.stringify(newOrg));
      if (newUser?.role !== "SUPERADMIN") {
        setOrganizationsList([newOrg]);
      }
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    setOrganization(null);
    setActiveOrganizationState(null);
    localStorage.removeItem("q_active_org");
  };

  const refreshOrganizations = async () => {
    try {
      if (user && user.role !== "SUPERADMIN") {
        return;
      }
      const orgs = await getOrganizations();
      setOrganizationsList(orgs);
    } catch (err) {
      console.error("Error refreshing organizations:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        organization,
        organizationsList,
        activeOrganization,
        setActiveOrganization,
        isLoading,
        login,
        loginWithGoogle,
        register,
        loginWithCustomToken,
        logout,
        refreshOrganizations,
        language,
        setLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
