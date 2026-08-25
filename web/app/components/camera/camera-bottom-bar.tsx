"use client";
import React from 'react';
import { Upload, RefreshCw, Image, ChevronDown, RotateCcw } from 'lucide-react';
import { cameraStyles } from '../../styles/camera-styles';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi } from '../../contexts/endofile-model-context';

interface CameraBottomBarProps {
  expanded: boolean;
  /** Catalog needs nearly the full screen; other drawer views keep the shorter default height. */
  fullHeight?: boolean;
  controlsHidden?: boolean;
  onClose: () => void;
  onOpenRecents: () => void;
  children?: React.ReactNode;
}

/**
 * Standard bottom action bar. When the camera-screen-shell has an active drawer
 * view it renders the view (recents / catalog / detail / alternatives) inside
 * `children` and grows the bar to roughly two-thirds of the viewport. When no
 * drawer is open the bar is the compact h-24 strip with upload, shutter,
 * recents and switch-camera controls.
 */
export default function CameraBottomBar({
  expanded,
  fullHeight = false,
  controlsHidden = false,
  onClose,
  onOpenRecents,
  children,
}: CameraBottomBarProps) {
  const {
    fileInputRef,
    selectedPhotoUrl,
    videoDevices,
    handleSwitchCamera,
    capturePhoto,
    resetDetection,
  } = useCamera();

  const {
    modelStatus,
    isAnalyzing,
  } = useEndofileAi();

  return (
    <>
      {/* Dimmed backdrop when drawer is expanded to allow closing by clicking outside */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 transition-opacity animate-[fadeIn_0.2s_ease-out]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline transition-all duration-300 ease-in-out flex flex-col justify-between ${
          expanded
            ? fullHeight
              ? 'h-[calc(100%-4.5rem)] max-h-[calc(100%-4.5rem)] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-40'
              : 'h-[65%] max-h-[70%] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-40'
            : 'h-24 min-h-[5.5rem] z-30'
        }`}
      >
      {expanded ? (
        /* Expanded Drawer Container holding children views */
        <div className="flex flex-col h-full overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
          {/* Collapse Chevron Button at Top Center */}
          <div className="flex justify-center pt-3 pb-2 border-b border-outline/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Cerrar panel"
              title="Cerrar panel"
            >
              <ChevronDown size={28} />
            </button>
          </div>

          {/* Drawer Children Content */}
          {children}
        </div>
      ) : (
        /* Standard Compact Action Bar */
        <div className="flex items-center justify-around h-full px-4 sm:px-6 max-w-xl mx-auto w-full pb-[env(safe-area-inset-bottom,0px)]">
          {/* Left: Upload image (hidden when controlsHidden) */}
          {!controlsHidden ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cameraStyles.iconButton}
              aria-label="Subir foto de lima"
              title="Cargar foto de lima local"
            >
              <Upload size={20} />
            </button>
          ) : (
            <div className="w-12 h-12" />
          )}

          {/* Center: Shutter trigger - always visible */}
          <button
            type="button"
            onClick={selectedPhotoUrl ? resetDetection : capturePhoto}
            className={cameraStyles.shutterOuterRing}
            aria-label={selectedPhotoUrl ? "Volver a la cámara en vivo" : "Capturar foto de lima"}
            disabled={isAnalyzing || modelStatus === 'loading'}
          >
            <div className={isAnalyzing ? cameraStyles.shutterInnerCircleLoading : cameraStyles.shutterInnerCircle}>
              {selectedPhotoUrl && (
                <RotateCcw className={cameraStyles.shutterReloadIcon} />
              )}
            </div>
          </button>

          {/* Right: Recents button or Camera Switch (hidden when controlsHidden) */}
          {!controlsHidden ? (
            <div className="flex items-center gap-2">
              {videoDevices.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className={cameraStyles.iconButton}
                  aria-label="Cambiar cámara"
                  title="Cambiar lente de cámara"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenRecents}
                className={cameraStyles.iconButton}
                aria-label="Detecciones recientes"
                title="Ver detecciones recientes"
              >
                <Image size={20} />
              </button>
            </div>
          ) : (
            <div className="w-12 h-12" />
          )}
        </div>
      )}
    </div>
  </>
);
}