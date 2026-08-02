"use client";
import React from 'react';
import { ChevronLeft, Home, History, BookOpen, Info } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNav?: (nav: 'inicio' | 'historial' | 'catalogo') => void;
  onOpenGuide?: () => void;
}

export default function Sidebar({ isOpen, onClose, onSelectNav, onOpenGuide }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Sidebar Panel sliding from left */}
      <div className="relative w-80 max-w-[85vw] h-full bg-surface-container-high border-r border-outline text-on-surface p-6 flex flex-col justify-between z-10 shadow-2xl animate-[slideRight_0.25s_ease-out]">

        {/* Top Header */}
        <div>
          <div className="flex justify-between items-center pb-6 border-b border-outline">
            <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
              <span className="text-on-primary-container">Endofile</span>AI
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container border border-outline/60 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              aria-label="Cerrar menú"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-2">
            <button
              onClick={() => {
                onSelectNav?.('inicio');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary-container/40 hover:bg-primary-container/70 text-on-surface font-medium text-sm transition-all cursor-pointer border border-primary-container/60"
            >
              <Home size={18} className="text-on-primary-container" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => {
                onSelectNav?.('historial');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all cursor-pointer border border-outline/40"
            >
              <History size={18} className="text-on-surface-variant" />
              <span>Historial de fotos</span>
            </button>

            <button
              onClick={() => {
                onSelectNav?.('catalogo');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all cursor-pointer border border-outline/40"
            >
              <BookOpen size={18} className="text-on-surface-variant" />
              <span>Catálogo de limas</span>
            </button>

            <button
              onClick={() => {
                onOpenGuide?.();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all cursor-pointer border border-outline/40"
            >
              <Info size={18} className="text-on-surface-variant" />
              <span>Guía de usuario</span>
            </button>
          </nav>

          {/* Help Section */}
          <div className="mt-8 p-4 rounded-2xl bg-surface-container-lowest/60 border border-outline/60">
            <div className="flex items-center gap-2 mb-2 text-on-surface font-semibold text-xs uppercase tracking-wider">
              <Info size={14} className="text-on-primary-container" />
              <span>Consejos rápidos</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Posicione la lima de endodoncia centrada en el visor.
              Asegúrese de contar con un fondo blanco en la camara con buena nitidez
              para obtener la mejor clasificación con inteligencia artificial.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-outline flex justify-between items-center text-xs text-on-surface-variant">
          <span>Versión</span>
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded-md text-on-surface font-semibold">0.1.0</span>
        </div>
      </div>
    </div>
  );
}
