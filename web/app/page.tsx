"use client";
import { useState, useEffect } from 'react';
import LoadingScreen from "@/app/components/loading-screen";
import CameraScreen from "@/app/components/camera-screen";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAway, setFadeAway] = useState(false);

  useEffect(() => {
    // Show loading screen for 2.5 seconds, then trigger fade out transition
    const fadeTimer = setTimeout(() => {
      setFadeAway(true);
    }, 2200);

    const finishTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`transition-opacity duration-300 ${fadeAway ? 'opacity-0' : 'opacity-100'}`}>
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <CameraScreen />
    </div>
  );
}
