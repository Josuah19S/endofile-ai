"use client";
import React, { useState } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import Sidebar from './sidebar';
import CameraHeader from './camera-header';
import CameraViewport from './camera-viewport';
import CameraDetectionBadge from './camera-detection-badge';
import CameraBottomBar from './camera-bottom-bar';
import RecentDetectionsView from './recent-detections-view';
import FileCatalogView from './file-catalog-view';
import { useCamera } from './camera-context';

export default function CameraScreenShell() {
  const { fileInputRef, handleFileSelect, showFlashOverlay } = useCamera();

  // Local UI Presentation Toggles & Drawer View State
  const [controlsHidden, setControlsHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDrawerView, setActiveDrawerView] = useState<'recents' | 'catalog' | null>(null);

  const handleSelectNav = (nav: 'inicio' | 'historial' | 'catalogo') => {
    if (nav === 'inicio') {
      setActiveDrawerView(null);
    } else if (nav === 'historial') {
      setActiveDrawerView('recents');
    } else if (nav === 'catalogo') {
      setActiveDrawerView('catalog');
    }
  };

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

      {/* Header Navigation Controls */}
      <CameraHeader
        controlsHidden={controlsHidden}
        setControlsHidden={setControlsHidden}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Center Viewport & Reticle Area */}
      <CameraViewport />

      {/* Info Card Overlay (Lima detectada) */}
      {!controlsHidden && <CameraDetectionBadge />}

      {/* Bottom Action Bar & Abstracted Drawer */}
      {!controlsHidden && (
        <CameraBottomBar
          expanded={activeDrawerView !== null}
          onClose={() => setActiveDrawerView(null)}
          onOpenRecents={() => setActiveDrawerView('recents')}
        >
          {activeDrawerView === 'recents' && <RecentDetectionsView />}
          {activeDrawerView === 'catalog' && <FileCatalogView />}
        </CameraBottomBar>
      )}

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectNav={handleSelectNav}
      />
    </div>
  );
}
