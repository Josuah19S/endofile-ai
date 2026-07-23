"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useEndofileAi } from "@/app/components/endofile-model-context";
import CameraScreenShell from './camera-screen-shell';

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

  // Controls & Tap Focus states
  const [flashOn, setFlashOn] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const [showTapFocus, setShowTapFocus] = useState(false);
  const tapFocusTimer = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { predict, modelStatus, limaDetected, isAnalyzing, setLimaDetected } = useEndofileAi();

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
        }, 300);
      } else {
        await track.applyConstraints(constraints);
      }
    } catch (err) {
      console.warn("Failed to trigger refocus constraint:", err);
    }
  };

  // Tap to focus handler on video viewport
  const handleViewportTap = () => {
    if (!cameraAvailable) return;
    triggerRefocus();

    setShowTapFocus(true);
    if (tapFocusTimer.current) clearTimeout(tapFocusTimer.current);
    tapFocusTimer.current = setTimeout(() => {
      setShowTapFocus(false);
    }, 1000);
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
    setTimeout(() => setShowFlashOverlay(false), 200);

    if (videoRef.current && cameraAvailable) {
      const videoElement = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const capturedDataUrl = canvas.toDataURL('image/jpeg');
        setSelectedPhotoUrl(capturedDataUrl);
      }
      await predict(videoElement);
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
            setSelectedPhotoUrl(img.src);
            await predict(img);
          } catch (err) {
            console.error("Uploaded file prediction error:", err);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset current detection & return to live camera feed
  const resetDetection = () => {
    setLimaDetected(null);
    setSelectedPhotoUrl(null);
  };

  return (
    <CameraScreenShell
      videoRef={videoRef}
      fileInputRef={fileInputRef}
      cameraAvailable={cameraAvailable}
      selectedPhotoUrl={selectedPhotoUrl}
      showFlashOverlay={showFlashOverlay}
      showTapFocus={showTapFocus}
      modelStatus={modelStatus}
      limaDetected={limaDetected}
      isAnalyzing={isAnalyzing}
      controlsHidden={controlsHidden}
      flashOn={flashOn}
      hasMultipleCameras={videoDevices.length > 1}
      onViewportTap={handleViewportTap}
      onToggleControls={setControlsHidden}
      onToggleFlash={toggleFlash}
      onSwitchCamera={handleSwitchCamera}
      onFileSelect={handleFileSelect}
      onCaptureOrReset={selectedPhotoUrl ? resetDetection : capturePhoto}
      onResetDetection={resetDetection}
      onBackToCamera={() => setSelectedPhotoUrl(null)}
    />
  );
}
