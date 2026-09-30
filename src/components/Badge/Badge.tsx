import React from "react";
import "./Badge.css";
export type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";
export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", pulse = false, className = "", style }) => {
  return (
    <span className={`q-badge q-badge--${variant} ${pulse ? "q-badge--pulse" : ""} ${className}`} style={style}>
      <span className="q-badge-dot" />
      {children}
    </span>
  );
};
