/**
 * Camera Screen Tailwind Utility Classes
 */
export const cameraStyles = {
  // Main screen container - uses theme background and text tokens
  screenContainer: "relative w-full h-screen h-dvh bg-background text-on-surface overflow-hidden select-none",

  // Top header area containing menu, status, aspect-ratio controls
  topHeader: "absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-4 md:p-6 w-full pointer-events-none",

  // Left control stack (contains menu button)
  leftControls: "pointer-events-auto",

  // Right control stack (contains aspect ratio & flash stacked vertically)
  rightControls: "flex flex-col gap-3 pointer-events-auto",

  // Icon buttons (menu, fullscreen, flash, upload, history)
  iconButton: "flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-low border border-outline text-on-surface shadow-md transition-all duration-200 active:scale-95 hover:bg-surface-container-high hover:border-primary/60 hover:text-primary cursor-pointer",

  // Status badge (Modelo: ---)
  statusBadge: "pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low border border-outline text-xs text-on-surface-variant shadow-md tracking-wide",

  // Active dot
  statusDot: "w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#22adfa]",

  // Flash button variation when active
  flashActive: "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30",

  // Camera viewport area - centered 3:4 aspect ratio frame for both desktop and mobile
  viewportArea: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82vw] max-w-[350px] aspect-[3/4] z-10 flex items-center justify-center bg-surface-container-lowest rounded-2xl border border-primary/40 shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden",

  // The interactive video stream
  videoPreview: "w-full h-full object-cover",

  // Focus frame overlays in the middle of screen
  focusFrameContainer: "absolute inset-0 flex items-center justify-center pointer-events-none",

  // Focus square container (scaled to fit nicely inside the squared viewport)
  focusSquare: "relative w-[80%] h-[80%] border border-primary/20 flex items-center justify-center transition-all duration-300",

  // Focus corner markers (L-shapes) - Celestial Sky Blue Accent
  focusCornerTL: "absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary shadow-[0_0_10px_rgba(34,173,250,0.5)] rounded-tl-xs",
  focusCornerTR: "absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary shadow-[0_0_10px_rgba(34,173,250,0.5)] rounded-tr-xs",
  focusCornerBL: "absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary shadow-[0_0_10px_rgba(34,173,250,0.5)] rounded-bl-xs",
  focusCornerBR: "absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary shadow-[0_0_10px_rgba(34,173,250,0.5)] rounded-br-xs",

  // Center focusing dot
  focusCenterDot: "w-1.5 h-1.5 rounded-full bg-primary/80 shadow-[0_0_8px_#22adfa]",

  // Bottom info overlay (Lima detectada card) - raised further to prevent control overlap
  infoOverlayContainer: "absolute bottom-36 md:bottom-40 left-0 right-0 z-20 px-4 md:px-6 w-full flex justify-center pointer-events-none",

  // Lima detectada card
  infoCard: "pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-xl bg-surface-container border border-outline shadow-xl transition-all duration-300",

  // Blue check icon container
  infoIconContainer: "flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/40",

  // Lima status text
  infoText: "text-sm font-semibold tracking-wide text-on-surface",

  // Solid dark bottom action bar - padded more at the bottom to avoid mobile browser toolbar overlap
  bottomActionBar: "absolute bottom-0 left-0 right-0 z-20 w-full bg-surface-container-lowest px-6 py-6 pb-12 md:pb-6 flex justify-between items-center border-t border-outline shadow-[0_-10px_30px_rgba(0,0,0,0.5)]",

  // Camera shutter button (center action)
  shutterOuterRing: "flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary/90 bg-transparent transition-all duration-300 active:scale-90 cursor-pointer shadow-[0_0_20px_rgba(34,173,250,0.35)] hover:shadow-[0_0_30px_rgba(34,173,250,0.6)] hover:border-primary",
  shutterInnerCircle: "w-16 h-16 p-1 rounded-full bg-primary text-on-primary border border-transparent shadow-inner transition-all duration-200 hover:opacity-90 active:scale-95",
  shutterInnerCircleLoading: "w-16 h-16 p-4 rounded-full bg-transparent border-4 border-outline border-t-primary animate-spin",
  shutterReloadIcon: "w-full h-full text-outline-variant hover:text-primary bg-transparent border border-transparent shadow-inner transition-colors duration-200",
};
