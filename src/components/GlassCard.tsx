import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  glow = false,
  onClick,
}) => {
  const baseStyle = glow ? "glass-panel-glow" : "glass-panel";
  const interactiveStyle = onClick
    ? "cursor-pointer active:scale-95 transition-all duration-200 hover:border-teal-500/30"
    : "";

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 ${baseStyle} ${interactiveStyle} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
