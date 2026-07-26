"use client";
import React from 'react';
import { BookOpen } from 'lucide-react';

export default function FileCatalogView() {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">
            Catálogo de Limas
          </h3>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant text-center">
          <BookOpen size={44} className="mb-3 opacity-60 text-on-primary-container" />
          <p className="text-base font-semibold text-on-surface">Catálogo de Limas Endodónticas</p>
          <span className="text-xs text-on-surface-variant/80 mt-1 max-w-sm">
            Próximamente disponible. Aquí se mostrará la información completa y especificaciones técnicas de las limas.
          </span>
        </div>
      </div>
    </div>
  );
}
