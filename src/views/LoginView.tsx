import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button/Button";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  User as UserIcon,
  Building2,
  UserPlus,
  LogIn,
  HelpCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import { forgotPassword, resetPassword, getGoogleClientId } from "../services/api";
import "./LoginView.css";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "600233776099-tlqifsqopk1tu5lsncuh54fhtprfq1vu.apps.googleusercontent.com";

export interface LoginViewProps {
  onGoToPortal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGoToPortal }) => {
  const { login, loginWithGoogle, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Estados de Login
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de Creación de Cuenta (Registro)
  const [regFullName, setRegFullName] = useState<string>("");
  const [regOrgName, setRegOrgName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>("");
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regLoading, setRegLoading] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Estados para Recuperación de Contraseña
  const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotCode, setForgotCode] = useState<string>("");
  const [forgotNewPassword, setForgotNewPassword] = useState<string>("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  // Estado para Google Client ID dinámico y modal de ayuda
  const [googleClientId, setGoogleClientId] = useState<string>(GOOGLE_CLIENT_ID);
  const [isGoogleHelpOpen, setIsGoogleHelpOpen] = useState<boolean>(false);
  const [copiedOrigin, setCopiedOrigin] = useState<boolean>(false);

  useEffect(() => {
    getGoogleClientId().then((cid) => {
      if (cid && cid !== googleClientId) {
        setGoogleClientId(cid);
      }
    });
  }, []);

  // Inicializar Google Identity Services
  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response?.credential) {
                try {
                  setLoading(true);
                  setError(null);
                  await loginWithGoogle(response.credential);
                } catch (err: any) {
                  setError(err.message || "Error al autenticar o crear cuenta con Google");
                } finally {
                  setLoading(false);
                }
              }
            },
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = "";
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              width: 360,
              text: mode === "register" ? "signup_with" : "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
          }
        } catch (err) {
          console.warn("Google Identity no disponible en este entorno:", err);
        }
      }
    };

    const timer = setTimeout(initGoogle, 400);
    return () => clearTimeout(timer);
  }, [loginWithGoogle, mode, googleClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Por favor completa tu correo electrónico y contraseña");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas o usuario inactivo");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setRegError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@") || !regEmail.includes(".")) {
      setRegError("Por favor ingresa un correo electrónico corporativo válido.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setRegLoading(true);
      setRegError(null);
      await register({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        organization_name: regOrgName.trim() || undefined,
      });
    } catch (err: any) {
      setRegError(err.message || "Error al crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Por favor ingresa tu correo electrónico.");
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setForgotStep(2);
      setForgotMsg(res.message || `¡Código de seguridad enviado a ${forgotEmail.trim()}! Revisa tu bandeja de entrada o spam.`);
      setForgotCode("");
    } catch (err: any) {
      setForgotError(err.message || "Error al solicitar código de verificación.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      setForgotError("El código de verificación debe tener 6 dígitos.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        new_password: forgotNewPassword,
      });
      setForgotMsg(res.message);
      setEmail(forgotEmail.trim());
      setPassword(forgotNewPassword);
      setTimeout(() => {
        setIsForgotOpen(false);
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || "Error al restablecer contraseña");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="q-login-page">
      <div className="q-login-card" style={{ maxWidth: mode === "register" ? "480px" : "440px" }}>
        <div className="q-login-header">
          <div className="q-login-logo-badge">Q</div>
          <h1 className="q-login-title">
            {mode === "login" ? "Qhapana RMM" : "Crear Cuenta en Qhapana"}
          </h1>
          <p className="q-login-subtitle">
            {mode === "login"
              ? "Consola de Gestión y Supervisión Remota"
              : "Gestiona y supervisa tu flota de servidores y puestos de trabajo"}
          </p>
        </div>

        {/* Selector de Modo (Tabs) */}
        <div className="q-auth-mode-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`q-auth-mode-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError(null);
              setRegError(null);
            }}
          >
            <LogIn size={15} />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`q-auth-mode-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError(null);
              setRegError(null);
            }}
          >
            <UserPlus size={15} />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* ALERTA DE ERROR */}
        {(mode === "login" ? error : regError) && (
          <div className="q-login-error" role="alert">
            <AlertCircle size={16} />
            <span>{mode === "login" ? error : regError}</span>
          </div>
        )}

        {/* FORMULARIO DE INICIO DE SESIÓN */}
        {mode === "login" ? (
          <form onSubmit={handleSubmit} className="q-login-form">
            <div className="q-form-group">
              <label className="q-form-label" htmlFor="login-email">
                Correo Electrónico
              </label>
              <div className="q-input-wrapper">
                <Mail size={16} />
                <input
                  id="login-email"
                  type="email"
                  className="q-input-field"
                  placeholder="ej. admin@qhapana.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="q-form-group">
              <label className="q-form-label" htmlFor="login-password">
                Contraseña
              </label>
              <div className="q-input-wrapper">
                <Lock size={16} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="q-input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="q-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: "100%", marginTop: 4, height: 42 }}
            >
              {loading ? "Verificando acceso..." : "Iniciar Sesión"}
            </Button>

            {/* Enlace Recuperar Contraseña */}
            <div style={{ textAlign: "center", marginTop: "2px" }}>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email.trim());
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotMsg(null);
                  setForgotCode("");
                  setForgotNewPassword("");
                  setShowForgotNewPassword(false);
                  setIsForgotOpen(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-brand-primary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "6px 8px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                ¿Olvidaste tu contraseña? Recuperar contraseña
              </button>
            </div>
          </form>
        ) : (
          /* FORMULARIO DE CREACIÓN DE CUENTA (REGISTRO) */
          <form onSubmit={handleRegisterSubmit} className="q-login-form">
            <div className="q-form-group">
              <label className="q-form-label" htmlFor="reg-fullname">
                Nombre y Apellidos
              </label>
              <div className="q-input-wrapper">
                <UserIcon size={16} />
                <input
                  id="reg-fullname"
                  type="text"
                  className="q-input-field"
                  placeholder="ej. Carlos Mendoza"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  disabled={regLoading}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="q-form-group">
              <label className="q-form-label" htmlFor="reg-orgname">
                Empresa u Organización <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(opcional)</span>
              </label>
              <div className="q-input-wrapper">
                <Building2 size={16} />
                <input
                  id="reg-orgname"
                  type="text"
                  className="q-input-field"
                  placeholder="ej. Inversiones Globales S.A."
                  value={regOrgName}
                  onChange={(e) => setRegOrgName(e.target.value)}
                  disabled={regLoading}
                />
              </div>
            </div>

            <div className="q-form-group">
              <label className="q-form-label" htmlFor="reg-email">
                Correo Electrónico Corporativo
              </label>
              <div className="q-input-wrapper">
                <Mail size={16} />
                <input
                  id="reg-email"
                  type="email"
                  className="q-input-field"
                  placeholder="ej. admin@miempresa.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>
            </div>

            <div className="q-form-group">
              <label className="q-form-label" htmlFor="reg-password">
                Contraseña (mínimo 6 caracteres)
              </label>
              <div className="q-input-wrapper">
                <Lock size={16} />
                <input
                  id="reg-password"
                  type={showRegPassword ? "text" : "password"}
                  className="q-input-field"
                  placeholder="Crea una contraseña segura"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={regLoading}
                  required
                />
                <button
                  type="button"
                  className="q-password-toggle"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  tabIndex={-1}
                  title={showRegPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="q-form-group">
              <label className="q-form-label" htmlFor="reg-confirm-password">
                Confirmar Contraseña
              </label>
              <div className="q-input-wrapper">
                <Lock size={16} />
                <input
                  id="reg-confirm-password"
                  type={showRegPassword ? "text" : "password"}
                  className="q-input-field"
                  placeholder="Repite tu contraseña"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={regLoading}
              style={{ width: "100%", marginTop: 4, height: 42 }}
            >
              {regLoading ? "Creando tu cuenta y espacio..." : "Crear Cuenta y Empezar Gratis"}
            </Button>

            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", textAlign: "center", margin: "2px 0 0" }}>
              Al registrarte aceptas las Condiciones del Servicio y la Política de Privacidad de Qhapana.
            </p>
          </form>
        )}

        <div className="q-login-divider">
          {mode === "login" ? "O continúa con" : "O regístrate con"}
        </div>

        <div className="q-google-btn-container">
          <div ref={googleBtnRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
          <div style={{ textAlign: "center", marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => setIsGoogleHelpOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-tertiary)",
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "2px 6px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-brand-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
            >
              <HelpCircle size={13} />
              <span>¿Error 401 / no registered origin con Google? Ver solución</span>
            </button>
          </div>
        </div>

        {onGoToPortal && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button
              type="button"
              onClick={onGoToPortal}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-brand-primary)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ← Ver Portal Comercial & Planes con Descuento
            </button>
          </div>
        )}
      </div>

      {/* Modal Recuperar Contraseña */}
      {isForgotOpen && (
        <div className="q-checkout-modal-overlay" onClick={() => setIsForgotOpen(false)}>
          <div
            className="q-checkout-modal"
            style={{ maxWidth: "460px" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-modal-title"
          >
            <button
              className="q-modal-close"
              onClick={() => setIsForgotOpen(false)}
              title="Cerrar ventana"
              aria-label="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Encabezado del Modal */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(124, 58, 237, 0.2))",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "var(--color-brand-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {forgotStep === 1 ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-brand-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {forgotStep === 1 ? "Paso 1 de 2 • Identificación" : "Paso 2 de 2 • Verificación"}
                </span>
                <h2
                  id="forgot-modal-title"
                  style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}
                >
                  {forgotStep === 1 ? "Recuperar Contraseña" : "Validar Código y Nueva Clave"}
                </h2>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "18px" }}>
              {forgotStep === 1
                ? "Ingresa tu correo electrónico registrado. Te enviaremos un código de seguridad de 6 dígitos para restablecer tu acceso."
                : `Hemos despachado un código de seguridad a ${forgotEmail}. Ingrésalo a continuación para activar tu nueva contraseña.`}
            </p>

            {forgotError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#dc2626",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#059669",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="q-form-group">
                  <label className="q-form-label">Correo Electrónico de la Cuenta</label>
                  <div className="q-input-wrapper">
                    <Mail size={16} color="var(--color-text-secondary)" />
                    <input
                      type="email"
                      required
                      className="q-input-field"
                      placeholder="ejemplo@tuempresa.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--color-surface-page)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Lock size={14} color="var(--color-brand-primary)" style={{ flexShrink: 0 }} />
                  <span>El código vence en 15 minutos y se envía de forma confidencial a tu bandeja.</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={forgotLoading}
                  style={{ width: "100%", height: "42px", marginTop: "4px" }}
                >
                  {forgotLoading ? "Enviando código por correo..." : "Enviar Código de Verificación"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="q-form-group">
                  <label className="q-form-label">Código de Verificación (6 dígitos recibido por correo)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="q-form-input"
                    placeholder="••••••"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                    style={{ letterSpacing: "6px", fontSize: "20px", fontWeight: 800, textAlign: "center" }}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                <div className="q-form-group">
                  <label className="q-form-label">Nueva Contraseña</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      required
                      className="q-form-input"
                      style={{ width: "100%", paddingRight: "40px" }}
                      placeholder="Mínimo 6 caracteres"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
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
                      title={showForgotNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={forgotLoading}
                  style={{ width: "100%", height: "42px", marginTop: "4px" }}
                >
                  {forgotLoading ? "Actualizando contraseña..." : "Restablecer y Actualizar Contraseña"}
                </Button>

                <div style={{ textAlign: "center", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError(null);
                      setForgotMsg(null);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-brand-primary)",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ← Volver a ingresar correo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ayuda: Configuración de Origen Google OAuth */}
      {isGoogleHelpOpen && (
        <div className="q-checkout-modal-overlay" onClick={() => setIsGoogleHelpOpen(false)}>
          <div
            className="q-checkout-modal"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="q-modal-close"
              onClick={() => setIsGoogleHelpOpen(false)}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.2))",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-brand-primary)",
                    marginBottom: "4px",
                  }}
                >
                  Diagnóstico y Solución Google OAuth
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--color-text-primary)" }}>
                  Resolver Error 401: no registered origin
                </h2>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
              Google bloquea el popup si el dominio o puerto actual no está autorizado en la lista blanca de la consola de Google Cloud.
            </p>

            {/* Caja de Origen Detectado */}
            <div style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                Origen actual de tu navegador:
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <code style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-brand-primary)", wordBreak: "break-all" }}>
                  {typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.origin);
                      setCopiedOrigin(true);
                      setTimeout(() => setCopiedOrigin(false), 2000);
                    }
                  }}
                  style={{
                    background: "var(--color-surface-default)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    flexShrink: 0,
                  }}
                >
                  <Copy size={12} />
                  <span>{copiedOrigin ? "¡Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* Pasos de configuración */}
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>1</span>
                <span>
                  Abre la <strong>Consola de Google Cloud</strong> en la sección de Credenciales de tu proyecto.
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>2</span>
                <span>
                  Haz clic en tu <strong>ID de cliente de OAuth 2.0</strong> (número de proyecto: <code>600233776099</code>).
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>3</span>
                <span>
                  Bajo <strong>Orígenes de JavaScript autorizados</strong>, añade:
                  <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                    <li><code>http://localhost:5173</code> (para pruebas en tu PC)</li>
                    <li><code>https://qrmm.qhapana.com</code> (para producción)</li>
                  </ul>
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>4</span>
                <span>
                  Guarda los cambios. Google tarda entre 1 y 5 minutos en sincronizar los dominios.
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => setIsGoogleHelpOpen(false)}
              >
                Entendido
              </Button>
              <a
                href="https://console.cloud.google.com/apis/credentials?project=600233776099"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--color-brand-primary)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span>Ir a Google Cloud Console</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
