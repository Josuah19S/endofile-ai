"use client";
import { useState } from 'react';
import LoadingScreen from "@/app/components/loading-screen";
import CameraScreen from "@/app/components/camera-screen";
import { EndofileContextProvider } from "@/app/components/model-provider";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAway, setFadeAway] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  // callback to take a delay to show the camera
  const transitionToCamera = () => {
    setFadeAway(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  // handle camera permission granted
  const handlePermissionGranted = (stream: MediaStream) => {
    setCameraStream(stream);
    setCameraAvailable(true);
    transitionToCamera();
  };

  if (isLoading) {
    return (
      <div className={`w-full h-full overflow-hidden transition-opacity duration-300 ${fadeAway ? 'opacity-0' : 'opacity-100'}`}>
        <LoadingScreen 
          onPermissionGranted={handlePermissionGranted}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden animate-fade-in">
      <EndofileContextProvider>
        <CameraScreen
          initialStream={cameraStream}
          initialCameraAvailable={cameraAvailable}
        />
      </EndofileContextProvider>
    </div>
  );
}
