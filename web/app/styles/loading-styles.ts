/**
 * Loading Screen Tailwind Utility Classes
 */
export const loadingStyles = {
  // Main full screen container - uses theme background and text tokens
  screenContainer: "flex flex-col items-center justify-center min-h-screen bg-background text-on-surface p-6 select-none",
  
  // Center logo and content wrapper
  contentWrapper: "flex flex-col items-center max-w-xs w-full text-center",
  
  // Circle container for the tooth icon
  iconContainer: "flex items-center justify-center w-24 h-24 rounded-full bg-primary-container/20 mb-6 shadow-md border border-outline/40 transition-all duration-500 hover:scale-105",
  
  // Tooth SVG style
  toothIcon: "w-12 h-12 text-on-primary-container transition-transform duration-300",
  
  // Brand title
  brandTitle: "text-3xl font-extrabold text-on-surface tracking-tight mb-8 font-headline",
  
  // Spinner outer container
  spinnerContainer: "flex items-center justify-center mb-4 relative w-10 h-10",
  
  // Loading spinner ring
  spinnerRing: "animate-spin rounded-full h-8 w-8 border-3 border-outline border-t-primary",
  
  // Small "CARGANDO..." status text
  loadingText: "text-xs font-bold text-on-surface-variant tracking-[0.2em] uppercase font-label animate-pulse",

  // Subtitle explaining permission request
  subtitleText: "text-sm text-on-surface-variant max-w-[260px] mb-6 leading-relaxed font-medium",

  // Main primary CTA button for camera access
  actionButton: "mt-6 px-6 py-3.5 w-full bg-primary hover:bg-primary-container text-on-primary font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 text-sm cursor-pointer",

  // Secondary/Skip button to run in simulator mode
  secondaryButton: "mt-3 px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-transparent rounded-xl transition-colors duration-200 cursor-pointer",

  // Error message formatting
  errorText: "mt-4 text-xs font-semibold text-error max-w-[260px] leading-normal"
};
