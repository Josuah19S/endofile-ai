"use client";
import { useState } from 'react';
import LoadingScreen from "@/app/components/camera/loading-screen";
import CameraScreen from "@/app/components/camera/camera-screen";
import { EndofileContextProvider } from "@/app/contexts/endofile-model-context";
import { ImageValidationProvider } from '@/app/contexts/image-validation-context';
import type { ModelVersion } from '@/app/constants/endofile-models';

interface ModelScannerPageProps {
  version?: ModelVersion;
}

export default function ModelScannerPage({ version = 'v2' }: ModelScannerPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAway, setFadeAway] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  // Callback to delay showing camera until transition completes
  const transitionToCamera = () => {
    setFadeAway(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  // Handle camera permission granted
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
    <div className="w-full h-full min-h-0 overflow-hidden animate-fade-in flex flex-col">
      <EndofileContextProvider version={version}>
        <ImageValidationProvider>
          <CameraScreen
            initialStream={cameraStream}
            initialCameraAvailable={cameraAvailable}
          />
        </ImageValidationProvider>
      </EndofileContextProvider>
    </div>
  );
}
