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
    <div className="relative w-full h-screen h-dvh bg-background text-on-surface select-none overflow-hidden flex items-center justify-center">
      {/* Background Image (16:9, centered horizontally for mobile, increased visibility) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <NextImage
          src="/elements/bg_permission.jpg"
          alt="Fondo de Clínica Endodóntica"
          fill
          className="object-cover object-center opacity-65 brightness-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background/80" />
      </div>

      {/* AI Robot Pinned to Bottom, Centered Horizontally (Stretched to occupy 65-70% of screen height) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-full h-[70vh] md:h-[75vh] max-h-[800px] flex items-end justify-center pointer-events-none overflow-hidden">
        {/* Soft Cyan Ambient Radial Glow */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />

        <div className="relative w-full h-full max-w-4xl flex items-end justify-center">
          <NextImage
            src="/elements/ai-nobg.png"
            alt="Endofile AI Robot"
            fill
            className="object-contain object-bottom scale-[1.55] sm:scale-[1.35] md:scale-[1.2] origin-bottom drop-shadow-[0_20px_40px_rgba(34,173,250,0.5)] animate-fade-in"
            priority
          />
        </div>
      </div>

      {/* Superimposed Floating Glass Card (Permission Request Prompt Overlaid Directly on Robot) */}
      <div className="relative z-20 w-full max-w-sm mx-4 p-6 rounded-3xl bg-surface-container-low/80 backdrop-blur-xs border border-outline/70 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col items-center text-center my-auto">
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">
          <span className="text-primary font-black">Endofile</span> AI
        </h1>
        <span className='text-primary text-xs mb-3'>Smart endodontic file recognition</span>

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
          <div className="flex flex-col items-center my-4">
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
