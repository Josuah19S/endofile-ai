"use client";
import React from 'react';
import NextImage from 'next/image';
import { FileText, ListChecks } from 'lucide-react';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi, TopPrediction } from '../../contexts/endofile-model-context';
import { formatClassName } from '../../lib/format-class-name';
import { getFilePhoto } from '../../constants/endofile-photos';

interface AlternativeCardProps {
  pred: TopPrediction;
  onPick: (classId: string) => void;
}

/**
 * One alternative-prediction card. Renders the catalog reference photo (when
 * the dataset has one) plus the class label and the model's confidence.
 * Tapping it runs `onPick`, which the parent uses to lock the pick in and
 * collapse the drawer back to the idle camera.
 */
function AlternativeCard({ pred, onPick }: AlternativeCardProps) {
  const formatted = formatClassName(pred.classId);
  const photo = getFilePhoto(pred.classId);
  const fullName = formatted?.orderAndName ?? pred.classId;
  const system = formatted?.system ?? '';

  return (
    <button
      type="button"
      onClick={() => onPick(pred.classId)}
      className="group flex flex-col gap-1.5 p-2 rounded-2xl bg-surface-container border border-outline text-on-surface text-left hover:bg-primary/15 hover:border-primary/60 active:scale-[0.98] transition-all cursor-pointer shadow-sm min-w-0"
      aria-label={`Confirmar ${fullName}`}
      title={`Confirmar ${fullName}`}
    >
      <div className="relative w-full aspect-[420/125] rounded-xl overflow-hidden bg-surface-container-lowest border border-outline/60 shrink-0">
        {photo ? (
          <NextImage
            src={photo.src}
            alt={`Fotografía de referencia de ${fullName}`}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 640px) 200px, 40vw"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
            <FileText size={28} aria-hidden />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col items-start gap-0 min-w-0 w-full">
        <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant truncate w-full">
          {system || 'Sistema'}
        </span>
        <span className="text-xs font-semibold leading-tight truncate w-full">
          {fullName}
        </span>
      </div>
      {/*
      <span className="text-[10px] tabular-nums font-bold text-primary self-end">
        {(pred.confidence * 100).toFixed(0)}%
      </span>
      */}
    </button>
  );
}

interface AlternativesViewProps {
  /** Called after the doctor picks one. Used by the shell to close the drawer. */
  onPicked?: () => void;
}

/**
 * Drawer view that lists the next-best predictions after the main one shown in
 * the badge. Reached via the "Otras alternativas" button in the badge, so this
 * view is only ever shown while `pendingConfirmation` is true.
 */
export default function AlternativesView({ onPicked }: AlternativesViewProps) {
  const { topPredictions, limaDetected } = useEndofileAi();
  const { lockInDetection } = useCamera();

  // Skip the main prediction (it lives in the badge) and the synthetic
  // "Lima no identificada" sentinel. Capped at four so the grid stays tidy.
  const alternatives = topPredictions
    .filter((p) => p.classId !== limaDetected && p.classId !== 'Lima no identificada')
    .slice(0, 4);

  const handlePick = (classId: string) => {
    lockInDetection(classId);
    onPicked?.();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-primary" />
            <h3 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">
              Otras alternativas
            </h3>
          </div>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-on-surface-variant/80">
            {alternatives.length} {alternatives.length === 1 ? 'opción' : 'opciones'}
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-on-surface-variant px-1">
          Si la primera detección no coincide con la lima fotografiada, elija una de las
          siguientes opciones. Si ninguna es correcta, cierre el panel y tome otra foto.
        </p>

        {alternatives.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {alternatives.map((pred) => (
              <AlternativeCard key={pred.classId} pred={pred} onPick={handlePick} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant text-center">
            <p className="text-sm font-medium">No hay alternativas disponibles.</p>
            <span className="text-xs text-on-surface-variant/80 mt-1">Cierre el panel y tome otra foto.</span>
          </div>
        )}
      </div>
    </div>
  );
}