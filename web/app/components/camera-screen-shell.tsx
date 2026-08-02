"use client";
import React, { useRef, useState } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import Sidebar from './sidebar';
import CameraHeader from './camera-header';
import CameraViewport from './camera-viewport';
import CameraDetectionBadge from './camera-detection-badge';
import CameraBottomBar from './camera-bottom-bar';
import RecentDetectionsView from './recent-detections-view';
import FileCatalogView from './file-catalog-view';
import FileDetailView from './file-detail-view';
import UserGuideModal from './user-guide-modal';
import { useCamera } from './camera-context';

import { useEndofileAi } from './endofile-model-context';

import ImageValidationBanner from './image-validation-banner';
import ValidationSettingsModal from './validation-settings-modal';

type DrawerView = 'recents' | 'catalog' | 'detail';

/**
 * What the detail view is showing. A history detail is tracked by index so the lateral
 * arrows can walk the scan list; a catalog detail is tracked by class id alone, with no
 * photo and no arrows.
 */
type DetailTarget =
  | { origin: 'history'; index: number }
  | { origin: 'catalog'; classId: string };

export default function CameraScreenShell() {
  const { fileInputRef, handleFileSelect, showFlashOverlay, validationResults, showUserGuide, setShowUserGuide } = useCamera();
  const { scanHistoryItems } = useEndofileAi();

  // Local UI Presentation Toggles & Drawer View State
  const [controlsHidden, setControlsHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDrawerView, setActiveDrawerView] = useState<DrawerView | null>(null);

  // File detail view state & the drawer to return to when leaving it
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [prevDrawerView, setPrevDrawerView] = useState<'recents' | 'catalog'>('recents');

  // Catalog browsing state, lifted so it survives a round trip to the detail view
  const [catalogQuery, setCatalogQuery] = useState('');
  const catalogScrollTop = useRef(0);

  const handleSelectNav = (nav: 'inicio' | 'historial' | 'catalogo') => {
    if (nav === 'inicio') {
      setActiveDrawerView(null);
    } else if (nav === 'historial') {
      setActiveDrawerView('recents');
    } else if (nav === 'catalogo') {
      setActiveDrawerView('catalog');
    }
  };

  // Remember where the detail view was opened from, unless we are already inside it
  const rememberDrawerOrigin = () => {
    if (activeDrawerView !== 'detail') {
      setPrevDrawerView(activeDrawerView === 'catalog' ? 'catalog' : 'recents');
    }
  };

  // Opened from the scan history or from the detection badge
  const handleOpenDetail = (classId: string, photoUrl?: string | null) => {
    const idx = scanHistoryItems.findIndex(
      item => item.classId === classId && (photoUrl ? item.photoUrl === photoUrl : true)
    );
    // No matching scan: show the requested class on its own rather than falling back to
    // the most recent scan, which would display a different file altogether.
    setDetailTarget(idx !== -1 ? { origin: 'history', index: idx } : { origin: 'catalog', classId });
    rememberDrawerOrigin();
    setActiveDrawerView('detail');
  };

  // Opened from the catalog: no photo, no lateral navigation
  const handleOpenCatalogFile = (classId: string) => {
    setDetailTarget({ origin: 'catalog', classId });
    rememberDrawerOrigin();
    setActiveDrawerView('detail');
  };

  const historyIndex = detailTarget?.origin === 'history' ? detailTarget.index : -1;
  const historyScan = historyIndex >= 0 ? scanHistoryItems[historyIndex] ?? null : null;

  const activeClassId = detailTarget === null
    ? null
    : detailTarget.origin === 'catalog'
      ? detailTarget.classId
      : historyScan?.classId ?? null;
  const activePhotoUrl = historyScan?.photoUrl ?? null;

  const hasNewerDetail = historyIndex > 0; // newer item (towards index 0)
  const hasOlderDetail = historyIndex >= 0 && historyIndex < scanHistoryItems.length - 1; // older item

  const handleNewerDetail = () => {
    setDetailTarget(prev =>
      prev?.origin === 'history' && prev.index > 0 ? { origin: 'history', index: prev.index - 1 } : prev
    );
  };

  const handleOlderDetail = () => {
    setDetailTarget(prev =>
      prev?.origin === 'history' && prev.index < scanHistoryItems.length - 1
        ? { origin: 'history', index: prev.index + 1 }
        : prev
    );
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
        onOpenSettings={() => setIsSettingsOpen(true)}
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
        {activeDrawerView === 'catalog' && (
          <FileCatalogView
            query={catalogQuery}
            onQueryChange={setCatalogQuery}
            scrollTopRef={catalogScrollTop}
            onSelectFile={handleOpenCatalogFile}
          />
        )}
        {activeDrawerView === 'detail' && activeClassId && (
          <FileDetailView
            classId={activeClassId}
            photoUrl={activePhotoUrl}
            backLabel={prevDrawerView === 'catalog' ? 'Volver al catálogo' : 'Volver a Detecciones Recientes'}
            onBack={() => setActiveDrawerView(prevDrawerView)}
            onNewer={historyIndex >= 0 ? handleNewerDetail : undefined}
            onOlder={historyIndex >= 0 ? handleOlderDetail : undefined}
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
        onOpenGuide={() => setShowUserGuide(true)}
      />

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
      />

      {/* Threshold Settings Modal */}
      <ValidationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
