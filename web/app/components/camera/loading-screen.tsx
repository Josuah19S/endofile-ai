"use client";
import React, { useState } from 'react';
import NextImage from 'next/image';
import { Camera } from 'lucide-react';

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
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      onPermissionGranted(stream);
    } catch (err) {
      console.error("Camera permission error:", err);
      setStatus('error');
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
    <div className="relative w-full h-full min-h-0 bg-[#f8fafc] text-black select-none overflow-hidden flex flex-col items-center justify-end">
      {/* 1. Fullscreen Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <NextImage
          src="/elements/bg_permission.webp"
          alt="Fondo Clínica Endodoncia"
          fill
          className="object-cover object-center opacity-85 brightness-95"
          priority
        />
      </div>

      {/* 2. AI Robot Pinned to Ground (80% Page Height) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-full h-[80%] flex items-end justify-center pointer-events-none">
        <div className="relative w-full h-full max-w-5xl flex items-end justify-center">
          <NextImage
            src="/elements/ai_nobg.webp"
            alt="Endofile AI Robot"
            fill
            className="object-contain object-bottom scale-[3] sm:scale-[1.35] md:scale-[1.2] origin-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            priority
          />
        </div>
      </div>

      {/* 3. Page Bottom Fade (Theme-Aware Gradient) */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-1/2 z-[15] pointer-events-none"
        style={{ background: 'var(--token-page-fade)' }}
      />

      {/* 3. Superimposed Floating Glass Card (Containing Title, Subtitle, Description & Pill Button) */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-around pb-6 px-4 md:pb-10 max-w-2xl mx-auto text-center pointer-events-auto">
        {/* Title & Subtitle Stack */}
        <div className="flex flex-col items-center mt-20 text-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          <h1 className="text-3xl sm:text-4xl font-black text-[#22adfa] tracking-wider font-headline uppercase drop-shadow-md">
            <span className="font-normal text-on-surface">ENDOFILE</span> AI
          </h1>
          <span className="text-on-surface font-extrabold text-xs sm:text-sm tracking-tight -mt-0.5">
            smart endo file recognition
          </span>
        </div>

        <div className="h-1/3"></div>

        {/* rounded-3xl bg-surface-container-low/85 backdrop-blur-lg border border-outline/70 shadow-[0_20px_50px_rgba(0,0,0,0.6)] */}
        <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-7 flex flex-col items-center text-center space-y-4">
          {status === 'idle' && (
            <>
              {/* Description Paragraph */}
              <p className="text-on-surface-variant font-medium text-xs sm:text-sm leading-relaxed max-w-xs">
                Por favor, habilite el acceso a la cámara para escanear y poder identificar la lima en tiempo real
              </p>

              {/* Pill-shaped Activation Button with tap-here.gif overlay */}
              <div className="relative w-full max-w-xs flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleRequestCamera}
                  className="w-full py-3.5 px-6 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-white font-extrabold tracking-wider uppercase text-xs sm:text-sm shadow-xl shadow-sky-400/40 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-white/40"
                >
                  <span>ACTIVAR CÁMARA</span>
                  <Camera className="w-4 h-4 shrink-0" />
                </button>

                {/* Animated Tap/Click Gesture GIF Superimposed Over Button */}
                <div className="absolute right-1 sm:right-3 +top-2 w-20 h-20 sm:w-22 sm:h-22 pointer-events-none z-30">
                  <NextImage
                    src="/elements/tap-here.gif"
                    alt="Animación toque botón"
                    fill
                    className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                    unoptimized
                  />
                </div>
              </div>
            </>
          )}

          {status === 'requesting' && (
            <div className="flex flex-col items-center py-4 space-y-3">
              <div className="w-9 h-9 border-4 border-sky-200 border-t-[#38bdf8] rounded-full animate-spin" />
              <p className="text-on-surface-variant font-extrabold text-xs tracking-widest uppercase animate-pulse">
                Solicitando permiso de cámara...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-3 px-2">
              <p className="text-error font-semibold text-xs bg-error-container/40 p-3 rounded-2xl border border-error/30">
                {errorMsg}
              </p>

              <button
                type="button"
                onClick={handleRequestCamera}
                className="py-3 px-6 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-white font-extrabold tracking-wider uppercase text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Reintentar Permiso
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
