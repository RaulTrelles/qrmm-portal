import React, { useState, useEffect } from "react";
import {
  Users,
  Radio,
  Search,
  Plus,
  RefreshCw,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Edit2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "../components/Badge/Badge";
import { Button } from "../components/Button/Button";
import { useAuth } from "../context/AuthContext";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  getOnlineUsers,
  getOrganizations,
} from "../services/api";
import type { AdminUser, OnlineUser } from "../types/payment";
import type { OrganizationItem } from "../types/organization";
import "./UsersView.css";

export const UsersView: React.FC = () => {
  const { user: currentUser, activeOrganization } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "online">("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modal Nuevo Usuario
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [newRole, setNewRole] = useState<string>("OPERATOR");
  const [newOrgId, setNewOrgId] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal Editar Usuario
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editRole, setEditRole] = useState<string>("");
  const [editOrgId, setEditOrgId] = useState<string>("");
  const [editPassword, setEditPassword] = useState<string>("");
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [editActive, setEditActive] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const orgIdToFilter = currentUser?.role === "SUPERADMIN" ? activeOrganization?.id : (currentUser?.organization_id || activeOrganization?.id);
      const [uList, onList, oList] = await Promise.all([
        getAdminUsers(orgIdToFilter),
        getOnlineUsers(),
        getOrganizations(),
      ]);
      setUsers(uList);
      setOnlineUsers(onList);
      setOrgs(oList);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh de presencia en línea cada 15 segundos
    const interval = setInterval(() => {
      getOnlineUsers()
        .then((data) => setOnlineUsers(data))
        .catch(() => null);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeOrganization]);

  const handleOpenCreate = () => {
    setNewEmail("");
    setNewName("");
    setNewPassword("");
    setShowNewPassword(false);
    setNewRole("OPERATOR");
    setNewOrgId(currentUser?.role === "SUPERADMIN" ? (activeOrganization?.id || "") : (currentUser?.organization_id || activeOrganization?.id || ""));
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const targetOrg = currentUser?.role === "SUPERADMIN"
        ? (newOrgId || (activeOrganization ? activeOrganization.id : undefined))
        : (currentUser?.organization_id || activeOrganization?.id);

      await createAdminUser({
        email: newEmail,
        full_name: newName,
        password: newPassword,
        role: newRole,
        organization_id: targetOrg,
        is_active: true,
      });
      setIsCreateOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setShowNewPassword(false);
      await fetchData();
    } catch (err: any) {
      setCreateError(err.message || "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditName(u.full_name);
    setEditRole(u.role);
    setEditOrgId(u.organization_id || "");
    setEditActive(u.is_active);
    setEditPassword("");
    setShowEditPassword(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await updateAdminUser(editingUser.id, {
        full_name: editName,
        role: editRole,
        organization_id: editOrgId || undefined,
        is_active: editActive,
        password: editPassword.trim() ? editPassword : undefined,
      });
      setEditingUser(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (currentUser?.role !== "SUPERADMIN" && currentUser?.organization_id) {
      if (u.organization_id !== currentUser.organization_id) return false;
    }
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const displayOnlineUsers = onlineUsers.filter((ou) => {
    if (currentUser?.role !== "SUPERADMIN" && currentUser?.organization_id) {
      return ou.organization_id === currentUser.organization_id;
    }
    return true;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "info";
      case "ADMIN":
        return "neutral";
      case "OPERATOR":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <div className="q-users-view">
      {/* Cabecera Principal */}
      <div className="q-users-header">
        <div className="q-users-title-box">
          <h1>Gestión de Usuarios y Presencia de Operadores</h1>
          <p>
            Administra los accesos del personal de TI, asignación a clientes y supervisa sesiones activas en tiempo real.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="secondary" size="sm" onClick={fetchData} loading={isLoading}>
            <RefreshCw size={14} /> Actualizar
          </Button>
          {(currentUser?.role === "SUPERADMIN" || currentUser?.role === "ADMIN") && (
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <Plus size={16} /> Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="q-users-tabs">
        <button
          className={`q-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <Users size={16} /> Usuarios del Sistema ({filteredUsers.length})
        </button>
        <button
          className={`q-tab-btn ${activeTab === "online" ? "active" : ""}`}
          onClick={() => setActiveTab("online")}
        >
          <Radio size={16} color="#10b981" /> Quiénes están en Línea ({displayOnlineUsers.length})
        </button>
      </div>

      {/* PESTAÑA 1: TODOS LOS USUARIOS */}
      {activeTab === "all" && (
        <>
          {/* Toolbar de Búsqueda y Filtros */}
          <div className="q-users-toolbar">
            <div className="q-search-box">
              <Search size={15} color="var(--color-text-secondary)" />
              <input
                type="text"
                className="q-search-input"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="q-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">Todos los Roles</option>
              <option value="SUPERADMIN">Superadmin</option>
              <option value="ADMIN">Administrador</option>
              <option value="OPERATOR">Operador</option>
              <option value="VIEWER">Visualizador</option>
            </select>
          </div>

          {/* Tabla de Usuarios */}
          <div className="q-users-table-card">
            <table className="q-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Organización / Cliente</th>
                  <th>Rol</th>
                  <th>Método de Acceso</th>
                  <th>Presencia</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="q-user-info-cell">
                          <div className="q-user-avatar-sm">{u.full_name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                              {u.full_name}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                          <Building2 size={14} color="var(--color-brand-primary)" />
                          {u.organization_name || "Sin Asignar"}
                        </span>
                      </td>
                      <td>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {u.role}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", textTransform: "capitalize", fontWeight: 500 }}>
                          {u.auth_provider === "google" ? "Google OAuth" : "Local (Email/Pass)"}
                        </span>
                      </td>
                      <td>
                        {u.is_online ? (
                          <Badge variant="success" pulse>
                            En Línea
                          </Badge>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                            Desconectado
                          </span>
                        )}
                      </td>
                      <td>
                        {u.is_active ? (
                          <span style={{ color: "#10b981", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle size={14} /> Activo
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-danger)", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <XCircle size={14} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {(currentUser?.role === "SUPERADMIN" ||
                          (currentUser?.role === "ADMIN" &&
                            u.organization_id === currentUser?.organization_id &&
                            u.role !== "SUPERADMIN")) && (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            style={{
                              border: "1px solid var(--color-border-default)",
                              background: "transparent",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PESTAÑA 2: QUIÉNES ESTÁN EN LÍNEA (PRESENCIA REAL TIME) */}
      {activeTab === "online" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-default)", borderRadius: "8px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>
              Sesiones activas detectadas en la consola: <strong>{displayOnlineUsers.length}</strong> operador(es) en línea.
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Actualizado dinámicamente cada 15 segundos
            </span>
          </div>

          <div className="q-online-grid">
            {displayOnlineUsers.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", backgroundColor: "var(--color-surface-default)", borderRadius: "12px", border: "1px solid var(--color-border-default)" }}>
                <Users size={32} color="var(--color-text-muted)" style={{ marginBottom: "8px" }} />
                <p style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  No hay otros operadores navegando en este momento.
                </p>
              </div>
            ) : (
              displayOnlineUsers.map((ou) => (
                <div key={ou.id} className="q-online-card">
                  <div className="q-online-card-header">
                    <div className="q-online-user-meta">
                      <div className="q-online-avatar-box">
                        <div className="q-user-avatar-sm">{ou.full_name.charAt(0).toUpperCase()}</div>
                        <span className="q-online-pulse-dot" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>
                          {ou.full_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          {ou.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(ou.role)} pulse>
                      {ou.role}
                    </Badge>
                  </div>

                  <div className="q-online-details-box">
                    <div className="q-online-row">
                      <span>Organización:</span>
                      <strong>{ou.organization_name || "Superadmin Global"}</strong>
                    </div>
                    <div className="q-online-row">
                      <span>Dirección IP:</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{ou.last_ip || "127.0.0.1"}</span>
                    </div>
                    <div className="q-online-row">
                      <span>Navegador / Dispositivo:</span>
                      <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ou.last_user_agent || "Google Chrome"}
                      </span>
                    </div>
                    <div className="q-online-row">
                      <span>Última Actividad:</span>
                      <span style={{ color: "#10b981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} /> Hace instantes
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {isCreateOpen && (
        <div className="q-checkout-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="q-checkout-modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <button className="q-modal-close" onClick={() => setIsCreateOpen(false)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>Crear Nuevo Usuario</h2>

            {createError && (
              <div style={{ padding: "8px 12px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="q-form-group">
                <label className="q-form-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="q-form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                />
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="q-form-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="carlos@empresa.com"
                />
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Contraseña Temporal</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    className="q-form-input"
                    style={{ width: "100%", paddingRight: "40px" }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      padding: "4px",
                    }}
                    title={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="q-form-group">
                  <label className="q-form-label">Rol del Usuario</label>
                  <select
                    className="q-filter-select"
                    style={{ width: "100%" }}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="VIEWER">Visualizador</option>
                    {currentUser?.role === "SUPERADMIN" && <option value="SUPERADMIN">Superadmin</option>}
                  </select>
                </div>

                <div className="q-form-group">
                  <label className="q-form-label">Cliente / Organización</label>
                  {currentUser?.role === "SUPERADMIN" ? (
                    <select
                      className="q-filter-select"
                      style={{ width: "100%" }}
                      value={newOrgId}
                      onChange={(e) => setNewOrgId(e.target.value)}
                    >
                      <option value="">(Global / Por Defecto)</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="q-form-input"
                      disabled
                      value={activeOrganization?.name || currentUser?.organization?.name || "Mi Organización"}
                      style={{ background: "var(--color-surface-hover)", cursor: "not-allowed" }}
                    />
                  )}
                </div>
              </div>

              <Button variant="primary" type="submit" loading={isSubmitting} style={{ marginTop: "12px" }}>
                Guardar Usuario
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="q-checkout-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="q-checkout-modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <button className="q-modal-close" onClick={() => setEditingUser(null)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
              Editar Usuario: {editingUser.email}
            </h2>

            <form onSubmit={handleUpdateUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="q-form-group">
                <label className="q-form-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="q-form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="q-form-group">
                  <label className="q-form-label">Rol</label>
                  <select
                    className="q-filter-select"
                    style={{ width: "100%" }}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="VIEWER">Visualizador</option>
                    {currentUser?.role === "SUPERADMIN" && <option value="SUPERADMIN">Superadmin</option>}
                  </select>
                </div>

                <div className="q-form-group">
                  <label className="q-form-label">Cliente / Organización</label>
                  {currentUser?.role === "SUPERADMIN" ? (
                    <select
                      className="q-filter-select"
                      style={{ width: "100%" }}
                      value={editOrgId}
                      onChange={(e) => setEditOrgId(e.target.value)}
                    >
                      <option value="">(Sin Asignar)</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="q-form-input"
                      disabled
                      value={editingUser.organization_name || activeOrganization?.name || "Mi Organización"}
                      style={{ background: "var(--color-surface-hover)", cursor: "not-allowed" }}
                    />
                  )}
                </div>
              </div>

              <div className="q-form-group">
                <label className="q-form-label">Cambiar Contraseña (opcional)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showEditPassword ? "text" : "password"}
                    className="q-form-input"
                    style={{ width: "100%", paddingRight: "40px" }}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar vacío si no se desea cambiar"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      padding: "4px",
                    }}
                    title={showEditPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <label htmlFor="userActiveCheck" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Usuario Activo (Permitir inicio de sesión)
                </label>
              </div>

              <Button variant="primary" type="submit" loading={isSubmitting} style={{ marginTop: "12px" }}>
                Guardar Cambios
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
