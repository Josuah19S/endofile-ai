"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import { 
  MenuIcon, 
  ExpandIcon, 
  FlashIcon, 
  UploadIcon, 
  HistoryIcon, 
  CheckCircleIcon 
} from './icons';

interface CameraScreenProps {
  initialStream?: MediaStream | null;
  initialCameraAvailable?: boolean;
}

export default function CameraScreen({ 
  initialStream = null, 
  initialCameraAvailable = false 
}: CameraScreenProps) {
  const [cameraAvailable, setCameraAvailable] = useState(initialCameraAvailable);
  const [stream, setStream] = useState<MediaStream | null>(initialStream);
  const [flashOn, setFlashOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Request actual camera access (as a fallback or retry)
  const requestCameraAccess = async () => {
    try {
      const constraints = { 
        video: { 
          facingMode: 'environment', // Rear camera for mobiles
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        } 
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraAvailable(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.warn('Physical camera not available or permission denied. Loading premium mock camera feed.', error);
      setCameraAvailable(false);
      setStream(null);
    }
  };

  useEffect(() => {
    // If we don't have a stream but camera should be available, request it
    if (!stream && cameraAvailable) {
      requestCameraAccess();
    }
    return () => {
      // Clean up the stream when unmounting
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element when stream is available or changes
  useEffect(() => {
    if (cameraAvailable && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraAvailable, stream]);

  // Handle Photo Capture & Mock Analysis
  const capturePhoto = () => {
    if (isAnalyzing) return;
    
    // Trigger screen flash animation
    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 150);

    setIsAnalyzing(true);
    
    // Mock the AI model processing time
    setTimeout(() => {
      const mockLimas = [
        "Lima K-File #15 (21mm)",
        "Lima K-File #20 (25mm)",
        "Lima K-File #25 (21mm)",
        "Lima H-File #30 (25mm)",
        "Lima Protaper F1 (25mm)"
      ];
      const randomLima = mockLimas[Math.floor(Math.random() * mockLimas.length)];
      setLimaDetected(randomLima);
      setScanHistory(prev => [randomLima, ...prev.slice(0, 9)]); // Keep last 10 scans
      setIsAnalyzing(false);
    }, 1800);
  };

  // Handle local image file upload (mock detection on upload)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      setTimeout(() => {
        const mockUploadedLimas = [
          "Lima K-File #35 (25mm)",
          "Lima K-File #40 (21mm)",
          "Lima Protaper F2 (25mm)"
        ];
        const randomLima = mockUploadedLimas[Math.floor(Math.random() * mockUploadedLimas.length)];
        setLimaDetected(randomLima);
        setScanHistory(prev => [randomLima, ...prev.slice(0, 9)]);
        setIsAnalyzing(false);
      }, 1500);
    }
  };

  // Reset current detection state
  const resetDetection = () => {
    setLimaDetected(null);
  };

  return (
    <div className={cameraStyles.screenContainer}>
      
      {/* Invisible file input for document/image upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Screen flash effect overlay */}
      {showFlashOverlay && (
        <div className="absolute inset-0 bg-white z-50 transition-opacity duration-75 pointer-events-none" />
      )}

      {/* Top Header Controls overlay */}
      <div className={cameraStyles.topHeader}>
        <div className={cameraStyles.leftControls}>
          <button 
            type="button"
            className={cameraStyles.iconButton}
            onClick={() => alert("Menú de Configuración EndoScan AI")}
            aria-label="Abrir menú"
          >
            <MenuIcon size={22} />
          </button>
        </div>
        
        {/* Model status indicator */}
        <div className={cameraStyles.statusBadge}>
          <span className={cameraStyles.statusDot} />
          <span>Modelo: EndoX-v2.1</span>
        </div>

        <div className={cameraStyles.rightControls}>
          {/* Toggle camera view fit (Aspect Ratio indicator) */}
          <button 
            type="button"
            className={cameraStyles.iconButton}
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label="Cambiar escala"
          >
            <ExpandIcon size={22} className={isFullscreen ? "rotate-45" : ""} />
          </button>
          
          {/* Simulated Flash toggle */}
          <button 
            type="button"
            className={`${cameraStyles.iconButton} ${flashOn ? cameraStyles.flashActive : ""}`}
            onClick={() => setFlashOn(!flashOn)}
            aria-label="Alternar flash"
          >
            <FlashIcon size={22} />
          </button>
        </div>
      </div>

      {/* Viewport / Cam Area */}
      <div className={cameraStyles.viewportArea}>
        {cameraAvailable ? (
          <video 
            ref={videoRef}
            id="camera-preview"
            autoPlay 
            playsInline
            muted
            className={`${cameraStyles.videoPreview} ${isFullscreen ? 'object-cover' : 'object-contain'}`}
          />
        ) : (
          /* Premium Mock Viewfinder for previewing without physical hardware */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
            {/* Animated medical grid background */}
            <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            {/* Glowing scanline effect */}
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[bounce_4s_infinite] opacity-40 top-1/4" />
            
            {/* Visual representation of tooth being scanned */}
            <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl border border-blue-500/10 bg-slate-900/40 backdrop-blur-sm">
              <svg className="w-32 h-32 text-blue-500/20 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C10.5 2 9 3 8 4.5 7.2 3.8 6 3.5 5 4c-1.5.8-2 2.5-2 4 0 3.5 1.5 6 2.5 8 .8 1.6 1.5 3 2 4.5.3 1 1 1.5 2 1.5.8 0 1.5-.5 1.8-1.2.3-.7.7-1.3.7-1.8 0-.5.4-.7.7-.7s.7.2.7.7c0 .5.4 1.1.7 1.8.3.7 1 1.2 1.8 1.2 1 0 1.7-.5 2-1.5.5-1.5 1.2-2.9 2-4.5 1-2 2.5-4.5 2.5-8 0-1.5-.5-3.2-2-4-.9-.5-2.2-.2-3 .5C15 3 13.5 2 12 2z" />
              </svg>
              <span className="text-xs text-slate-500 mt-4 tracking-wider text-center max-w-[200px]">
                Simulador de cámara activo. Apunte a la radiografía dental.
              </span>
            </div>
          </div>
        )}

        {/* Focus square frame overlay */}
        <div className={cameraStyles.focusFrameContainer}>
          <div className={`${cameraStyles.focusSquare} ${isAnalyzing ? 'border-blue-500/30' : ''}`}>
            {/* Corner Markers */}
            <div className={`${cameraStyles.focusCornerTL} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerTR} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerBL} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            <div className={`${cameraStyles.focusCornerBR} ${isAnalyzing ? 'border-blue-500' : 'border-white'}`} />
            
            {/* Center target dot */}
            <div className={`${cameraStyles.focusCenterDot} ${isAnalyzing ? 'bg-blue-500 scale-150 animate-ping' : ''}`} />

            {/* Pulsing scanning overlay during analysis */}
            {isAnalyzing && (
              <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[panVertical_1.8s_ease-in-out_infinite]" />
            )}
          </div>
        </div>
      </div>

      {/* Info Card Overlay (Lima detectada) */}
      <div className={cameraStyles.infoOverlayContainer}>
        <div className={`${cameraStyles.infoCard} ${limaDetected ? 'border-blue-500/50 bg-[#0e172a]/90' : 'border-slate-800/80'}`}>
          <div className={`${cameraStyles.infoIconContainer} ${limaDetected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
            <CheckCircleIcon size={14} className={limaDetected ? "animate-[scaleIn_0.3s_ease-out]" : ""} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 leading-none mb-1">
              Detector de Limas
            </p>
            <p className={cameraStyles.infoText}>
              {isAnalyzing 
                ? "Analizando radiografía..." 
                : (limaDetected ? `Lima detectada: ${limaDetected}` : "Lima detectada: ---")
              }
            </p>
          </div>
          {limaDetected && (
            <button 
              onClick={resetDetection} 
              className="text-xs text-slate-500 hover:text-slate-300 font-medium px-2 py-1 rounded hover:bg-slate-800"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Solid Dark Action Bar */}
      <div className={cameraStyles.bottomActionBar}>
        {/* Left: Upload image */}
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cameraStyles.iconButton}
          aria-label="Subir radiografía"
          title="Cargar radiografía local"
        >
          <UploadIcon size={20} />
        </button>

        {/* Center: Shutter trigger */}
        <button 
          type="button"
          onClick={capturePhoto}
          className={cameraStyles.shutterOuterRing}
          aria-label="Capturar radiografía"
          disabled={isAnalyzing}
        >
          <div className={isAnalyzing ? cameraStyles.shutterInnerCircleLoading : cameraStyles.shutterInnerCircle} />
        </button>

        {/* Right: History / Previous scans */}
        <button 
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className={cameraStyles.iconButton}
          aria-label="Ver historial"
          title="Historial de detecciones"
        >
          <HistoryIcon size={20} />
        </button>
      </div>

      {/* Scanning history modal overlay */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-[slideUp_0.2s_ease-out]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Historial de Detección</h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {scanHistory.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No hay detecciones previas en esta sesión.
                </p>
              ) : (
                <ul className="space-y-2">
                  {scanHistory.map((item, index) => (
                    <li 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800/40 rounded-xl"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {scanHistory.length - index}
                      </div>
                      <span className="text-sm text-slate-300 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
