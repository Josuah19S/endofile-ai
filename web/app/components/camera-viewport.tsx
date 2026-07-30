"use client";
import React from 'react';
import NextImage from 'next/image';
import { Scan } from 'lucide-react';
import { cameraStyles } from '../styles/camera-styles';
import { useCamera } from './camera-context';
import { useEndofileAi } from './endofile-model-context';

export default function CameraViewport() {
  const {
    videoRef,
    cameraAvailable,
    selectedPhotoUrl,
    showTapFocus,
    handleViewportTap,
    isCameraPaused,
  } = useCamera();

  const { isAnalyzing } = useEndofileAi();

  return (
    <div
      className={`${cameraStyles.viewportArea} cursor-pointer`}
      onClick={handleViewportTap}
    >
      {isCameraPaused ? (
        /* Black screen when camera is paused */
        <div className="w-full h-full bg-black" />
      ) : selectedPhotoUrl ? (
        /* Static endodontic file photo preview */
        <NextImage
          id="selected-file-preview"
          src={selectedPhotoUrl}
          fill
          className="object-cover animate-[fadeIn_0.3s_ease-out]"
          alt="Foto de la lima"
        />
      ) : cameraAvailable ? (
        <video
          ref={videoRef}
          id="camera-preview"
          autoPlay
          playsInline
          muted
          className={cameraStyles.videoPreview}
        />
      ) : (
        /* Mock Viewfinder */
        <div className="relative w-full h-full flex items-center justify-center bg-surface-container-lowest overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[16px_16px]" />
          <div className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-on-primary-container to-transparent animate-[bounce_4s_infinite] opacity-40 top-1/4" />
          <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl border border-primary/20 bg-surface-container/40 backdrop-blur-sm">
            <Scan size={100} className="text-on-primary-container/20 animate-pulse" />
            <span className="text-xs text-on-surface-variant mt-4 tracking-wider text-center max-w-50">
              Simulador de cámara activo. Apunte a la lima de endodoncia.
            </span>
          </div>
        </div>
      )}

      {/* Tap to Focus square animation */}
      {showTapFocus && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-24 h-24 border-2 border-on-primary-container rounded-2xl animate-[ping_0.8s_ease-out_1] flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.6)]">
            <div className="w-2.5 h-2.5 rounded-full bg-on-primary-container shadow-[0_0_8px_#60a5fa]" />
          </div>
        </div>
      )}

      {/* Reticle square frame overlay */}
      <div className={cameraStyles.focusFrameContainer}>
        <div className={`${cameraStyles.focusSquare} ${isAnalyzing ? 'border-on-primary-container/30' : ''}`}>
          <div className={`${cameraStyles.focusCornerTL} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />
          <div className={`${cameraStyles.focusCornerTR} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />
          <div className={`${cameraStyles.focusCornerBL} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />
          <div className={`${cameraStyles.focusCornerBR} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />

          <div className={`${cameraStyles.focusCenterDot} ${isAnalyzing ? 'bg-on-primary-container scale-150 animate-ping' : ''}`} />

          {isAnalyzing && (
            <div className="absolute inset-x-2 h-1 bg-linear-to-r from-transparent via-on-primary-container to-transparent animate-pan-vertical" />
          )}
        </div>
      </div>
    </div>
  );
}
