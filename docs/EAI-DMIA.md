# Endofile AI - Documento del Modelo de IA

**Versión:** 2.0
**Fecha:** 2026-08-04
**Autor:** Josue Carbajal

---

## 1. Qué hace

Clasifica la fotografía de una lima endodóntica rotatoria en una de **28 clases** y
devuelve una probabilidad por clase. Corre íntegramente en el navegador con TensorFlow.js:
ninguna imagen sale del dispositivo del usuario.

Es la **segunda generación** del modelo. La primera cubría 38 clases en 10 sistemas con
MobileNetV3-Small; esta se reentrenó desde cero sobre EfficientNetB0 y cubre **7 sistemas
(28 limas)** — los que tenían dataset suficiente para entrenar con confianza.

---

## 2. Arquitectura

| | |
| --- | --- |
| Base | EfficientNetB0 preentrenado en ImageNet |
| Cabeza | `GlobalAveragePooling2D` → `BatchNorm` → `Dense(512)` → `Dropout` → `Dense(256)` → `BatchNorm` → `Dropout` → `Dense(28, softmax)` |
| Parámetros | ~4,85 millones |
| Tamaño exportado | ~18,3 MiB, sin cuantizar (`float32`) |
| Entrada | imagen 448×448 px, RGB, píxeles en [0, 255] |
| Salida | 28 probabilidades que suman 1 |
| Formato | TensorFlow.js *graph model* |

---

## 3. Entrenamiento

Documentado en [`model/endox_ia_reduced.ipynb`](../model/endox_ia_reduced.ipynb), sobre
Google Colab (GPU Tesla T4).

- **Dataset:** 4 199 fotos, ~150 por lima, recortadas a proporción 3:4 y repartidas 80/20
  entre entrenamiento y validación.
- **Aumentado de datos:** volteos horizontal/vertical, rotación en múltiplos de 90°, zoom,
  brillo y contraste, todos aleatorios.
- **Dos fases:** primero con el backbone congelado (20 épocas, *learning rate* 1e-4);
  después con las últimas 30 capas de EfficientNetB0 descongeladas (15 épocas, *learning
  rate* 1e-5).
- **Resultado final:** 94,64 % de exactitud en validación, 99,88 % top-3, 100 % top-5.

Las clases más flojas son las de `MG3-Blue` (60–89 % de precisión) y `rising_2-13` (75 %);
el resto ronda o alcanza el 100 %.

---

## 4. Sistemas y clases cubiertos

| Sistema | Limas |
| --- | ---: |
| 3D-Files | 3 |
| Apical-Shaper | 4 |
| Blue-Shaper | 4 |
| MG3-Blue | 5 |
| MicroMega One Curve Mini | 4 |
| Rising | 5 |
| Slim-Shaper | 3 |
| **Total** | **28** |

**No** cubiertos por el modelo (pero sí consultables en el catálogo de la app, marcados como
«solo consulta»): Re-Treaty, S-Blue, RC-Blue, Super-Files-III y Micromega-Remover.

---

## 5. Limitaciones conocidas

- Sin validación clínica: los datos de cada ficha vienen del fabricante, no de un ensayo.
- El dataset de entrenamiento vive en Google Drive, fuera del repositorio: no es
  reproducible sin acceso a esa carpeta.
- El preprocesado de imagen del cliente web se corrigió para coincidir con el usado al
  entrenar, pero no se ha vuelto a medir la accuracy en un dispositivo real tras el cambio
  (detalle técnico en `model/README.md` §3, §9).
- 5 de los 12 sistemas del catálogo no tienen clase en este modelo (ver §4).

---

## 6. Dónde está todo

| Qué | Dónde |
| --- | --- |
| Pesos del modelo (los que sirve la app) | `web/public/model_proto/` |
| Notebook de entrenamiento | `model/endox_ia_reduced.ipynb` |
| Ficha técnica completa (grafo, defectos, métricas por clase) | [`model/README.md`](../model/README.md) |
| Lista de clases (contrato con el modelo) | `web/app/constants/endofile-classes.ts` |
| Fichas técnicas de cada lima | `web/app/constants/endofile-dataset.ts` |

Este documento es un resumen. Para el detalle técnico de los artefactos, análisis
del grafo, defectos conocidos y su evidencia— ver `model/README.md`.
