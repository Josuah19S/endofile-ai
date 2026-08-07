# Endofile AI - Informe del Modelo Reducido V2

**Versión:** 2.0
**Fecha:** 2026-08-06
**Autor:** Josue Carbajal
**Notebook:** [`model/endox_ia_reduced_v2.ipynb`](../model/endox_ia_reduced_v2.ipynb)
**Estado:** Vigente — es el modelo que sirve `web/public/model_proto/`.

---

## 1. Resumen

Tercera generación del clasificador. Reentrena la arquitectura de V1 sobre
**EfficientNetB2** (antes B0) y suma el sistema `MicroMega-Remover`, para **8 sistemas / 29
limas** (antes 7 / 28). Predecesor: [`EAI-IMRV1.md`](EAI-IMRV1.md).

## 2. Arquitectura

| | |
| --- | --- |
| Base | EfficientNetB2 (ImageNet), congelado en fase 1 |
| Cabeza | `GAP → BatchNorm → Dense(512) → Dropout(0.4) → Dense(256) → BatchNorm → Dropout(0.3) → Dense(29, softmax)` — idéntica a V1, solo cambia el backbone |
| Parámetros | 8 635 414 |
| Tamaño exportado | ≈32,60 MiB, `float32` sin cuantizar, 9 *shards* |
| Entrada | 448×448 px RGB, píxeles en [0, 255] (normalización propia del grafo, misma fórmula que V1) |
| Salida | `[batch, 29]`, softmax incluido |

## 3. Entrenamiento

- **Dataset:** 5 364 imágenes, 185 promedio por clase (mínimo 139, máximo 215), recorte 3:4,
  80/20 train/val (`seed=42`).
- **Aumentado:** igual que V1 — flips horizontal/vertical, rotación en múltiplos de 90°,
  zoom/brillo/contraste ±30 %.
- **Fase 1** (backbone congelado): 25 épocas, LR 1e-4, mejor época 21, val_accuracy 95,99 %.
- **Fase 2** (fine-tuning, últimas 40 capas¹): 20 épocas, LR 1e-5, mejor época 17,
  val_accuracy **97,20 %** — a diferencia de V1, aquí la fase 2 sí mejora sobre la fase 1.

¹ El notebook imprime "últimas 30 capas" pero el código descongela las últimas 40; la cifra
de esta tabla es la del código, que es lo que realmente se entrenó.

## 4. Sistemas y clases cubiertos

| Sistema | Clases |
| --- | ---: |
| 3D-Files | 3 |
| Apical-Shaper | 4 |
| Blue-Shaper | 4 |
| MG3-Blue | 5 |
| MicroMega One Curve Mini | 4 |
| **MicroMega-Remover** | **1 (nuevo)** |
| Rising | 5 |
| Slim-Shaper | 3 |
| **Total** | **29** |

**No** cubiertos: Re-Treaty, S-Blue, RC-Blue y Super-Files-III (18 limas — uno menos que en
V1, porque MicroMega-Remover pasó a estar cubierto).

## 5. Métricas finales

| Métrica | V2 | V1 |
| --- | ---: | ---: |
| Accuracy | **97,20 %** | 94,64 % |
| Top-3 accuracy | 100,00 % | 99,88 % |
| Top-5 accuracy | 100,00 % | 100,00 % |
| Precisión media (macro avg) | 97,44 % | 94,49 % |

Mejora en las cuatro métricas. `MicroMega-Remover` (la clase nueva) llega a 100 % de
precisión. `MG3-Blue` sigue siendo el sistema más débil, pero mejora en conjunto (su peor
clase pasa de 60,00 % a 89,36 %). La única clase que **empeoró** frente a V1 es
`rising_3-25` (95,00 % → 85,29 %), sin explicación documentada en el notebook.

## 6. Limitaciones conocidas

- Discrepancia entre el log impreso de la fase 2 ("30 capas") y el código real (40 capas).
- Constantes de normalización no reverificadas byte a byte para este grafo (sí se hizo en
  V1); se asume la misma fórmula por ser la misma función de Keras.

## 7. Dónde está todo

| Qué | Dónde |
| --- | --- |
| Pesos del modelo (los que sirve la app) | `web/public/model_proto/` |
| Notebook de entrenamiento | `model/endox_ia_reduced_v2.ipynb` |
| Ficha técnica completa (grafo, hashes, precisión por clase) | [`model/README.md`](../model/README.md) |
| Lista de clases (contrato con el modelo) | `web/app/constants/endofile-classes.ts` |
| Predecesor | [`EAI-IMRV1.md`](EAI-IMRV1.md) |

Este es un informe breve. Para el detalle técnico completo (composición del grafo, hashes de
artefactos, análisis de la inconsistencia de la celda de verificación) ver
[`model/README.md`](../model/README.md).
