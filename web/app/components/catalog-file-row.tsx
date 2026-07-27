"use client";
import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { CatalogEntry } from '../constants/endofile-dataset';

interface CatalogFileRowProps {
  entry: CatalogEntry;
  onClick: () => void;
}

export default function CatalogFileRow({ entry, onClick }: CatalogFileRowProps) {
  const { classId, info } = entry;

  // Fallback parsing for classes with no dictionary entry, mirroring the detail view
  const fileRaw = classId.split('_').slice(1).join('_');
  const dashParts = fileRaw.includes('-') ? fileRaw.split('-') : null;
  const fallbackName = (dashParts ? dashParts.slice(1).join(' ') : fileRaw).replace(/-/g, ' ');

  const fileName = info?.nombre || fallbackName || classId;
  const orderDisplay = info ? `${info.numero}°` : dashParts ? `${dashParts[0]}°` : null;

  // Single uniform line: same font, size and colour for every figure
  const specLine = info
    ? `ISO #${info.diametroApical} · ${(info.conicidad * 100).toFixed(0)} % · ${info.longitud} mm`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver ficha técnica de ${fileName}`}
      className="group w-full min-h-11 flex items-center gap-3 p-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest border border-outline hover:border-primary/50 shadow-sm hover:shadow-primary/10 text-left transition-all duration-200 cursor-pointer"
    >
      {orderDisplay && (
        <span className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-xl bg-primary-container/30 border border-primary-container/50 text-xs font-bold text-on-primary-container font-mono">
          {orderDisplay}
        </span>
      )}

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold tracking-tight text-on-surface truncate group-hover:text-on-primary-container transition-colors">
          {fileName}
        </span>
        <span className="mt-1 block text-[11px] font-medium tabular-nums text-on-surface-variant truncate">
          {specLine ?? 'Sin ficha técnica'}
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-on-surface-variant group-hover:text-on-surface transition-colors"
      />
    </button>
  );
}
