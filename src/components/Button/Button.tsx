import React from "react";
import "./Button.css";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "icon" | "danger" | "ghost-danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ variant = "primary", size = "md", icon, children, className = "", loading = false, disabled, ...props }) => {
  return (
    <button className={`q-btn q-btn--${variant} q-btn--${size} ${loading ? "q-btn--loading" : ""} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? (
        <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      ) : (
        icon && <span className="q-btn-icon">{icon}</span>
      )}
      {children}
    </button>
  );
};
