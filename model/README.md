# Modelo de clasificación de limas endodónticas

Clasificador de imagen que identifica una lima rotatoria a partir de una fotografía y
devuelve una de **28 clases**. Se ejecuta íntegramente en el navegador con TensorFlow.js;
ninguna imagen sale del dispositivo.

> **Dónde vive el modelo.** Los artefactos no están en esta carpeta: se sirven como
> estáticos desde [`web/public/model_proto/`](../web/public/model_proto). Esta carpeta
> documenta el modelo, no lo contiene.

> **Modelo reducido.** Esta es la segunda generación del clasificador. La primera cubría 38
> clases en 10 sistemas con MobileNetV3-Small; esta versión se entrenó desde cero sobre
> EfficientNetB0 y cubre **7 sistemas / 28 limas** — los que tenían dataset suficiente para
> entrenar con confianza. Re-Treaty, S-Blue, RC-Blue, Super-Files-III y MicroMega-Remover
> quedan fuera del modelo por ahora; siguen consultables en el catálogo de la app, pero la
> cámara nunca los va a devolver (ver [README raíz](../README.md)).

Las secciones 1–5 y 7–9 están extraídas del propio `model.json` y del código que lo
consume, igual que en la versión anterior de este documento. La sección 6 es nueva: ahora
existe [`endox_ia_reduced.ipynb`](endox_ia_reduced.ipynb), el notebook de entrenamiento, así
que el procedimiento y las métricas que antes faltaban (§10 de la versión anterior) ya
constan en el repositorio. Lo que sigue sin constar se declara como tal en §10.

## 1. Ficha técnica

| | |
| --- | --- |
| Arquitectura | EfficientNetB0 (ImageNet) + cabeza propia — ver §6.2 |
| Origen | Keras / TensorFlow **2.19.0** (notebook `endox_ia_reduced.ipynb`, Google Colab) |
| Formato | TensorFlow.js **graph model** (`format: "graph-model"`) |
| Convertido con | TensorFlow.js Converter **v4.22.0** |
| Entrada | `inputs:0` · `float32` · `[batch, 448, 448, 3]` · rango **[0, 255]** — ver §3 |
| Salida | `Identity:0` · `float32` · `[batch, 28]` · **probabilidades** (softmax incluido) |
| Parámetros | **4 850 111** según `model.count_params()` (notebook, celda 14) |
| Pesos exportados | 4 792 976 `float32` + 170 `int32` — ver nota en §2 |
| Cuantización | **Ninguna**, pesos en `float32` |
| Nodos del grafo | 671, en 19 tipos de operación |
| Control de flujo | No hay. Tampoco formas dinámicas |

Reparto de operaciones: `Const` 310, `Mul` 85, `Sigmoid` 65, `_FusedConv2D` 56, `AddV2` 28,
`Mean` 17, `DepthwiseConv2dNative` 16, `Shape` 16, `StridedSlice` 16, `Pack` 16, `Reshape`
16, `Conv2D` 9, `AddN` 9, `Pad` 5, `_FusedMatMul` 3, `Placeholder` 1, `Add` 1, `Softmax` 1,
`Identity` 1.

La combinación `Sigmoid` + `Mul` es la activación *swish* (`x · sigmoid(x)`) de
EfficientNet — a diferencia del modelo anterior (MobileNetV3-Small), que usaba la
aproximación *hard-swish* (`Relu6` + `Mul` + `AddV2`) y no tiene ni un solo `Sigmoid` en el
grafo. Es la forma más rápida de confirmar, sin abrir el notebook, que el backbone cambió.

## 2. Artefactos

