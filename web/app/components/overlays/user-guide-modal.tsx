"use client";
import React from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-surface-container border border-outline rounded-2xl shadow-2xl text-on-surface overflow-hidden flex flex-col max-h-[90%]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline/60 px-5 md:px-6 py-4">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">Cómo usar la app</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5 space-y-6">

          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs font-bold shrink-0">1</span>
              <h3 className="font-semibold text-sm md:text-base text-on-surface">Fondo blanco y limpio</h3>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed pl-9">
              Coloca la lima de endodoncia centrada sobre un fondo blanco y limpio. El contraste ayuda al modelo a detectar con precisión.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs font-bold shrink-0">2</span>
              <h3 className="font-semibold text-sm md:text-base text-on-surface">Evita sombras</h3>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed pl-9">
              Asegúrate de tener una buena iluminación. Usa luz natural o artificial uniforme para obtener mejores resultados en la clasificación.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs font-bold shrink-0">3</span>
              <h3 className="font-semibold text-sm md:text-base text-on-surface">Toma o carga una foto</h3>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed pl-9">
              Captura una foto con la cámara o carga una imagen desde tu galería. La app analizará automáticamente la lima detectada.
            </p>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs font-bold shrink-0">4</span>
              <h3 className="font-semibold text-sm md:text-base text-on-surface">Revisa el historial o catálogo</h3>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed pl-9">
              Accede al historial de fotos o catálogo completo desde la barra de navegación. Toca cualquier resultado para ver detalles completos de la lima.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-outline/60 px-5 md:px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
