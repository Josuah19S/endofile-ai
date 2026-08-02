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
 * Torch and focus control are MediaTrack extensions that lib.dom does not declare yet,
 * so the standard types are widened here instead of casting call sites to `any`.
 */
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
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

  recentsExpanded: boolean;
  setRecentsExpanded: React.Dispatch<React.SetStateAction<boolean>>;

  validationResults: ImageValidationResults | null;
  validationConfig: ValidationConfig;
  setValidationConfig: React.Dispatch<React.SetStateAction<ValidationConfig>>;
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

  const [recentsExpanded, setRecentsExpanded] = useState(false);
  const [validationResults, setValidationResults] = useState<ImageValidationResults | null>(null);
  const [validationConfig, setValidationConfig] = useState<ValidationConfig>(DEFAULT_VALIDATION_CONFIG);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Latest stream, so teardown never acts on a stale render-time closure
  const streamRef = useRef<MediaStream | null>(initialStream);

  const { predict, isAnalyzing, setLimaDetected, addScanHistoryItem } = useEndofileAi();

  // Enumerate all video inputs to allow switching between lenses
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (err) {
      console.warn("Could not enumerate camera devices:", err);
    }
  };

  useEffect(() => {
    enumerateCameras();
  }, []);

  // Request user camera stream with specific device index
  const requestCameraAccess = async (deviceIndex: number = 0) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);

      const targetDevice = videoInputs[deviceIndex];
      const videoConstraints: MediaTrackConstraints = targetDevice?.deviceId
        ? { deviceId: { exact: targetDevice.deviceId } }
        : { facingMode: 'environment' };

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      setStream(newStream);
      setCameraAvailable(true);
      setActiveDeviceIndex(deviceIndex);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => { });
      }
    } catch (err) {
      console.warn("Camera access denied or failed:", err);
      setCameraAvailable(false);
    }
  };

  // Cycle to next available camera lens
  const handleSwitchCamera = async () => {
    if (videoDevices.length <= 1) return;
    const nextIndex = (activeDeviceIndex + 1) % videoDevices.length;
    await requestCameraAccess(nextIndex);
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
        console.warn("Torch capability is not supported on this device track.");
      }
    } catch (err) {
      console.warn("Failed to toggle torch:", err);
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
      console.warn("Failed to trigger refocus constraint:", err);
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
          console.warn('Failed to resume camera:', err);
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

  useEffect(() => {
    if (!cameraAvailable) return;

    const hasLiveStream = streamRef.current?.getTracks().some(track => track.readyState === 'live') ?? false;
    if (!hasLiveStream) {
      requestCameraAccessRef.current();
    }

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [cameraAvailable]);

  useEffect(() => {
    if (cameraAvailable && stream && videoRef.current && !selectedPhotoUrl) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => { });
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

  // Capture frame from camera stream, VALIDATE, then predict
  const capturePhoto = async () => {
    if (isAnalyzing) return;

    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 200);

    if (videoRef.current && cameraAvailable) {
      const videoElement = videoRef.current;
      const vw = videoElement.videoWidth || 640;
      const vh = videoElement.videoHeight || 480;

      const { sx, sy, cropW, cropH } = get3by4CropBounds(vw, vh);

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, sx, sy, cropW, cropH, 0, 0, 480, 480);
        const capturedDataUrl = canvas.toDataURL('image/jpeg');
        setSelectedPhotoUrl(capturedDataUrl);

        // 1. Run independent validations BEFORE sending to model
        const valResults = await validateAllImages(canvas, validationConfig);
        setValidationResults(valResults);

        if (valResults.hasErrors) {
          console.warn("[Validation Gate] Photo has quality warnings:", valResults.warnings);
        }

        // 2. Proceed with model prediction
        const top3 = await predict(canvas);
        if (top3 && top3.length > 0) {
          addScanHistoryItem({
            id: createScanId(),
            classId: top3[0].classId,
            photoUrl: capturedDataUrl,
            timestamp: Date.now(),
          });
        }
      }
    } else {
      setLimaDetected('mg3-blue_1-sv');
    }
  };

  // Predict on uploaded custom image file with 3:4 crop & pre-validations
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          try {
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;

            const { sx, sy, cropW, cropH } = get3by4CropBounds(iw, ih);

            const canvas = document.createElement('canvas');
            canvas.width = 480;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, 480, 480);
              const croppedDataUrl = canvas.toDataURL('image/jpeg');
              setSelectedPhotoUrl(croppedDataUrl);

              // 1. Run independent validations BEFORE sending to model
              const valResults = await validateAllImages(canvas, validationConfig);
              setValidationResults(valResults);

              if (valResults.hasErrors) {
                console.warn("[Validation Gate] Uploaded file has quality warnings:", valResults.warnings);
              }

              // 2. Proceed with model prediction
              const top3 = await predict(canvas);
              if (top3 && top3.length > 0) {
                addScanHistoryItem({
                  id: createScanId(),
                  classId: top3[0].classId,
                  photoUrl: croppedDataUrl,
                  timestamp: Date.now(),
                });
              }
            }
          } catch (err) {
            console.error("Uploaded file prediction error:", err);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const resetDetection = () => {
    setLimaDetected(null);
    setSelectedPhotoUrl(null);
    setValidationResults(null);
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
      recentsExpanded,
      setRecentsExpanded,
      validationResults,
      validationConfig,
      setValidationConfig,
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
