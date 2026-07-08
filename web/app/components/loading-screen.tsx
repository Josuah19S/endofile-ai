"use client";
import React, { useState } from 'react';
import { loadingStyles } from '../styles/loading-styles';
import { ToothIcon } from './icons';

interface LoadingScreenProps {
  onPermissionGranted: (stream: MediaStream) => void;
  onSimulatorMode: () => void;
}

export default function LoadingScreen({ onPermissionGranted, onSimulatorMode }: LoadingScreenProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestCamera = async () => {
    setStatus('requesting');
    setErrorMsg(null);

    const constraints = { 
      video: { 
        facingMode: 'environment', // Request back/rear camera on mobile
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      } 
    };

    try {
      // Explicitly trigger the browser's permission prompt
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      onPermissionGranted(stream);
    } catch (err: any) {
      console.error("Camera permission error:", err);
      setStatus('error');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg("Permiso denegado. Habilite el acceso a la cámara en la configuración del navegador.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg("No se detectó ninguna cámara en este dispositivo.");
      } else {
        setErrorMsg("Error al acceder a la cámara. Intente de nuevo o use el simulador.");
      }
    }
  };

  return (
    <div className={loadingStyles.screenContainer}>
      <div className={loadingStyles.contentWrapper}>
        
        {/* Brand Molar Icon */}
        <div className={loadingStyles.iconContainer}>
          <ToothIcon className={loadingStyles.toothIcon} />
        </div>
        
        {/* Title */}
        <h1 className={loadingStyles.brandTitle}>
          EndoScan AI
        </h1>

        {status === 'idle' && (
          <>
            <p className={loadingStyles.subtitleText}>
              Aplicación de asistencia endodóntica. Por favor, habilite el acceso a la cámara para escanear y medir limas en tiempo real.
            </p>
            
            <button
              type="button"
              onClick={handleRequestCamera}
              className={loadingStyles.actionButton}
            >
              Activar Cámara
            </button>
            
            <button
              type="button"
              onClick={onSimulatorMode}
              className={loadingStyles.secondaryButton}
            >
              Probar en Modo Simulador
            </button>
          </>
        )}

        {status === 'requesting' && (
          <div className="flex flex-col items-center mt-6">
            <div className={loadingStyles.spinnerContainer}>
              <div className={loadingStyles.spinnerRing}></div>
            </div>
            <p className={loadingStyles.loadingText}>
              Solicitando permiso...
            </p>
          </div>
        )}

        {status === 'error' && (
          <>
            <p className={loadingStyles.errorText}>
              {errorMsg}
            </p>
            
            <button
              type="button"
              onClick={handleRequestCamera}
              className={loadingStyles.actionButton}
            >
              Reintentar Permiso
            </button>

            <button
              type="button"
              onClick={onSimulatorMode}
              className={loadingStyles.secondaryButton}
            >
              Continuar con Simulador
            </button>
          </>
        )}
      </div>
    </div>
  );
}
