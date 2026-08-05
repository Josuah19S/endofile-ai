"use client";
import React from 'react';
import { CheckCircle, Camera, Focus, Moon, ZoomIn, HelpCircle } from 'lucide-react';
import { cameraStyles } from '../../styles/camera-styles';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi } from '../../contexts/endofile-model-context';

interface CameraDetectionBadgeProps {
  onOpenDetail?: (classId: string) => void;
}

/** Formats a model class id (`re-treaty_1-bully`) into display name (`1° Bully`). */
function formatClassName(classId: string): { system: string; orderAndName: string } | null {
  const parts = classId.split('_');
  if (parts.length < 2) return null;

  const system = parts[0].replace(/-/g, ' ');
  const fileRaw = parts.slice(1).join('_');

  let orderStr: string | null = null;
  let fileName = fileRaw.replace(/-/g, ' ');

  if (fileRaw.includes('-')) {
    const dashParts = fileRaw.split('-');
    orderStr = `${dashParts[0]}°`;
    fileName = dashParts.slice(1).join(' ').replace(/-/g, ' ');
  }

  return {
    system,
    orderAndName: orderStr ? `${orderStr} ${fileName}` : fileName,
  };
}

export default function CameraDetectionBadge({ onOpenDetail }: CameraDetectionBadgeProps) {
  const { resetDetection, validationResults, selectedPhotoUrl } = useCamera();
  const { limaDetected, isAnalyzing } = useEndofileAi();

  const isUnidentified = limaDetected === 'Lima no identificada';
  const hasValidationErrors = validationResults?.hasErrors;
  const blurError = validationResults?.blur.isBlurry;
  const darkError = validationResults?.dark.isDark;
  const tooFarError = validationResults?.tooFar.isTooFar;

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

        {(limaDetected || selectedPhotoUrl || hasValidationErrors) && (
          <button
            onClick={resetDetection}
            className="text-xs text-on-surface-variant hover:text-on-surface font-medium px-2.5 py-1 rounded-lg hover:bg-surface-variant/50 transition-colors cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
