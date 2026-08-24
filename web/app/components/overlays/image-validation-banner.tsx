"use client";

import React from 'react';
import { Moon, Focus, ZoomIn } from 'lucide-react';
import { ImageValidationResults } from '../../lib/image-validations';

interface ImageValidationBannerProps {
  results: ImageValidationResults | null;
  className?: string;
  compact?: boolean;
}

export default function ImageValidationBanner({ results, className = "", compact = false }: ImageValidationBannerProps) {
  if (!results || !results.hasErrors) return null;

  const { blur, dark, tooFar } = results;

  if (compact) {
    return (
      <div className={`space-y-1 max-w-sm w-full mx-auto ${className}`}>
        {blur.isBlurry && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-medium shadow-sm backdrop-blur-md">
            <Focus size={13} className="shrink-0 text-amber-400" />
            <span className="truncate">Imagen desenfocada (mantenga la cámara firme)</span>
          </div>
        )}

        {dark.isDark && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-300 text-[11px] font-medium shadow-sm backdrop-blur-md">
            <Moon size={13} className="shrink-0 text-blue-400" />
            <span className="truncate">Poca iluminación (encienda el flash)</span>
          </div>
        )}

        {tooFar.isTooFar && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-medium shadow-sm backdrop-blur-md">
            <ZoomIn size={13} className="shrink-0 text-rose-400" />
            <span className="truncate">Lima muy lejos (acerque la cámara)</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 max-w-sm w-full mx-auto animate-slide-up ${className}`}>
      {blur.isBlurry && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium shadow-lg backdrop-blur-md">
          <Focus size={16} className="shrink-0 text-amber-400 animate-pulse" />
          <div className="flex-1">
            <span className="font-semibold block">Imagen Desenfocada</span>
            <span className="text-[11px] text-amber-200/80">
              Varianza: {blur.blurScore} (Umbral: &lt;{blur.threshold}). Mantenga la cámara firme.
            </span>
          </div>
        </div>
      )}

      {dark.isDark && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 text-xs font-medium shadow-lg backdrop-blur-md">
          <Moon size={16} className="shrink-0 text-blue-400" />
          <div className="flex-1">
            <span className="font-semibold block">Imagen Demasiado Oscura</span>
            <span className="text-[11px] text-blue-200/80">
              Brillo: {dark.averageBrightness} (Umbral: &lt;{dark.threshold}). Encienda el flash.
            </span>
          </div>
        </div>
      )}

      {tooFar.isTooFar && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium shadow-lg backdrop-blur-md">
          <ZoomIn size={16} className="shrink-0 text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold block">Lima Demasiado Lejos</span>
            <span className="text-[11px] text-rose-200/80">
              Área: {tooFar.areaPercent}% (Umbral: &lt;{tooFar.thresholdMinAreaPercent}%), Extensión: {tooFar.heightPercent}%. Acerque la cámara.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