| Fichero | Tamaño | SHA-256 |
| --- | ---: | --- |
| `web/public/model_proto/model.json` | 300 443 B (293 KiB) | `3ccf1ecb6f27a8895e157a36bc9201afc9d74dee6ddd3f6cb046cf86f6ae81ba` |
| `web/public/model_proto/group1-shard1of5.bin` | 4 194 304 B (4,00 MiB) | `a5d3c200275dbf28d27de33327f269ad324fec8ed8bb71bbee5ae095683a9ba4` |
| `web/public/model_proto/group1-shard2of5.bin` | 4 194 304 B (4,00 MiB) | `3e6bfcf4faea00c953d1c308d1b45ee7a01c6bc283c69ebe35952e54cfea0fb0` |
| `web/public/model_proto/group1-shard3of5.bin` | 4 194 304 B (4,00 MiB) | `6c84f21737e663333777cce8dc6fbf63f200c21ee5b399fe3c88f9229f147781` |
| `web/public/model_proto/group1-shard4of5.bin` | 4 194 304 B (4,00 MiB) | `ca812eea1bbd042f3a41e1b47353544950694ea61b2e06f7e6fd05d16b7db914` |
| `web/public/model_proto/group1-shard5of5.bin` | 2 395 368 B (2,28 MiB) | `e3e94dd54591c8eff3b8067a372a040383f36856da832a4c090d543fdba71425` |

Cinco *shards* en vez del único de la versión anterior: los cuatro primeros pesan
exactamente 4 194 304 B (4 MiB), el tamaño máximo por defecto de `tensorflowjs_converter`;
el quinto se lleva el resto. En total, **19 172 584 B (≈18,29 MiB) de pesos**, frente a los
3,61 MiB del modelo anterior — coherente con que EfficientNetB0 (~4,85 M parámetros) es
bastante más grande que MobileNetV3-Small (945 442).

Los 4 792 976 `float32` guardados en el grafo son algo menos que los 4 850 111 que reporta
`count_params()` en el notebook: diferencia esperable del plegado de `BatchNormalization`
que aplica el conversor al pasar de `SavedModel` a `graph-model` (fusiona sus parámetros en
las convoluciones precedentes en vez de guardarlos aparte). No indica cuantización — el
tamaño en bytes de esos 4 792 976 valores (19 171 904 B) más los 170 `int32` auxiliares
(680 B) cuadra exactamente con el peso real de los ficheros.

Se cargan desde la raíz del sitio, no mediante `import`:

```ts
await tfjs.loadGraphModel('/model_proto/model.json');
```

## 3. Entrada y preprocesado

**El modelo lleva su propia normalización incorporada**, igual que la versión anterior,
pero con una fórmula distinta. Inspeccionando el grafo y los pesos exportados (no hay
constantes inline en `model.json`; los valores están en los `.bin`, así que se leyeron
directamente):

```
StatefulPartitionedCall/.../efficientnetb0_1/rescaling_1/mul     ← multiplica por 0.00392157 (= 1/255)
StatefulPartitionedCall/.../efficientnetb0_1/rescaling_1/add     ← suma [-0.485, -0.456, -0.406]
StatefulPartitionedCall/.../efficientnetb0_1/normalization_1/truediv ← divide por [4.3668, 4.4643, 4.4444] (= 1/[0.229, 0.224, 0.225])
```

Es decir, el modelo espera **píxeles crudos en [0, 255]** y aplica internamente
`(x/255 − mean) / std` con la media y desviación típica estándar de ImageNet. Esto coincide
con el notebook: `tf.keras.applications.efficientnet.preprocess_input()` (celda 14 y 34) es,
para EfficientNet clásico (a diferencia de MobileNet), una función que **no transforma la
entrada** — el reescalado real vive dentro del propio modelo Keras, como capas
`Rescaling`/`Normalization`, y el grafo lo confirma.

### Corregido: normalización manual duplicada en el cliente

Hasta esta versión del documento, `endofile-model-context.tsx` normalizaba la entrada antes
de pasarla al modelo:

```ts
// Normalización EfficientNet: [0, 255] → [-1, 1]
const normalized = casted.div(127.5).sub(1.0);
```

