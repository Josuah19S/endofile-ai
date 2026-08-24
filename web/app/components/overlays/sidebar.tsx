"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home, History, BookOpen, Info, Cpu, Layers } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNav?: (nav: 'inicio' | 'historial' | 'catalogo') => void;
  onOpenGuide?: () => void;
}

export default function Sidebar({ isOpen, onClose, onSelectNav, onOpenGuide }: SidebarProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  const modelOptions = [
    {
      id: 'v2',
      href: '/modelv2',
      label: 'Modelo V2 (Actual)',
      tag: '29 clases',
      details: 'Normalización integrada',
      icon: Cpu,
      isActive: pathname === '/' || pathname === '/modelv2',
    },
    {
      id: 'v1',
      href: '/modelv1',
      label: 'Modelo V1',
      tag: '28 clases',
      details: 'Normalización [-1, 1]',
      icon: Layers,
      isActive: pathname === '/modelv1',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Sidebar Panel sliding from left */}
      <div className="relative w-80 max-w-[85vw] h-full bg-surface-container-high border-r border-outline text-on-surface p-6 flex flex-col justify-between z-10 shadow-2xl animate-[slideRight_0.25s_ease-out] overflow-y-auto">

        {/* Top Header */}
        <div>
          <div className="flex justify-between items-center pb-5 border-b border-outline">
            <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
              <span className="text-primary font-black">Endofile</span>AI
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container border border-outline/60 flex items-center justify-center text-on-surface-variant hover:text-primary transition-all cursor-pointer"
              aria-label="Cerrar menú"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-2">
            <button
              onClick={() => {
                onSelectNav?.('inicio');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all cursor-pointer border border-outline/40"
            >
              <Home size={18} className="text-primary" />
              <span>Visor Cámara</span>
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

          {/* Model Switcher Section (Subpages / Live Test) */}
          <div className="mt-6 pt-5 border-t border-outline/60">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-on-surface font-bold text-xs uppercase tracking-wider">
                <Cpu size={14} className="text-primary" />
                <span>Modelos IA</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-md font-semibold">
                Subpáginas
              </span>
            </div>

            <div className="space-y-2">
              {modelOptions.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <Link
                    key={opt.id}
                    href={opt.href}
                    onClick={onClose}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${
                      opt.isActive
                        ? 'bg-primary/15 border-primary/60 text-on-surface shadow-sm ring-1 ring-primary/40'
                        : 'bg-surface-container-lowest/40 hover:bg-surface-container border-outline/40 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl ${opt.isActive ? 'bg-primary/25 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-xs font-semibold truncate flex items-center gap-1.5">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/80 truncate">
                          {opt.details}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium ${
                        opt.isActive ? 'bg-primary/30 text-primary font-bold' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick tips Section */}
          <div className="mt-6 p-4 rounded-2xl bg-surface-container-lowest/60 border border-outline/60">
            <div className="flex items-center gap-2 mb-2 text-on-surface font-semibold text-xs uppercase tracking-wider">
              <Info size={14} className="text-on-primary-container" />
              <span>Consejos rápidos</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Posicione la lima de endodoncia centrada en el visor.
              Asegúrese de contar con un fondo blanco y buena nitidez para obtener la mejor clasificación.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 border-t border-outline flex justify-between items-center text-xs text-on-surface-variant">
          <span>Versión</span>
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded-md text-on-surface font-semibold">0.1.0</span>
        </div>
      </div>
    </div>
  );
}
