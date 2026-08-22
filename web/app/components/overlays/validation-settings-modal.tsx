"use client";

import { Sliders, RotateCcw, X, Focus, Moon, ZoomIn, Check } from 'lucide-react';
import { useImageValidation } from '../../contexts/image-validation-context';

interface ValidationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ValidationSettingsModal({ isOpen, onClose }: ValidationSettingsModalProps) {
  const { config, updateConfig, resetConfig, isOpenCvReady, isOpenCvLoading } = useImageValidation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-container border border-outline rounded-2xl p-5 md:p-6 shadow-2xl text-on-surface space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline/60 pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-primary" />
            <h3 className="text-base font-bold tracking-wide">Configuración de Validaciones</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

  {/* OpenCV Status indicator */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline/70">
          <span className="text-on-surface-variant">Motor de Visión OpenCV.js:</span>
          {isOpenCvLoading ? (
            <span className="text-amber-400 font-medium animate-pulse">Cargando OpenCV.js...</span>
          ) : isOpenCvReady ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check size={14} /> Listo
            </span>
          ) : (
            <span className="text-amber-400 font-medium">Modo Canvas Fallback</span>
          )}
        </div>

        {/* Intro: what the gates do, in clinical terms. */}
        <p className="text-[11px] leading-relaxed text-on-surface-variant">
          Antes de clasificar la imagen, el sistema aplica tres controles de calidad. Si alguno
          falla, el resultado se sigue mostrando como <em>identificación tentativa</em>; use estos
          umbrales para ajustar qué tan estricta es la advertencia.
        </p>

        {/* Sliders Form */}
        <div className="space-y-4 text-sm">
          {/* 1. Nitidez */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-container-low border border-outline/60">
            <div className="flex items-center justify-between">
              <label className="font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wider text-on-surface-variant">
                <Focus size={15} className="text-amber-400" /> Nitidez de la Foto
              </label>
              <span className="text-xs font-bold text-primary">
                {config.thresholdBlur < 50
                  ? 'Permisivo'
                  : config.thresholdBlur <= 120
                  ? 'Estándar'
                  : 'Alta precisión'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={config.thresholdBlur}
              onChange={(e) => updateConfig({ thresholdBlur: parseFloat(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant/70 font-medium">
              <span>Permisivo</span>
              <span>Estándar</span>
              <span>Exigente</span>
            </div>
          </div>

          {/* 2. Iluminación */}
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-container-low border border-outline/60">
            <div className="flex items-center justify-between">
              <label className="font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wider text-on-surface-variant">
                <Moon size={15} className="text-blue-400" /> Iluminación Mínima
              </label>
              <span className="text-xs font-bold text-primary">
                {config.thresholdBrightness < 35
                  ? 'Tenue'
                  : config.thresholdBrightness <= 70
                  ? 'Natural'
                  : 'Brillante'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="2"
              value={config.thresholdBrightness}
              onChange={(e) => updateConfig({ thresholdBrightness: parseFloat(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant/70 font-medium">
              <span>Tenue</span>
              <span>Natural</span>
              <span>Brillante</span>
            </div>
          </div>

          {/* 3. Tamaño de la lima */}
          <div className="space-y-2.5 p-3 rounded-xl bg-surface-container-low border border-outline/60">
            <label className="font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wider text-on-surface-variant">
              <ZoomIn size={15} className="text-rose-400" /> Tamaño de la Lima en Pantalla
            </label>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Tamaño Mínimo de Lima:</span>
                <span className="font-bold text-primary">
                  {config.thresholdMinAreaPercent < 1.0
                    ? 'Pequeño'
                    : config.thresholdMinAreaPercent <= 3.0
                    ? 'Estándar'
                    : 'Grande'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={config.thresholdMinAreaPercent}
                onChange={(e) => updateConfig({ thresholdMinAreaPercent: parseFloat(e.target.value) })}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs">
                <span>Tamaño Mínimo en Pantalla:</span>
                <span className="font-bold text-primary">
                  {config.thresholdMinHeightPercent < 15
                    ? 'Flexible'
                    : config.thresholdMinHeightPercent <= 30
                    ? 'Estándar'
                    : 'Cercana'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={config.thresholdMinHeightPercent}
                onChange={(e) => updateConfig({ thresholdMinHeightPercent: parseFloat(e.target.value) })}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={resetConfig}
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface font-semibold cursor-pointer"
          >
            <RotateCcw size={14} /> Restablecer Valores
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
