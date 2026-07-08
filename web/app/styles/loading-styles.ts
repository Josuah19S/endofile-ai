/**
 * Loading Screen Tailwind Utility Classes
 */
export const loadingStyles = {
  // Main full screen container - clean off-white background
  screenContainer: "flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa] p-6 select-none",
  
  // Center logo and content wrapper
  contentWrapper: "flex flex-col items-center max-w-xs w-full text-center",
  
  // Circle container for the tooth icon
  iconContainer: "flex items-center justify-center w-24 h-24 rounded-full bg-[#eff6ff] mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-50/50 transition-all duration-500 hover:scale-105",
  
  // Tooth SVG style
  toothIcon: "w-12 h-12 text-[#0056b3] transition-transform duration-300",
  
  // Brand title
  brandTitle: "text-3xl font-extrabold text-[#0b0f19] tracking-tight mb-8 font-sans",
  
  // Spinner outer container
  spinnerContainer: "flex items-center justify-center mb-4 relative w-10 h-10",
  
  // Loading spinner ring
  spinnerRing: "animate-spin rounded-full h-8 w-8 border-3 border-blue-100 border-t-[#0056b3]",
  
  // Small "CARGANDO..." status text
  loadingText: "text-xs font-bold text-slate-400 tracking-[0.2em] uppercase font-sans animate-pulse"
};
