"use client";
import React, { useState } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import { Menu, Zap, X, ListSortDescending, Upload, CheckCircle, RefreshCw, ArrowLeft, Maximize, Scan, History, ChevronDown } from 'lucide-react';
import NextImage from "next/image";
import Sidebar from './sidebar';
import EFileDetectionCard from './efile-detection-card';
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
          className="absolute top-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white shadow-2xl hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
          onClick={() => setControlsHidden(false)}
          aria-label="Mostrar controles"
          title="Mostrar controles"
        >
          <div className="relative flex items-center justify-center">
            <Maximize size={20} className="text-blue-400" />
            <ListSortDescending size={12} className="absolute -bottom-0.5 -right-0.5 text-blue-400 bg-slate-950 rounded-full" />
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
              <span className={modelStatus === 'ready' ? cameraStyles.statusDot : "w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"} />
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
                <Maximize size={20} className="text-slate-300 opacity-60" />
                <X size={14} className="absolute text-red-400 font-extrabold drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]" />
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
              <Zap size={22} />
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
          /* Premium Mock Viewfinder for previewing without physical hardware */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
            {/* Animated medical grid background */}
            <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[16px_16px]" />

            {/* Glowing scanline effect */}
            <div className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-[bounce_4s_infinite] opacity-40 top-1/4" />

            {/* Visual representation of tooth being scanned */}
            <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl border border-blue-500/10 bg-slate-900/40 backdrop-blur-sm">
              <Scan size={100} className="text-blue-500/20 animate-pulse" />
              <span className="text-xs text-slate-500 mt-4 tracking-wider text-center max-w-50">
                Simulador de cámara activo. Apunte a la lima de endodoncia.
              </span>
            </div>
          </div>
        )}

        {/* Tap to Focus square animation in middle of video tag */}
        {showTapFocus && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="w-24 h-24 border-2 border-blue-400 rounded-2xl animate-[ping_0.8s_ease-out_1] flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.6)]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            </div>
          </div>
        )}

        {/* Focus square frame overlay */}
        <div className={cameraStyles.focusFrameContainer}>
          <div className={`${cameraStyles.focusSquare} ${isAnalyzing ? 'border-blue-500/30' : ''}`}>
            {/* Corner Markers */}
            <div className={`${cameraStyles.focusCornerTL} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerTR} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerBL} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerBR} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />

            {/* Center target dot */}
            <div className={`${cameraStyles.focusCenterDot} ${isAnalyzing ? 'bg-blue-500 scale-150 animate-ping' : ''}`} />

            {/* Pulsing scanning overlay during analysis */}
            {isAnalyzing && (
              <div className="absolute inset-x-2 h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-pan-vertical" />
            )}
          </div>
        </div>
      </div>

      {/* Info Card Overlay (Lima detectada) */}
      {!controlsHidden && (
        <div className={cameraStyles.infoOverlayContainer}>
          <div className={`${cameraStyles.infoCard} ${limaDetected ? 'border-blue-500/50 bg-[#0e172a]/90' : 'border-slate-800/80'}`}>
            <div className={`${cameraStyles.infoIconContainer} ${limaDetected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
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
          className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800 transition-all duration-300 ease-in-out flex flex-col justify-between ${recentsExpanded ? 'h-[65vh] max-h-[70vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' : 'h-24'
            }`}
        >
          {recentsExpanded ? (
            /* Expanded Drawer Content matching wireframe Recientes fotos.png */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Collapse Chevron Button at Top Center */}
              <div className="flex justify-center pt-3 pb-2 border-b border-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setRecentsExpanded(false)}
                  className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
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
                    <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
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
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                      <History size={40} className="mb-3 text-slate-600 opacity-60" />
                      <p className="text-sm font-medium text-slate-400">No hay detecciones recientes todavía.</p>
                      <span className="text-xs text-slate-500 mt-1">Tome una foto de lima para ver los resultados aquí.</span>
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
