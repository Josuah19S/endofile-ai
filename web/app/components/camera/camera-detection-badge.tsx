"use client";
import React from 'react';
import { CheckCircle, Camera, Focus, Moon, ZoomIn, HelpCircle, ArrowRight, ListChecks, AlertTriangle } from 'lucide-react';
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
  const { validationResults, selectedPhotoUrl, resetDetection } = useCamera();
  const { limaDetected, isAnalyzing, pendingConfirmation } = useEndofileAi();

  const isPictureTaken = Boolean(selectedPhotoUrl);
  const isUnidentified = limaDetected === 'Lima no identificada';
  const hasValidationErrors = validationResults?.hasErrors;
  const blurError = validationResults?.blur.isBlurry;
  const darkError = validationResults?.dark.isDark;

  const hasMatch = Boolean(limaDetected && !isUnidentified);
  const predictedName = hasMatch ? formatClassName(limaDetected!) : null;

  return (
    <div className={cameraStyles.infoOverlayContainer}>
      <div
        className={`${cameraStyles.infoCard} ${hasMatch
            ? 'border-primary/50 shadow-[0_10px_25px_rgba(0,0,0,0.15)] cursor-pointer hover:border-primary'
            : isUnidentified || (!isPictureTaken && hasValidationErrors)
              ? 'border-amber-500/60 bg-surface-container-low shadow-[0_10px_25px_rgba(245,158,11,0.15)]'
              : 'border-outline/80'
          }`}
      >
        {/* State Icon */}
        <div
          className={`${cameraStyles.infoIconContainer} ${hasMatch
              ? 'bg-primary-container/30 text-on-primary-container border-primary-container/50'
              : isUnidentified || (!isPictureTaken && hasValidationErrors)
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
        >
          {isAnalyzing ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : hasMatch ? (
            <CheckCircle size={14} className="animate-scale-in" />
          ) : isUnidentified ? (
            <HelpCircle size={14} className="animate-pulse text-amber-400" />
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
            {!isPictureTaken && hasValidationErrors ? 'Validación de Imagen' : 'Detector de Limas'}
          </p>
          <div className={cameraStyles.infoText}>
            {isAnalyzing ? (
              <span className="text-on-surface-variant font-medium text-xs">Analizando lima...</span>
            ) : hasMatch ? (
              <div className="flex flex-col">
                <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-on-surface-variant font-normal text-xs">Lima detectada:</span>
                  {predictedName ? (
                    <>
                      <span className="text-xs font-medium text-on-surface-variant/80">{predictedName.system}</span>
                      <span className="text-sm font-semibold text-on-surface">{predictedName.orderAndName}</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-on-surface">{limaDetected?.replace(/-/g, ' ')}</span>
                  )}
                </span>
                {/* Smaller warning message when the picture is taken and main result is shown */}
                {hasValidationErrors && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-amber-300 font-normal leading-tight">
                    <AlertTriangle size={11} className="shrink-0 text-amber-400" />
                    <span>
                      {blurError
                        ? 'Imagen desenfocada'
                        : darkError
                          ? 'Poca iluminación'
                          : 'Lima muy lejos'}
                    </span>
                  </span>
                )}
              </div>
            ) : isUnidentified ? (
              <div className="flex flex-col">
                <span className="text-amber-300 font-semibold text-xs">
                  Lima no identificada. Intente enfocar la lima nuevamente.
                </span>
                {hasValidationErrors && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-amber-200/80 font-normal leading-tight">
                    <AlertTriangle size={11} className="shrink-0 text-amber-400" />
                    <span>
                      {blurError
                        ? 'Posible causa: imagen desenfocada'
                        : darkError
                          ? 'Posible causa: poca iluminación'
                          : 'Posible causa: lima muy lejos'}
                    </span>
                  </span>
                )}
              </div>
            ) : hasValidationErrors ? (
              <span className="text-amber-300 font-medium text-xs">
                {blurError
                  ? 'Imagen desenfocada. Mantenga la cámara firme.'
                  : darkError
                    ? 'Imagen muy oscura. Encienda la luz o el flash.'
                    : 'Lima muy lejos. Acerque la cámara a la lima.'}
              </span>
            ) : (
              <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                Lista para tomar foto
              </span>
            )}
          </div>
        </div>

        {/*
          Disambiguation affordances — appear while the model has a pending pick.
          Two side-by-side buttons:
            - "Otras alternativas" opens the drawer so the doctor can pick a
              different candidate when the model's top guess is wrong.
            - "Continuar" is just "move on" — clears the camera back to the
              live stream so the doctor can take the next shot. Persisting
              the current pick (or not) is handled in the drawer and in
              history-store; the badge only owns the dismissal gesture.
        */}
        {pendingConfirmation && hasMatch ? (
          <div className="shrink-0 flex flex-col items-center gap-1.5">
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
                resetDetection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              aria-label="Continuar"
              title="Continuar — descartar la captura y volver a la cámara en vivo"
            >
              <ArrowRight size={14} />
              Continuar
            </button>
          </div>
        ) : isPictureTaken && !isAnalyzing ? (
          <div className="shrink-0 flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetDetection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline text-on-surface text-xs font-semibold hover:bg-surface-container-highest active:scale-95 transition-all cursor-pointer"
              aria-label="Reintentar"
              title="Tomar otra foto"
            >
              <ArrowRight size={14} />
              Reintentar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
