"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useEndofileAi } from './endofile-model-context';
import { createScanId } from '@/app/lib/history-store';
import { isMobileDevice } from '@/app/lib/device-detection';
import {
  validateAllImages,
  ImageValidationResults,
  DEFAULT_VALIDATION_CONFIG,
  ValidationConfig,
} from '@/app/lib/image-validations';

/**
 * Torch, focus, and zoom control are MediaTrack extensions that lib.dom does not declare yet,
 * so the standard types are widened here instead of casting call sites to `any`.
 */
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
  zoom?: { min?: number; max?: number; step?: number };
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
  zoom?: number;
}

interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  advanced?: ExtendedMediaTrackConstraintSet[];
}

export interface CameraContextType {
  cameraAvailable: boolean;
  stream: MediaStream | null;
  selectedPhotoUrl: string | null;
  videoDevices: MediaDeviceInfo[];
  activeDeviceIndex: number;
  flashOn: boolean;
  showFlashOverlay: boolean;
  showTapFocus: boolean;
  isCameraPaused: boolean;

  zoom: number;
  minZoom: number;
  maxZoom: number;
  stepZoom: number;
  hasHardwareZoom: boolean;
  applyZoom: (zoom: number) => Promise<void>;

  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  requestCameraAccess: (deviceIndex?: number) => Promise<void>;
  handleSwitchCamera: () => Promise<void>;
  toggleFlash: () => Promise<void>;
  triggerRefocus: () => Promise<void>;
  handleViewportTap: () => void;
  capturePhoto: () => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetDetection: () => void;
  setSelectedPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  toggleCameraPause: () => void;

  /**
   * Lock in the doctor's choice as the final detection. Takes the picked
   * class id; the captured photo is supplied by the camera context.
   * No-op if no photo has been captured.
   */
  lockInDetection: (classId: string) => void;
  /** True when a prediction has run but the doctor has not yet confirmed a candidate. */
  pendingConfirmation: boolean;

  recentsExpanded: boolean;
  setRecentsExpanded: React.Dispatch<React.SetStateAction<boolean>>;

  validationResults: ImageValidationResults | null;
  validationConfig: ValidationConfig;
  setValidationConfig: React.Dispatch<React.SetStateAction<ValidationConfig>>;

