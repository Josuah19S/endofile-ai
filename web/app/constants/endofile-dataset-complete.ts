import { FILE_CLASSES } from './endofile-classes';

export interface EndoFileDetails {
  id: string;
  sistema: string;
  numero: number;
  nombre: string;
  diametroApical: number; // ISO size in mm (0.01mm) e.g., 25 = #25
  longitud: number; // Primary length in mm
  longitudesAdicionales?: number[]; // Alternative lengths in mm
  conicidad: number; // Taper e.g., 0.07 (7%)
  conicidadAlt?: number; // Alternative taper
  velocidadMin?: number; // RPM
  velocidadMax?: number; // RPM
  torque?: number | string; // Ncm
}

export const ENDOFILE_DICTIONARY: Record<string, EndoFileDetails> = {
  // Re-Treaty
  're-treaty_1-bully': {
    id: 're-treaty_1-bully',
    sistema: 'Re Treaty',
    numero: 1,
    nombre: 'BullY #25',
    diametroApical: 25,
    longitud: 21,
    conicidad: 0.07,
    velocidadMin: 350,
    velocidadMax: 500,
    torque: 1.5,
  },
  're-treaty_2-skinny': {
    id: 're-treaty_2-skinny',
    sistema: 'Re Treaty',
    numero: 2,
    nombre: 'SkinnY #25',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.04,
    velocidadMin: 350,
    velocidadMax: 500,
    torque: 1.5,
  },
  're-treaty_3-shapy1': {
    id: 're-treaty_3-shapy1',
    sistema: 'Re Treaty',
    numero: 3,
    nombre: 'ShapY 1 #20',
    diametroApical: 20,
    longitud: 25,
    conicidad: 0.05,
    velocidadMin: 350,
    velocidadMax: 500,
    torque: 1.5,
  },
  're-treaty_4-shapy2': {
    id: 're-treaty_4-shapy2',
    sistema: 'Re Treaty',
    numero: 4,
    nombre: 'ShapY 2 #25',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.05,
    velocidadMin: 350,
    velocidadMax: 500,
    torque: 1.5,
  },
  're-treaty_5-shapy3': {
    id: 're-treaty_5-shapy3',
    sistema: 'Re Treaty',
    numero: 5,
    nombre: 'ShapY 3 #30',
    diametroApical: 30,
    longitud: 25,
    conicidad: 0.05,
    velocidadMin: 350,
    velocidadMax: 500,
    torque: 1.5,
  },

  // MG3-Blue / Blue Shaper
  'mg3-blue_1-sv': {
    id: 'mg3-blue_1-sv',
    sistema: 'MG3 Blue',
    numero: 1,
    nombre: 'SV #20',
    diametroApical: 20,
    longitud: 19,
    conicidad: 0.1,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 3,
  },
  'mg3-blue_2-px': {
    id: 'mg3-blue_2-px',
    sistema: 'MG3 Blue',
    numero: 2,
    nombre: 'PX #15',
    diametroApical: 15,
    longitud: 21.25,
    conicidad: 0.03,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },
  'mg3-blue_3-g1': {
    id: 'mg3-blue_3-g1',
    sistema: 'MG3 Blue',
    numero: 3,
    nombre: 'G1 #20',
    diametroApical: 20,
    longitud: 21.25,
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },
  'mg3-blue_4-g2x': {
    id: 'mg3-blue_4-g2x',
    sistema: 'MG3 Blue',
    numero: 4,
    nombre: 'G2X #25',
    diametroApical: 25,
    longitud: 21.25,
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },
  'mg3-blue_5-g2': {
    id: 'mg3-blue_5-g2',
    sistema: 'MG3 Blue',
    numero: 5,
    nombre: 'G2 #25',
    diametroApical: 25,
    longitud: 21.25,
    conicidad: 0.06,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },
  'blue-shaper_1-z1': {
    id: 'blue-shaper_1-z1',
    sistema: 'Blue Shaper',
    numero: 1,
    nombre: 'Z1 #20',
    diametroApical: 20,
    longitud: 19,
    conicidad: 0.1,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 3,
  },
  'blue-shaper_2-z2': {
    id: 'blue-shaper_2-z2',
    sistema: 'Blue Shaper',
    numero: 2,
    nombre: 'Z2 #15',
    diametroApical: 15,
    longitud: 21.25,
    conicidad: 0.03,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },
  'blue-shaper_3-z3': {
    id: 'blue-shaper_3-z3',
    sistema: 'Blue Shaper',
    numero: 3,
    nombre: 'Z3 #20',
    diametroApical: 20,
    longitud: 21.25,
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },
  'blue-shaper_4-z4': {
    id: 'blue-shaper_4-z4',
    sistema: 'Blue Shaper',
    numero: 4,
    nombre: 'Z4 #25',
    diametroApical: 25,
    longitud: 21.25,
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 350,
    torque: 2,
  },

  // S-BLUE
  's-blue_1-b0': {
    id: 's-blue_1-b0',
    sistema: 'S Blue',
    numero: 1,
    nombre: 'B0 #17',
    diametroApical: 17,
    longitud: 19,
    conicidad: 0.1,
    velocidadMin: 425,
    velocidadMax: 500,
    torque: 2.5,
  },
  's-blue_2-b1': {
    id: 's-blue_2-b1',
    sistema: 'S Blue',
    numero: 2,
    nombre: 'B1 #20',
    diametroApical: 20,
    longitud: 25,
    longitudesAdicionales: [31],
    conicidad: 0.04,
    velocidadMin: 425,
    velocidadMax: 500,
    torque: 2.5,
  },
  's-blue_3-b2': {
    id: 's-blue_3-b2',
    sistema: 'S Blue',
    numero: 3,
    nombre: 'B2 #25',
    diametroApical: 25,
    longitud: 25,
    longitudesAdicionales: [31],
    conicidad: 0.06,
    velocidadMin: 425,
    velocidadMax: 500,
    torque: 2.5,
  },
  's-blue_4-b3': {
    id: 's-blue_4-b3',
    sistema: 'S Blue',
    numero: 4,
    nombre: 'B3 #35',
    diametroApical: 35,
    longitud: 25,
    longitudesAdicionales: [31],
    conicidad: 0.04,
    velocidadMin: 425,
    velocidadMax: 500,
    torque: 2.5,
  },

  // RC-BLUE
  'rc-blue_1-r25': {
    id: 'rc-blue_1-r25',
    sistema: 'RC Blue',
    numero: 1,
    nombre: 'R25',
    diametroApical: 25,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.08,
    velocidadMin: 250,
    velocidadMax: 350,
    torque: 3.5,
  },
  'rc-blue_2-r40': {
    id: 'rc-blue_2-r40',
    sistema: 'RC Blue',
    numero: 2,
    nombre: 'R40',
    diametroApical: 40,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.06,
    velocidadMin: 250,
    velocidadMax: 350,
    torque: 3.5,
  },
  'rc-blue_3-r50': {
    id: 'rc-blue_3-r50',
    sistema: 'RC Blue',
    numero: 3,
    nombre: 'R50',
    diametroApical: 50,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.05,
    velocidadMin: 250,
    velocidadMax: 350,
    torque: 3.5,
  },

  // Super-Files-III
  'super-files-iii_1-sx': {
    id: 'super-files-iii_1-sx',
    sistema: 'Super Files III',
    numero: 1,
    nombre: 'SX',
    diametroApical: 19,
    longitud: 19,
    conicidad: 0.03,
    conicidadAlt: 0.19,
    velocidadMin: 150,
    velocidadMax: 300,
    torque: '2-2.5',
  },
  'super-files-iii_2-s1': {
    id: 'super-files-iii_2-s1',
    sistema: 'Super Files III',
    numero: 2,
    nombre: 'S1',
    diametroApical: 17,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.02,
    conicidadAlt: 0.11,
    velocidadMin: 150,
    velocidadMax: 300,
    torque: '2-2.5',
  },
  'super-files-iii_3-s2': {
    id: 'super-files-iii_3-s2',
    sistema: 'Super Files III',
    numero: 3,
    nombre: 'S2',
    diametroApical: 20,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.04,
    conicidadAlt: 0.115,
    velocidadMin: 150,
    velocidadMax: 300,
    torque: '2-2.5',
  },
  'super-files-iii_4-f1': {
    id: 'super-files-iii_4-f1',
    sistema: 'Super Files III',
    numero: 4,
    nombre: 'F1',
    diametroApical: 20,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.07,
    velocidadMin: 150,
    velocidadMax: 300,
    torque: '2-2.5',
  },
  'super-files-iii_5-f2': {
    id: 'super-files-iii_5-f2',
    sistema: 'Super Files III',
    numero: 5,
    nombre: 'F2',
    diametroApical: 25,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.08,
    velocidadMin: 150,
    velocidadMax: 300,
    torque: '2-2.5',
  },
  'super-files-iii_6-f3': {
    id: 'super-files-iii_6-f3',
    sistema: 'Super Files III',
    numero: 6,
    nombre: 'F3',
    diametroApical: 30,
    longitud: 21,
    longitudesAdicionales: [25, 31],
    conicidad: 0.09,
    velocidadMin: 150,
    velocidadMax: 300,
    torque: '2-2.5',
  },

  // Apical-Shaper
  'apical-shaper_1-z30': {
    id: 'apical-shaper_1-z30',
    sistema: 'Apical Shaper',
    numero: 1,
    nombre: 'Z30',
    diametroApical: 30,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.03,
    velocidadMin: 150,
    velocidadMax: 350,
    torque: '2-2.5',
  },
  'apical-shaper_2-z35': {
    id: 'apical-shaper_2-z35',
    sistema: 'Apical Shaper',
    numero: 2,
    nombre: 'Z35',
    diametroApical: 35,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.03,
    velocidadMin: 150,
    velocidadMax: 350,
    torque: '2-2.5',
  },
  'apical-shaper_3-z40': {
    id: 'apical-shaper_3-z40',
    sistema: 'Apical Shaper',
    numero: 3,
    nombre: 'Z40',
    diametroApical: 40,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.03,
    velocidadMin: 150,
    velocidadMax: 350,
    torque: '2-2.5',
  },
  'apical-shaper_4-z50': {
    id: 'apical-shaper_4-z50',
    sistema: 'Apical Shaper',
    numero: 4,
    nombre: 'Z50',
    diametroApical: 50,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.03,
    velocidadMin: 150,
    velocidadMax: 350,
    torque: '2-2.5',
  },

  // 3D-Files
  '3d-files_1-f25': {
    id: '3d-files_1-f25',
    sistema: '3D Files',
    numero: 1,
    nombre: 'F25',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.02,
    velocidadMin: 800,
    velocidadMax: 800,
    torque: 1,
  },
  '3d-files_2-f25': {
    id: '3d-files_2-f25',
    sistema: '3D Files',
    numero: 1,
    nombre: 'F25',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.02,
    velocidadMin: 800,
    velocidadMax: 800,
    torque: 1,
  },
  '3d-files_2-f30': {
    id: '3d-files_2-f30',
    sistema: '3D Files',
    numero: 2,
    nombre: 'F30',
    diametroApical: 30,
    longitud: 25,
    conicidad: 0.02,
    velocidadMin: 800,
    velocidadMax: 800,
    torque: 1,
  },
  '3d-files_3-f30': {
    id: '3d-files_3-f30',
    sistema: '3D Files',
    numero: 2,
    nombre: 'F30',
    diametroApical: 30,
    longitud: 25,
    conicidad: 0.02,
    velocidadMin: 800,
    velocidadMax: 800,
    torque: 1,
  },
  '3d-files_1-s30': {
    id: '3d-files_1-s30',
    sistema: '3D Files',
    numero: 3,
    nombre: 'S30',
    diametroApical: 30,
    longitud: 25,
    conicidad: 0.04,
    velocidadMin: 800,
    velocidadMax: 800,
    torque: 1,
  },
  '3d-files_3-s30': {
    id: '3d-files_3-s30',
    sistema: '3D Files',
    numero: 3,
    nombre: 'S30',
    diametroApical: 30,
    longitud: 25,
    conicidad: 0.04,
    velocidadMin: 800,
    velocidadMax: 800,
    torque: 1,
  },

  // Micromega-Remover
  'micromega-remover_1-n30': {
    id: 'micromega-remover_1-n30',
    sistema: 'MicroMega Remover',
    numero: 1,
    nombre: 'N30',
    diametroApical: 30,
    longitud: 23,
    longitudesAdicionales: [19],
    conicidad: 0.07,
    velocidadMin: 400,
    velocidadMax: 800,
    torque: 2.5,
  },

  // Rising
  'rising_1-17': {
    id: 'rising_1-17',
    sistema: 'Rising',
    numero: 1,
    nombre: '17',
    diametroApical: 17,
    longitud: 19,
    conicidad: 0.1,
    velocidadMin: 450,
    torque: 2.5,
  },
  'rising_2-13': {
    id: 'rising_2-13',
    sistema: 'Rising',
    numero: 2,
    nombre: '13',
    diametroApical: 13,
    longitud: 25,
    conicidad: 0.03,
    velocidadMin: 450,
    torque: 2.5,
  },
  'rising_3-25': {
    id: 'rising_3-25',
    sistema: 'Rising',
    numero: 3,
    nombre: '25',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.04,
    velocidadMin: 450,
    torque: 2.5,
  },
  'rising_4-30': {
    id: 'rising_4-30',
    sistema: 'Rising',
    numero: 4,
    nombre: '30',
    diametroApical: 30,
    longitud: 25,
    conicidad: 0.04,
    velocidadMin: 450,
    torque: 2.5,
  },
  'rising_5-28': {
    id: 'rising_5-28',
    sistema: 'Rising',
    numero: 5,
    nombre: '28',
    diametroApical: 28,
    longitud: 25,
    conicidad: 0.05,
    velocidadMin: 450,
    torque: 2.5,
  },

  // Slim-Shaper
  'slim-shaper_zs1': {
    id: 'slim-shaper_zs1',
    sistema: 'Slim Shaper',
    numero: 1,
    nombre: 'ZS1',
    diametroApical: 15,
    longitud: 25,
    conicidad: 0.02,
    conicidadAlt: 0.06,
    velocidadMin: 300,
    velocidadMax: 500,
    torque: 3,
  },
  'slim-shaper_zs2': {
    id: 'slim-shaper_zs2',
    sistema: 'Slim Shaper',
    numero: 2,
    nombre: 'ZS2',
    diametroApical: 20,
    longitud: 25,
    conicidad: 0.04,
    conicidadAlt: 0.03,
    velocidadMin: 300,
    velocidadMax: 500,
    torque: 3,
  },
  'slim-shaper_zs3': {
    id: 'slim-shaper_zs3',
    sistema: 'Slim Shaper',
    numero: 3,
    nombre: 'ZS3',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.04,
    conicidadAlt: 0.03,
    velocidadMin: 300,
    velocidadMax: 500,
    torque: 3,
  },
  // Alias under the id the current (v2) model emits — see the 3D-Files note above.
  'slim-shaper_1-zs1': {
    id: 'slim-shaper_1-zs1',
    sistema: 'Slim Shaper',
    numero: 1,
    nombre: 'ZS1',
    diametroApical: 15,
    longitud: 25,
    conicidad: 0.02,
    conicidadAlt: 0.06,
    velocidadMin: 300,
    velocidadMax: 500,
    torque: 3,
  },
  'slim-shaper_2-zs2': {
    id: 'slim-shaper_2-zs2',
    sistema: 'Slim Shaper',
    numero: 2,
    nombre: 'ZS2',
    diametroApical: 20,
    longitud: 25,
    conicidad: 0.04,
    conicidadAlt: 0.03,
    velocidadMin: 300,
    velocidadMax: 500,
    torque: 3,
  },
  'slim-shaper_3-zs3': {
    id: 'slim-shaper_3-zs3',
    sistema: 'Slim Shaper',
    numero: 3,
    nombre: 'ZS3',
    diametroApical: 25,
    longitud: 25,
    conicidad: 0.04,
    conicidadAlt: 0.03,
    velocidadMin: 300,
    velocidadMax: 500,
    torque: 3,
  },

  // MicroMega One Curve Mini Assorted
  'micromega-one-curve-mini-assorted_1-n45-0.4': {
    id: 'micromega-one-curve-mini-assorted_1-n45-0.4',
    sistema: 'MicroMega One Curve Mini',
    numero: 1,
    nombre: 'N45 4%',
    diametroApical: 45,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  'micromega-one-curve-mini-assorted_2-n35-0.4': {
    id: 'micromega-one-curve-mini-assorted_2-n35-0.4',
    sistema: 'MicroMega One Curve Mini',
    numero: 2,
    nombre: 'N35 4%',
    diametroApical: 35,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  'micromega-one-curve-mini-assorted_3-n25-0.6': {
    id: 'micromega-one-curve-mini-assorted_3-n25-0.6',
    sistema: 'MicroMega One Curve Mini',
    numero: 3,
    nombre: 'N25 6%',
    diametroApical: 25,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.06,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  'micromega-one-curve-mini-assorted_4-n25-0.4': {
    id: 'micromega-one-curve-mini-assorted_4-n25-0.4',
    sistema: 'MicroMega One Curve Mini',
    numero: 4,
    nombre: 'N25 4%',
    diametroApical: 25,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  // Alias under the id the current (v2) model emits — see the 3D-Files note above.
  'micromega-one-curve-mini_1-n45-0.4': {
    id: 'micromega-one-curve-mini_1-n45-0.4',
    sistema: 'MicroMega One Curve Mini',
    numero: 1,
    nombre: 'N45 4%',
    diametroApical: 45,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  'micromega-one-curve-mini_2-n35-0.4': {
    id: 'micromega-one-curve-mini_2-n35-0.4',
    sistema: 'MicroMega One Curve Mini',
    numero: 2,
    nombre: 'N35 4%',
    diametroApical: 35,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  'micromega-one-curve-mini_3-n25-0.6': {
    id: 'micromega-one-curve-mini_3-n25-0.6',
    sistema: 'MicroMega One Curve Mini',
    numero: 3,
    nombre: 'N25 6%',
    diametroApical: 25,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.06,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
  'micromega-one-curve-mini_4-n25-0.4': {
    id: 'micromega-one-curve-mini_4-n25-0.4',
    sistema: 'MicroMega One Curve Mini',
    numero: 4,
    nombre: 'N25 4%',
    diametroApical: 25,
    longitud: 25,
    longitudesAdicionales: [21, 31],
    conicidad: 0.04,
    velocidadMin: 300,
    velocidadMax: 450,
    torque: 2.5,
  },
};

/**
 * Helper function to retrieve EndoFileDetails by class ID (fuzzy matching supported)
 */
export function getEndoFileInfo(classId: string | null): EndoFileDetails | null {
  if (!classId) return null;
  const key = classId.trim().toLowerCase();
  
  if (ENDOFILE_DICTIONARY[key]) {
    return ENDOFILE_DICTIONARY[key];
  }

  // Fallback: search by replacing hyphens/underscores
  const normalizedKey = key.replace(/[-_]/g, '');
  const matchKey = Object.keys(ENDOFILE_DICTIONARY).find(k => k.replace(/[-_]/g, '') === normalizedKey);

  if (matchKey) {
    return ENDOFILE_DICTIONARY[matchKey];
  }

  return null;
}

/* ------------------------------------------------------------------------- */
/* Catalog view                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Files the catalog lists: the 43 rows of `dataset/limas-endodonticas.csv` in CSV order
 * (by system, then `numero`), plus the 4 `Blue Shaper` files, as dictionary keys. 47 in all.
 *
 * Deliberately separate from `FILE_CLASSES`: this is the reference list the user browses,
 * while `FILE_CLASSES` is the model's output contract. The two overlap but neither contains
 * the other — the current (v2) model covers Blue Shaper, MG3 Blue, Apical Shaper, 3D Files,
 * Rising, Slim Shaper, MicroMega One Curve Mini and MicroMega Remover (29 classes / 8
 * systems). Re Treaty, S Blue, RC Blue and Super Files III (18 files) are listed here with
 * no class in the model, and so carry `detectable: false` until a future model covers them.
 *
 * `Blue Shaper` is the one system with no row in the CSV: its ficha exists only here and in
 * the dictionary, and its four files duplicate MG3 Blue's first four field for field, which
 * suggests they are the same instruments under the model's naming. Unresolved on purpose —
 * merging them is a data decision, not a rendering one.
 *
 * 3D Files, Slim Shaper and MicroMega One Curve Mini each hold two aliases per file in the
 * dictionary — one under the retired 47-class model's ids (kept so history captured under
 * the old model still resolves a ficha) and one under the ids the current model emits. The
 * ids used here are always the ones the current model emits, so catalog, detection and
 * detail key on the same string.
 */
export const CATALOG_FILE_IDS = [
  're-treaty_1-bully', 're-treaty_2-skinny', 're-treaty_3-shapy1',
  're-treaty_4-shapy2', 're-treaty_5-shapy3',
  'mg3-blue_1-sv', 'mg3-blue_2-px', 'mg3-blue_3-g1', 'mg3-blue_4-g2x', 'mg3-blue_5-g2',
  'blue-shaper_1-z1', 'blue-shaper_2-z2', 'blue-shaper_3-z3', 'blue-shaper_4-z4',
  's-blue_1-b0', 's-blue_2-b1', 's-blue_3-b2', 's-blue_4-b3',
  'rc-blue_1-r25', 'rc-blue_2-r40', 'rc-blue_3-r50',
  'super-files-iii_1-sx', 'super-files-iii_2-s1', 'super-files-iii_3-s2',
  'super-files-iii_4-f1', 'super-files-iii_5-f2', 'super-files-iii_6-f3',
  'apical-shaper_1-z30', 'apical-shaper_2-z35', 'apical-shaper_3-z40', 'apical-shaper_4-z50',
  '3d-files_1-f25', '3d-files_2-f30', '3d-files_3-s30',
  'micromega-remover_1-n30',
  'rising_1-17', 'rising_2-13', 'rising_3-25', 'rising_4-30', 'rising_5-28',
  'slim-shaper_1-zs1', 'slim-shaper_2-zs2', 'slim-shaper_3-zs3',
  'micromega-one-curve-mini_1-n45-0.4', 'micromega-one-curve-mini_2-n35-0.4',
  'micromega-one-curve-mini_3-n25-0.6', 'micromega-one-curve-mini_4-n25-0.4',
] as const;

/** Lookup for the detectable flag below. */
const MODEL_CLASS_IDS: ReadonlySet<string> = new Set(FILE_CLASSES);

/** A single catalog row: a dataset file plus its dictionary entry, when there is one. */
export interface CatalogEntry {
  classId: string;
  /** `null` when the file has no dictionary entry; callers fall back to parsing `classId`. */
  info: EndoFileDetails | null;
  /**
   * `false` for dataset files the model has no class for: they can be consulted from the
   * catalog, but the camera can never return them.
   */
  detectable: boolean;
}

export interface EndoFileSystemGroup {
  sistema: string;
  limas: CatalogEntry[];
}

/** Strips case and diacritics so searches match regardless of accents. */
function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** System label for classes missing a dictionary entry, derived from the class id. */
function fallbackSystemName(classId: string): string {
  return classId.split('_')[0]?.replace(/-/g, ' ') || 'Sistema desconocido';
}

/** Sequence order within a system. Entries without a dictionary hit sink to the bottom. */
function compareCatalogEntries(a: CatalogEntry, b: CatalogEntry): number {
  if (a.info && b.info) return a.info.numero - b.info.numero;
  if (a.info) return -1;
  if (b.info) return 1;
  return a.classId.localeCompare(b.classId, 'es');
}

function buildCatalogSystems(): EndoFileSystemGroup[] {
  const groups = new Map<string, CatalogEntry[]>();

  // The catalog is derived from the dataset list, never from the dictionary keys: the
  // dataset is the reference the fichas come from, and iterating an explicit list sidesteps
  // the alias entries the dictionary holds for some systems.
  for (const classId of CATALOG_FILE_IDS) {
    const info = getEndoFileInfo(classId);
    if (!info) {
      console.warn(`[Catálogo] La lima "${classId}" no tiene ficha en ENDOFILE_DICTIONARY.`);
    }

    const entry: CatalogEntry = {
      classId,
      info,
      detectable: MODEL_CLASS_IDS.has(classId),
    };

    const sistema = info?.sistema || fallbackSystemName(classId);
    const bucket = groups.get(sistema);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(sistema, [entry]);
    }
  }

  return Array.from(groups, ([sistema, limas]) => ({
    sistema,
    limas: limas.sort(compareCatalogEntries),
  })).sort((a, b) => a.sistema.localeCompare(b.sistema, 'es'));
}

// Static data: build once so the console warning above cannot spam on re-render.
let catalogCache: EndoFileSystemGroup[] | null = null;

/**
 * Catalog derived from CATALOG_FILE_IDS: every dataset file resolved against the
 * dictionary, grouped by system (A→Z) and ordered by `numero` asc within each group.
 */
export function getCatalogSystems(): EndoFileSystemGroup[] {
  if (!catalogCache) {
    catalogCache = buildCatalogSystems();
  }
  return catalogCache;
}

function matchesSearchTerm(entry: CatalogEntry, sistema: string, term: string): boolean {
  const haystack = [sistema, entry.info?.nombre ?? entry.classId];
  if (entry.info) {
    haystack.push(String(entry.info.diametroApical));
  }
  return haystack.some(value => normalizeSearchText(value).includes(term));
}

/** Filters by name, system or apical diameter. An empty query returns the full catalog. */
export function searchEndoFiles(query: string): EndoFileSystemGroup[] {
  const term = normalizeSearchText(query.trim());
  if (!term) return getCatalogSystems();

  return getCatalogSystems()
    .map(group => ({
      sistema: group.sistema,
      limas: group.limas.filter(entry => matchesSearchTerm(entry, group.sistema, term)),
    }))
    .filter(group => group.limas.length > 0);
}
