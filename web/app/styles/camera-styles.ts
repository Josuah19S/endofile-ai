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
  iconButton: "flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline/80 text-on-surface shadow-lg transition-all duration-200 active:scale-95 hover:bg-surface-container-high cursor-pointer",

  // Status badge (Modelo: ---)
  statusBadge: "pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline/80 text-sm font-medium text-on-surface-variant shadow-lg",

  // Active dot
  statusDot: "w-2.5 h-2.5 rounded-full bg-tertiary-fixed animate-pulse shadow-[0_0_8px_var(--tertiary)]",

  // Flash button variation when active
  flashActive: "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30",

  // Camera viewport area - centered, rounded square box for both desktop and mobile
  viewportArea: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[420px] max-h-[420px] z-10 flex items-center justify-center bg-surface-container-lowest rounded-3xl border border-outline shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden",

  // The interactive video stream
  videoPreview: "w-full h-full object-cover",

  // Focus frame overlays in the middle of screen
  focusFrameContainer: "absolute inset-0 flex items-center justify-center pointer-events-none",

  // Focus square container (scaled to fit nicely inside the squared viewport)
  focusSquare: "relative w-[80%] h-[80%] border border-on-surface/10 flex items-center justify-center transition-all duration-300",

  // Focus corner markers (L-shapes)
  focusCornerTL: "absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-on-surface rounded-tl-sm",
  focusCornerTR: "absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-on-surface rounded-tr-sm",
  focusCornerBL: "absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-on-surface rounded-bl-sm",
  focusCornerBR: "absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-on-surface rounded-br-sm",

  // Center focusing dot
  focusCenterDot: "w-1 h-1 rounded-full bg-on-surface/40",

  // Bottom info overlay (Lima detectada card) - raised further to prevent control overlap
  infoOverlayContainer: "absolute bottom-36 md:bottom-40 left-0 right-0 z-20 px-4 md:px-6 w-full flex justify-center pointer-events-none",

  // Lima detectada card
  infoCard: "pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3.5 rounded-2xl bg-surface/90 backdrop-blur-lg border border-outline shadow-2xl transition-all duration-300",

  // Blue check icon container
  infoIconContainer: "flex items-center justify-center w-6 h-6 rounded-full bg-primary-container/30 text-on-primary-container border border-primary-container/50",

  // Lima status text
  infoText: "text-sm font-semibold tracking-wide text-on-surface",

  // Solid dark bottom action bar - padded more at the bottom to avoid mobile browser toolbar overlap
  bottomActionBar: "absolute bottom-0 left-0 right-0 z-20 w-full bg-surface-container-lowest/90 backdrop-blur-lg px-6 py-6 pb-12 md:pb-6 flex justify-between items-center border-t border-outline/60 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]",

  // Camera shutter button (center action)
  shutterOuterRing: "flex items-center justify-center w-20 h-20 rounded-full border-4 border-on-surface bg-transparent transition-all duration-300 active:scale-90 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]",
  shutterInnerCircle: "w-16 h-16 rounded-full bg-on-surface border border-transparent shadow-inner transition-colors duration-200 hover:bg-surface-variant active:bg-surface-dim",
  shutterInnerCircleLoading: "w-16 h-16 rounded-full bg-transparent border-4 border-outline border-t-on-surface animate-spin",
};
