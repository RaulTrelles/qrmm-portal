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
} from "lucide-react";
import { forgotPassword, resetPassword } from "../services/api";
import "./LoginView.css";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1008955884041-n58nlc30n4fnqnl6c3btr3nmfh8sduj1.apps.googleusercontent.com";

export interface LoginViewProps {
  onGoToPortal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGoToPortal }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
  const [generatedCodeNotice, setGeneratedCodeNotice] = useState<string | null>(null);

  // Inicializar Google Identity Services
  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                try {
                  setLoading(true);
                  setError(null);
                  await loginWithGoogle(response.credential);
                } catch (err: any) {
                  setError(err.message || "Error al iniciar sesión con Google");
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
              text: "continue_with",
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
  }, [loginWithGoogle]);

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
      setForgotMsg(res.message);
      if (res.code) {
        setGeneratedCodeNotice(res.code);
        setForgotCode(res.code);
      }
    } catch (err: any) {
      setForgotError(err.message || "Error al solicitar código");
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
      <div className="q-login-card">
        <div className="q-login-header">
          <div className="q-login-logo-badge">Q</div>
          <h1 className="q-login-title">Qhapana RMM</h1>
          <p className="q-login-subtitle">
            Consola SaaS de Gestión y Supervisión Remota
          </p>
        </div>

        {error && (
          <div className="q-login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

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
                setGeneratedCodeNotice(null);
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

        <div className="q-login-divider">O continúa con</div>

        <div className="q-google-btn-container">
          <div ref={googleBtnRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
        </div>

        {onGoToPortal && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
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
          >
            <button
              className="q-modal-close"
              onClick={() => setIsForgotOpen(false)}
              title="Cerrar"
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--color-brand-surface)",
                  color: "var(--color-brand-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <KeyRound size={20} />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--color-text-primary)" }}>
                Recuperar Contraseña
              </h2>
            </div>

            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
              {forgotStep === 1
                ? "Ingresa el correo electrónico asociado a tu cuenta para generar un código de verificación."
                : `Ingresa el código de 6 dígitos enviado y define tu nueva contraseña para ${forgotEmail}.`}
            </p>

            {forgotError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#dcfce7",
                  color: "#15803d",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="q-form-group">
                  <label className="q-form-label">Correo Electrónico</label>
                  <div className="q-input-wrapper">
                    <Mail size={16} />
                    <input
                      type="email"
                      required
                      className="q-input-field"
                      placeholder="ej. raul.trelles@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={forgotLoading}
                  style={{ width: "100%", height: "42px", marginTop: "4px" }}
                >
                  Enviar Código de Verificación
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {generatedCodeNotice && (
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--color-brand-surface)",
                      border: "1px dashed var(--color-brand-primary)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--color-brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      Código generado: <strong>{generatedCodeNotice}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setForgotCode(generatedCodeNotice)}
                      style={{
                        background: "var(--color-brand-primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Autocompletar
                    </button>
                  </div>
                )}

                <div className="q-form-group">
                  <label className="q-form-label">Código de Verificación (6 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="q-form-input"
                    placeholder="Ej. 123456"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                    style={{ letterSpacing: "3px", fontSize: "16px", fontWeight: 700, textAlign: "center" }}
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
                  Restablecer Contraseña
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
                      color: "var(--color-text-secondary)",
                      fontSize: "12px",
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
    </div>
  );
};
