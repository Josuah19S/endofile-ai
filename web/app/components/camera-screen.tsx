"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import { UploadIcon, CheckCircleIcon, HistoryIcon as SwitchCameraIcon, MenuIcon, ExpandIcon, FlashIcon, FocusIcon } from './icons';
import { useEndofileAi } from "@/app/components/endofile-model-context";
import NextImage from "next/image";


interface CameraScreenProps {
  initialStream?: MediaStream | null;
  initialCameraAvailable?: boolean;
}

export default function CameraScreen({ 
  initialStream = null, 
  initialCameraAvailable = false 
}: CameraScreenProps) {
  // camera variables
  const [cameraAvailable, setCameraAvailable] = useState(initialCameraAvailable);
  const [stream, setStream] = useState<MediaStream | null>(initialStream);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);
  
  // Controls states
  const [flashOn, setFlashOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { predict, model, tf, modelStatus, limaDetected, isAnalyzing, setLimaDetected } = useEndofileAi();

  // Enumerate all video inputs to allow switching between lenses
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      
      // Try to default to the rear lens (back, environment, 0.5x, etc.)
      const backCamIdx = videoInputs.findIndex(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('entorno') || 
        device.label.toLowerCase().includes('0.5x') ||
        device.label.toLowerCase().includes('ultra')
      );
      if (backCamIdx !== -1) {
        setActiveDeviceIndex(backCamIdx);
      }
    } catch (err) {
      console.warn("Failed to enumerate camera devices:", err);
    }
  };

  // Request actual camera access (as a fallback or retry)
  const requestCameraAccess = async (deviceIndex = activeDeviceIndex) => {
    try {
      // Stop any existing stream tracks first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Dynamically invert dimensions based on screen orientation to fit portrait/landscape viewports
      const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
      const idealWidth = isPortrait ? 1080 : 1920;
      const idealHeight = isPortrait ? 1920 : 1080;
      console.log("Ideal dimensions:", idealWidth, "x", idealHeight);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: idealWidth },
          height: { ideal: idealHeight }
        }
      };

      // Target the specific active device ID if populated
      if (videoDevices.length > 0 && videoDevices[deviceIndex]) {
        constraints.video = {
          deviceId: { exact: videoDevices[deviceIndex].deviceId },
          width: { ideal: idealWidth },
          height: { ideal: idealHeight }
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraAvailable(true);

      // Populate camera list now that permissions are granted
      if (videoDevices.length === 0) {
        await enumerateCameras();
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.warn('Physical camera access failed:', error);
      setCameraAvailable(false);
      setStream(null);
    }
  };

  // Toggle/cycle through available camera lenses
  const handleSwitchCamera = async () => {
    if (videoDevices.length <= 1) return;
    const nextIndex = (activeDeviceIndex + 1) % videoDevices.length;
    setActiveDeviceIndex(nextIndex);
    await requestCameraAccess(nextIndex);
  };

  // Toggle flash (torch) on/off
  const toggleFlash = async () => {
    const nextFlash = !flashOn;
    setFlashOn(nextFlash);
    
    const track = stream?.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = (track.getCapabilities() as any);
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: nextFlash }]
          } as any);
          console.log("Torch constraint applied successfully:", nextFlash);
        } else {
          console.warn("Torch/flash is not supported on this track.");
        }
      } catch (err) {
        console.error("Failed to toggle flash constraint:", err);
      }
    }
  };

  // Trigger autofocus reset / focus sweep in the middle
  const triggerRefocus = async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    
    try {
      const capabilities = (track.getCapabilities() as any);
      const constraints = track.getConstraints();
      
      if (capabilities.focusMode) {
        console.log("Exposing focus mode capability:", capabilities.focusMode);
        // Switch to single-shot manual focus to trigger sweep, then return to continuous
        await track.applyConstraints({
          ...constraints,
          advanced: [
            ...(constraints.advanced || []),
            { focusMode: 'single-shot' }
          ]
        } as any);
        
        setTimeout(async () => {
          await track.applyConstraints({
            ...constraints,
            advanced: [
              ...(constraints.advanced || []),
              { focusMode: 'continuous' }
            ]
          } as any);
          console.log("Autofocus continuous re-enabled.");
        }, 300);
      } else {
        // Fallback: re-apply the current video track constraints to force device auto-focus reset
        await track.applyConstraints(constraints);
        console.log("Autofocus triggered via constraints re-application");
      }
    } catch (err) {
      console.warn("Failed to trigger refocus constraint:", err);
    }
  };

  // useEffect block to ask for camera permissions
  useEffect(() => {
    if (!stream && cameraAvailable) {
      requestCameraAccess();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraAvailable]);

  // Update video element when stream is available or changes
  useEffect(() => {
    if (cameraAvailable && stream && videoRef.current && !selectedPhotoUrl) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraAvailable, stream, selectedPhotoUrl]);


  // Callback to capture a frame from live camera stream, freeze view, and run prediction
  const capturePhoto = async () => {
    if (isAnalyzing) return;
    
    // trigger screen flash animation
    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 150);

    const videoElement = videoRef.current;
    if (videoElement && cameraAvailable) {
      try {
        // Create canvas to capture the current video frame
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 1280;
        canvas.height = videoElement.videoHeight || 720;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setSelectedPhotoUrl(dataUrl); // Freeze viewport on captured image
        }
        // predict via context
        await predict(canvas);
      } catch (err) {
        console.error("Capture prediction error:", err);
      }
    }
  };

  // Handle local image file upload (Inference on upload)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && tf && model) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = async () => {
          try {
            setSelectedPhotoUrl(img.src); // Freeze view on uploaded image
            await predict(img);
          } catch (err) {
            console.error("Uploaded file prediction error:", err);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset current detection state and return to live camera
  const resetDetection = () => {
    setLimaDetected(null);
    setSelectedPhotoUrl(null);
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

      {/* Float Back to Live Camera button when viewing a static photo */}
      {selectedPhotoUrl && (
        <button
          type="button"
          onClick={() => {
            setSelectedPhotoUrl(null);
            setLimaDetected(null);
          }}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950/75 backdrop-blur-md border border-slate-800/80 text-xs font-semibold text-white shadow-lg cursor-pointer hover:bg-slate-900 active:scale-95 transition-all"
        >
          <span className="text-base leading-none">←</span> Volver a Cámara
        </button>
      )}

      {/* Top Header Controls (Menu, Model Status, Flash, Refocus, Fullscreen) */}
      <div className={cameraStyles.topHeader}>
        {/* Left Stack: Menu and Model Badge */}
        <div className={`${cameraStyles.leftControls} flex items-center gap-3`}>
          <button 
            type="button" 
            className={cameraStyles.iconButton}
            aria-label="Menú principal"
          >
            <MenuIcon size={22} />
          </button>
          
          <div className={cameraStyles.statusBadge}>
            <span className={modelStatus === 'ready' ? cameraStyles.statusDot : "w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"} />
            <span>modelo: {modelStatus === 'ready' ? 'EndoX IA' : '---'}</span>
          </div>
        </div>

        {/* Right Stack: Fullscreen, Flash, and Re-focus */}
        <div className={cameraStyles.rightControls}>
          <button 
            type="button"
            className={`${cameraStyles.iconButton} ${isFullscreen ? "bg-slate-800/80 border-slate-700" : ""}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label="Alternar pantalla completa"
            title="Alternar pantalla completa"
          >
            <ExpandIcon size={22} className={isFullscreen ? "rotate-45" : ""} />
          </button>

          <button 
            type="button"
            className={`${cameraStyles.iconButton} ${flashOn ? cameraStyles.flashActive : ""}`}
            onClick={toggleFlash}
            aria-label="Alternar flash"
            title="Alternar flash"
            disabled={!cameraAvailable}
          >
            <FlashIcon size={22} />
          </button>

          <button 
            type="button"
            className={cameraStyles.iconButton}
            onClick={triggerRefocus}
            aria-label="Reenfocar cámara"
            title="Forzar autofoco"
            disabled={!cameraAvailable}
          >
            <FocusIcon size={22} />
          </button>
        </div>
      </div>

      {/* Viewport / Cam Area */}
      <div className={cameraStyles.viewportArea}>
        {selectedPhotoUrl ? (
          /* Show selected static endodontic file photo */
          <NextImage
            id="selected-file-preview"
            src={selectedPhotoUrl}
            fill
            className="object-cover animate-[fadeIn_0.3s_ease-out]"
            alt="Foto de la lima"
          />
        ) : cameraAvailable ? (
          <video 
            ref={videoRef}
            id="camera-preview"
            autoPlay 
            playsInline
            muted
            className={cameraStyles.videoPreview}
          />
        ) : (
          /* Premium Mock Viewfinder for previewing without physical hardware */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
            {/* Animated medical grid background */}
            <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[16px_16px]" />
            
            {/* Glowing scanline effect */}
            <div className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-[bounce_4s_infinite] opacity-40 top-1/4" />
            
            {/* Visual representation of tooth being scanned */}
            <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl border border-blue-500/10 bg-slate-900/40 backdrop-blur-sm">
              <svg className="w-32 h-32 text-blue-500/20 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C10.5 2 9 3 8 4.5 7.2 3.8 6 3.5 5 4c-1.5.8-2 2.5-2 4 0 3.5 1.5 6 2.5 8 .8 1.6 1.5 3 2 4.5.3 1 1 1.5 2 1.5.8 0 1.5-.5 1.8-1.2.3-.7.7-1.3.7-1.8 0-.5.4-.7.7-.7s.7.2.7.7c0 .5.4 1.1.7 1.8.3.7 1 1.2 1.8 1.2 1 0 1.7-.5 2-1.5.5-1.5 1.2-2.9 2-4.5 1-2 2.5-4.5 2.5-8 0-1.5-.5-3.2-2-4-.9-.5-2.2-.2-3 .5C15 3 13.5 2 12 2z" />
              </svg>
              <span className="text-xs text-slate-500 mt-4 tracking-wider text-center max-w-50">
                Simulador de cámara activo. Apunte a la lima de endodoncia.
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
              <div className="absolute inset-x-2 h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-pan-vertical" />
            )}
          </div>
        </div>
      </div>

      {/* Info Card Overlay (Lima detectada) */}
      <div className={cameraStyles.infoOverlayContainer}>
        <div className={`${cameraStyles.infoCard} ${limaDetected ? 'border-blue-500/50 bg-[#0e172a]/90' : 'border-slate-800/80'}`}>
          <div className={`${cameraStyles.infoIconContainer} ${limaDetected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
            <CheckCircleIcon size={14} className={limaDetected ? "animate-scale-in" : ""} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 leading-none mb-1">
              Detector de Limas
            </p>
            <p className={cameraStyles.infoText}>
              {isAnalyzing 
                ? "Analizando lima..." 
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
          aria-label="Subir foto de lima"
          title="Cargar foto de lima local"
        >
          <UploadIcon size={20} />
        </button>

        {/* Center: Shutter trigger - captures frame or resets view */}
        <button 
          type="button"
          onClick={selectedPhotoUrl ? resetDetection : capturePhoto}
          className={cameraStyles.shutterOuterRing}
          aria-label={selectedPhotoUrl ? "Volver a la cámara en vivo" : "Capturar foto de lima"}
          disabled={isAnalyzing || modelStatus === 'loading'}
        >
          <div className={isAnalyzing ? cameraStyles.shutterInnerCircleLoading : (selectedPhotoUrl ? "w-10 h-10 rounded-full bg-amber-500 scale-95 transition-all duration-300" : cameraStyles.shutterInnerCircle)} />
        </button>

        {/* Right: Switch camera button or layout spacer */}
        {videoDevices.length > 1 ? (
          <button 
            type="button"
            onClick={handleSwitchCamera}
            className={cameraStyles.iconButton}
            aria-label="Cambiar cámara"
            title="Cambiar lente de cámara"
          >
            <SwitchCameraIcon size={20} />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}
      </div>
    </div>
  );
}
