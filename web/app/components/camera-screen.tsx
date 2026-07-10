"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cameraStyles } from '../styles/camera-styles';
import { UploadIcon, CheckCircleIcon } from './icons';
import { useEndofileAi } from "@/app/components/model-provider";
import Image from "next/image";


// Model classes as specified by the user
const FILE_CLASSES = [
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50',
  're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1', 're-treaty_4-shapy2', 're-treaty_5-shapy3',
  's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3'
];

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
  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);

  const { predict } = useEndofileAi()

  // TensorFlow States
  const [tf, setTf] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  
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
      // get camera
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraAvailable(true);
      // update camera if there was already one being used
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (cameraAvailable && stream && videoRef.current && !selectedPhotoUrl) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraAvailable, stream, selectedPhotoUrl]);



  // 3. Capture frame from live camera stream, freeze view, and run prediction
  const capturePhoto = async () => {
    if (isAnalyzing) return;
    
    // Trigger screen flash animation
    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 150);

    setIsAnalyzing(true);
    setLimaDetected(null);

    // extract video element and start the processing
    const videoElement = videoRef.current;
    if (videoElement && cameraAvailable && tf && model) {
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

        await predict(canvas)
      } catch (err) {
        console.error("Capture prediction error:", err);
        setLimaDetected("Error al analizar");
      } finally {
        setIsAnalyzing(false);
      }
    }
    /*
    else {
      // Mock Fallback if camera is simulated/permission-denied
      setTimeout(() => {
        const randomLima = FILE_CLASSES[Math.floor(Math.random() * FILE_CLASSES.length)];
        setSelectedPhotoUrl('/model_test/1783529426027.jpg');
        setLimaDetected(randomLima);
        setScanHistory(prev => [randomLima, ...prev.slice(0, 9)]);
        setIsAnalyzing(false);
      }, 1500);
    }
    */
  };

  // Handle local image file upload (Inference on upload)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && tf && model) {
      setIsAnalyzing(true);
      setLimaDetected(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = async () => {
          try {
            await predict(img)
          } catch (err) {
            console.error("Uploaded file prediction error:", err);
            setLimaDetected("Error al analizar archivo");
          } finally {
            setIsAnalyzing(false);
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

      {/* Model loading status indicator */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/70 backdrop-blur-md border border-slate-800/60 text-xs font-medium text-slate-300 shadow-lg">
        <span className={`w-2 h-2 rounded-full ${
          modelStatus === 'ready' ? 'bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]' :
          modelStatus === 'loading' ? 'bg-amber-400 animate-spin border-t-transparent border-2' : 'bg-red-500'
        }`} />
        <span>
          {modelStatus === 'ready' ? 'EndoX IA' :
           modelStatus === 'loading' ? 'Cargando IA...' : 'Error de IA'}
        </span>
      </div>

      {/* Viewport / Cam Area */}
      <div className={cameraStyles.viewportArea}>
        {selectedPhotoUrl ? (
          /* Show selected static endodontic file photo */
          <Image
            id="selected-file-preview"
            src={selectedPhotoUrl}
            className="w-full h-full object-cover animate-[fadeIn_0.3s_ease-out]"
            alt="Foto de la lima"
          />
        ) : cameraAvailable ? (
          <video 
            ref={videoRef}
            id="camera-preview"
            autoPlay 
            playsInline
            muted
            className={`${cameraStyles.videoPreview} object-cover`}
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
              <span className="text-xs text-slate-500 mt-4 tracking-wider text-center max-w-[200px]">
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

        {/* Right: Layout spacer to maintain symmetry */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}
