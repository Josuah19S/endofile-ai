"use client";
import { CameraContextProvider } from '../../contexts/camera-context';
import CameraScreenShell from './camera-screen-shell';

interface CameraScreenProps {
  initialStream?: MediaStream | null;
  initialCameraAvailable?: boolean;
}

export default function CameraScreen({
  initialStream = null,
  initialCameraAvailable = false
}: CameraScreenProps) {
  return (
    <CameraContextProvider
      initialStream={initialStream}
      initialCameraAvailable={initialCameraAvailable}
    >
      <CameraScreenShell />
    </CameraContextProvider>
  );
}
