"use client";
import React, { useRef, useState } from 'react';
import NextImage from 'next/image';
import { cameraStyles } from '../../styles/camera-styles';
import Sidebar from '../overlays/sidebar';
import CameraHeader from './camera-header';
import CameraViewport from './camera-viewport';
import CameraDetectionBadge from './camera-detection-badge';
import CameraBottomBar from './camera-bottom-bar';
import RecentDetectionsView from '../file/recent-detections-view';
import FileCatalogView from '../file/file-catalog-view';
import FileDetailView from '../file/file-detail-view';
import AlternativesView from '../file/alternatives-view';
import UserGuideModal from '../overlays/user-guide-modal';
import { useCamera } from '../../contexts/camera-context';
import { useEndofileAi } from '../../contexts/endofile-model-context';
import ImageValidationBanner from '../overlays/image-validation-banner';
import ValidationSettingsModal from '../overlays/validation-settings-modal';

/**
 * Detail view target. History entries carry an index so the file-detail view
 * can walk laterally (newer / older scan). Catalog entries carry a classId
 * alone — there is no scan history to navigate.
 */
type DetailTarget =
  | { origin: 'history'; index: number }
  | { origin: 'catalog'; classId: string };

/**
 * The bottom-bar drawer holds one of these views at a time. Modeling it as a
 * discriminated union (rather than a flat enum + parallel payload state) makes
 * it impossible to land in `detail` without a target, and the type narrows
 * automatically in the renderer — no `if (activeClassId)` guards needed.
 *
 * `from` on the detail state remembers which drawer the user was in when
 * detail was opened, so the back button can return them there. It is
 * independent of `target.origin` (the data source) because a history scan
 * without a match falls back to the catalog view but the user still came
 * from the recents drawer.
 */
type DrawerState =
  | { view: 'recents' }
  | { view: 'catalog' }
  | { view: 'detail'; target: DetailTarget; from: 'recents' | 'catalog' }
  | { view: 'alternatives' };

