import React from "react";
import { t } from "../lib/i18n";

interface MacroRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  consumed,
  target,
  size = 200,
  strokeWidth = 14,
}) => {
  const safeTarget = target <= 0 ? 2000 : target;
  const remaining = Math.max(0, safeTarget - consumed);
  const percentage = Math.min(100, (consumed / safeTarget) * 100);
  const isOver = consumed > safeTarget;

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Circular Progress */}
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={isOver ? "url(#coralGradient)" : "url(#tealGradient)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          <linearGradient id="coralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inside Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        {isOver ? (
          <>
            <span className="text-sm font-semibold text-red-400">{t("dash.over_target", "Over Target")}</span>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              +{consumed - safeTarget}
            </span>
            <span className="text-xs text-gray-400">{t("dash.kcal_surplus", "kcal surplus")}</span>
          </>
        ) : (
          <>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {remaining}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              {t("dash.kcal_left", "kcal left")}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              {t("dash.of_target", "of {target} target").replace("{target}", String(safeTarget))}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default MacroRing;
