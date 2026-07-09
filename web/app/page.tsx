"use client";
import { useState, useEffect } from 'react';
import LoadingScreen from "@/app/components/loading-screen";
import CameraScreen from "@/app/components/camera-screen";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAway, setFadeAway] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  const transitionToCamera = () => {
    setFadeAway(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  const handlePermissionGranted = (stream: MediaStream) => {
    setCameraStream(stream);
    setCameraAvailable(true);
    transitionToCamera();
  };

  const handleSimulatorMode = () => {
    setCameraStream(null);
    setCameraAvailable(false);
    transitionToCamera();
  };

  if (isLoading) {
    return (
      <div className={`w-full h-screen h-dvh overflow-hidden transition-opacity duration-300 ${fadeAway ? 'opacity-0' : 'opacity-100'}`}>
        <LoadingScreen 
          onPermissionGranted={handlePermissionGranted} 
          onSimulatorMode={handleSimulatorMode} 
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen h-dvh overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <CameraScreen 
        initialStream={cameraStream} 
        initialCameraAvailable={cameraAvailable} 
      />
    </div>
  );
}
