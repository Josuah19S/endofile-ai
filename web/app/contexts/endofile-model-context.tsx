"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { GraphModel } from "@tensorflow/tfjs"
import { FILE_CLASSES } from "@/app/constants/endofile-classes"
import {
  MAX_HISTORY_ITEMS,
  clearScanHistory,
  createScanId,
  deleteScanItem,
  isHistoryStorageAvailable,
  loadScanHistory,
  saveScanItem,
} from "@/app/lib/history-store"
import type { RecentScanItem } from "@/app/lib/history-store"
import { devLog } from "@/app/lib/logger"
type TensorFlow = typeof import("@tensorflow/tfjs")

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
 * is wrong — see feat/transition-detector-helper.
 */
const TOP_N = 6;

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

export function EndofileContextProvider({ children }: { children: React.ReactNode }) {
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
        devLog("Loading TensorFlow.js...");
        // Dynamic import to avoid Next.js node-side compile/SSR issues
        const tfjs = await import('@tensorflow/tfjs');
        if (!active) return;
        setTf(tfjs);

        devLog("Loading graph model...");
        // Load the graph model from public directory (served at root /model_proto/model.json)
        const loadedModel = await tfjs.loadGraphModel('/model_proto/model.json');

        // Warm up the model (compiles WebGL shaders in the background to avoid first-click latency)
        devLog("Warming up model...");
        const dummyInput = tfjs.zeros([1, 448, 448, 3]);
        // Sync execute(): the graph has no control flow or dynamic output shapes (see
        // model/README.md §5), so executeAsync()'s extra async round-trip buys nothing —
        // it only exists for graphs that need it, and TF.js warns on every run otherwise.
        const warmupPrediction = loadedModel.execute(dummyInput);
        tfjs.dispose(dummyInput);
        tfjs.dispose(warmupPrediction);

        if (!active) return;
        setModel(loadedModel);
        setModelStatus('ready');
        devLog(`EndoScan Graph Model loaded and warmed up successfully! Active Tensors: ${tfjs.memory().numTensors}`);
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

  /**
   * Lock in `classId` as the final detection and persist it to history.
   * The photoUrl comes from the caller (camera-context) because the model
   * context doesn't own the captured frame.
   *
   * capturePhoto / handleFileSelect already auto-save the top candidate as
   * soon as predict() finishes, so by the time the doctor taps an
   * alternative in the drawer the most recent history item is usually the
   * auto-saved top. We detect that case by matching photoUrl and update the
   * existing entry in place (both in state and in IndexedDB) instead of
   * adding a duplicate.
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
        const tensor = tf.browser.fromPixels(src);
        const resized = tf.image.resizeBilinear(tensor, [448, 448]);
        // The model has its own Rescaling + Normalization layers baked into the graph
        // (1/255 then ImageNet mean/std, see model/README.md §3) and expects raw [0, 255]
        // pixels — normalizing here a second time would feed it a near-constant input.
        const casted = resized.cast('float32');
        return casted.expandDims(0);
      });

      // Sync execute(): no control flow or dynamic shapes in this graph (see warm-up above).
      const prediction = model.execute(inputTensor);

      let rawOutput: Float32Array;
      if (Array.isArray(prediction)) {
        rawOutput = (await prediction[0].data()) as Float32Array;
      } else {
        rawOutput = (await prediction.data()) as Float32Array;
      }

      const rawArray = Array.from(rawOutput);

      // The graph already ends in a Softmax (Identity <- Softmax <- dense), so
      // rawOutput is a proper probability distribution that sums to 1. Applying
      // softmax a second time here would compress every confidence toward the
      // uniform distribution (1/29 ≈ 3.4%) — argmax and top-3 would still be
      // correct since softmax is monotone, but the numbers would be useless.
      // See model/README.md §4.
      const probabilities = rawArray;

      // Rank all classes by confidence score
      const ranked = FILE_CLASSES.map((className, idx) => ({
        classId: className,
        confidence: probabilities[idx] || 0,
      })).sort((a, b) => b.confidence - a.confidence);

      const topN = ranked.slice(0, TOP_N);

      // Debug log: top 10 ranked classes per prediction. Dev-only, kept commented
      // for quick re-enable during debugging. Uncomment to inspect raw confidences.
      devLog(`[TF.js Top 10 Predictions]:\n` + ranked.slice(0, 10).map((p, i) => `  ${i + 1}. ${p.classId}: ${(p.confidence * 100).toFixed(2)}%`).join('\n'));

      // Confidence threshold check (35% minimum probability across all 29 classes)
      const MIN_CONFIDENCE_THRESHOLD = 0.35;
      const topConfidence = topN[0]?.confidence || 0;

      if (topConfidence < MIN_CONFIDENCE_THRESHOLD) {
        console.warn(`[TF.js Low Confidence]: Highest class probability was only ${(topConfidence * 100).toFixed(2)}% (< 2%).`);
        setLimaDetected('Lima no identificada');
        setTopPredictions([{ classId: 'Lima no identificada', confidence: topConfidence }, ...topN]);

        // Clean up WebGL tensors completely after prediction
        tf.dispose(inputTensor);
        tf.dispose(prediction);

        // No confirmation needed for the synthetic "unidentified" sentinel — the
        // doctor will retake rather than confirm a non-prediction.
        setPendingConfirmation(false);

        return [{ classId: 'Lima no identificada', confidence: topConfidence }, ...topN];
      }

      setTopPredictions(topN);

      const bestOption = topN[0]?.classId || 'Clase desconocida';
      setLimaDetected(bestOption);

      // Clean up WebGL tensors completely after prediction
      tf.dispose(inputTensor);
      tf.dispose(prediction);

      devLog(`[TF.js Top ${TOP_N} Predictions]:\n` + topN.map((p, i) => `  ${i + 1}. ${p.classId}: ${(p.confidence * 100).toFixed(2)}%`).join('\n'));
      devLog(`[TF.js Memory] Active Tensors after prediction: ${tf.memory().numTensors}`);

      return topN;
    } catch (err) {
      console.error("Capture prediction error:", err);
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
  )
}

export function useEndofileAi() {
  const context = useContext(EndofileAiContext)
  if (context === null) {
    throw new Error('useEndofileAi must be used within a EndofileAiProvider')
  }
  return context
}