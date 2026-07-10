"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import type { GraphModel, Tensor } from "@tensorflow/tfjs"
type TensorFlow = typeof import("@tensorflow/tfjs")

// Model classes as specified by the user
const FILE_CLASSES = [
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50',
  're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1', 're-treaty_4-shapy2', 're-treaty_5-shapy3',
  's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3'
];

type PredictionSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData | ImageBitmap

export interface EndofileAiContextType {
  tf: TensorFlow | null;
  model: GraphModel | null;
  modelLoaded: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
  predict: (canvas: PredictionSource) => Promise<void>;
  limaDetected: string | null;
  scanHistory: string[];
  isAnalyzing: boolean;
}

const EndofileAiContext = createContext<EndofileAiContextType | null>(null)

export function EndofileContextProvider({ children }: { children: React.ReactNode }) {
  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // TensorFlow States
  type TensorFlow = typeof import ("@tensorflow/tfjs");
  type ModelStatus = 'loading' | 'ready' | 'error';
  const [tf, setTf] = useState<TensorFlow | null>(null);
  const [model, setModel] = useState<GraphModel | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');

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

        if (!active) return;
        setModel(loadedModel);
        setModelStatus('ready');
        console.log("EndoScan Graph Model loaded successfully!");
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


  const predict = async (src: PredictionSource) => {
    if (isAnalyzing || !tf || !model) return;
    try {
      // Run prediction directly on the canvas element
      const tensor = tf.browser.fromPixels(src);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const casted = resized.cast('float32');
      const expanded = casted.expandDims(0);

      const prediction = await model.executeAsync(expanded) as Tensor;
      const probabilities = await prediction.data();
      const maxIdx = probabilities.indexOf(Math.max(...probabilities));
      const predictedClass = FILE_CLASSES[maxIdx] || 'Clase desconocida';

      setLimaDetected(predictedClass);
      setScanHistory(prev => [predictedClass, ...prev.slice(0, 9)]);

      tf.dispose([tensor, resized, casted, expanded, prediction]);
    } catch (err) {
      console.error("Capture prediction error:", err);
      setLimaDetected("Error al analizar");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <EndofileAiContext.Provider value={{
        tf,
        model,
        modelLoaded: modelStatus === 'ready',
        modelStatus,
        predict,
        limaDetected,
        scanHistory,
        isAnalyzing,
      }}>
      { children }
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
