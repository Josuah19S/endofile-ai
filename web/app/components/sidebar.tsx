"use client";
import React from 'react';
import { ChevronLeft, Home, History, BookOpen, Info } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNav?: (nav: 'inicio' | 'historial' | 'catalogo') => void;
}

export default function Sidebar({ isOpen, onClose, onSelectNav }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Sidebar Panel sliding from left */}
      <div className="relative w-80 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 text-white p-6 flex flex-col justify-between z-10 shadow-2xl animate-[slideRight_0.25s_ease-out]">
        
        {/* Top Header */}
        <div>
          <div className="flex justify-between items-center pb-6 border-b border-slate-800">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-400">Endofile</span>AI
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-white font-medium text-sm transition-all cursor-pointer border border-slate-700/40"
            >
              <Home size={18} className="text-blue-400" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => {
                onSelectNav?.('historial');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950/40 hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer border border-slate-800/40"
            >
              <History size={18} className="text-slate-400" />
              <span>Historial de fotos</span>
            </button>

            <button
              onClick={() => {
                onSelectNav?.('catalogo');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950/40 hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer border border-slate-800/40"
            >
              <BookOpen size={18} className="text-slate-400" />
              <span>Catálogo de limas</span>
            </button>
          </nav>

          {/* Help Section */}
          <div className="mt-8 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
              <Info size={14} className="text-blue-400" />
              <span>Cómo usar la app</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Posicione la lima de endodoncia centrada en el visor. Asegúrese de contar con buen contraste sobre el fondo para obtener la mejor clasificación con inteligencia artificial.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
          <span>Versión</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded-md text-slate-300 font-semibold">0.1.0</span>
        </div>
      </div>
    </div>
  );
}
