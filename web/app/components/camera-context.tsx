"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useEndofileAi } from './endofile-model-context';
import { createScanId } from '@/app/lib/history-store';
import { isMobileDevice } from '@/app/lib/device-detection';

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
  setRecentsExpanded: React.Dispatch<React.SetStateAction<boolean>>
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

      // Default to rear camera lens if available
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

  // Request camera access
  const requestCameraAccess = async (deviceIndex = activeDeviceIndex) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
      const idealWidth = isPortrait ? 1080 : 1920;
      const idealHeight = isPortrait ? 1920 : 1080;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: idealWidth },
          height: { ideal: idealHeight }
        }
      };

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

      if (videoDevices.length === 0) {
        await enumerateCameras();
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => { });
      }
    } catch (error) {
      console.warn('Physical camera access failed:', error);
      setCameraAvailable(false);
      setStream(null);
    }
  };

  // Switch camera lens
  const handleSwitchCamera = async () => {
    if (videoDevices.length <= 1) return;
    const nextIndex = (activeDeviceIndex + 1) % videoDevices.length;
    setActiveDeviceIndex(nextIndex);
    await requestCameraAccess(nextIndex);
  };

  // Toggle flash (torch)
  const toggleFlash = async () => {
    const nextFlash = !flashOn;
    setFlashOn(nextFlash);

    const track = stream?.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: nextFlash }]
          } as ExtendedMediaTrackConstraints);
        }
      } catch (err) {
        console.error("Failed to toggle flash constraint:", err);
      }
    }
  };

  // Trigger autofocus reset
  const triggerRefocus = async () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
      const constraints = track.getConstraints() as ExtendedMediaTrackConstraints;

      if (capabilities.focusMode) {
        await track.applyConstraints({
          ...constraints,
          advanced: [
            ...(constraints.advanced || []),
            { focusMode: 'single-shot' }
          ]
        } as ExtendedMediaTrackConstraints);

        setTimeout(async () => {
          await track.applyConstraints({
            ...constraints,
            advanced: [
              ...(constraints.advanced || []),
              { focusMode: 'continuous' }
            ]
          } as ExtendedMediaTrackConstraints);
        }, 300);
      } else {
        await track.applyConstraints(constraints);
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
      // Resuming camera
      if (isMobile) {
        // Mobile: Quick resume using pause/play
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
      } else {
        // Desktop: Full stream restart for reliability
        try {
          await requestCameraAccess(activeDeviceIndex);
        } catch (err) {
          console.warn('Failed to resume camera:', err);
        }
      }
    } else {
      // Pausing camera
      if (isMobile) {
        // Mobile: Just pause video
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } else {
        // Desktop: Stop stream completely to free resources
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

  // Latest acquisition callback, kept out of the lifecycle effect's dependency list
  const requestCameraAccessRef = useRef(requestCameraAccess);

  // Keep the refs in sync with the current stream and acquisition callback. Pinning the
  // callback here lets the lifecycle effect below depend on `cameraAvailable` alone:
  // depending on the function itself would re-run it on every render, and its teardown
  // would stop the camera it had just acquired.
  useEffect(() => {
    streamRef.current = stream;
    requestCameraAccessRef.current = requestCameraAccess;
  });

  // Own the camera for as long as the provider stays mounted
  useEffect(() => {
    if (!cameraAvailable) return;

    // StrictMode remounts this effect in development, running the teardown below between
    // both mounts and ending the tracks handed over by the loading screen. Gating on the
    // track state instead of `stream !== null` makes the second mount re-acquire the
    // camera rather than hold a dead stream, which rendered as a black viewport in dev.
    const hasLiveStream = streamRef.current?.getTracks().some(track => track.readyState === 'live') ?? false;
    if (!hasLiveStream) {
      requestCameraAccessRef.current();
    }

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [cameraAvailable]);

  // Sync video element with stream
  useEffect(() => {
    if (cameraAvailable && stream && videoRef.current && !selectedPhotoUrl) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => { });
    }
  }, [cameraAvailable, stream, selectedPhotoUrl]);

  // Capture frame from camera stream with 1:1 center-square crop
  const capturePhoto = async () => {
    if (isAnalyzing) return;

    setShowFlashOverlay(true);
    setTimeout(() => setShowFlashOverlay(false), 200);

    if (videoRef.current && cameraAvailable) {
      const videoElement = videoRef.current;
      const vw = videoElement.videoWidth || 640;
      const vh = videoElement.videoHeight || 480;

      const cropSize = Math.min(vw, vh);
      const sx = (vw - cropSize) / 2;
      const sy = (vh - cropSize) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 384;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, sx, sy, cropSize, cropSize, 0, 0, 384, 384);
        const capturedDataUrl = canvas.toDataURL('image/jpeg');
        setSelectedPhotoUrl(capturedDataUrl);
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

  // Predict on uploaded custom image file
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
            const cropSize = Math.min(iw, ih);
            const sx = (iw - cropSize) / 2;
            const sy = (ih - cropSize) / 2;

            const canvas = document.createElement('canvas');
            canvas.width = 384;
            canvas.height = 384;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 384, 384);
              const croppedDataUrl = canvas.toDataURL('image/jpeg');
              setSelectedPhotoUrl(croppedDataUrl);
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
      setRecentsExpanded
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
