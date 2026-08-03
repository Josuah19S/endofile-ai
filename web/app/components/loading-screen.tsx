"use client";
import React, { useState } from 'react';
import NextImage from 'next/image';
import { loadingStyles } from '../styles/loading-styles';

interface LoadingScreenProps {
  onPermissionGranted: (stream: MediaStream) => void;
}

export default function LoadingScreen({ onPermissionGranted }: LoadingScreenProps) {
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
    } catch (err) {
      console.error("Camera permission error:", err);
      setStatus('error');

      // getUserMedia rejects with a DOMException whose `name` identifies the failure
      const errorName = err instanceof DOMException ? err.name : '';

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setErrorMsg("Permiso denegado. Habilite el acceso a la cámara en la configuración del navegador.");
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setErrorMsg("No se detectó ninguna cámara en este dispositivo.");
      } else {
        setErrorMsg("Error al acceder a la cámara. Intente de nuevo o use el simulador.");
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-on-surface p-6 select-none overflow-hidden">
      {/* Background Image (16:9, centered horizontally for mobile) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <NextImage
          src="/elements/bg_permission.jpg"
          alt="Fondo de Clínica Endodóntica"
          fill
          className="object-cover object-center opacity-40 brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 backdrop-blur-[2px]" />
      </div>

      <div className={`${loadingStyles.contentWrapper} relative z-10`}>
        {/* AI Robot Hero Illustration */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <NextImage
            src="/elements/ai-nobg.png"
            alt="Endofile AI Robot"
            width={240}
            height={240}
            className="object-contain relative z-10 drop-shadow-[0_12px_24px_rgba(34,173,250,0.35)] animate-fade-in"
            priority
          />
        </div>
        
        {/* Title */}
        <h1 className={loadingStyles.brandTitle}>
          <span className="text-primary font-black">Endofile</span> AI
        </h1>

        {/* Request permission button */}
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
          </>
        )}
      </div>
    </div>
  );
}