Esa fórmula (`x/127.5 − 1`) es la de MobileNet/Inception (modo `"tf"` de Keras), **no** la
de EfficientNet. Aplicada ahí, el pixel llegaba al modelo ya comprimido a `[-1, 1]` y el
modelo lo volvía a dividir por 255 internamente, aplastando prácticamente toda la señal:

| Pixel de entrada | Tras `/127.5 − 1` | Tras la normalización interna del modelo (canal R) |
| --- | ---: | ---: |
| 0 (negro) | −1,000 | ≈ −2,135 |
| 128 (gris medio) | 0,004 | ≈ −2,116 |
| 255 (blanco) | 1,000 | ≈ −2,116 |

Negro y blanco terminaban a **0,02 de distancia** en vez de a los ~4,4 que separa la
normalización correcta — el rango dinámico de la imagen quedaba casi anulado antes de entrar
al backbone convolucional.

## 4. Salida y postprocesado

La firma declara `Identity:0` con forma `[batch, 28]`. Igual que en la versión anterior, el
grafo ya termina en `Softmax`, así que **la salida es una distribución de probabilidad**
completa (los 28 valores suman 1).

A diferencia de la versión anterior de este documento, aquí no hay nada que corregir: el
código actual ya usa `rawArray` directamente como `probabilities`, sin aplicar un segundo
softmax. El defecto que describía la versión anterior de este documento (confianzas
comprimidas hacia el reparto uniforme) está resuelto.

`endofile-model-context.tsx` filtra por confianza mínima:

```ts
const MIN_CONFIDENCE_THRESHOLD = 0.35; // 35 %
```

Por debajo de ese umbral se descarta la predicción y se marca como «Lima no identificada»
en vez de forzar la clase más probable.

## 5. Ejecución en el navegador

- **Backend**: el que TensorFlow.js elija por defecto, normalmente WebGL.
- **Carga**: `import('@tensorflow/tfjs')` dinámico, para evitar que el paquete entre en el
  render de servidor de Next.js.
- **Calentamiento**: tras cargar se ejecuta una pasada con `tf.zeros([1, 448, 448, 3])` para
  compilar los shaders de WebGL y que la primera captura real no pague esa latencia.
- **Memoria**: los tensores intermedios se envuelven en `tf.tidy`, y la entrada y la salida
  se liberan con `tf.dispose` después de cada predicción.

### `executeAsync` frente a `execute`

Igual que en la versión anterior del modelo, el código llama a `model.executeAsync()` y
TensorFlow.js sigue respondiendo con el mismo aviso en consola: el grafo no tiene control de
flujo ni formas dinámicas (§1), así que `execute()` síncrono bastaría. Sigue pendiente de
aplicar.

## 6. Entrenamiento

Documentado a partir de [`endox_ia_reduced.ipynb`](endox_ia_reduced.ipynb), ejecutado en
Google Colab sobre una GPU Tesla T4. No versionado hasta ahora, es la primera vez que el
procedimiento consta en el repositorio.

### 6.1 Dataset

El notebook aplana `dataset/<sistema>/<lima>/*` (una carpeta de fotos por lima, en Google
Drive, fuera del repositorio) a `dataset_flat_reduced/<sistema>_<lima>/`, recortando cada
imagen al cuadrado **3:4** centrado (celda 5) — el mismo recorte que aplica
`camera-context.tsx` en el cliente (§3).

| | |
| --- | --- |
| Sistemas incluidos | 7: `3d-files`, `apical-shaper`, `blue-shaper`, `mg3-blue`, `micromega-one-curve-mini`, `rising`, `slim-shaper` |
| Clases (limas) | 28 |
| Imágenes totales | 4 199 |
| Promedio por clase | ~150 (mínimo 115 en `blue-shaper_2-z2`, máximo 208 en `slim-shaper_1-zs1`) |
| Partición | 80 % train (3 360) / 20 % val (839), `validation_split=0.2`, `seed=42` |
| Tamaño de imagen | 448×448 |
| Batch size | 16 |

