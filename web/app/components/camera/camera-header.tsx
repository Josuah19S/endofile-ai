"use client";
import { Menu, Zap, Maximize, ListSortDescending, X, Pause, Play } from 'lucide-react';
import { cameraStyles } from '../../styles/camera-styles';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi } from '../../contexts/endofile-model-context';

interface CameraHeaderProps {
  controlsHidden: boolean;
  setControlsHidden: (hidden: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  onOpenSettings?: () => void;
}

export default function CameraHeader({
  controlsHidden,
  setControlsHidden,
  setSidebarOpen,
  onOpenSettings,
}: CameraHeaderProps) {
  const {
    cameraAvailable,
    flashOn,
    toggleFlash,
    isCameraPaused,
    toggleCameraPause,
  } = useCamera();

  const { modelStatus, modelConfig } = useEndofileAi();

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-3 sm:p-4 md:p-6 pointer-events-none">
      {/* Left Stack: Menu and Model Badge */}
      <div
        className={`${cameraStyles.leftControls} flex items-center gap-3 transition-opacity duration-200 ${
          controlsHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
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
          <span>modelo: {modelStatus === 'ready' ? (modelConfig?.badgeName || 'EndoX IA') : '---'}</span>
        </div>
      </div>

      {/* Right Stack: Clear/Restore Controls, Flash, Pause */}
      <div className={`${cameraStyles.rightControls} pointer-events-auto transition-all duration-200`}>
        <button
          type="button"
          className={cameraStyles.iconButton}
          onClick={() => setControlsHidden(!controlsHidden)}
          aria-label={controlsHidden ? "Mostrar controles" : "Limpiar controles"}
          title={controlsHidden ? "Mostrar controles" : "Limpiar controles (Pantalla completa)"}
        >
          {controlsHidden ? (
            <div className="relative flex items-center justify-center">
              <Maximize size={20} className="text-on-surface" />
              <ListSortDescending size={12} className="absolute text-on-surface bg-transparent rounded-full" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <Maximize size={20} className="text-on-surface opacity-60" />
              <X size={12} className="absolute text-on-surface font-extrabold" />
            </div>
          )}
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

        <button
          type="button"
          className={`${cameraStyles.iconButton} ${isCameraPaused ? "bg-error/20 text-error" : ""}`}
          onClick={toggleCameraPause}
          aria-label={isCameraPaused ? "Reanudar cámara" : "Pausar cámara"}
          title={isCameraPaused ? "Reanudar cámara" : "Pausar cámara"}
          disabled={!cameraAvailable}
        >
          {isCameraPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
    </div>
  );
}
