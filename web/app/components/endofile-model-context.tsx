"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import type { GraphModel } from "@tensorflow/tfjs"
import { FILE_CLASSES } from "@/app/constants/endofile-classes"
import {
  MAX_HISTORY_ITEMS,
  clearScanHistory,
  isHistoryStorageAvailable,
  loadScanHistory,
  saveScanItem,
} from "@/app/lib/history-store"
import type { RecentScanItem } from "@/app/lib/history-store"
type TensorFlow = typeof import("@tensorflow/tfjs")

export interface TopPrediction {
  classId: string;
  confidence: number; // Decimal e.g., 0.948 = 94.8%
}

// Re-exported from the store so existing imports keep working
export type { RecentScanItem };

type PredictionSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData | ImageBitmap;

export interface EndofileAiContextType {
  tf: TensorFlow | null;
  model: GraphModel | null;
  modelLoaded: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
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
}

const EndofileAiContext = createContext<EndofileAiContextType | null>(null);

export function EndofileContextProvider({ children }: { children: React.ReactNode }) {
  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [topPredictions, setTopPredictions] = useState<TopPrediction[]>([]);
  const [scanHistoryItems, setScanHistoryItems] = useState<RecentScanItem[]>([]);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const [historyPersisted, setHistoryPersisted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Read the persisted history after mounting on the client. Starting from an empty array
  // keeps the server and the first client render identical, so no hydration mismatch.
  useEffect(() => {
    let active = true;
    loadScanHistory().then(items => {
      if (!active) return;
      setScanHistoryItems(items);
      // Checked after the open attempt, so a failed open reports as "not persisted"
      setHistoryPersisted(isHistoryStorageAvailable());
      setHistoryHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const addScanHistoryItem = (item: RecentScanItem) => {
    setScanHistoryItems(prev => [item, ...prev].slice(0, MAX_HISTORY_ITEMS));
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

  // 1. Initialize TensorFlow.js and load MobileNetV3 Graph Model on client mount (SSR Safe)
  useEffect(() => {
    let active = true;
    const initModel = async () => {
      try {
        console.log("Loading TensorFlow.js...");
        // Dynamic import to avoid Next.js node-side compile/SSR issues
        const tfjs = await import('@tensorflow/tfjs');
        if (!active) return;
        setTf(tfjs);

        console.log("Loading graph model...");
        // Load the graph model from public directory (served at root /model_proto/model.json)
        const loadedModel = await tfjs.loadGraphModel('/model_proto/model.json');

        // Warm up the model (compiles WebGL shaders in the background to avoid first-click latency)
        console.log("Warming up model...");
        const dummyInput = tfjs.zeros([1, 480, 480, 3]);
        const warmupPrediction = await loadedModel.executeAsync(dummyInput);
        tfjs.dispose(dummyInput);
        tfjs.dispose(warmupPrediction);

        if (!active) return;
        setModel(loadedModel);
        setModelStatus('ready');
        console.log(`EndoScan Graph Model loaded and warmed up successfully! Active Tensors: ${tfjs.memory().numTensors}`);
      } catch (err) {
        console.error("Error initializing model:", err);
        if (active) setModelStatus('error');
      }
    };
    initModel();
    return () => {
      active = false;
    };
  }, []);


  const predict = async (src: PredictionSource): Promise<TopPrediction[]> => {
    if (isAnalyzing || !tf || !model) return [];
    setIsAnalyzing(true);
    setLimaDetected(null);
    try {
      // Wrap intermediate preprocessing tensors in tf.tidy to prevent WebGL memory leaks
      const inputTensor = tf.tidy(() => {
        const tensor = tf.browser.fromPixels(src);
        const resized = tf.image.resizeBilinear(tensor, [480, 480]);
        const casted = resized.cast('float32');
        return casted.expandDims(0);
      });

      // Execute graph model asynchronously
      const prediction = await model.executeAsync(inputTensor);

      let rawOutput: Float32Array;
      if (Array.isArray(prediction)) {
        rawOutput = (await prediction[0].data()) as Float32Array;
      } else {
        rawOutput = (await prediction.data()) as Float32Array;
      }

      const rawArray = Array.from(rawOutput);

      // Numerically stable Softmax calculation
      const maxVal = Math.max(...rawArray);
      const expArray = rawArray.map(v => Math.exp(v - maxVal));
      const expSum = expArray.reduce((a, b) => a + b, 0);
      const probabilities = expArray.map(v => v / (expSum || 1));

      // Rank all classes by confidence score
      const ranked = FILE_CLASSES.map((className, idx) => ({
        classId: className,
        confidence: probabilities[idx] || 0,
      })).sort((a, b) => b.confidence - a.confidence);

      const top3 = ranked.slice(0, 3);
      setTopPredictions(top3);

      const bestOption = top3[0]?.classId || 'Clase desconocida';
      setLimaDetected(bestOption);

      // Clean up WebGL tensors completely after prediction
      tf.dispose(inputTensor);
      tf.dispose(prediction);

      console.log(`[TF.js Top 3 Predictions]:\n` + top3.map((p, i) => `  ${i + 1}. ${p.classId}: ${(p.confidence * 100).toFixed(2)}%`).join('\n'));
      console.log(`[TF.js Memory] Active Tensors after prediction: ${tf.memory().numTensors}`);

      return top3;
    } catch (err) {
      console.error("Capture prediction error:", err);
      setLimaDetected("Error al analizar");
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
    }}>
      {children}
    </EndofileAiContext.Provider>
  )
}

export function useEndofileAi() {
  const context = useContext(EndofileAiContext)
  if (context === null) {
    throw new Error('useEndofileAi must be used within a EndofileAiProvider')
  }
  return context
}
