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
      <div className={`${cameraStyles.infoCard} ${limaDetected ? 'border-on-primary-container/50 bg-primary/90' : 'border-primary/80'}`}>
        <div className={`${cameraStyles.infoIconContainer} ${limaDetected ? 'bg-on-primary-container/20 text-on-primary-container' : 'bg-primary text-slate-500 border-transparent'}`}>
          <CheckCircle size={14} className={limaDetected ? "animate-scale-in" : ""} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 leading-none mb-1">
            Detector de Limas
          </p>
          <p className={cameraStyles.infoText}>
            {isAnalyzing ? (
              "Analizando lima..."
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
                      <span className="text-slate-300 font-normal">Lima detectada:</span>
                      <span className="text-xs font-medium text-slate-400">{system}</span>
                      <span className="text-sm font-semibold text-slate-100">
                        {orderStr ? `${orderStr} ${fileName}` : fileName}
                      </span>
                    </span>
                  );
                }
                return (
                  <span>
                    <span className="text-slate-300 font-normal">Lima detectada:</span>{' '}
                    <span className="text-sm font-semibold text-slate-100">{limaDetected.replace(/-/g, ' ')}</span>
                  </span>
                );
              })()
            ) : (
              "Lima detectada: ---"
            )}
          </p>
        </div>
        {limaDetected && (
          <button
            onClick={resetDetection}
            className="text-xs text-slate-500 hover:text-slate-300 font-medium px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
