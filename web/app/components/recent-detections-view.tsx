"use client";
import React from 'react';
import { History, Loader2, Trash2, TriangleAlert } from 'lucide-react';
import EFileDetectionCard from './efile-detection-card';
import { useEndofileAi } from './endofile-model-context';

interface RecentDetectionsViewProps {
  onSelectCard?: (classId: string, photoUrl?: string | null) => void;
}

export default function RecentDetectionsView({ onSelectCard }: RecentDetectionsViewProps) {
  const { scanHistoryItems, clearHistory, historyHydrated, historyPersisted } = useEndofileAi();

  const handleClearHistory = () => {
    const confirmed = window.confirm(
      'Se eliminarán todas las detecciones guardadas y sus fotos de este dispositivo. Esta acción no se puede deshacer.'
    );
    if (confirmed) {
      void clearHistory();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <h3 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">
            Detecciones Recientes ({scanHistoryItems.length})
          </h3>

          {scanHistoryItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              aria-label="Borrar todo el historial de detecciones"
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-outline/60 text-[11px] font-medium text-on-surface-variant hover:text-on-error-container hover:border-error/50 hover:bg-error-container/20 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Borrar historial
            </button>
          )}
        </div>

        {/* Storage unavailable: the session still works, it just will not survive a reload */}
        {historyHydrated && !historyPersisted && (
          <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-xl border border-outline/60 bg-surface-container-high/60">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-on-surface-variant" />
            <span className="text-[11px] text-on-surface-variant">
              Este navegador no permite guardar el historial, así que se perderá al cerrar la aplicación.
            </span>
          </div>
        )}

        {!historyHydrated ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant text-center">
            <Loader2 size={28} className="mb-3 animate-spin opacity-70" />
            <span className="text-xs text-on-surface-variant/80">Cargando historial…</span>
          </div>
        ) : scanHistoryItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {scanHistoryItems.map((scan) => (
              <EFileDetectionCard
                key={scan.id}
                classId={scan.classId}
                photoUrl={scan.photoUrl}
                timestamp={scan.timestamp}
                onClick={() => onSelectCard?.(scan.classId, scan.photoUrl)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant text-center">
            <History size={40} className="mb-3 opacity-60" />
            <p className="text-sm font-medium text-on-surface-variant">No hay detecciones recientes todavía.</p>
            <span className="text-xs text-on-surface-variant/80 mt-1">Tome una foto de lima para ver los resultados aquí.</span>
          </div>
        )}
      </div>
    </div>
  );
}