`micromega-one-curve-mini` se aplanó en una pasada aparte (celda 6, comentada en el propio
notebook): 598 imágenes más, repartidas de forma pareja entre sus 4 clases (139–160 c/u).

**Aumentado de datos** (solo en entrenamiento): `RandomFlip` horizontal y vertical, rotación
aleatoria en múltiplos de 90° (capa `RandomRotate90` propia), `RandomZoom` ±30 %,
`RandomBrightness` ±30 %, `RandomContrast` ±30 %.

### 6.2 Arquitectura

```
Input(448, 448, 3)
  → [augmentation, solo entrenamiento]
  → efficientnet.preprocess_input   (no-op — ver §3)
  → EfficientNetB0(weights='imagenet', include_top=False)
  → GlobalAveragePooling2D
  → BatchNormalization
  → Dense(512, relu) → Dropout(0.4)
  → Dense(256, relu)
  → BatchNormalization → Dropout(0.3)
  → Dense(28, softmax)
```

### 6.3 Procedimiento — dos fases

| | Fase 1 (backbone congelado) | Fase 2 (fine-tuning) |
| --- | --- | --- |
| `base_model.trainable` | `False` | `True`, salvo todas las capas menos las últimas 30 |
| Learning rate | 1e-4 | 1e-5 |
| Épocas (máx. / ejecutadas) | 20 / 20 | 15 / 15 |
| `EarlyStopping` | `monitor='val_accuracy'`, `patience=5` | `patience=7` |
| `ReduceLROnPlateau` | `factor=0.5`, `patience=3`, `min_lr=1e-7` | `patience=4`, `min_lr=1e-8` |
| Mejor época (pesos restaurados) | 19 | 14 |
| `val_accuracy` de esa época | **95,59 %** | **94,64 %** |

Optimizador `Adam` en ambas fases, pérdida `SparseCategoricalCrossentropy`, métricas
`accuracy`, `top_3_accuracy` y `top_5_accuracy`.

**Detalle a tener en cuenta:** la fase 2 (fine-tuning) termina con una `val_accuracy` más
baja que el mejor punto de la fase 1 (94,64 % frente a 95,59 %). El notebook exporta de
todos modos los pesos de la fase 2, que son los que sirve la app. No consta en el
repositorio si esto se investigó (¿el fine-tuning con learning rate más bajo sencillamente
no encontró un óptimo mejor en 15 épocas, o el backbone congelado ya bastaba para este
dataset?); ver §10.

### 6.4 Métricas finales

Evaluadas sobre el 20 % de validación (839 imágenes), con los pesos de la fase 2 (el modelo
que se exporta):

| Métrica | Valor |
| --- | ---: |
| Loss | 0,1530 |
| Accuracy | **94,64 %** |
| Top-3 accuracy | 99,88 % |
| Top-5 accuracy | 100,00 % |
| Precisión media (macro avg) | 94,49 % |

Precisión por clase (`sklearn.classification_report`), de mayor a menor:

| Clase | Precisión |
| --- | ---: |
| `3d-files_1-f25`, `3d-files_2-f30`, `3d-files_3-s30` | 100,00 % |
| `apical-shaper_2-z35`, `_3-z40`, `_4-z50` | 100,00 % |
| `blue-shaper_1-z1` … `_4-z4` (las 4) | 100,00 % |
| `mg3-blue_3-g1` | 100,00 % |
| `micromega-one-curve-mini_3-n25-0.6`, `_4-n25-0.4` | 100,00 % |
| `rising_4-30`, `rising_5-28` | 100,00 % |
| `slim-shaper_1-zs1`, `_2-zs2` | 100,00 % |
| `apical-shaper_1-z30` | 97,50 % |
| `rising_1-17` | 95,83 % |
| `rising_3-25` | 95,00 % |
| `slim-shaper_3-zs3` | 95,00 % |
| `micromega-one-curve-mini_2-n35-0.4` | 91,30 % |
| `micromega-one-curve-mini_1-n45-0.4` | 91,18 % |
| `mg3-blue_2-px` | 88,89 % |
| `mg3-blue_1-sv` | 79,07 % |
| `mg3-blue_5-g2` | 76,92 % |
| `rising_2-13` | 75,00 % |
| **`mg3-blue_4-g2x`** | **60,00 %** |

