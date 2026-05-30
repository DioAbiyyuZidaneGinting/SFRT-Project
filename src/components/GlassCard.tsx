/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
  hasScanline?: boolean;
}

export default function GlassCard({
  children,
  glow = false,
  title,
  subtitle,
  headerAction,
  className = '',
  hasScanline = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`cyber-panel rounded-2xl flex flex-col transition-all duration-300 ${
        glow ? 'shadow-lg border-brand-emerald/30' : 'border-border-primary'
      } ${className}`}
      {...props}
    >

      {/* HUD Corners Removed for Premium Look */}

      {/* Card Header (Optional) */}
      {(title || subtitle || headerAction) && (
        <div className="px-5 py-4 border-b border-border-primary/50 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-display font-semibold text-sm text-text-primary flex items-center gap-2">
                {glow && <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full shrink-0" />}
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-sans text-xs text-text-secondary mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col relative z-10">
        {children}
      </div>
    </div>
  );
}
