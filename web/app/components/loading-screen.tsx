"use client";
import React from 'react';
import { loadingStyles } from '../styles/loading-styles';
import { ToothIcon } from './icons';

export default function LoadingScreen() {
  return (
    <div className={loadingStyles.screenContainer}>
      <div className={loadingStyles.contentWrapper}>
        {/* Logo Container with circle background */}
        <div className={loadingStyles.iconContainer}>
          <ToothIcon className={loadingStyles.toothIcon} />
        </div>
        
        {/* Brand Name */}
        <h1 className={loadingStyles.brandTitle}>
          EndoScan AI
        </h1>
        
        {/* Loading Spinner */}
        <div className={loadingStyles.spinnerContainer}>
          <div className={loadingStyles.spinnerRing}></div>
        </div>
        
        {/* Loading Text */}
        <p className={loadingStyles.loadingText}>
          Cargando...
        </p>
      </div>
    </div>
  );
}
