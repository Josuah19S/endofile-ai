"use client";
import { Menu, Zap, Maximize, ListSortDescending, X, ArrowLeft, FileText } from 'lucide-react';
import { cameraStyles } from '../styles/camera-styles';
import { useCamera } from './camera-context';
import { useEndofileAi } from './endofile-model-context';

interface CameraHeaderProps {
  controlsHidden: boolean;
  setControlsHidden: (hidden: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

export default function CameraHeader({
  controlsHidden,
  setControlsHidden,
  setSidebarOpen,
}: CameraHeaderProps) {
  const {
    cameraAvailable,
    flashOn,
    toggleFlash,
  } = useCamera();

  const { modelStatus } = useEndofileAi();

  return (
    <>
      {/* Floating Restore Controls Button (displayed when controls are cleared/hidden) */}
      {controlsHidden && (
        <button
          type="button"
          className="absolute top-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-2xl bg-surface/80 backdrop-blur-md border border-outline text-on-surface shadow-2xl hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
          onClick={() => setControlsHidden(false)}
          aria-label="Mostrar controles"
          title="Mostrar controles"
        >
          <div className="relative flex items-center justify-center">
            <Maximize size={20} className="text-on-surface" />
            <ListSortDescending size={12} className="absolute text-on-surface bg-transparent rounded-full" />
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
    </>
  );
}
