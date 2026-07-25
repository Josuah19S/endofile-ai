"use client";
import React, { useState } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import Sidebar from './sidebar';
import CameraHeader from './camera-header';
import CameraViewport from './camera-viewport';
import CameraDetectionBadge from './camera-detection-badge';
import CameraBottomBar from './camera-bottom-bar';
import { useCamera } from './camera-context';

export default function CameraScreenShell() {
  const { fileInputRef, handleFileSelect, showFlashOverlay } = useCamera();

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

      {/* Bottom Action Bar & Recents Drawer */}
      {!controlsHidden && (
        <CameraBottomBar
          recentsExpanded={recentsExpanded}
          setRecentsExpanded={setRecentsExpanded}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