export default function CameraScreenShell() {
  const { fileInputRef, handleFileSelect, showFlashOverlay, validationResults, showUserGuide, setShowUserGuide } = useCamera();
  const { scanHistoryItems, pendingConfirmation } = useEndofileAi();

  // Local UI Presentation Toggles
  const [controlsHidden, setControlsHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /**
   * Which drawer view is currently expanded in the bottom bar. Null = idle
   * bar. Helper functions below mutate it through the discriminated union so
   * each open call carries whatever payload its view needs.
   */
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const closeDrawer = () => setDrawer(null);
  const openRecents = () => setDrawer({ view: 'recents' });
  const openCatalog = () => setDrawer({ view: 'catalog' });
  const openAlternatives = () => setDrawer({ view: 'alternatives' });

  const handleSelectNav = (nav: 'inicio' | 'historial' | 'catalogo') => {
    if (nav === 'inicio') {
      setDrawer(null);
      setSidebarOpen(false);
    } else if (nav === 'historial') {
      setDrawer({ view: 'recents' });
      setSidebarOpen(false);
    } else if (nav === 'catalogo') {
      setDrawer({ view: 'catalog' });
      setSidebarOpen(false);
    }
  };

  // Opened from the scan history card or from the detection badge.
  const handleOpenDetail = (classId: string, photoUrl?: string | null) => {
    const idx = scanHistoryItems.findIndex(
      (item) => item.classId === classId && (photoUrl ? item.photoUrl === photoUrl : true)
    );
    // No matching scan: show the requested class on its own rather than
    // falling back to the most recent scan, which would display a different
    // file altogether. `from` still records where the user actually was.
    const target: DetailTarget =
      idx !== -1
        ? { origin: 'history', index: idx }
        : { origin: 'catalog', classId };
    const from: 'recents' | 'catalog' = idx !== -1 ? 'recents' : 'catalog';
    setDrawer({ view: 'detail', target, from });
  };

  // Opened from the catalog: no photo, no lateral navigation.
  const handleOpenCatalogFile = (classId: string) => {
    setDrawer({
      view: 'detail',
      target: { origin: 'catalog', classId },
      from: 'catalog',
    });
  };

  // Derived state for the detail view (the rest of the screen reads this).
  const detailView = drawer?.view === 'detail' ? drawer : null;
  const historyIndex = detailView?.target.origin === 'history' ? detailView.target.index : -1;
  const historyScan = historyIndex >= 0 ? scanHistoryItems[historyIndex] ?? null : null;
  const activeClassId =
    detailView === null
      ? null
      : detailView.target.origin === 'catalog'
        ? detailView.target.classId
        : historyScan?.classId ?? null;
  const activePhotoUrl = historyScan?.photoUrl ?? null;
  const hasNewerDetail = historyIndex > 0; // newer item (towards index 0)
  const hasOlderDetail = historyIndex >= 0 && historyIndex < scanHistoryItems.length - 1; // older item

  const handleNewerDetail = () => {
    setDrawer((prev) => {
      if (prev?.view !== 'detail' || prev.target.origin !== 'history' || prev.target.index <= 0) {
        return prev;
      }
      return { ...prev, target: { ...prev.target, index: prev.target.index - 1 } };
    });
  };

  const handleOlderDetail = () => {
    setDrawer((prev) => {
      if (prev?.view !== 'detail' || prev.target.origin !== 'history' || prev.target.index >= scanHistoryItems.length - 1) {
        return prev;
      }
      return { ...prev, target: { ...prev.target, index: prev.target.index + 1 } };
    });
  };

  const handleDetailBack = () => {
    setDrawer((prev) => {
      if (prev?.view !== 'detail') return prev;
      return prev.from === 'catalog' ? { view: 'catalog' } : { view: 'recents' };
    });
  };

  // Catalog browsing state, lifted so it survives a round trip to the detail view
  const [catalogQuery, setCatalogQuery] = useState('');
  const catalogScrollTop = useRef(0);

  return (
    <div className={cameraStyles.screenContainer}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <NextImage
          src="/elements/bg_camera.webp"
          alt="Fondo Cámara Clínica"
          fill
          className="object-cover object-center opacity-85 brightness-95"
          priority
        />
      </div>

      {/* Robot arm overlay: 10rem in from the left, 11rem past the right edge.
         object-cover + object-right keeps the arm (which sits on the right side of
         the source PNG) visible on every viewport, while h-[80vh] always gives it
         the full intended vertical space — object-contain was width-bound on mobile
         and shrank the visible height to ~33% of the container. */}
      <div className="absolute bottom-0 left-[10rem] right-[-30rem] sm:right-[-20rem] md:right-[-11rem] z-[5] h-[80vh] pointer-events-none">
        <NextImage
          src="/elements/camera_screen_robot_arm.webp"
          alt="Brazo del Robot"
          fill
          className="object-cover object-right"
          priority
        />
      </div>

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
          onOpenAlternatives={openAlternatives}
        />
      )}

      {/*
        Bottom Bar — h-24 when idle, grows to h-[65vh] (or fullHeight for the
        catalog / alternatives grid) when a drawer view is active. The view
        itself is rendered inside the bar via `children` so each view can size
        itself to the available space.
      */}
      <CameraBottomBar
        expanded={drawer !== null}
        fullHeight={drawer?.view === 'catalog' || drawer?.view === 'alternatives'}
        controlsHidden={controlsHidden}
        onClose={closeDrawer}
        onOpenRecents={openRecents}
      >
        {drawer?.view === 'recents' && (
          <RecentDetectionsView onSelectCard={handleOpenDetail} />
        )}
        {drawer?.view === 'catalog' && (
          <FileCatalogView
            query={catalogQuery}
            onQueryChange={setCatalogQuery}
            scrollTopRef={catalogScrollTop}
            onSelectFile={handleOpenCatalogFile}
          />
        )}
        {drawer?.view === 'detail' && activeClassId && (
          <FileDetailView
            classId={activeClassId}
            photoUrl={activePhotoUrl}
            backLabel={drawer.from === 'catalog' ? 'Volver al catálogo' : 'Volver a Detecciones Recientes'}
            onBack={handleDetailBack}
            onNewer={historyIndex >= 0 ? handleNewerDetail : undefined}
            onOlder={historyIndex >= 0 ? handleOlderDetail : undefined}
            hasNewer={hasNewerDetail}
            hasOlder={hasOlderDetail}
          />
        )}
        {drawer?.view === 'alternatives' && (
          <AlternativesView onPicked={closeDrawer} />
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