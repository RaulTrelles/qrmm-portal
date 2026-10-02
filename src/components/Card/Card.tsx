import React from "react";
import "./Card.css";
export interface CardProps { 
  children: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
  onClick?: () => void; 
}
export const Card: React.FC<CardProps> = ({ children, className = "", style, onClick }) => {
  return <div className={`q-card ${className}`} style={style} onClick={onClick}>{children}</div>;
};
