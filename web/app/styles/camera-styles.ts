/**
 * Camera Screen Tailwind Utility Classes
 */
export const cameraStyles = {
  // Main screen container - dark midnight background, full screen
  screenContainer: "relative w-full h-screen h-dvh bg-[#0b121f] text-white overflow-hidden select-none",

  // Top header area containing menu, status, aspect-ratio controls
  topHeader: "absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-4 md:p-6 w-full pointer-events-none",
  
  // Left control stack (contains menu button)
  leftControls: "pointer-events-auto",
  
  // Right control stack (contains aspect ratio & flash stacked vertically)
  rightControls: "flex flex-col gap-3 pointer-events-auto",

  // Icon buttons (menu, fullscreen, flash, upload, history)
  iconButton: "flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-slate-800/60 text-white shadow-lg transition-all duration-200 active:scale-95 hover:bg-slate-900/90 cursor-pointer",
  
  // Status badge (Modelo: ---)
  statusBadge: "pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/70 backdrop-blur-md border border-slate-800/60 text-sm font-medium text-slate-200 shadow-lg",
  
  // Green active dot
  statusDot: "w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]",

  // Flash button variation when active
  flashActive: "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30",

  // Camera viewport area - absolutely filling the entire screen behind everything
  viewportArea: "absolute inset-0 w-full h-full z-0 flex items-center justify-center",
  
  // The interactive video stream
  videoPreview: "w-full h-full object-contain bg-slate-950",
  
  // Focus frame overlays in the middle of screen
  focusFrameContainer: "absolute inset-0 flex items-center justify-center pointer-events-none",
  
  // Focus square container (aspect-ratio square in mobile)
  focusSquare: "relative w-72 h-72 md:w-96 md:h-96 border border-white/10 flex items-center justify-center transition-all duration-300",
  
  // Focus corner markers (L-shapes)
  focusCornerTL: "absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-sm",
  focusCornerTR: "absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-sm",
  focusCornerBL: "absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-sm",
  focusCornerBR: "absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-sm",
  
  // Center focusing dot
  focusCenterDot: "w-1 h-1 rounded-full bg-white/40",

  // Bottom info overlay (Lima detectada card) - raised further to prevent control overlap
  infoOverlayContainer: "absolute bottom-36 md:bottom-40 left-0 right-0 z-20 px-4 md:px-6 w-full flex justify-center pointer-events-none",
  
  // Lima detectada card
  infoCard: "pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3.5 rounded-2xl bg-slate-950/80 backdrop-blur-lg border border-slate-800/80 shadow-2xl transition-all duration-300",
  
  // Blue check icon container
  infoIconContainer: "flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30",
  
  // Lima status text
  infoText: "text-sm font-semibold tracking-wide text-slate-100",

  // Solid dark bottom action bar - padded more at the bottom to avoid mobile browser toolbar overlap
  bottomActionBar: "absolute bottom-0 left-0 right-0 z-20 w-full bg-[#040810]/85 backdrop-blur-lg px-6 py-6 pb-12 md:pb-6 flex justify-between items-center border-t border-slate-800/40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]",
  
  // Camera shutter button (center action)
  shutterOuterRing: "flex items-center justify-center w-20 h-20 rounded-full border-4 border-white bg-transparent transition-all duration-300 active:scale-90 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]",
  shutterInnerCircle: "w-16 h-16 rounded-full bg-white border border-transparent shadow-inner transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200",
  shutterInnerCircleLoading: "w-16 h-16 rounded-full bg-transparent border-4 border-slate-700 border-t-white animate-spin",
};
