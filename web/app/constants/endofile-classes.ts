/**
 * Classes the model predicts, in the exact order of the graph output tensor.
 *
 * WARNING: the array order is the contract with the model. Each index maps to a position
 * in the deployed graph's output tensor, so this list must never be sorted, filtered or
 * reordered — only appended to, and only alongside a retrained model. The currently
 * deployed graph (`web/public/model_proto`) still outputs `[-1, 28]`; the last entry below
 * (`micromega-remover_1-n30`) is staged ahead of the v2 graph that will actually emit it.
 */
export const FILE_CLASSES = [
  '3d-files_1-f25', '3d-files_2-f30', '3d-files_3-s30',
  'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50',
  'blue-shaper_1-z1', 'blue-shaper_2-z2', 'blue-shaper_3-z3', 'blue-shaper_4-z4',
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'micromega-one-curve-mini_1-n45-0.4', 'micromega-one-curve-mini_2-n35-0.4',
  'micromega-one-curve-mini_3-n25-0.6', 'micromega-one-curve-mini_4-n25-0.4',
  'rising_1-17', 'rising_2-13', 'rising_3-25', 'rising_4-30', 'rising_5-28',
  'slim-shaper_1-zs1', 'slim-shaper_2-zs2', 'slim-shaper_3-zs3',
  'micromega-remover_1-n30',
] as const;

export type EndoFileClassId = typeof FILE_CLASSES[number];
