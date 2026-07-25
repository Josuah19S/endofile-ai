"use client";
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cameraStyles } from '../styles/camera-styles';
import { useCamera } from './camera-context';
import { useEndofileAi } from './endofile-model-context';

export default function CameraDetectionBadge() {
  const { resetDetection } = useCamera();
  const { limaDetected, isAnalyzing } = useEndofileAi();

  return (
    <div className={cameraStyles.infoOverlayContainer}>
      <div className={`${cameraStyles.infoCard} ${limaDetected ? 'border-primary/50 shadow-[0_10px_25px_rgba(0,0,0,0.15)]' : 'border-outline/80'}`}>
        <div className={`${cameraStyles.infoIconContainer} ${limaDetected ? 'bg-primary-container/30 text-on-primary-container border-primary-container/50' : 'bg-surface-variant text-on-surface-variant border-transparent'}`}>
          <CheckCircle size={14} className={limaDetected ? "animate-scale-in" : ""} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant leading-none mb-1">
            Detector de Limas
          </p>
          <p className={cameraStyles.infoText}>
            {isAnalyzing ? (
              <span className="text-on-surface-variant font-medium">Analizando lima...</span>
            ) : limaDetected ? (
              (() => {
                const parts = limaDetected.split('_');
                if (parts.length >= 2) {
                  const system = parts[0].replace(/-/g, ' ');
                  const fileRaw = parts.slice(1).join('_');

                  let orderStr: string | null = null;
                  let fileName = fileRaw.replace(/-/g, ' ');

                  if (fileRaw.includes('-')) {
                    const dashParts = fileRaw.split('-');
                    orderStr = `${dashParts[0]}°`;
                    fileName = dashParts.slice(1).join(' ').replace(/-/g, ' ');
                  }

                  return (
                    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-on-surface-variant font-normal">Lima detectada:</span>
                      <span className="text-xs font-medium text-on-surface-variant/80">{system}</span>
                      <span className="text-sm font-semibold text-on-surface">
                        {orderStr ? `${orderStr} ${fileName}` : fileName}
                      </span>
                    </span>
                  );
                }
                return (
                  <span>
                    <span className="text-on-surface-variant font-normal">Lima detectada:</span>{' '}
                    <span className="text-sm font-semibold text-on-surface">{limaDetected.replace(/-/g, ' ')}</span>
                  </span>
                );
              })()
            ) : (
              <span className="text-on-surface-variant/70 font-normal">Lima detectada: ---</span>
            )}
          </p>
        </div>
        {limaDetected && (
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
