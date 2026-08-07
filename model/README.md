# Modelo de clasificación de limas endodónticas

Clasificador de imagen que identifica una lima rotatoria a partir de una fotografía y
devuelve una de **29 clases**. Se ejecuta íntegramente en el navegador con TensorFlow.js;
ninguna imagen sale del dispositivo.

> **Dónde vive el modelo.** Los artefactos no están en esta carpeta: se sirven como
> estáticos desde [`web/public/model_proto/`](../web/public/model_proto). Esta carpeta
> documenta el modelo, no lo contiene.

> **Modelo reducido, v2.** Esta es la tercera generación del clasificador. La primera
> cubría 38 clases en 10 sistemas con MobileNetV3-Small; la segunda (v1 de este "modelo
> reducido") se entrenó sobre EfficientNetB0 y cubría 7 sistemas / 28 limas; esta versión
> (v2) reentrena sobre **EfficientNetB2** y suma `MicroMega-Remover`, para **8 sistemas /
> 29 limas**. Re-Treaty, S-Blue, RC-Blue y Super-Files-III siguen fuera del modelo; siguen
> consultables en el catálogo de la app, pero la cámara nunca los va a devolver (ver
> [README raíz](../README.md)). Informes breves de cada generación reducida en
> [`docs/EAI-IMRV1.md`](../docs/EAI-IMRV1.md) y [`docs/EAI-IMRV2.md`](../docs/EAI-IMRV2.md).

Documentado a partir de [`endox_ia_reduced_v2.ipynb`](endox_ia_reduced_v2.ipynb), el mismo
método que documentaba la versión anterior de este archivo sobre
[`endox_ia_reduced.ipynb`](endox_ia_reduced.ipynb) (ver [`docs/EAI-IMRV1.md`](../docs/EAI-IMRV1.md)
para el detalle de ese modelo). Lo que no se pudo verificar se declara como tal en §9.

## 1. Ficha técnica

| | |
| --- | --- |
| Arquitectura | EfficientNetB2 (ImageNet) + cabeza propia — ver §6.2 |
| Origen | Keras / TensorFlow **2.20.0** (notebook `endox_ia_reduced_v2.ipynb`, Google Colab) |
| Formato | TensorFlow.js **graph model** (`format: "graph-model"`) |
| Convertido con | TensorFlow.js Converter **v4.22.0** |
| Entrada | `inputs:0` · `float32` · `[batch, 448, 448, 3]` · rango **[0, 255]** — ver §3 |
| Salida | `Identity:0` · `float32` · `[batch, 29]` · **probabilidades** (softmax incluido) |
| Parámetros | **8 635 414** según `model.count_params()` (notebook, celda 13) |
| Pesos exportados | 8 545 519 `float32` + 226 `int32` — ver nota en §2 |
| Cuantización | **Ninguna**, pesos en `float32` |
| Nodos del grafo | 946, en 19 tipos de operación |
| Control de flujo | No hay. Tampoco formas dinámicas |

Reparto de operaciones: `Const` 434, `Mul` 119, `Sigmoid` 92, `_FusedConv2D` 76, `AddV2` 42,
`Mean` 24, `DepthwiseConv2dNative` 23, `Shape` 23, `StridedSlice` 23, `Pack` 23, `Reshape`
23, `Conv2D` 16, `AddN` 16, `Pad` 5, `_FusedMatMul` 3, `Placeholder` 1, `Add` 1, `Softmax` 1,
`Identity` 1 — mismos 19 tipos que en v1, con más nodos de cada uno: EfficientNetB2 es un
backbone más profundo y ancho que B0 (más bloques MBConv), no una arquitectura distinta. La
combinación `Sigmoid` + `Mul` sigue siendo la activación *swish* de EfficientNet.

## 2. Artefactos

| Fichero | Tamaño | SHA-256 |
| --- | ---: | --- |
| `web/public/model_proto/model.json` | 423 926 B (414 KiB) | `a1a6afbc3f9cac133c46f351ff62959da03804c220c8bdfb6a80566d9f52030a` |
| `web/public/model_proto/group1-shard1of9.bin` | 4 194 304 B (4,00 MiB) | `b516d484fa2b4907446af6ad227444fd9a32a35ba07402b9e2b9b49b1b524f1b` |
| `web/public/model_proto/group1-shard2of9.bin` | 4 194 304 B (4,00 MiB) | `c177d8be8b48f837f36b25bf6a48539ea42e79fb0accd4bc2fc912098fb33213` |
| `web/public/model_proto/group1-shard3of9.bin` | 4 194 304 B (4,00 MiB) | `0835ac7ab851f60cfd4ecbc2925f8a5addf292f459b1e4d7acf2e80723845f6f` |
| `web/public/model_proto/group1-shard4of9.bin` | 4 194 304 B (4,00 MiB) | `aa5107f78083ada2e0de501ef882e910def8e47b1e2d7a7e31af9e2f147db432` |
| `web/public/model_proto/group1-shard5of9.bin` | 4 194 304 B (4,00 MiB) | `1dfe83624475d5447169f02138ea254c4335f145c824c338e99e0ec5abeb3426` |
| `web/public/model_proto/group1-shard6of9.bin` | 4 194 304 B (4,00 MiB) | `6391f154b4be9b77cc75a555f7df6ed47e9b5abfd37886ea8511c57de36c03af` |
| `web/public/model_proto/group1-shard7of9.bin` | 4 194 304 B (4,00 MiB) | `a3037522e3eeafb3f9fe82391a8dadd9169fd7ec81326bdc3613caecef4d634f` |
| `web/public/model_proto/group1-shard8of9.bin` | 4 194 304 B (4,00 MiB) | `8d1c934359b2f803919610b7713dc18281e9c8ea3b58789b1afc4dc5e41b7a9a` |
| `web/public/model_proto/group1-shard9of9.bin` | 628 548 B (614 KiB) | `a63fb27460d31bfae2dfa322e7d67da9bc2bdd534a5af658d0a5680fd7492d67` |

Nueve *shards* en vez de los cinco de v1: los ocho primeros pesan exactamente 4 194 304 B
(4 MiB, el máximo por defecto de `tensorflowjs_converter`); el noveno se lleva el resto. En
total, **34 182 980 B (≈32,60 MiB) de pesos**, frente a los ≈18,29 MiB de v1 — coherente con
que EfficientNetB2 (~8,64 M parámetros) es sustancialmente más grande que EfficientNetB0
(~4,85 M).

Los 8 545 519 `float32` guardados en el grafo son algo menos que los 8 635 414 que reporta
`count_params()` en el notebook, igual que en v1: el conversor funde los parámetros de
`BatchNormalization` en las convoluciones precedentes al pasar de `SavedModel` a
`graph-model`. El tamaño en bytes de esos 8 545 519 valores (34 182 076 B) más los 226
`int32` auxiliares (904 B) cuadra exactamente con el peso real de los ficheros.

Se cargan igual que en v1, desde la raíz del sitio y no mediante `import`:

```ts
await tfjs.loadGraphModel('/model_proto/model.json');
```

## 3. Entrada y preprocesado

**El modelo lleva su propia normalización incorporada**, con la misma fórmula que v1 (§3 de
la versión anterior de este documento): el grafo confirma los mismos nodos
`rescaling_1/mul`, `rescaling_1/add` y `normalization_1/truediv` que en v1, bajo el mismo
namespace `efficientnetb2_1` en vez de `efficientnetb0_1`. No se han vuelto a leer los bytes
exactos de esas constantes para esta versión (a diferencia de v1, donde sí se hizo — ver
§9), pero es la misma función de Keras (`efficientnet.preprocess_input`, no-op sobre la
entrada; el reescalado real vive en las capas `Rescaling`/`Normalization` del propio
`EfficientNetB2`) para cualquier variante de la familia, así que se asume la misma fórmula:
`(x/255 − mean) / std` con media y desviación típica de ImageNet.

Es decir, el modelo espera **píxeles crudos en [0, 255]**, igual que v1. El cliente
(`endofile-model-context.tsx`) no aplica ninguna normalización manual — el defecto que
describía v1 §3 sigue corregido, no ha vuelto a introducirse.

## 4. Salida y postprocesado

La firma declara `Identity:0` con forma `[batch, 29]` (antes `[batch, 28]`). Igual que en
v1, el grafo ya termina en `Softmax`, así que **la salida es una distribución de
probabilidad** completa (las 29 clases suman 1). El cliente usa `rawArray` directamente
como `probabilities`, sin aplicar un segundo softmax.

`endofile-model-context.tsx` sigue filtrando por confianza mínima:

```ts
const MIN_CONFIDENCE_THRESHOLD = 0.35; // 35 %
```

Por debajo de ese umbral se descarta la predicción y se marca como «Lima no identificada».
Este umbral no se ha revisado para v2: con una clase más (29 en vez de 28) el reparto
uniforme baja de ~3,6 % a ~3,4 %, una diferencia demasiado pequeña como para justificar
tocarlo, pero no hay una medición nueva que lo confirme.

## 5. Ejecución en el navegador

Sin cambios respecto a v1, salvo el punto siguiente:

- **Backend**: el que TensorFlow.js elija por defecto, normalmente WebGL.
- **Carga**: `import('@tensorflow/tfjs')` dinámico, para evitar que el paquete entre en el
  render de servidor de Next.js.
- **Calentamiento**: tras cargar se ejecuta una pasada con `tf.zeros([1, 448, 448, 3])` para
  compilar los shaders de WebGL y que la primera captura real no pague esa latencia.
- **Memoria**: los tensores intermedios se envuelven en `tf.tidy`, y la entrada y la salida
  se liberan con `tf.dispose` después de cada predicción.

### `executeAsync` frente a `execute` — resuelto

v1 llamaba a `model.executeAsync()`, que TF.js reserva para grafos con control de flujo o
formas de salida dinámicas — ninguna de las dos cosas está presente aquí (§1), y el
navegador lo avisaba en cada inferencia: *"This model execution did not contain any nodes
with control flow or dynamic output shapes. You can use model.execute() instead."* El
cliente (`endofile-model-context.tsx`) ahora llama a `model.execute()`, síncrono, tanto en
el *warm-up* como en `predict()`. El aviso deja de aparecer y se ahorra una vuelta de
`await` innecesaria en cada predicción.

## 6. Entrenamiento

Documentado a partir de [`endox_ia_reduced_v2.ipynb`](endox_ia_reduced_v2.ipynb), ejecutado
en Google Colab. El notebook no imprime esta vez la GPU asignada (v1 sí lo hacía y era una
Tesla T4); se asume equivalente pero no consta.

### 6.1 Dataset

Mismo procedimiento que v1: aplana `dataset/<sistema>/<lima>/*` (Google Drive, fuera del
repositorio) a `dataset_flat_reduced/<sistema>_<lima>/`, con el mismo recorte 3:4 centrado.

| | |
| --- | --- |
| Sistemas incluidos | 8: `3d-files`, `apical-shaper`, `blue-shaper`, `mg3-blue`, `micromega-one-curve-mini`, `micromega-remover`, `rising`, `slim-shaper` |
| Clases (limas) | 29 |
| Imágenes totales | 5 364 |
| Promedio por clase | 185,0 (mínimo 139 en `micromega-one-curve-mini_2-n35-0.4`, máximo 215 en `mg3-blue_5-g2`) |
| Partición | 80 % train (4 292) / 20 % val (1 072), `validation_split=0.2`, `seed=42` |
| Tamaño de imagen | 448×448 |
| Batch size | 16 |

A diferencia de v1, aquí `micromega-one-curve-mini` no se procesa aparte: las ocho carpetas
se aplanan en una sola pasada (celda 5).

**Aumentado de datos** (solo en entrenamiento): idéntico a v1 — `RandomFlip` horizontal y
vertical, rotación aleatoria en múltiplos de 90° (`RandomRotate90` propia), `RandomZoom`
±30 %, `RandomBrightness` ±30 %, `RandomContrast` ±30 %.

### 6.2 Arquitectura

```
Input(448, 448, 3)
  → [augmentation, solo entrenamiento]
  → efficientnet.preprocess_input   (no-op — ver §3)
  → EfficientNetB2(weights='imagenet', include_top=False)
  → GlobalAveragePooling2D
  → BatchNormalization
  → Dense(512, relu) → Dropout(0.4)
  → Dense(256, relu)
  → BatchNormalization → Dropout(0.3)
  → Dense(29, softmax)
```

Misma cabeza que v1, cambia solo el backbone (`EfficientNetB0` → `EfficientNetB2`).

### 6.3 Procedimiento — dos fases

| | Fase 1 (backbone congelado) | Fase 2 (fine-tuning) |
| --- | --- | --- |
| `base_model.trainable` | `False` | `True`, salvo todas las capas menos las últimas 40¹ |
| Learning rate | 1e-4 | 1e-5 |
| Épocas (máx. / ejecutadas) | 25 / 25 | 20 / 20 |
| `EarlyStopping` | `monitor='val_accuracy'`, `patience=5` | `patience=7` |
| `ReduceLROnPlateau` | `monitor='val_loss'`, `factor=0.5`, `patience=3`, `min_lr=1e-7` | `patience=4`, `min_lr=1e-8` |
| Mejor época (pesos restaurados) | 21 | 17 |
| `val_accuracy` de esa época | 95,99 % | **97,20 %** |

Optimizador `Adam` en ambas fases, pérdida `SparseCategoricalCrossentropy`, métricas
`accuracy`, `top_3_accuracy` y `top_5_accuracy`.

¹ **Inconsistencia en el notebook:** el `print` de la celda 18 anuncia "Capas descongeladas:
últimas 30 de EfficientNetB2", pero el código de esa misma celda es
`for layer in base_model.layers[:-40]: layer.trainable = False` — es decir, se descongelan
las últimas **40** capas, no 30. La tabla de arriba usa el valor del código (fuente de
verdad de lo que realmente se entrenó); el mensaje impreso está desactualizado. A diferencia
de v1 —donde la fase 2 rendía *peor* que la fase 1—, aquí la fase 2 mejora sobre la fase 1
(97,20 % frente a 95,99 %), así que el defecto de v1 no se repite.

### 6.4 Métricas finales

Evaluadas sobre el 20 % de validación (1 072 imágenes), con los pesos de la fase 2 (el
modelo que se exporta):

| Métrica | Valor | vs. v1 |
| --- | ---: | ---: |
| Loss | 0,0906 | 0,1530 |
| Accuracy | **97,20 %** | 94,64 % |
| Top-3 accuracy | 100,00 % | 99,88 % |
| Top-5 accuracy | 100,00 % | 100,00 % |
| Precisión media (macro avg) | 97,44 % | 94,49 % |

Mejora en las cuatro métricas comparables, no solo por sumar `MicroMega-Remover`: el
promedio de imágenes por clase también subió (185,0 frente a ~150) y el backbone es mayor.
El notebook no aísla cuál de los tres factores (más datos, más parámetros, más épocas)
explica la mejora.

Precisión por clase (`sklearn.classification_report`), de mayor a menor:

| Clase | Precisión |
| --- | ---: |
| `3d-files_1-f25`, `_2-f30`, `_3-s30` (las 3) | 100,00 % |
| `apical-shaper_2-z35`, `_3-z40`, `_4-z50` | 100,00 % |
| `blue-shaper_1-z1` … `_4-z4` (las 4) | 100,00 % |
| `mg3-blue_3-g1` | 100,00 % |
| `micromega-one-curve-mini_2-n35-0.4`, `_3-n25-0.6`, `_4-n25-0.4` | 100,00 % |
| `micromega-remover_1-n30` | 100,00 % |
| `rising_4-30`, `rising_5-28` | 100,00 % |
| `slim-shaper_1-zs1` … `_3-zs3` (las 3) | 100,00 % |
| `apical-shaper_1-z30` | 96,77 % |
| `rising_2-13` | 95,83 % |
| `micromega-one-curve-mini_1-n45-0.4` | 95,24 % |
| `mg3-blue_2-px` | 94,29 % |
| `mg3-blue_1-sv` | 92,00 % |
| `mg3-blue_4-g2x` | 89,36 % |
| `rising_1-17` | 89,29 % |
| `mg3-blue_5-g2` | 87,76 % |
| **`rising_3-25`** | **85,29 %** |

`MG3-Blue` sigue siendo el sistema más débil (4 de sus 5 clases por debajo de 100 %, igual
que en v1), pero mejora en conjunto: la clase más floja de v1 (`mg3-blue_4-g2x`, 60,00 %)
sube a 89,36 %. `micromega-remover_1-n30` —la clase nueva, con una sola variante y 174
imágenes— llega a 100 %, así que no aporta debilidad al modelo. La clase más floja de esta
versión es `rising_3-25` (85,29 %, antes 95,00 %): a diferencia del resto de mejoras,
empeoró respecto a v1. El notebook no explica por qué; la matriz de confusión existe (celda
30) pero, igual que en v1, no se ha exportado como imagen versionada.

### 6.5 Verificación de clases — inconsistencia detectada

La celda 37/38 del notebook ("Comprobar que las clases contempladas fueron incluidas en el
modelo") imprime una lista de **28** clases, sin `micromega-remover_1-n30` y con `rising` y
`slim-shaper` en los índices que tenían en v1. Esto **contradice** la celda 8, que carga el
dataset real y reporta 29 clases con `micromega-remover_1-n30` en el índice 20 (ver §7). La
celda de verificación quedó con una salida vieja, de antes de sumar `micromega-remover` al
dataset, y no se volvió a ejecutar tras el cambio — por lo que, tal como está, **no verifica
nada**: da una falsa sensación de chequeo pasado.

La fuente de verdad usada en este documento y en `web/app/constants/endofile-classes.ts` es
la celda 8 (`class_names = train_dataset.class_names`, la misma variable que entra en
`Dense(NUM_CLASSES, ...)` y en el modelo exportado) y la forma real del tensor de salida del
`model.json` desplegado (`[batch, 29]`), no la celda 37/38.

### 6.6 Exportación

```
Keras (.keras) → tf.saved_model.save() → tensorflowjs_converter
  --input_format=tf_saved_model --output_format=tfjs_graph_model
```

Sin flag de cuantización, de ahí los pesos en `float32` de §1–2. Igual que en v1, el
notebook reconstruye un `inference_model` sin las capas de aumentado antes de exportar y
verifica que su accuracy siga siendo 97,20 % tras transferir los pesos (celda 33).

## 7. Clases

Las 29 clases viven en
[`web/app/constants/endofile-classes.ts`](../web/app/constants/endofile-classes.ts), en el
mismo orden que `class_names` en el notebook (celda 8) — el índice de cada una es su
posición en el tensor de salida `[batch, 29]`. `class_names` sale de
`tf.keras.utils.image_dataset_from_directory`, que ordena los nombres de carpeta
alfabéticamente; por eso `micromega-remover` cae entre `micromega-one-curve-mini` y
`rising`, no al final de la lista.

> **El orden del array es el contrato con el modelo.** No reordenar, no filtrar. Cualquier
> cambio debe copiarse tal cual del `class_names` de un modelo reentrenado — no insertarse
> a mano ni añadirse al final.

| Sistema | Clases | Identificadores |
| --- | ---: | --- |
| `3d-files` | 3 | `_1-f25`, `_2-f30`, `_3-s30` |
| `apical-shaper` | 4 | `_1-z30`, `_2-z35`, `_3-z40`, `_4-z50` |
| `blue-shaper` | 4 | `_1-z1`, `_2-z2`, `_3-z3`, `_4-z4` |
| `mg3-blue` | 5 | `_1-sv`, `_2-px`, `_3-g1`, `_4-g2x`, `_5-g2` |
| `micromega-one-curve-mini` | 4 | `_1-n45-0.4`, `_2-n35-0.4`, `_3-n25-0.6`, `_4-n25-0.4` |
| `micromega-remover` | 1 | `_1-n30` |
| `rising` | 5 | `_1-17`, `_2-13`, `_3-25`, `_4-30`, `_5-28` |
| `slim-shaper` | 3 | `_1-zs1`, `_2-zs2`, `_3-zs3` |
| **Total** | **29** | 8 sistemas |

### Relación con el resto del repositorio

| Fuente | Cifra |
| --- | --- |
| Clases del modelo | 29 / 8 sistemas |
| [`dataset/limas-endodonticas.csv`](../dataset) | 43 limas / 11 sistemas |
| `ENDOFILE_DICTIONARY` / catálogo (`CATALOG_FILE_IDS`) | 47 limas / 12 sistemas |

El modelo predice `blue-shaper` (4 limas, no está en el CSV), `mg3-blue` (5 limas, sí está
en el CSV) y ahora también `micromega-remover` (1 lima, sí está en el CSV). No predice
`Re-Treaty`, `S-Blue`, `RC-Blue` ni `Super-Files-III` (18 limas entre los cuatro): están en
el catálogo marcadas como «solo consulta» (`detectable: false`), pero la cámara nunca las va
a devolver. Detalle completo en el [README raíz](../README.md).

## 8. Imágenes de prueba

`web/public/model_test/` contiene cuatro fotografías para probar la inferencia sin cámara,
subiéndolas con el botón de carga. No han cambiado con este modelo:

| Fichero | Tamaño |
| --- | ---: |
| `1783529426027.jpg` | 639 KB |
| `1783529678661.jpg` | 700 KB |
| `1783529748280.jpg` | 688 KB |
| `IMG_20260708_133623.jpg` | 1,4 MB |

No consta a qué lima corresponde cada una, así que no sirven como conjunto de validación:
son solo material de prueba manual. Ninguna corresponde a `micromega-remover`, la clase
nueva de esta versión.

## 9. Lo que no consta en el repositorio

- **Imágenes de entrenamiento**: viven en Google Drive (`dataset_flat_reduced`, celda 3 del
  notebook), fuera del repositorio. No hay forma de reproducir el entrenamiento sin acceso a
  esa carpeta.
- **Constantes exactas de normalización**: a diferencia de v1, no se han vuelto a leer los
  bytes de `rescaling_1`/`normalization_1` para esta versión — se asume la misma fórmula por
  ser la misma función de Keras, pero no está reverificada byte a byte (§3).
- **GPU de entrenamiento**: v1 registraba una Tesla T4; este notebook no lo imprime.
- **Matriz de confusión**: se genera en el notebook (celda 30) pero no se ha exportado como
  imagen ni transcrito, igual que en v1.
- **Por qué `rising_3-25` empeoró** frente a v1 (95,00 % → 85,29 %) mientras el resto de
  clases mejoraba: no hay ninguna nota al respecto (§6.4).
- **Procedencia y licencia** de las fotografías de origen, incluidas las nuevas de
  `micromega-remover`.
- **Impacto real en producción**: no se ha medido la accuracy con la app real, en
  dispositivo, ni para v1 ni para v2 (carry-over de v1 §9).

Mientras eso siga sin documentarse, el modelo debe tratarse como una **caja negra sin
validación clínica**, coherente con el aviso del README raíz.

## 10. Mejoras identificadas

| Mejora | Detalle |
| --- | --- |
| Re-ejecutar la celda de verificación de clases | §6.5. Tal como está, no cumple su propio propósito: compara contra una lista vieja |
| Corregir el `print` de la fase 2 | §6.3. Dice "30 capas", el código descongela 40 — alguien que solo lea el log se lleva un dato falso |
| Investigar la caída de `rising_3-25` | §6.4, §9. Es la única clase que empeoró respecto a v1 |
| Reverificar la normalización de entrada byte a byte | §3, §9. Se asume igual que v1 por ser la misma función de Keras, pero no se confirmó para este grafo |
| Medir la accuracy en producción | Sigue sin hacerse ni para v1 ni para v2 (§9) |
| Cuantizar los pesos | `--quantize_uint8` reduciría los ≈32,60 MiB actuales — más relevante ahora que con v1, dado el salto de tamaño de B0 a B2 |
| Reincorporar los sistemas que faltan | Re-Treaty, S-Blue, RC-Blue y Super-Files-III siguen en el catálogo pero no en el modelo — evaluar si hay dataset suficiente |
