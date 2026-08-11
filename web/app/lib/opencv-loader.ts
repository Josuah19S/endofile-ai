"use client";

import { devLog } from './logger';

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let openCvPromise: Promise<any> | null = null;

export function isOpenCVReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.cv && window.cv.Mat && typeof window.cv.Mat === 'function');
}

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error("OpenCV.js can only be loaded in the browser environment."));
  }

  if (isOpenCVReady()) {
    return Promise.resolve(window.cv);
  }

  if (openCvPromise) {
    return openCvPromise;
  }

  openCvPromise = new Promise((resolve, reject) => {
    let resolved = false;

    const checkReady = () => {
      if (!resolved && isOpenCVReady()) {
        resolved = true;
        devLog("[OpenCV.js] Engine ready and cv.Mat available!");
        resolve(window.cv);
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    // Hook Module runtime callback
    window.Module = window.Module || {};
    const originalOnRuntimeInitialized = window.Module.onRuntimeInitialized;
    window.Module.onRuntimeInitialized = () => {
      if (originalOnRuntimeInitialized) originalOnRuntimeInitialized();
      checkReady();
    };

    // Polling interval fallback for Emscripten initialization
    const intervalId = setInterval(() => {
      if (checkReady()) {
        clearInterval(intervalId);
      }
    }, 100);

    // Timeout after 15 seconds if loading fails
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (!resolved && !isOpenCVReady()) {
        console.warn("[OpenCV.js] Timed out waiting for full WASM initialization, fallback will be used.");
        // We do not hard-reject so the app can gracefully use Canvas 2D fallback
        resolve(window.cv || null);
      }
    }, 15000);

    // Inject script if not already present
    let script = document.getElementById('opencv-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'opencv-script';
      script.src = '/js/opencv.js';
      script.async = true;
      script.onload = () => {
        // If cv is a factory function returning a Promise
        if (typeof window.cv === 'function') {
          try {
            window.cv().then((cvInstance: any) => {
              window.cv = cvInstance;
              checkReady();
            }).catch(() => { });
          } catch (e) { }
        }
        checkReady();
      };
      script.onerror = (err) => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        openCvPromise = null;
        reject(new Error(`Failed to load OpenCV.js script from /js/opencv.js: ${err}`));
      };
      document.body.appendChild(script);
    }
  });

  return openCvPromise;
}
