import React from "react";
import "./KpiCard.css";
export interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
}
export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, subtitle, badge }) => {
  return (
    <div className="q-kpi-card">
      <div className="q-kpi-header">
        <span className="q-kpi-title">{title}</span>
        <div className="q-kpi-icon-wrapper">{icon}</div>
      </div>
      <div className="q-kpi-value">{value}</div>
      {(subtitle || badge) && (
        <div className="q-kpi-footer">
          {badge}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