`MG3-Blue` concentra las cinco clases más débiles del modelo (`_4-g2x`, `_5-g2`, `_1-sv`,
`_2-px`), con `_3-g1` como única excepción al 100 %. `rising_2-13` es la única clase floja
fuera de ese sistema. El notebook no diagnostica la causa (¿confusión entre limas visualmente
similares del mismo sistema, dataset insuficiente, o ambas?); la matriz de confusión existe
en el notebook (celda 31) pero no se ha volcado a este documento — es demasiado grande para
transcribir a una tabla y no se ha exportado como imagen versionada.

### 6.5 Exportación

```
Keras (.keras) → tf.saved_model.save() → tensorflowjs_converter
  --input_format=tf_saved_model --output_format=tfjs_graph_model
```

Sin flag de cuantización (`--quantize_uint8` u otro), de ahí los pesos en `float32` de §1–2.
El notebook reconstruye un `inference_model` sin las capas de aumentado antes de exportar, y
verifica que su accuracy siga siendo 94,64 % tras transferir los pesos (celda 34) — es el
paso que garantiza que lo exportado es lo mismo que se evaluó en §6.4.

## 7. Clases

Las 28 clases viven en
[`web/app/constants/endofile-classes.ts`](../web/app/constants/endofile-classes.ts), en el
mismo orden que `class_names` en el notebook (celda 9 y 39) — el índice de cada una es su
posición en el tensor de salida `[batch, 28]`.

> **El orden del array es el contrato con el modelo.** No reordenar, no ordenar
> alfabéticamente, no filtrar. Cualquier cambio debe acompañar a un modelo reentrenado.

| Sistema | Clases | Identificadores |
| --- | ---: | --- |
| `3d-files` | 3 | `_1-f25`, `_2-f30`, `_3-s30` |
| `apical-shaper` | 4 | `_1-z30`, `_2-z35`, `_3-z40`, `_4-z50` |
| `blue-shaper` | 4 | `_1-z1`, `_2-z2`, `_3-z3`, `_4-z4` |
| `mg3-blue` | 5 | `_1-sv`, `_2-px`, `_3-g1`, `_4-g2x`, `_5-g2` |
| `micromega-one-curve-mini` | 4 | `_1-n45-0.4`, `_2-n35-0.4`, `_3-n25-0.6`, `_4-n25-0.4` |
| `rising` | 5 | `_1-17`, `_2-13`, `_3-25`, `_4-30`, `_5-28` |
| `slim-shaper` | 3 | `_1-zs1`, `_2-zs2`, `_3-zs3` |
| **Total** | **28** | 7 sistemas |

Las dos irregularidades de nomenclatura que señalaba la versión anterior de este documento
— `slim-shaper` sin número de secuencia y `micromega-one-curve-mini-assorted` con el sufijo
`-assorted` — **están resueltas** en este modelo: el notebook genera los nombres de clase
directamente de la carpeta aplanada (`sistema_lima`), así que ahora siguen el mismo patrón
`_N-variante` que el resto y el diccionario de especificaciones ya no necesita normalizarlos.
`3D-Files` también cambia de numeración: antes `_1-s30, _2-f25, _3-f30` (sin relación con el
`numero` real de la ficha), ahora `_1-f25, _2-f30, _3-s30` — coincide con el `numero` de
`ENDOFILE_DICTIONARY`.

