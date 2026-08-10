"use client";
import React from 'react';
import { CheckCircle, Camera, Focus, Moon, ZoomIn, HelpCircle, Check, ListChecks } from 'lucide-react';
import { cameraStyles } from '../../styles/camera-styles';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi } from '../../contexts/endofile-model-context';
import { formatClassName } from '../../lib/format-class-name';

interface CameraDetectionBadgeProps {
  onOpenDetail?: (classId: string) => void;
  /**
   * Open the alternatives drawer — wired up to the camera-screen-shell so the
   * bottom bar grows to display the next-best candidates.
   */
  onOpenAlternatives?: () => void;
}

export default function CameraDetectionBadge({ onOpenDetail, onOpenAlternatives }: CameraDetectionBadgeProps) {
  const { validationResults, selectedPhotoUrl, lockInDetection } = useCamera();
  const { limaDetected, isAnalyzing, pendingConfirmation } = useEndofileAi();

  const isUnidentified = limaDetected === 'Lima no identificada';
  const hasValidationErrors = validationResults?.hasErrors;
  const blurError = validationResults?.blur.isBlurry;
  const darkError = validationResults?.dark.isDark;

  const hasMatch = limaDetected && !isUnidentified;
  const predictedName = hasMatch ? formatClassName(limaDetected!) : null;

  return (
    <div className={cameraStyles.infoOverlayContainer}>
      <div
        className={`${cameraStyles.infoCard} ${
          hasMatch
            ? 'border-primary/50 shadow-[0_10px_25px_rgba(0,0,0,0.15)] cursor-pointer hover:border-primary'
            : isUnidentified || hasValidationErrors
            ? 'border-amber-500/60 bg-surface-container-low shadow-[0_10px_25px_rgba(245,158,11,0.15)]'
            : 'border-outline/80'
        }`}
      >
        {/* State Icon */}
        <div
          className={`${cameraStyles.infoIconContainer} ${
            hasMatch
              ? 'bg-primary-container/30 text-on-primary-container border-primary-container/50'
              : isUnidentified || hasValidationErrors
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}
        >
          {isAnalyzing ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isUnidentified ? (
            <HelpCircle size={14} className="animate-pulse text-amber-400" />
          ) : hasMatch ? (
            <CheckCircle size={14} className="animate-scale-in" />
          ) : hasValidationErrors ? (
            blurError ? (
              <Focus size={14} className="animate-pulse" />
            ) : darkError ? (
              <Moon size={14} />
            ) : (
              <ZoomIn size={14} />
            )
          ) : (
            <Camera size={14} />
          )}
        </div>

        {/* Text Content */}
        <div
          className="flex-1 min-w-0"
          onClick={() => {
            if (hasMatch && onOpenDetail) {
              onOpenDetail(limaDetected!);
            }
          }}
        >
          <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant leading-none mb-1">
            {isUnidentified || hasValidationErrors ? 'Validación de Imagen' : 'Detector de Limas'}
          </p>
          <p className={cameraStyles.infoText}>
            {isAnalyzing ? (
              <span className="text-on-surface-variant font-medium">Analizando lima...</span>
            ) : isUnidentified ? (
              <span className="text-amber-300 font-semibold text-xs">
                Lima no identificada. Intente enfocar la lima nuevamente.
              </span>
            ) : hasValidationErrors ? (
              <span className="text-amber-300 font-medium text-xs">
                {blurError
                  ? 'Imagen desenfocada. Mantenga la cámara firme.'
                  : darkError
                  ? 'Imagen muy oscura. Encienda la luz o el flash.'
                  : 'Lima muy lejos. Acerque la cámara a la lima.'}
              </span>
            ) : hasMatch && predictedName ? (
              <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-on-surface-variant font-normal">Lima detectada:</span>
                <span className="text-xs font-medium text-on-surface-variant/80">{predictedName.system}</span>
                <span className="text-sm font-semibold text-on-surface">{predictedName.orderAndName}</span>
              </span>
            ) : hasMatch && limaDetected ? (
              <span>
                <span className="text-on-surface-variant font-normal">Lima detectada:</span>{' '}
                <span className="text-sm font-semibold text-on-surface">{limaDetected.replace(/-/g, ' ')}</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                Lista para tomar foto
              </span>
            )}
          </p>
        </div>

        {/*
          Confirmation affordances — appear while the model has a pending pick.
          Two side-by-side buttons: "Confirmar" locks in the main prediction
          shown in the badge; "Otras alternativas" opens the drawer so the
          doctor can pick a different candidate when the model's top guess
          is wrong (feat/transition-detector-helper).
        */}
        {pendingConfirmation && hasMatch && (
          <div className="shrink-0 flex items-center gap-1.5">
            {onOpenAlternatives && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAlternatives();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline text-on-surface text-xs font-semibold hover:bg-surface-container-highest active:scale-95 transition-all cursor-pointer"
                aria-label="Ver otras alternativas"
                title="Ver otras alternativas"
              >
                <ListChecks size={14} />
                Otras alternativas
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                lockInDetection(limaDetected!);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              aria-label="Confirmar identificación"
              title="Confirmar esta identificación"
            >
              <Check size={14} />
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}