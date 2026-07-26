"use client";
import React from 'react';
import { History } from 'lucide-react';
import EFileDetectionCard from './efile-detection-card';
import { useEndofileAi } from './endofile-model-context';

interface RecentDetectionsViewProps {
  onSelectCard?: (classId: string, photoUrl?: string | null) => void;
}

export default function RecentDetectionsView({ onSelectCard }: RecentDetectionsViewProps) {
  const { scanHistoryItems } = useEndofileAi();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">
            Detecciones Recientes ({scanHistoryItems.length})
          </h3>
        </div>

        {scanHistoryItems.length > 0 ? (
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
