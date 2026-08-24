/**
 * Classes predicted by Model v1 (28 classes).
 * Order must match the output tensor contract of the v1 graph (EfficientNetB0).
 */
export const FILE_CLASSES_V1 = [
  '3d-files_1-f25', '3d-files_2-f30', '3d-files_3-s30',
  'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50',
  'blue-shaper_1-z1', 'blue-shaper_2-z2', 'blue-shaper_3-z3', 'blue-shaper_4-z4',
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'micromega-one-curve-mini_1-n45-0.4', 'micromega-one-curve-mini_2-n35-0.4',
  'micromega-one-curve-mini_3-n25-0.6', 'micromega-one-curve-mini_4-n25-0.4',
  'rising_1-17', 'rising_2-13', 'rising_3-25', 'rising_4-30', 'rising_5-28',
  'slim-shaper_1-zs1', 'slim-shaper_2-zs2', 'slim-shaper_3-zs3',
] as const;

/**
 * Classes predicted by Model v2 (29 classes).
 * Order must match the output tensor contract of the v2 graph (EfficientNetB2).
 * Includes 'micromega-remover_1-n30'.
 */
export const FILE_CLASSES_V2 = [
  '3d-files_1-f25', '3d-files_2-f30', '3d-files_3-s30',
  'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50',
  'blue-shaper_1-z1', 'blue-shaper_2-z2', 'blue-shaper_3-z3', 'blue-shaper_4-z4',
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'micromega-one-curve-mini_1-n45-0.4', 'micromega-one-curve-mini_2-n35-0.4',
  'micromega-one-curve-mini_3-n25-0.6', 'micromega-one-curve-mini_4-n25-0.4',
  'micromega-remover_1-n30',
  'rising_1-17', 'rising_2-13', 'rising_3-25', 'rising_4-30', 'rising_5-28',
  'slim-shaper_1-zs1', 'slim-shaper_2-zs2', 'slim-shaper_3-zs3',
] as const;

export type ModelVersion = 'v1' | 'v2';

export interface ModelConfig {
  id: ModelVersion;
  name: string;
  badgeName: string;
  shortLabel: string;
  description: string;
  classCount: number;
  modelUrl: string;
  classes: readonly string[];
  normalization: 'none';
  isAsyncExecute?: boolean;
  route: string;
}

export const MODEL_CONFIGS: Record<ModelVersion, ModelConfig> = {
  v1: {
    id: 'v1',
    name: 'EndoX IA Reduced v1',
    badgeName: 'EndoX v1',
    shortLabel: 'Modelo v1',
    description: '28 clases · Normalización integrada (EfficientNetB0)',
    classCount: 28,
    modelUrl: '/models/v1/model.json',
    classes: FILE_CLASSES_V1,
    normalization: 'none',
    isAsyncExecute: true,
    route: '/modelv1',
  },
  v2: {
    id: 'v2',
    name: 'EndoX IA Reduced v2',
    badgeName: 'EndoX v2',
    shortLabel: 'Modelo v2',
    description: '29 clases · Normalización integrada (EfficientNetB2)',
    classCount: 29,
    modelUrl: '/models/v2/model.json',
    classes: FILE_CLASSES_V2,
    normalization: 'none',
    isAsyncExecute: true,
    route: '/modelv2',
  },
};

export const DEFAULT_MODEL_VERSION: ModelVersion = 'v2';