`web/app/constants/endofile-dataset.ts` conserva además, como alias, las claves del modelo
anterior (`slim-shaper_zs1`, `micromega-one-curve-mini-assorted_1-n45-0.4`,
`3d-files_2-f25`, …) para que una detección guardada en el historial antes de este cambio de
modelo siga resolviendo su ficha.

### Relación con el resto del repositorio

| Fuente | Cifra |
| --- | --- |
| Clases del modelo | 28 / 7 sistemas |
| [`dataset/limas-endodonticas.csv`](../dataset) | 43 limas / 11 sistemas |
| `ENDOFILE_DICTIONARY` / catálogo (`CATALOG_FILE_IDS`) | 47 limas / 12 sistemas |

El modelo predice `blue-shaper` (4 limas, no está en el CSV) y `mg3-blue` (5 limas, sí está
en el CSV). No predice `Re-Treaty`, `S-Blue`, `RC-Blue`, `Super-Files-III` ni
`Micromega-Remover` (19 limas entre los cinco): están en el catálogo marcadas como «solo
consulta» (`detectable: false`), pero la cámara nunca las va a devolver. Detalle completo en
el [README raíz](../README.md).

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
son solo material de prueba manual.

## 9. Lo que no consta en el repositorio

- **Imágenes de entrenamiento**: viven en Google Drive (`dataset_flat_reduced`, celda 3 del
  notebook), fuera del repositorio. No hay forma de reproducir el entrenamiento sin acceso a
  esa carpeta, ni de auditar de dónde salieron las fotos o en qué condiciones se tomaron.
- **Matriz de confusión**: se genera en el notebook (celda 31) pero no se ha exportado como
  imagen ni transcrito; solo consta la precisión por clase de §6.4, que es una vista parcial
  de la misma información.
- **Por qué la fase 2 rinde peor que la fase 1**: ver §6.3. No hay ninguna nota en el
  notebook al respecto.
- **Causa de la debilidad de `MG3-Blue`**: §6.4 constata el patrón, no la causa.
- **Procedencia y licencia**: autoría y condiciones de uso de las fotografías de origen.
- **Impacto real de la corrección de §3**: se corrigió la normalización de entrada, pero no
  se ha vuelto a evaluar el modelo (con la app real, en dispositivo) tras el cambio; la
  accuracy de §6.4 sigue siendo la medida en el notebook, no una medición end-to-end del
  cliente web ya corregido.

Mientras eso siga sin documentarse, el modelo debe tratarse como una **caja negra sin
validación clínica**, coherente con el aviso del README raíz.

## 10. Mejoras identificadas

| Mejora | Detalle |
| --- | --- |
| Volver a medir la accuracy en producción | §3, §9. La normalización ya está corregida; falta confirmar en el dispositivo real que el resultado se acerca al 94,64 % de §6.4 |
| Usar `execute()` en vez de `executeAsync()` | §5. Quita el aviso de consola y un ciclo asíncrono |
| Investigar por qué el fine-tuning empeora | §6.3. Antes de reentrenar de nuevo, vale la pena entender si la fase 2 tiene sentido tal como está configurada |
| Reforzar `MG3-Blue` y `rising_2-13` | §6.4. Son las clases con menos precisión; más datos o revisar si son visualmente ambiguas entre sí |
| Versionar el dataset de entrenamiento | Hoy vive solo en Google Drive; el notebook ya está versionado, pero no es reproducible sin las imágenes |
| Cuantizar los pesos | `--quantize_uint8` reduciría los ≈18,29 MiB actuales, con pérdida mínima a validar |
| Reincorporar los 5 sistemas que faltan | Re-Treaty, S-Blue, RC-Blue, Super-Files-III y Micromega-Remover están en el catálogo pero no en el modelo — evaluar si hay dataset suficiente para sumarlos en la próxima versión |
