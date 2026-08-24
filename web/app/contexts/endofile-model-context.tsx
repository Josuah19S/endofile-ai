"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { GraphModel } from "@tensorflow/tfjs";
import {
  MODEL_CONFIGS,
  DEFAULT_MODEL_VERSION,
  type ModelVersion,
  type ModelConfig,
} from "@/app/constants/endofile-models";
import {
  MAX_HISTORY_ITEMS,
  clearScanHistory,
  createScanId,
  deleteScanItem,
  isHistoryStorageAvailable,
  loadScanHistory,
  saveScanItem,
} from "@/app/lib/history-store";
import type { RecentScanItem } from "@/app/lib/history-store";
import { devLog } from "@/app/lib/logger";

type TensorFlow = typeof import("@tensorflow/tfjs");

export interface TopPrediction {
  classId: string;
  confidence: number; // Decimal e.g., 0.948 = 94.8%
}

// Re-exported from the store so existing imports keep working
export type { RecentScanItem };

type PredictionSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData | ImageBitmap;

/**
 * How many ranked candidates we keep after each prediction. The top one is shown in
 * the detection badge; the rest (up to TOP_N - 1) are surfaced as tappable chips in
 * the bottom bar so the doctor can pick an alternative when the model's top guess
 * is wrong.
 */
const TOP_N = 6;

export interface EndofileAiContextType {
  tf: TensorFlow | null;
  model: GraphModel | null;
  modelLoaded: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
  modelConfig: ModelConfig;
  debug: boolean;
  predict: (canvas: PredictionSource) => Promise<TopPrediction[]>;
  limaDetected: string | null;
  topPredictions: TopPrediction[];
  scanHistoryItems: RecentScanItem[];
  addScanHistoryItem: (item: RecentScanItem) => void;
  clearHistory: () => Promise<void>;
  /** `false` until the persisted history has been read on the client. */
  historyHydrated: boolean;
  /** `false` when the history lives in memory only, e.g. private browsing. */
  historyPersisted: boolean;
  setLimaDetected: React.Dispatch<React.SetStateAction<string | null>>;
  isAnalyzing: boolean;
  /**
   * Lock in one of the model's predictions as the final detection. Updates
   * `limaDetected`, persists the scan to history, and clears the pending
   * alternatives so the bottom bar collapses back to its idle layout.
   * No-op when the class is the synthetic "Lima no identificada" sentinel.
   */
  confirmCandidate: (classId: string, photoUrl?: string | null) => void;
  /**
   * True after a fresh prediction until either confirmCandidate runs or the
   * prediction is reset. Drives the bottom-bar "alternatives" view.
   */
  pendingConfirmation: boolean;
}

const EndofileAiContext = createContext<EndofileAiContextType | null>(null);

