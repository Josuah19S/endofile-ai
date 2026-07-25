"use client";
import React from 'react';
import { Upload, RefreshCw, History, ChevronDown } from 'lucide-react';
import { cameraStyles } from '../styles/camera-styles';
import EFileDetectionCard from './efile-detection-card';
import { useCamera } from './camera-context';
import { useEndofileAi } from './endofile-model-context';

interface CameraBottomBarProps {
  recentsExpanded: boolean;
  setRecentsExpanded: (expanded: boolean) => void;
}

export default function CameraBottomBar({
  recentsExpanded,
  setRecentsExpanded,
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
    scanHistoryItems,
  } = useEndofileAi();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline transition-all duration-300 ease-in-out flex flex-col justify-between ${
        recentsExpanded ? 'h-[65vh] max-h-[70vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' : 'h-24'
      }`}
    >
      {recentsExpanded ? (
        /* Expanded Drawer Content matching wireframe Recientes fotos.png */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Collapse Chevron Button at Top Center */}
          <div className="flex justify-center pt-3 pb-2 border-b border-outline/60 shrink-0">
            <button
              type="button"
              onClick={() => setRecentsExpanded(false)}
              className="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Cerrar recientes"
              title="Cerrar recientes"
            >
              <ChevronDown size={28} />
            </button>
          </div>

          {/* Scrollable Recents Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">
                  Detecciones Recientes ({scanHistoryItems.length})
                </h3>
              </div>

              {scanHistoryItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {scanHistoryItems.map((scan) => (
                    <EFileDetectionCard
                      key={scan.id}
                      classId={scan.classId}
                      photoUrl={scan.photoUrl}
                      timestamp={scan.timestamp}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant text-center">
                  <History size={40} className="mb-3 opacity-60" />
                  <p className="text-sm font-medium text-on-surface-variant">No hay detecciones recientes todavía.</p>
                  <span className="text-xs text-on-surface-variant/80 mt-1">Tome una foto de lima para ver los resultados aquí.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Compact Action Bar */
        <div className="flex items-center justify-around h-full px-6 max-w-xl mx-auto w-full">
          {/* Left: Upload image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cameraStyles.iconButton}
            aria-label="Subir foto de lima"
            title="Cargar foto de lima local"
          >
            <Upload size={20} />
          </button>

          {/* Center: Shutter trigger - captures frame or resets view */}
          <button
            type="button"
            onClick={selectedPhotoUrl ? resetDetection : capturePhoto}
            className={cameraStyles.shutterOuterRing}
            aria-label={selectedPhotoUrl ? "Volver a la cámara en vivo" : "Capturar foto de lima"}
            disabled={isAnalyzing || modelStatus === 'loading'}
          >
            <div className={isAnalyzing ? cameraStyles.shutterInnerCircleLoading : (selectedPhotoUrl ? "w-10 h-10 rounded-full bg-amber-500 scale-95 transition-all duration-300" : cameraStyles.shutterInnerCircle)} />
          </button>

          {/* Right: Recents button or Camera Switch */}
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
              onClick={() => setRecentsExpanded(true)}
              className={cameraStyles.iconButton}
              aria-label="Detecciones recientes"
              title="Ver detecciones recientes"
            >
              <History size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
