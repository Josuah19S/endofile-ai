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
    <div className="relative w-full h-screen h-dvh bg-[#f8fafc] text-black select-none overflow-hidden flex flex-col items-center justify-end">
      {/* 1. Fullscreen Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <NextImage
          src="/elements/bg_permission.jpg"
          alt="Fondo Clínica Endodoncia"
          fill
          className="object-cover object-center opacity-85 brightness-95"
          priority
        />
      </div>

      {/* 2. AI Robot Pinned to Ground (Bottom Stretched) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-full h-[80vh] md:h-[85vh] flex items-end justify-center pointer-events-none overflow-hidden">
        <div className="relative w-full h-full max-w-5xl flex items-end justify-center">
          <NextImage
            src="/elements/ai-nobg.png"
            alt="Endofile AI Robot"
            fill
            className="object-contain object-bottom scale-[1.35] sm:scale-150 md:scale-100 origin-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            priority
          />
        </div>
      </div>

      {/* 3. Superimposed Content Stack (Title placed just above description & button label) */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-end pb-8 px-4 md:pb-12 max-w-2xl mx-auto text-center pointer-events-auto">
        <div className="w-full flex flex-col items-center max-w-lg space-y-4">

          {/* Title & Subtitle Stack Just Above Button */}
          <div className="flex flex-col items-center mb-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#22adfa] tracking-wider font-headline uppercase drop-shadow-md">
              ENDOFILE AI
            </h1>
            <span className="text-black font-extrabold text-xs sm:text-sm md:text-base tracking-tight -mt-0.5">
              smart endo file recognition
            </span>
          </div>

          {status === 'idle' && (
            <>
              {/* Description Paragraph */}
              <p className="text-black font-semibold text-sm sm:text-base md:text-lg leading-snug px-4 drop-shadow-sm max-w-md">
                Por favor, habilite el acceso a la cámara para escanear y poder identificar la lima en tiempo real
              </p>

              {/* Pill-shaped Activation Button with tap-here.gif overlay */}
              <div className="relative w-full max-w-xs sm:max-w-sm flex justify-center mt-1">
                <button
                  type="button"
                  onClick={handleRequestCamera}
                  className="w-full py-3.5 px-6 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-white font-extrabold tracking-wider uppercase text-sm sm:text-base shadow-xl shadow-sky-400/40 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-white/40"
                >
                  <span>ACTIVAR CÁMARA</span>
                  <Camera className="w-5 h-5 shrink-0" />
                </button>

                {/* Animated Tap/Click Gesture GIF Superimposed Over Button */}
                <div className="absolute right-2 sm:right-6 -top-5 sm:-top-6 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-30">
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
              <div className="w-10 h-10 border-4 border-sky-200 border-t-[#38bdf8] rounded-full animate-spin" />
              <p className="text-black font-extrabold text-xs tracking-widest uppercase animate-pulse">
                Solicitando permiso de cámara...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 px-4">
              <p className="text-red-600 font-semibold text-xs sm:text-sm bg-white/90 p-3 rounded-2xl shadow-md border border-red-200">
                {errorMsg}
              </p>

              <button
                type="button"
                onClick={handleRequestCamera}
                className="py-3 px-8 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-white font-extrabold tracking-wider uppercase text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
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
