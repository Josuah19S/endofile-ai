"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ValidationConfig,
  DEFAULT_VALIDATION_CONFIG,
  ImageValidationResults,
  InputImageSource,
  validateAllImages,
  validateBlur,
  validateBrightness,
  validateTooFar,
  BlurValidationResult,
  DarkValidationResult,
  TooFarValidationResult,
} from '../lib/image-validations';
import { loadOpenCV, isOpenCVReady } from '../lib/opencv-loader';

interface ImageValidationContextType {
  config: ValidationConfig;
  updateConfig: (newConfig: Partial<ValidationConfig>) => void;
  resetConfig: () => void;

  isOpenCvReady: boolean;
  isOpenCvLoading: boolean;

  lastResults: ImageValidationResults | null;

  validateSource: (source: InputImageSource) => Promise<ImageValidationResults>;
  validateBlurOnly: (source: InputImageSource) => Promise<BlurValidationResult>;
  validateDarknessOnly: (source: InputImageSource) => Promise<DarkValidationResult>;
  validateDistanceOnly: (source: InputImageSource) => Promise<TooFarValidationResult>;
}

const ImageValidationContext = createContext<ImageValidationContextType | undefined>(undefined);

export function ImageValidationProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ValidationConfig>(DEFAULT_VALIDATION_CONFIG);
  const [isOpenCvReadyState, setIsOpenCvReadyState] = useState<boolean>(false);
  const [isOpenCvLoading, setIsOpenCvLoading] = useState<boolean>(true);
  const [lastResults, setLastResults] = useState<ImageValidationResults | null>(null);

  // Initialize OpenCV.js on provider mount
  useEffect(() => {
    let active = true;
    loadOpenCV()
      .then(() => {
        if (active) {
          setIsOpenCvReadyState(true);
          setIsOpenCvLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Could not preload OpenCV.js:", err);
        if (active) {
          setIsOpenCvLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateConfig = (newConfig: Partial<ValidationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_VALIDATION_CONFIG);
  };

  const validateSource = async (source: InputImageSource): Promise<ImageValidationResults> => {
    const results = await validateAllImages(source, config);
    setLastResults(results);
    return results;
  };

  const validateBlurOnly = (source: InputImageSource) => validateBlur(source, config);
  const validateDarknessOnly = (source: InputImageSource) => validateBrightness(source, config);
  const validateDistanceOnly = (source: InputImageSource) => validateTooFar(source, config);

  return (
    <ImageValidationContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        isOpenCvReady: isOpenCvReadyState || isOpenCVReady(),
        isOpenCvLoading,
        lastResults,
        validateSource,
        validateBlurOnly,
        validateDarknessOnly,
        validateDistanceOnly,
      }}
    >
      {children}
    </ImageValidationContext.Provider>
  );
}

export function useImageValidation() {
  const context = useContext(ImageValidationContext);
  if (!context) {
    throw new Error('useImageValidation must be used within an ImageValidationProvider');
  }
  return context;
}
