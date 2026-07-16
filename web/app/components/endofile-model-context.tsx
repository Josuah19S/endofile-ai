"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import type { GraphModel, Tensor } from "@tensorflow/tfjs"
type TensorFlow = typeof import("@tensorflow/tfjs")

// Model classes as specified by the user
const FILE_CLASSES = [
  '3d-files_1-s30', '3d-files_2-f25', '3d-files_3-f30',
  'af-blue-s-one_1', 'af-blue-s-one_2', 'af-blue-s-one_3', 'af-blue-s-one_4', 'af-blue-s-one_5',
  'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50',
  'blue-shaper_1', 'blue-shaper_2', 'blue-shaper_3', 'blue-shaper_4',
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'micromega-one-curve-mini-assorted_n25-0.4', 'micromega-one-curve-mini-assorted_n25-0.6',
  'micromega-one-curve-mini-assorted_n35-0.4', 'micromega-one-curve-mini-assorted_n45-0.4',
  'micromega-remover_1-n30',
  'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50',
  're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1', 're-treaty_4-shapy2', 're-treaty_5-shapy3',
  's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3',
  'slim-shaper_10', 'slim-shaper_zs1', 'slim-shaper_zs3',
  'super-files-iii_1', 'super-files-iii_2', 'super-files-iii_3', 'super-files-iii_4', 'super-files-iii_5', 'super-files-iii_6'
];

type PredictionSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData | ImageBitmap

export interface EndofileAiContextType {
  tf: TensorFlow | null;
  model: GraphModel | null;
  modelLoaded: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
  predict: (canvas: PredictionSource) => Promise<void>;
  limaDetected: string | null;
  setLimaDetected: React.Dispatch<React.SetStateAction<string | null>>;
  scanHistory: string[];
  isAnalyzing: boolean;
}

const EndofileAiContext = createContext<EndofileAiContextType | null>(null)

export function EndofileContextProvider({ children }: { children: React.ReactNode }) {
  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        const dummyInput = tfjs.zeros([1, 224, 224, 3]);
        const warmupPrediction = await loadedModel.executeAsync(dummyInput) as Tensor;
        tfjs.dispose([dummyInput, warmupPrediction]);

        if (!active) return;
        setModel(loadedModel);
        setModelStatus('ready');
        console.log("EndoScan Graph Model loaded and warmed up successfully!");
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
    setIsAnalyzing(true);
    setLimaDetected(null);
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
        setLimaDetected,
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
