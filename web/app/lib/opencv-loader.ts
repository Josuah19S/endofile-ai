"use client";

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let openCvPromise: Promise<any> | null = null;

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error("OpenCV.js can only be loaded in the browser environment."));
  }

  if (window.cv && window.cv.Mat) {
    return Promise.resolve(window.cv);
  }

  if (openCvPromise) {
    return openCvPromise;
  }

  openCvPromise = new Promise((resolve, reject) => {
    // Set Module callbacks before loading script
    window.Module = window.Module || {};
    window.Module.onRuntimeInitialized = () => {
      console.log("OpenCV.js runtime initialized successfully!");
      resolve(window.cv);
    };

    // Check if script element already exists
    const existingScript = document.getElementById('opencv-script');
    if (existingScript) {
      if (window.cv && window.cv.Mat) {
        resolve(window.cv);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-script';
    script.src = '/js/opencv.js';
    script.async = true;
    script.onload = () => {
      // If cv.Mat is available immediately or via Module callback
      if (window.cv && window.cv.Mat) {
        resolve(window.cv);
      }
    };
    script.onerror = (err) => {
      openCvPromise = null;
      reject(new Error(`Failed to load OpenCV.js script from /js/opencv.js: ${err}`));
    };

    document.body.appendChild(script);
  });

  return openCvPromise;
}

export function isOpenCVReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.cv && window.cv.Mat);
}
