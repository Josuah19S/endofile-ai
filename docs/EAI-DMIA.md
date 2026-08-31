# Endofile AI - Documento del Modelo de IA

**Versión:** 3.1

---

## 1. Qué hace

Clasifica la fotografía de una lima endodóntica rotatoria y devuelve una probabilidad por
clase. Corre íntegramente en el navegador con TensorFlow.js: ninguna imagen sale del
dispositivo del usuario.

La app sirve **dos generaciones a la vez**, cada una en su propia ruta, para poder
compararlas sobre las mismas fotos:

| Ruta | Modelo | Backbone | Clases | Estado |
| --- | --- | --- | ---: | --- |
| `/` y `/modelv2` | EndoX IA Reduced **v2** | EfficientNetB2 | 29 | Por defecto |
| `/modelv1` | EndoX IA Reduced **v1** | EfficientNetB0 | 28 | Generación anterior, aún servida |

v2 es la **tercera generación** del clasificador. La primera cubría 38 clases en 10 sistemas
con MobileNetV3-Small y ya no se sirve; la segunda (v1 del reducido) cubría 7 sistemas / 28
limas sobre EfficientNetB0; esta se reentrenó sobre EfficientNetB2 y suma
`MicroMega-Remover`, para **8 sistemas (29 limas)**. Informes por generación en
[`EAI-IMRV1.md`](EAI-IMRV1.md) y [`EAI-IMRV2.md`](EAI-IMRV2.md).

---

## 2. Arquitectura

| | v2 | v1 |
| --- | --- | --- |
| Base | EfficientNetB2 (ImageNet) | EfficientNetB0 (ImageNet) |
| Cabeza | `GlobalAveragePooling2D` → `BatchNorm` → `Dense(512)` → `Dropout` → `Dense(256)` → `BatchNorm` → `Dropout` → `Dense(N, softmax)` | idéntica |
| Parámetros | 8 635 414 | 4 850 111 |
| Tamaño exportado | ~32,6 MiB, sin cuantizar (`float32`), 9 *shards* | ~18,3 MiB, 5 *shards* |
| Entrada | imagen 448×448 px, RGB, píxeles en [0, 255] | idéntica |
| Salida | 29 probabilidades que suman 1 | 28 probabilidades |
| Formato | TensorFlow.js *graph model* | TensorFlow.js *graph model* |

La cabeza es la misma en las dos generaciones; lo único que cambia es el backbone y el
número de clases de la última capa.

---

## 3. Cómo lo usa la aplicación

- Los pesos se cargan con `loadGraphModel()` y se ejecutan con `executeAsync()`.
- **El cliente no normaliza.** Los dos grafos llevan sus capas `Rescaling` y `Normalization`
  incorporadas y esperan píxeles crudos en [0, 255]. Normalizar antes fue un bug real de la
  generación anterior (ver [`EAI-IMRV1.md`](EAI-IMRV1.md) §6).
- La captura se recorta a 3:4 —la misma proporción del dataset de entrenamiento— y ese
  recorte se comprime a 448×448 para el modelo. Sobre el mismo recorte se genera un lienzo
  480×640 que es lo que se muestra y se guarda.
- Al cargar se ejecuta un *warm-up* con un tensor de ceros, para compilar los shaders de
  WebGL y evitar la latencia del primer disparo.
- De cada predicción se conservan los **6 mejores candidatos**: el primero se muestra y hasta
  4 de los siguientes se ofrecen como corrección manual.
- Por debajo del **15 %** de confianza se devuelve «Lima no identificada» en vez de forzar
  una clase.

---

## 4. Entrenamiento (v2)

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

## 5. Sistemas y clases cubiertos

| Sistema | Limas en v2 | Limas en v1 |
| --- | ---: | ---: |
| 3D-Files | 3 | 3 |
| Apical-Shaper | 4 | 4 |
| Blue-Shaper | 4 | 4 |
| MG3-Blue | 5 | 5 |
| MicroMega One Curve Mini | 4 | 4 |
| MicroMega-Remover | 1 | — |
| Rising | 5 | 5 |
| Slim-Shaper | 3 | 3 |
| **Total** | **29** | **28** |

**No** cubiertos por ningún modelo: `Re-Treaty`, `S-Blue`, `RC-Blue` y `Super-Files-III`
(18 limas entre los cuatro). Sus fichas y fotografías siguen en el repositorio, pero desde
que el catálogo se construye a partir de las clases del modelo activo **no aparecen en la
app**: volverán cuando haya dataset suficiente para reincorporarlas.

---

## 6. Limitaciones conocidas

- Sin validación clínica: los datos de cada ficha vienen del fabricante, no de un ensayo.
- El dataset de entrenamiento vive en Google Drive, fuera del repositorio: no es
  reproducible sin acceso a esa carpeta.
- El notebook v2 tiene una celda de verificación de clases con salida desactualizada (no
  refleja las 29 clases reales); detalle en `model/README.md` §6.5.
- El log de la fase 2 imprime "30 capas" mientras el código descongela 40; la cifra buena es
  la del código.
- `rising_3-25` es la única clase que empeoró respecto a v1 (95,00 % → 85,29 %), sin
  explicación documentada.
- No se ha vuelto a medir la accuracy en un dispositivo real, ni para esta generación ni
  para la anterior (detalle técnico en `model/README.md` §9).
- El umbral del 15 % de confianza mínima se fijó por tanteo, no por análisis de la curva de
  confianza sobre el conjunto de validación.
- Los pesos van sin cuantizar: 32,6 MiB de descarga inicial para v2.

---

## 7. Dónde está todo

| Qué | Dónde |
| --- | --- |
| Pesos de v2 (los que sirve la app por defecto) | `web/public/models/v2/` |
| Pesos de v1 | `web/public/models/v1/` |
| Configuración de los modelos y listas de clases (contrato) | `web/app/constants/endofile-models.ts` |
| Código de carga e inferencia | `web/app/contexts/endofile-model-context.tsx` |
| Notebook de entrenamiento v2 | `model/endox_ia_reduced_v2.ipynb` |
| Notebook de entrenamiento v1 | `model/endox_ia_reduced.ipynb` |
| Ficha técnica completa (grafo, defectos, métricas por clase) | [`model/README.md`](../model/README.md) |
| Informes breves por generación | [`EAI-IMRV1.md`](EAI-IMRV1.md), [`EAI-IMRV2.md`](EAI-IMRV2.md) |
| Fichas técnicas de cada lima | `web/app/constants/endofile-dataset.ts` |
| Imágenes de prueba | `web/public/model_test/` |

Este documento es un resumen. Para el detalle técnico de los artefactos, análisis
del grafo, defectos conocidos y su evidencia — ver `model/README.md`.
