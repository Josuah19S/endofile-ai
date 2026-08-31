# Endofile AI - Informe del Modelo Reducido V1

**Versión:** 1.1  
**Notebook:** [`model/endox_ia_reduced.ipynb`](../model/endox_ia_reduced.ipynb)   
**Estado:** Sustituido como modelo por defecto por V2 ([`EAI-IMRV2.md`](EAI-IMRV2.md)), pero **sigue servido**: sus artefactos están en `web/public/models/v1/` y la app los carga en la ruta `/modelv1`, para poder comparar ambas generaciones sobre las mismas fotos.

---

## 1. Resumen

Segunda generación del clasificador (la primera cubría 38 clases en 10 sistemas con
MobileNetV3-Small). Este modelo se entrenó desde cero sobre **EfficientNetB0** y cubría
**7 sistemas / 28 limas** — los que tenían dataset suficiente en ese momento.

## 2. Arquitectura

| | |
| --- | --- |
| Base | EfficientNetB0 (ImageNet), congelado en fase 1 |
| Cabeza | `GAP → BatchNorm → Dense(512) → Dropout(0.4) → Dense(256) → BatchNorm → Dropout(0.3) → Dense(28, softmax)` |
| Parámetros | 4 850 111 |
| Tamaño exportado | ≈18,29 MiB, `float32` sin cuantizar, 5 *shards* |
| Entrada | 448×448 px RGB, píxeles en [0, 255] (normalización propia del grafo) |
| Salida | `[batch, 28]`, softmax incluido |

## 3. Entrenamiento

- **Dataset:** 4 199 imágenes, ~150 por clase, recorte 3:4, 80/20 train/val (`seed=42`).
- **Aumentado:** flips horizontal/vertical, rotación en múltiplos de 90°, zoom/brillo/
  contraste ±30 %.
- **Fase 1** (backbone congelado): 20 épocas, LR 1e-4, mejor época 19, val_accuracy 95,59 %.
- **Fase 2** (fine-tuning, últimas 30 capas): 15 épocas, LR 1e-5, mejor época 14,
  val_accuracy **94,64 %** — más baja que el mejor punto de la fase 1, sin explicación en
  el notebook.

## 4. Sistemas y clases cubiertos

| Sistema | Clases |
| --- | ---: |
| 3D-Files | 3 |
| Apical-Shaper | 4 |
| Blue-Shaper | 4 |
| MG3-Blue | 5 |
| MicroMega One Curve Mini | 4 |
| Rising | 5 |
| Slim-Shaper | 3 |
| **Total** | **28** |

**No** cubiertos: Re-Treaty, S-Blue, RC-Blue, Super-Files-III y MicroMega-Remover (19 limas).

## 5. Métricas finales

| Métrica | Valor |
| --- | ---: |
| Accuracy | 94,64 % |
| Top-3 accuracy | 99,88 % |
| Top-5 accuracy | 100,00 % |
| Precisión media (macro avg) | 94,49 % |

Clases más flojas: `mg3-blue_4-g2x` (60,00 %) y el resto de `MG3-Blue` (76–89 %);
`rising_2-13` (75,00 %) fuera de ese sistema.

## 6. Dónde está todo

| Qué | Dónde |
| --- | --- |
| Pesos del modelo (servidos en `/modelv1`) | `web/public/models/v1/` |
| Ficha técnica completa (grafo, artefactos, defectos) | [`model/README.md`](../model/README.md) (histórico de v1, documenta v2) |
| Notebook | `model/endox_ia_reduced.ipynb` |
| Lista de clases (contrato con el modelo) | `FILE_CLASSES_V1` en `web/app/constants/endofile-models.ts` |
| Sucesor | [`EAI-IMRV2.md`](EAI-IMRV2.md) |

Este es un informe breve. El detalle técnico completo de esta generación (grafo, hashes de
artefactos, tabla de precisión por clase completa) quedó en el historial de git de
`model/README.md`, en el commit previo a la actualización que documenta v2.
