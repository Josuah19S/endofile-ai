"use client";
import { useState } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import { Menu, Zap, X, ListSortDescending, Upload, CheckCircle, RefreshCw, ArrowLeft, Maximize, Scan, History, ChevronDown } from 'lucide-react';
import NextImage from "next/image";
import Sidebar from './sidebar';
import EFileDetectionCard from './endofile-detection-card';
import { useEndofileAi } from './endofile-model-context';
import { useCamera } from './camera-context';

export default function CameraScreenShell() {
  const {
    videoRef,
    fileInputRef,
    cameraAvailable,
    selectedPhotoUrl,
    showFlashOverlay,
    showTapFocus,
    flashOn,
    videoDevices,
    handleViewportTap,
    toggleFlash,
    handleSwitchCamera,
    handleFileSelect,
    capturePhoto,
    resetDetection,
    setSelectedPhotoUrl,
  } = useCamera();

  const {
    modelStatus,
    limaDetected,
    isAnalyzing,
    scanHistoryItems,
  } = useEndofileAi();

  // Local UI Presentation Toggles
  const [controlsHidden, setControlsHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentsExpanded, setRecentsExpanded] = useState(false);

  return (
    <div className={cameraStyles.screenContainer}>
      {/* Hidden file input for uploading custom photos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Screen flash effect overlay */}
      {showFlashOverlay && (
        <div className="absolute inset-0 bg-white z-50 transition-opacity duration-75 pointer-events-none" />
      )}

      {/* Float Back to Live Camera button when viewing a static photo */}
      {selectedPhotoUrl && (
        <button
          type="button"
          onClick={() => setSelectedPhotoUrl(null)}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-xs font-semibold text-white shadow-lg cursor-pointer hover:bg-slate-900 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} /> Volver a Cámara
        </button>
      )}

      {/* Floating Restore Controls Button (displayed when controls are cleared/hidden) */}
      {controlsHidden && (
        <button
          type="button"
          className="
          absolute top-4 right-4 z-40 flex items-center justify-center
          w-12 h-12 rounded-2xl bg-surface/80 backdrop-blur-md border
          border-surface-variant text-white shadow-2xl hover:bg-surface-dim
          active:scale-95 transition-all cursor-pointer"
          onClick={() => setControlsHidden(false)}
          aria-label="Mostrar controles"
          title="Mostrar controles"
        >
          <div className="relative flex items-center justify-center">
            <Maximize size={20} className="text-on-surface" />
            <ListSortDescending size={12} className="
              absolute text-on-surface bg-transparent rounded-full" />
          </div>
        </button>
      )}

      {/* Top Header Controls (Menu, Model Status, Clear Controls, Flash) */}
      {!controlsHidden && (
        <div className={cameraStyles.topHeader}>
          {/* Left Stack: Menu and Model Badge */}
          <div className={`${cameraStyles.leftControls} flex items-center gap-3`}>
            <button
              type="button"
              className={cameraStyles.iconButton}
              onClick={() => setSidebarOpen(true)}
              aria-label="Menú principal"
            >
              <Menu size={22} />
            </button>

            <div className={cameraStyles.statusBadge}>
              <span className={modelStatus === 'ready' ? cameraStyles.statusDot : "w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"} />
              <span>modelo: {modelStatus === 'ready' ? 'EndoX IA' : '---'}</span>
            </div>
          </div>

          {/* Right Stack: Clear Controls and Flash */}
          <div className={cameraStyles.rightControls}>
            <button
              type="button"
              className={cameraStyles.iconButton}
              onClick={() => setControlsHidden(true)}
              aria-label="Limpiar controles"
              title="Limpiar controles (Pantalla completa)"
            >
              <div className="relative flex items-center justify-center">
                <Maximize size={20} className="text-on-surface opacity-60" />
                <X size={12} className="absolute text-on-surface font-extrabold" />
              </div>
            </button>

            <button
              type="button"
              className={`${cameraStyles.iconButton} ${flashOn ? cameraStyles.flashActive : ""}`}
              onClick={toggleFlash}
              aria-label="Alternar flash"
              title="Alternar flash"
              disabled={!cameraAvailable}
            >
              <Zap size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Viewport / Cam Area */}
      <div
        className={`${cameraStyles.viewportArea} cursor-pointer`}
        onClick={handleViewportTap}
      >
        {selectedPhotoUrl ? (
          /* Show selected static endodontic file photo */
          <NextImage
            id="selected-file-preview"
            src={selectedPhotoUrl}
            fill
            className="object-cover animate-[fadeIn_0.3s_ease-out]"
            alt="Foto de la lima"
          />
        ) : cameraAvailable && (
          <video
            ref={videoRef}
            id="camera-preview"
            autoPlay
            playsInline
            muted
            className={cameraStyles.videoPreview}
          />
        )}

        {/* Tap to Focus square animation in middle of video tag */}
        {showTapFocus && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="w-24 h-24 border-2 border-on-primary-container rounded-2xl animate-[ping_0.8s_ease-out_1] flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.6)]">
              <div className="w-2.5 h-2.5 rounded-full bg-on-primary-container shadow-[0_0_8px_#60a5fa]" />
            </div>
          </div>
        )}

        {/* Focus square frame overlay */}
        <div className={cameraStyles.focusFrameContainer}>
          <div className={`${cameraStyles.focusSquare} ${isAnalyzing ? 'border-on-primary-container/30' : ''}`}>
            {/* Corner Markers */}
            <div className={`${cameraStyles.focusCornerTL} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerTR} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerBL} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerBR} ${isAnalyzing ? 'border-on-primary-container' : 'border-white'}`} />

            {/* Center target dot */}
            <div className={`${cameraStyles.focusCenterDot} ${isAnalyzing ? 'bg-on-primary-container scale-150 animate-ping' : ''}`} />

            {/* Pulsing scanning overlay during analysis */}
            {isAnalyzing && (
              <div className="absolute inset-x-2 h-1 bg-linear-to-r from-transparent via-on-primary-container to-transparent animate-pan-vertical" />
            )}
          </div>
        </div>
      </div>

      {/* Info Card Overlay (Lima detectada) */}
      {!controlsHidden && (
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
      )}

      {/* Solid Dark Action Bar / Expandable Recents Drawer */}
      {!controlsHidden && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline transition-all duration-300 ease-in-out flex flex-col justify-between ${recentsExpanded ? 'h-[65vh] max-h-[70vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' : 'h-24'
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
      )}

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