export function EndofileContextProvider({
  children,
  version = DEFAULT_MODEL_VERSION,
  debug = false,
}: {
  children: React.ReactNode;
  version?: ModelVersion;
  debug?: boolean;
}) {
  const activeModelConfig = MODEL_CONFIGS[version] || MODEL_CONFIGS.v2;

  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [topPredictions, setTopPredictions] = useState<TopPrediction[]>([]);
  const [scanHistoryItems, setScanHistoryItems] = useState<RecentScanItem[]>([]);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const [historyPersisted, setHistoryPersisted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  /** True after a fresh prediction, until confirmCandidate or a reset runs. */
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  // Read the persisted history after mounting on the client. Starting from an empty array
  // keeps the server and the first client render identical, so no hydration mismatch.
  useEffect(() => {
    let active = true;
    loadScanHistory().then((items) => {
      if (!active) return;
      setScanHistoryItems(items);
      setHistoryPersisted(isHistoryStorageAvailable());
      setHistoryHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const addScanHistoryItem = (item: RecentScanItem) => {
    setScanHistoryItems((prev) => [item, ...prev].slice(0, MAX_HISTORY_ITEMS));
    // Fire and forget: saveScanItem never rejects, so a failed write cannot block capture
    void saveScanItem(item);
  };

  const clearHistory = async () => {
    setScanHistoryItems([]);
    await clearScanHistory();
  };

  // TensorFlow States
  const [tf, setTf] = useState<TensorFlow | null>(null);
  const [model, setModel] = useState<GraphModel | null>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Initialize TensorFlow.js and load active Graph Model on mount/version change (SSR Safe)
  useEffect(() => {
    let active = true;
    const initModel = async () => {
      try {
        if (debug) devLog(`[${activeModelConfig.name}] Loading TensorFlow.js...`);
        const tfjs = await import('@tensorflow/tfjs');
        if (!active) return;
        setTf(tfjs);

        if (debug) devLog(`[${activeModelConfig.name}] Loading graph model from ${activeModelConfig.modelUrl}...`);
        const loadedModel = await tfjs.loadGraphModel(activeModelConfig.modelUrl);

        // Warm up the model (compiles WebGL shaders in the background to avoid first-click latency)
        if (debug) devLog(`[${activeModelConfig.name}] Warming up model...`);
        const dummyInput = tfjs.zeros([1, 448, 448, 3]);
        const warmupPrediction = await loadedModel.executeAsync(dummyInput);
        tfjs.dispose(dummyInput);
        tfjs.dispose(warmupPrediction);

        if (!active) return;
        setModel(loadedModel);
        setModelStatus('ready');
        if (debug) devLog(`[${activeModelConfig.name}] Graph Model loaded and warmed up successfully! Active Tensors: ${tfjs.memory().numTensors}`);
      } catch (err) {
        console.error(`Error initializing model (${activeModelConfig.name}):`, err);
        if (active) setModelStatus('error');
      }
    };
    initModel();
    return () => {
      active = false;
    };
  }, [activeModelConfig.modelUrl, activeModelConfig.name, debug]);

  /**
   * Lock in `classId` as the final detection and persist it to history.
   */
  const confirmCandidate = useCallback((classId: string, photoUrl?: string | null) => {
    if (!classId || classId === 'Lima no identificada') return;
    setLimaDetected(classId);
    setPendingConfirmation(false);
    if (!photoUrl) return;

    setScanHistoryItems((prev) => {
      const latest = prev[0];
      if (latest && latest.photoUrl === photoUrl) {
        // Same photo as the auto-saved top — swap its classId in place.
        const updated: RecentScanItem = { ...latest, classId };
        void deleteScanItem(latest.id).then(() => saveScanItem(updated));
        return [updated, ...prev.slice(1)];
      }
      // Different photo (or empty history): create a fresh entry.
      const item: RecentScanItem = {
        id: createScanId(),
        classId,
        photoUrl,
        timestamp: Date.now(),
      };
      void saveScanItem(item);
      return [item, ...prev];
    });
  }, []);

  const predict = async (src: PredictionSource): Promise<TopPrediction[]> => {
    if (isAnalyzing || !tf || !model) return [];
    setIsAnalyzing(true);
    setLimaDetected(null);
    setPendingConfirmation(true);
    try {
      // Wrap intermediate preprocessing tensors in tf.tidy to prevent WebGL memory leaks
      const inputTensor = tf.tidy(() => {
        // Clean canvas ensures proper pixel reading in fromPixels
        const cleanCanvas = document.createElement('canvas');
        cleanCanvas.width = 448;
        cleanCanvas.height = 448;
        const cleanCtx = cleanCanvas.getContext('2d', { willReadFrequently: true });
        cleanCtx?.drawImage(src as CanvasImageSource, 0, 0, 448, 448);

        const tensor = tf.browser.fromPixels(cleanCanvas);
        // Both v1 (EfficientNetB0) and v2 (EfficientNetB2) have internal Rescaling + Normalization
        // layers baked into the graph and expect raw [0, 255] float32 pixels.
        const casted = tensor.cast('float32');
        return casted.expandDims(0);
      });

      if (debug) {
        const allData = await inputTensor.data();
        let minVal = Infinity;
        let maxVal = -Infinity; 
        for (let i = 0; i < allData.length; i++) {
          if (allData[i] < minVal) minVal = allData[i];
          if (allData[i] > maxVal) maxVal = allData[i];
        }
        console.log('[Debug] Input min FULL:', minVal);
        console.log('[Debug] Input max FULL:', maxVal);

        const debugData = await inputTensor.data();
        console.log('[Debug] Input min:', Math.min(...Array.from(debugData).slice(0, 1000)));
        console.log('[Debug] Input max:', Math.max(...Array.from(debugData).slice(0, 1000)));
        console.log('[Debug] Input sample:', Array.from(debugData).slice(0, 5));
      }

      const prediction = await model.executeAsync(inputTensor);

      let rawOutput: Float32Array;
      if (Array.isArray(prediction)) {
        rawOutput = (await prediction[0].data()) as Float32Array;
      } else {
        rawOutput = (await prediction.data()) as Float32Array;
      }

      const rawArray = Array.from(rawOutput);
      const probabilities = rawArray;

      // Rank all classes by confidence score according to active model's classes
      const ranked = activeModelConfig.classes.map((className, idx) => ({
        classId: className,
        confidence: probabilities[idx] || 0,
      })).sort((a, b) => b.confidence - a.confidence);

      const topN = ranked.slice(0, TOP_N);

      if (debug) {
        devLog(`[${activeModelConfig.name} Top 10 Predictions]:\n` + ranked.slice(0, 10).map((p, i) => `  ${i + 1}. ${p.classId}: ${(p.confidence * 100).toFixed(2)}%`).join('\n'));
      }

      // Confidence threshold check (15% minimum probability)
      const MIN_CONFIDENCE_THRESHOLD = 0.15;
      const topConfidence = topN[0]?.confidence || 0;

      if (topConfidence < MIN_CONFIDENCE_THRESHOLD) {
        if (debug) {
          devLog(`[${activeModelConfig.name} Low Confidence]: Highest class probability was only ${(topConfidence * 100).toFixed(2)}% (< ${(MIN_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%).`);
        }
        setLimaDetected('Lima no identificada');
        setTopPredictions([{ classId: 'Lima no identificada', confidence: topConfidence }, ...topN]);

        tf.dispose(inputTensor);
        tf.dispose(prediction);
        setPendingConfirmation(false);

        return [{ classId: 'Lima no identificada', confidence: topConfidence }, ...topN];
      }

      setTopPredictions(topN);

      const bestOption = topN[0]?.classId || 'Clase desconocida';
      setLimaDetected(bestOption);

      // Clean up WebGL tensors completely after prediction
      tf.dispose(inputTensor);
      tf.dispose(prediction);

      if (debug) {
        devLog(`[${activeModelConfig.name} Top ${TOP_N} Predictions]:\n` + topN.map((p, i) => `  ${i + 1}. ${p.classId}: ${(p.confidence * 100).toFixed(2)}%`).join('\n'));
        devLog(`[TF.js Memory] Active Tensors after prediction: ${tf.memory().numTensors}`);
      }

      return topN;
    } catch (err) {
      console.error(`Capture prediction error (${activeModelConfig.name}):`, err);
      setLimaDetected("Error al analizar");
      setPendingConfirmation(false);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <EndofileAiContext.Provider value={{
      tf,
      model,
      modelLoaded: modelStatus === 'ready',
      modelStatus,
      modelConfig: activeModelConfig,
      debug,
      predict,
      limaDetected,
      topPredictions,
      scanHistoryItems,
      addScanHistoryItem,
      clearHistory,
      historyHydrated,
      historyPersisted,
      setLimaDetected,
      isAnalyzing,
      confirmCandidate,
      pendingConfirmation,
    }}>
      {children}
    </EndofileAiContext.Provider>
  );
}

export function useEndofileAi() {
  const context = useContext(EndofileAiContext);
  if (context === null) {
    throw new Error('useEndofileAi must be used within a EndofileContextProvider');
  }
  return context;
}
