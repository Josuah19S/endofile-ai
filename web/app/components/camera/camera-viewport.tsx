"use client";
import React, { useRef, useState } from 'react';
import NextImage from 'next/image';
import { Scan } from 'lucide-react';
import { cameraStyles } from '../../styles/camera-styles';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi } from '../../contexts/endofile-model-context';

export default function CameraViewport() {
  const {
    videoRef,
    cameraAvailable,
    selectedPhotoUrl,
    showTapFocus,
    handleViewportTap,
    isCameraPaused,
    zoom,
    minZoom,
    maxZoom,
    stepZoom,
    hasHardwareZoom,
    applyZoom,
  } = useCamera();

  const { isAnalyzing } = useEndofileAi();
  const [showSlider, setShowSlider] = useState(false);

  // Pinch-to-zoom touch handlers
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartZoom.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      const targetZoom = Math.round(touchStartZoom.current * factor * 10) / 10;
      applyZoom(targetZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
  };

  const zoomPresets = [1, 1.5, 2, 3].filter(z => z >= minZoom && z <= maxZoom);

  return (
    <div
      className={`${cameraStyles.viewportArea} cursor-pointer`}
      onClick={handleViewportTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          style={
            !hasHardwareZoom && zoom > 1
              ? {
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.1s ease-out',
                }
              : undefined
          }
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

      {/* Interactive Zoom Control Overlay (Floating at bottom of viewport) */}
      {!selectedPhotoUrl && cameraAvailable && !isCameraPaused && (
        <div
          className="absolute bottom-3 left-0 right-0 z-30 flex flex-col items-center gap-1.5 px-3 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Collapsible Slider */}
          {showSlider && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 shadow-xl animate-fade-in w-48">
              <span className="text-[10px] font-mono text-white/70 font-semibold">{minZoom}x</span>
              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step={stepZoom}
                value={zoom}
                onChange={(e) => applyZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-mono text-white/70 font-semibold">{maxZoom}x</span>
            </div>
          )}

          {/* Quick Preset Buttons & Active Zoom Pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg">
            {zoomPresets.map((preset) => {
              const isSelected = Math.abs(zoom - preset) < 0.1;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyZoom(preset)}
                  className={`w-7 h-7 rounded-full text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-[0_0_8px_#22adfa] scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label={`Zoom ${preset}x`}
                >
                  {preset}x
                </button>
              );
            })}

            {/* If current zoom is custom (not one of the presets), show current zoom pill */}
            {!zoomPresets.some((p) => Math.abs(zoom - p) < 0.1) && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-bold shadow-[0_0_8px_#22adfa]">
                {zoom.toFixed(1)}x
              </span>
            )}

            {/* Toggle fine slider */}
            <button
              type="button"
              onClick={() => setShowSlider(!showSlider)}
              className={`w-7 h-7 rounded-full text-[10px] font-mono transition-all flex items-center justify-center cursor-pointer border ${
                showSlider
                  ? 'bg-white/30 border-white text-white'
                  : 'border-white/20 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Ajustar barra de zoom"
              aria-label="Ajustar barra de zoom"
            >
              ···
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
