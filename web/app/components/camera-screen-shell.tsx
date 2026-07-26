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
import FileDetailView from './file-detail-view';
import { useCamera } from './camera-context';

import { useEndofileAi } from './endofile-model-context';

export default function CameraScreenShell() {
  const { fileInputRef, handleFileSelect, showFlashOverlay, selectedPhotoUrl } = useCamera();
  const { scanHistoryItems } = useEndofileAi();

  // Local UI Presentation Toggles & Drawer View State
  const [controlsHidden, setControlsHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDrawerView, setActiveDrawerView] = useState<'recents' | 'catalog' | 'detail' | null>(null);

  // File detail view state & history index tracking
  const [detailClassId, setDetailClassId] = useState<string | null>(null);
  const [detailPhotoUrl, setDetailPhotoUrl] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number>(-1);
  const [prevDrawerView, setPrevDrawerView] = useState<'recents' | 'catalog' | null>(null);

  const handleSelectNav = (nav: 'inicio' | 'historial' | 'catalogo') => {
    if (nav === 'inicio') {
      setActiveDrawerView(null);
    } else if (nav === 'historial') {
      setActiveDrawerView('recents');
    } else if (nav === 'catalogo') {
      setActiveDrawerView('catalog');
    }
  };

  const handleOpenDetail = (classId: string, photoUrl?: string | null) => {
    const idx = scanHistoryItems.findIndex(
      item => item.classId === classId && (photoUrl ? item.photoUrl === photoUrl : true)
    );
    if (idx !== -1) {
      setDetailIndex(idx);
    } else {
      setDetailIndex(0);
    }
    setDetailClassId(classId);
    setDetailPhotoUrl(photoUrl || selectedPhotoUrl);
    setPrevDrawerView(activeDrawerView === 'detail' ? prevDrawerView : activeDrawerView);
    setActiveDrawerView('detail');
  };

  const currentScan = detailIndex >= 0 && detailIndex < scanHistoryItems.length ? scanHistoryItems[detailIndex] : null;
  const activeClassId = currentScan ? currentScan.classId : detailClassId;
  const activePhotoUrl = currentScan ? currentScan.photoUrl : detailPhotoUrl;

  const hasNewerDetail = detailIndex > 0; // newer item (towards index 0)
  const hasOlderDetail = detailIndex >= 0 && detailIndex < scanHistoryItems.length - 1; // older item

  const handleNewerDetail = () => {
    if (hasNewerDetail) {
      setDetailIndex(prev => prev - 1);
    }
  };

  const handleOlderDetail = () => {
    if (hasOlderDetail) {
      setDetailIndex(prev => prev + 1);
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
      {!controlsHidden && (
        <CameraDetectionBadge
          onOpenDetail={handleOpenDetail}
        />
      )}

      {/* Bottom Action Bar & Abstracted Drawer */}
      <CameraBottomBar
        expanded={activeDrawerView !== null}
        controlsHidden={controlsHidden}
        onClose={() => setActiveDrawerView(null)}
        onOpenRecents={() => setActiveDrawerView('recents')}
      >
        {activeDrawerView === 'recents' && (
          <RecentDetectionsView onSelectCard={handleOpenDetail} />
        )}
        {activeDrawerView === 'catalog' && <FileCatalogView />}
        {activeDrawerView === 'detail' && activeClassId && (
          <FileDetailView
            classId={activeClassId}
            photoUrl={activePhotoUrl}
            onBack={() => setActiveDrawerView(prevDrawerView || 'recents')}
            onNewer={handleNewerDetail}
            onOlder={handleOlderDetail}
            hasNewer={hasNewerDetail}
            hasOlder={hasOlderDetail}
          />
        )}
      </CameraBottomBar>

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectNav={handleSelectNav}
      />
    </div>
  );
}
