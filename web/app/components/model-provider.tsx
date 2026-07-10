"use client"
import React, { createContext, RefObject, useContext, useState, useEffect } from "react"


// Model classes as specified by the user
const FILE_CLASSES = [
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50',
  're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1', 're-treaty_4-shapy2', 're-treaty_5-shapy3',
  's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3'
];

export interface EndofileAiContextType {
  tf: any;
  model: any;
  modelLoaded: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
  predict: (canvas: HTMLCanvasElement) => Promise<void>;
  limaDetected: string | null;
  scanHistory: string[];
  isAnalyzing: boolean;
  selectedPhotoUrl: string | null;
  setSelectedPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const EndofileAiContext = createContext<EndofileAiContextType | null>(null)

export function EndofileContextProvider({ children }: { children: React.ReactNode }) {
  const [limaDetected, setLimaDetected] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [tf, setTf] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

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


  const predict = async (canvas: HTMLCanvasElement) => {
    if (isAnalyzing) return;
    try {
      // Run prediction directly on the canvas element
      const tensor = tf.browser.fromPixels(canvas);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const casted = resized.cast('float32');
      const expanded = casted.expandDims(0);

      const prediction = await model.executeAsync(expanded) as any;
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
        selectedPhotoUrl,
        setSelectedPhotoUrl: setSelectedPhotoUrl
      }}>
      { children }
    </EndofileAiContext.Provider>
  )
}

export function useEndofileAi() {
  const context = useContext(EndofileAiContext)
  if (context === undefined) {
    throw new Error('useEndofileAi must be used within a EndofileAiProvider')
  }
  return context
}
