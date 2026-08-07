# Endofile AI - Documento del Modelo de IA

**Versión:** 3.0
**Fecha:** 2026-08-06
**Autor:** Josue Carbajal

---

## 1. Qué hace

Clasifica la fotografía de una lima endodóntica rotatoria en una de **29 clases** y
devuelve una probabilidad por clase. Corre íntegramente en el navegador con TensorFlow.js:
ninguna imagen sale del dispositivo del usuario.

Es la **tercera generación** del modelo (v2 del "modelo reducido"). La primera cubría 38
clases en 10 sistemas con MobileNetV3-Small; la segunda (v1 del reducido) cubría 7 sistemas
/ 28 limas sobre EfficientNetB0; esta se reentrenó sobre EfficientNetB2 y suma
`MicroMega-Remover`, para **8 sistemas (29 limas)**. Informes por generación en
[`EAI-IMRV1.md`](EAI-IMRV1.md) y [`EAI-IMRV2.md`](EAI-IMRV2.md).

---

## 2. Arquitectura

| | |
| --- | --- |
| Base | EfficientNetB2 preentrenado en ImageNet |
| Cabeza | `GlobalAveragePooling2D` → `BatchNorm` → `Dense(512)` → `Dropout` → `Dense(256)` → `BatchNorm` → `Dropout` → `Dense(29, softmax)` |
| Parámetros | ~8,64 millones |
| Tamaño exportado | ~32,6 MiB, sin cuantizar (`float32`) |
| Entrada | imagen 448×448 px, RGB, píxeles en [0, 255] |
| Salida | 29 probabilidades que suman 1 |
| Formato | TensorFlow.js *graph model* |

---

## 3. Entrenamiento

Documentado en [`model/endox_ia_reduced_v2.ipynb`](../model/endox_ia_reduced_v2.ipynb),
sobre Google Colab.

- **Dataset:** 5 364 fotos, 185 promedio por lima, recortadas a proporción 3:4 y repartidas
  80/20 entre entrenamiento y validación.
- **Aumentado de datos:** volteos horizontal/vertical, rotación en múltiplos de 90°, zoom,
  brillo y contraste, todos aleatorios — igual que la generación anterior.
- **Dos fases:** primero con el backbone congelado (25 épocas, *learning rate* 1e-4);
  después con las últimas 40 capas de EfficientNetB2 descongeladas (20 épocas, *learning
  rate* 1e-5).
- **Resultado final:** 97,20 % de exactitud en validación, 100 % top-3, 100 % top-5 — mejora
  sobre la generación anterior (94,64 % / 99,88 % / 100 %).

Las clases más flojas son las de `MG3-Blue` (88–96 % de precisión) y `rising_3-25` (85 %);
el resto ronda o alcanza el 100 %, incluida la clase nueva `micromega-remover_1-n30`.

---

## 4. Sistemas y clases cubiertos

| Sistema | Limas |
| --- | ---: |
| 3D-Files | 3 |
| Apical-Shaper | 4 |
| Blue-Shaper | 4 |
| MG3-Blue | 5 |
| MicroMega One Curve Mini | 4 |
| MicroMega-Remover | 1 |
| Rising | 5 |
| Slim-Shaper | 3 |
| **Total** | **29** |

**No** cubiertos por el modelo (pero sí consultables en el catálogo de la app, marcados como
«solo consulta»): Re-Treaty, S-Blue, RC-Blue y Super-Files-III.

---

## 5. Limitaciones conocidas

- Sin validación clínica: los datos de cada ficha vienen del fabricante, no de un ensayo.
- El dataset de entrenamiento vive en Google Drive, fuera del repositorio: no es
  reproducible sin acceso a esa carpeta.
- El notebook tiene una celda de verificación de clases con salida desactualizada (no
  refleja las 29 clases reales); detalle en `model/README.md` §6.5.
- No se ha vuelto a medir la accuracy en un dispositivo real, ni para esta generación ni
  para la anterior (detalle técnico en `model/README.md` §9).
- 4 de los 12 sistemas del catálogo no tienen clase en este modelo (ver §4).

---

## 6. Dónde está todo

| Qué | Dónde |
| --- | --- |
| Pesos del modelo (los que sirve la app) | `web/public/model_proto/` |
| Notebook de entrenamiento | `model/endox_ia_reduced_v2.ipynb` |
| Ficha técnica completa (grafo, defectos, métricas por clase) | [`model/README.md`](../model/README.md) |
| Informes breves por generación | [`EAI-IMRV1.md`](EAI-IMRV1.md), [`EAI-IMRV2.md`](EAI-IMRV2.md) |
| Lista de clases (contrato con el modelo) | `web/app/constants/endofile-classes.ts` |
| Fichas técnicas de cada lima | `web/app/constants/endofile-dataset.ts` |

Este documento es un resumen. Para el detalle técnico de los artefactos, análisis
del grafo, defectos conocidos y su evidencia — ver `model/README.md`.
