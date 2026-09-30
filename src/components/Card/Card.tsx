import React from "react";
import "./Card.css";
export interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void; }
export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => {
  return <div className={`q-card ${className}`} onClick={onClick}>{children}</div>;
};