  showUserGuide: boolean;
  setShowUserGuide: React.Dispatch<React.SetStateAction<boolean>>;
}

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraContextProvider({
  children,
  initialStream = null,
  initialCameraAvailable = false,
}: {
  children: React.ReactNode;
  initialStream?: MediaStream | null;
  initialCameraAvailable?: boolean;
}) {
  const [cameraAvailable, setCameraAvailable] = useState(initialCameraAvailable);
  const [stream, setStream] = useState<MediaStream | null>(initialStream);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);

  const [flashOn, setFlashOn] = useState(false);
  const [showTapFocus, setShowTapFocus] = useState(false);
  const [isCameraPaused, setIsCameraPaused] = useState(false);
  const tapFocusTimer = useRef<NodeJS.Timeout | null>(null);

  // Zoom management (Hardware Zoom API with Digital Crop Fallback)
  const [zoom, setZoom] = useState<number>(1.0);
  const [minZoom, setMinZoom] = useState<number>(1.0);
  const [maxZoom, setMaxZoom] = useState<number>(3.5);
  const [stepZoom, setStepZoom] = useState<number>(0.1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);

  const [recentsExpanded, setRecentsExpanded] = useState(false);
  const [validationResults, setValidationResults] = useState<ImageValidationResults | null>(null);
  const [validationConfig, setValidationConfig] = useState<ValidationConfig>(DEFAULT_VALIDATION_CONFIG);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const isFirstCameraLoad = useRef(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Latest stream, so teardown never acts on a stale render-time closure
  const streamRef = useRef<MediaStream | null>(initialStream);

  const { predict, isAnalyzing, setLimaDetected, addScanHistoryItem, confirmCandidate, pendingConfirmation, debug } = useEndofileAi();

  const checkZoomCapabilities = (newStream: MediaStream) => {
    const track = newStream.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
      if (capabilities.zoom) {
        setHasHardwareZoom(true);
        const min = capabilities.zoom.min || 1.0;
        const max = Math.min(capabilities.zoom.max || 5.0, 5.0);
        const step = capabilities.zoom.step || 0.1;
        setMinZoom(min);
        setMaxZoom(max);
        setStepZoom(step);
      } else {
        setHasHardwareZoom(false);
        setMinZoom(1.0);
        setMaxZoom(3.5);
        setStepZoom(0.1);
      }
    } catch {
      setHasHardwareZoom(false);
      setMinZoom(1.0);
      setMaxZoom(3.5);
      setStepZoom(0.1);
    }
  };

  const applyZoom = async (newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(newZoom, maxZoom));
    const rounded = Math.round(clamped * 10) / 10;
    setZoom(rounded);

    if (hasHardwareZoom && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: rounded }],
          } as ExtendedMediaTrackConstraints);
        } catch (err) {
          if (debug) console.warn("Failed to apply hardware zoom, falling back to digital crop:", err);
          setHasHardwareZoom(false);
        }
      }
    }
  };

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Enumerate all video inputs to allow switching between lenses
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (err) {
      if (debug) console.warn("Could not enumerate camera devices:", err);
    }
  };

  useEffect(() => {
    enumerateCameras();
  }, []);

  // Helper to safely get user media with fallback cascade
  const obtainCameraStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (primaryErr) {
      if (debug) console.warn("Primary camera constraint failed, attempting fallback:", primaryErr);
      
      // Fallback 1: Ideal facingMode instead of exact deviceId
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: false,
        });
      } catch (fallbackErr1) {
        if (debug) console.warn("FacingMode fallback failed, attempting basic video:", fallbackErr1);
        
        // Fallback 2: Basic video constraint
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
    }
  };

  // Request user camera stream with specific device index or facing mode
  const requestCameraAccess = async (targetFacingOrIndex?: 'environment' | 'user' | number) => {
    try {
      let targetConstraints: MediaTrackConstraints;
      let nextFacing = facingMode;

      if (targetFacingOrIndex === 'environment' || targetFacingOrIndex === 'user') {
        nextFacing = targetFacingOrIndex;
        targetConstraints = {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        };
      } else if (typeof targetFacingOrIndex === 'number' && videoDevices[targetFacingOrIndex]?.deviceId) {
        const devId = videoDevices[targetFacingOrIndex].deviceId;
        targetConstraints = {
          deviceId: { exact: devId },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        };
        setActiveDeviceIndex(targetFacingOrIndex);
      } else {
        targetConstraints = {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        };
      }

      const newStream = await obtainCameraStream({
        video: targetConstraints,
        audio: false,
      });

      // Stop previous stream only after the new stream is successfully created
      if (streamRef.current && streamRef.current !== newStream) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setStream(newStream);
      streamRef.current = newStream;
      setCameraAvailable(true);
      setFacingMode(nextFacing);
      checkZoomCapabilities(newStream);

      // Re-enumerate devices with the newly granted permissions to populate device labels
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
      } catch {}

      if (isFirstCameraLoad.current) {
        setShowUserGuide(true);
        isFirstCameraLoad.current = false;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => { });
      }
    } catch (err) {
      if (debug) console.warn("Camera access denied or failed:", err);
      const hasLiveStream = streamRef.current?.getTracks().some(track => track.readyState === 'live') ?? false;
      if (!hasLiveStream) {
        setCameraAvailable(false);
      }
    }
  };

  // Cycle to next available camera lens or toggle between front/back
  const handleSwitchCamera = async () => {
    if (videoDevices.length > 1) {
      const nextIndex = (activeDeviceIndex + 1) % videoDevices.length;
      await requestCameraAccess(nextIndex);
    } else {
      const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
      await requestCameraAccess(nextFacing);
    }
  };

  // Toggle flash/torch on environment camera
  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
      if (capabilities.torch) {
        const nextState = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        } as ExtendedMediaTrackConstraints);
        setFlashOn(nextState);
      } else {
        if (debug) console.warn("Torch capability is not supported on this device track.");
      }
    } catch (err) {
      if (debug) console.warn("Failed to toggle torch:", err);
    }
  };

  // Programmatic refocus call
  const triggerRefocus = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        const constraints = { advanced: [{ focusMode: 'continuous' }] } as ExtendedMediaTrackConstraints;
        if (capabilities.focusMode.includes('single-shot')) {
          await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] } as ExtendedMediaTrackConstraints);
          setTimeout(async () => {
            await track.applyConstraints(constraints);
          }, 300);
        } else {
          await track.applyConstraints(constraints);
        }
      }
    } catch (err) {
      if (debug) console.warn("Failed to trigger refocus constraint:", err);
    }
  };

  // Tap to focus on video viewport
  const handleViewportTap = () => {
    if (!cameraAvailable) return;
    triggerRefocus();

    setShowTapFocus(true);
    if (tapFocusTimer.current) clearTimeout(tapFocusTimer.current);
    tapFocusTimer.current = setTimeout(() => {
      setShowTapFocus(false);
    }, 1000);
  };

  // Toggle camera pause/resume with hybrid strategy
  const toggleCameraPause = async () => {
    const isMobile = isMobileDevice();

    if (isCameraPaused) {
      if (isMobile) {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
      } else {
        try {
          await requestCameraAccess(activeDeviceIndex);
        } catch (err) {
          if (debug) console.warn('Failed to resume camera:', err);
        }
      }
    } else {
      if (isMobile) {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } else {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }

    setIsCameraPaused(!isCameraPaused);
  };

  const requestCameraAccessRef = useRef(requestCameraAccess);

  useEffect(() => {
    streamRef.current = stream;
    requestCameraAccessRef.current = requestCameraAccess;
  });

  // Periodic 1-second async image quality validation loop for live camera stream
  useEffect(() => {
    if (!stream || isCameraPaused || selectedPhotoUrl) return;

    let isMounted = true;
    let isValidating = false;

    const intervalId = setInterval(async () => {
      if (!isMounted || isValidating || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.paused || video.ended) return;

      try {
        isValidating = true;
        const valResults = await validateAllImages(video, validationConfig);
        if (isMounted && !selectedPhotoUrl) {
          setValidationResults(valResults);
        }
      } catch {
        // Silent catch for live stream validation loop
      } finally {
        isValidating = false;
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [stream, isCameraPaused, selectedPhotoUrl, validationConfig]);

  useEffect(() => {
    // If an initial live stream from LoadingScreen already exists, use it without re-requesting
    const activeStream = streamRef.current;
    const hasLiveStream = activeStream?.getTracks().some(track => track.readyState === 'live') ?? false;

    if (hasLiveStream && activeStream) {
      checkZoomCapabilities(activeStream);
      if (videoRef.current && videoRef.current.srcObject !== activeStream) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.play().catch(() => { });
      }
    } else if (cameraAvailable) {
      requestCameraAccessRef.current();
    }

    return () => {
      // Clean up media tracks when session is torn down
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraAvailable && stream && videoRef.current && !selectedPhotoUrl) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => { });
    }
  }, [cameraAvailable, stream, selectedPhotoUrl]);

  // Calculate 3:4 aspect ratio crop bounds centered on source dimensions
  const get3by4CropBounds = (width: number, height: number) => {
    let cropW = width;
    let cropH = width * (4 / 3);

    if (cropH > height) {
      cropH = height;
      cropW = height * (3 / 4);
    }

    const sx = (width - cropW) / 2;
    const sy = (height - cropH) / 2;

    return { sx, sy, cropW, cropH };
  };

  /**
   * Render the same 3:4 crop into two canvases off the same source bounds:
   *   - displayCanvas: 480x640, aspect preserved, what the user sees and what
   *     gets saved into history.
   *   - modelCanvas:   448x448, the 3:4 crop squished into 1:1, what the
   *     TensorFlow.js graph expects (see endofile-model-context.tsx).
   *
   * Supports hardware zoom (already framed by sensor) and digital crop zoom (scaled from center).
   */
  const buildCaptureArtifacts = (
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
  ): { displayDataUrl: string; modelCanvas: HTMLCanvasElement } | null => {
    const { sx, sy, cropW, cropH } = get3by4CropBounds(sourceWidth, sourceHeight);

    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = 480;
    displayCanvas.height = 640;
    const displayCtx = displayCanvas.getContext('2d');
    if (!displayCtx) return null;

    const modelCanvas = document.createElement('canvas');
    modelCanvas.width = 448;
    modelCanvas.height = 448;
    const modelCtx = modelCanvas.getContext('2d');
    if (!modelCtx) return null;

    // If using digital zoom fallback (not hardware zoom) and zoom > 1:
    const effectiveZoom = hasHardwareZoom ? 1.0 : Math.max(1.0, zoom);
    const finalCropW = cropW / effectiveZoom;
    const finalCropH = cropH / effectiveZoom;
    const finalSx = sx + (cropW - finalCropW) / 2;
    const finalSy = sy + (cropH - finalCropH) / 2;

    displayCtx.drawImage(source, finalSx, finalSy, finalCropW, finalCropH, 0, 0, 480, 640);
    modelCtx.drawImage(source, finalSx, finalSy, finalCropW, finalCropH, 0, 0, 448, 448);

    if (debug) {
      const debugData = modelCtx.getImageData(0, 0, 10, 1).data;
      const debugCenter = modelCtx.getImageData(200, 200, 10, 1).data;
      console.log('[Debug Canvas] Esquina superior izq:', Array.from(debugData));
      console.log('[Debug Canvas] Centro del canvas:', Array.from(debugCenter));
      console.log('[Debug Canvas] cropW:', finalCropW, 'cropH:', finalCropH, 'zoom:', zoom, 'hasHardwareZoom:', hasHardwareZoom);
    }

    return {
      displayDataUrl: displayCanvas.toDataURL('image/jpeg'),
      modelCanvas,
    };
  };

  // Capture frame from camera stream, VALIDATE, then predict
  const capturePhoto = async () => {
    if (isAnalyzing) return;

    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 200);

    if (!videoRef.current || !cameraAvailable) {
      if (debug) console.warn("[Camera] capturePhoto called with no active video stream.");
      setLimaDetected('Error al analizar');
      return;
    }

    const videoElement = videoRef.current;
    const vw = videoElement.videoWidth || 640;
    const vh = videoElement.videoHeight || 480;

    const artifacts = buildCaptureArtifacts(videoElement, vw, vh);
    if (!artifacts) return;

    // New capture supersedes the previous prediction.
    setLimaDetected(null);
    setSelectedPhotoUrl(artifacts.displayDataUrl);

    // 1. Run independent validations
    const valResults = await validateAllImages(artifacts.modelCanvas, validationConfig);
    setValidationResults(valResults);

    if (debug && valResults.hasErrors) {
      console.warn("[Validation Gate] Photo has quality warnings:", valResults.warnings);
    }

    // 2. Proceed with model prediction, then persist the top candidate
    const topN = await predict(artifacts.modelCanvas);
    const top = topN[0];
    if (top && top.classId !== 'Lima no identificada') {
      addScanHistoryItem({
        id: createScanId(),
        classId: top.classId,
        photoUrl: artifacts.displayDataUrl,
        timestamp: Date.now(),
      });
    }
  };

  // Predict on uploaded custom image file with 3:4 crop & pre-validations
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = async () => {
        if (debug) {
          console.log('[Debug] Image loaded:', img.naturalWidth, img.naturalHeight);
          const testCanvas = document.createElement('canvas');
          testCanvas.width = 10;
          testCanvas.height = 10;
          const testCtx = testCanvas.getContext('2d');
          testCtx?.drawImage(img, 0, 0, 10, 10);
          try {
            const testData = testCtx?.getImageData(0, 0, 10, 10);
            console.log('[Debug] Canvas NOT tainted, first pixel:', testData?.data.slice(0, 4));
          } catch (err) {
            console.log('[Debug] Canvas IS tainted (CORS):', err);
          }
        }

        try {          
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;

          const artifacts = buildCaptureArtifacts(img, iw, ih);
          if (!artifacts) return;

          setLimaDetected(null);
          setSelectedPhotoUrl(artifacts.displayDataUrl);

          // 1. Run independent validations
          const valResults = await validateAllImages(artifacts.modelCanvas, validationConfig);
          setValidationResults(valResults);

          if (debug && valResults.hasErrors) {
            console.warn("[Validation Gate] Uploaded file has quality warnings:", valResults.warnings);
          }

          // 2. Proceed with model prediction and auto-save the top
          const topN = await predict(artifacts.modelCanvas);
          const top = topN[0];
          if (top && top.classId !== 'Lima no identificada') {
            addScanHistoryItem({
              id: createScanId(),
              classId: top.classId,
              photoUrl: artifacts.displayDataUrl,
              timestamp: Date.now(),
            });
          }
        } catch (err) {
          if (debug) console.error("Uploaded file prediction error:", err);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const resetDetection = () => {
    setLimaDetected(null);
    setSelectedPhotoUrl(null);
    setValidationResults(null);
  };

  /**
   * Lock in the doctor's pick as the detection result. Thin wrapper around the
   * model context's confirmCandidate that supplies the captured frame as the
   * photoUrl for history persistence.
   */
  const lockInDetection = (classId: string) => {
    if (!selectedPhotoUrl) return;
    confirmCandidate(classId, selectedPhotoUrl);
  };

  return (
    <CameraContext.Provider value={{
      cameraAvailable,
      stream,
      selectedPhotoUrl,
      videoDevices,
      activeDeviceIndex,
      flashOn,
      showFlashOverlay,
      showTapFocus,
      isCameraPaused,
      zoom,
      minZoom,
      maxZoom,
      stepZoom,
      hasHardwareZoom,
      applyZoom,
      videoRef,
      fileInputRef,
      requestCameraAccess,
      handleSwitchCamera,
      toggleFlash,
      triggerRefocus,
      handleViewportTap,
      capturePhoto,
      handleFileSelect,
      resetDetection,
      setSelectedPhotoUrl,
      toggleCameraPause,
      lockInDetection,
      pendingConfirmation,
      recentsExpanded,
      setRecentsExpanded,
      validationResults,
      validationConfig,
      setValidationConfig,
      showUserGuide,
      setShowUserGuide,
    }}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraContextProvider');
  }
  return context;
}
