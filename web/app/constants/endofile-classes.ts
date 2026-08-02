// Model classes as specified by the user
// ['3d-files_1-s30', '3d-files_2-f25', '3d-files_3-f30', 'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50', 'blue-shaper_1-z1', 'blue-shaper_2-z2', 'blue-shaper_3-z3', 'blue-shaper_4-z4', 'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2', 'micromega-one-curve-mini-assorted_1-n45-0.4', 'micromega-one-curve-mini-assorted_2-n35-0.4', 'micromega-one-curve-mini-assorted_3-n25-0.6', 'micromega-one-curve-mini-assorted_4-n25-0.4', 'micromega-remover_1-n30', 'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50', 're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1', 're-treaty_4-shapy2', 're-treaty_5-shapy3', 'rising_1-17', 'rising_2-13', 'rising_3-25', 'rising_4-30', 'rising_5-28', 's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3', 'slim-shaper_zs1', 'slim-shaper_zs2', 'slim-shaper_zs3', 'super-files-iii_1-sx', 'super-files-iii_2-s1', 'super-files-iii_3-s2', 'super-files-iii_4-f1', 'super-files-iii_5-f2', 'super-files-iii_6-f3']

/**
 * Classes the model predicts, in the exact order of the graph output tensor.
 *
 * WARNING: the array order is the contract with the model. Each index maps to a position
 * in the `[-1, 38]` output tensor (see `endofile-model-context.tsx`), so this list must
 * never be sorted, filtered or reordered. Append-only, and only alongside a retrained model.
 */
export const FILE_CLASSES = [
  '3d-files_1-s30', '3d-files_2-f25', '3d-files_3-f30',
  'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50',
  'blue-shaper_1-z1', 'blue-shaper_2-z2', 'blue-shaper_3-z3', 'blue-shaper_4-z4',
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'micromega-one-curve-mini-assorted_1-n45-0.4', 'micromega-one-curve-mini-assorted_2-n35-0.4',
  'micromega-one-curve-mini-assorted_3-n25-0.6', 'micromega-one-curve-mini-assorted_4-n25-0.4',
  'micromega-remover_1-n30',
  'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50',
  're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1', 're-treaty_4-shapy2', 're-treaty_5-shapy3',
  'rising_1-17', 'rising_2-13', 'rising_3-25', 'rising_4-30', 'rising_5-28',
  's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3',
  'slim-shaper_zs1', 'slim-shaper_zs2', 'slim-shaper_zs3',
  'super-files-iii_1-sx', 'super-files-iii_2-s1', 'super-files-iii_3-s2',
  'super-files-iii_4-f1', 'super-files-iii_5-f2', 'super-files-iii_6-f3'
] as const;

export type EndoFileClassId = typeof FILE_CLASSES[number];
