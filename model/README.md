# Modelo de clasificación de limas endodónticas

Clasificador de imagen que identifica una lima rotatoria a partir de una fotografía y
devuelve una de **38 clases**. Se ejecuta íntegramente en el navegador con TensorFlow.js;
ninguna imagen sale del dispositivo.

> **Dónde vive el modelo.** Los artefactos no están en esta carpeta: se sirven como
> estáticos desde [`web/public/model_proto/`](../web/public/model_proto). Esta carpeta
> documenta el modelo, no lo contiene.

Todos los datos de este documento están extraídos del propio `model.json` y del código que
lo consume. Lo que no consta en el repositorio se declara como tal en §8.

## 1. Ficha técnica

| | |
| --- | --- |
| Arquitectura | MobileNetV3-Small + `GlobalAveragePooling2D` + `Dense(38)` con softmax |
| Origen | Keras / TensorFlow **2.19.0** (modelo funcional) |
| Formato | TensorFlow.js **graph model** (`format: "graph-model"`) |
| Convertido con | TensorFlow.js Converter **v4.22.0** |
| Entrada | `inputs:0` · `float32` · `[batch, 384, 384, 3]` · rango **[0, 255]** |
| Salida | `Identity:0` · `float32` · `[batch, 38]` · **probabilidades** (softmax incluido) |
| Parámetros | **945 442** |
| Tensores de peso | 187 (173 `float32` + 14 `int32`) |
| Cuantización | **Ninguna**, pesos en `float32` |
| Nodos del grafo | 404, en 15 tipos de operación |
| Control de flujo | No hay. Tampoco formas dinámicas |

Reparto de operaciones: `Const` 187, `Mul` 66, `AddV2` 45, `_FusedConv2D` 35, `Relu6` 27,
`DepthwiseConv2dNative` 11, `Mean` 10, `Conv2D` 6, `AddN` 6, `Pad` 4, `Relu` 3,
`Placeholder` 1, `_FusedMatMul` 1, `Softmax` 1, `Identity` 1.

La combinación `Relu6` + `Mul` + `AddV2` corresponde a las activaciones *hard-swish* y a
los bloques *squeeze-and-excitation* característicos de MobileNetV3.

## 2. Artefactos

| Fichero | Tamaño | SHA-256 |
| --- | ---: | --- |
| `web/public/model_proto/model.json` | 182 542 B (178 KiB) | `e9fe8574770ee9027738dba6c69e3d9f1d89062d05c8023eba99e349cfcc40db` |
| `web/public/model_proto/group1-shard1of1.bin` | 3 781 768 B (3,61 MiB) | `d7cbeb7ab178ce3ed7c7523d01c95857562785393904612b3b602b4eb6eae3c7` |

Un único grupo de pesos y un único shard. El tamaño del binario coincide con el cálculo
teórico de 945 442 parámetros en `float32` (3,61 MiB), lo que confirma que **no hay
cuantización**.

Se cargan desde la raíz del sitio, no mediante `import`:

```ts
await tfjs.loadGraphModel('/model_proto/model.json');
```

## 3. Entrada y preprocesado

**El modelo lleva su propia capa de reescalado incorporada.** La primera operación tras el
`Placeholder` es `MobileNetV3Small_1/rescaling_1/mul`, seguida de `rescaling_1/add`. Es
decir, el modelo espera **píxeles crudos en [0, 255]** y normaliza por su cuenta.

Consecuencia práctica: `web/app/components/endofile-model-context.tsx` hace lo correcto al
**no** dividir entre 255.

```ts
const inputTensor = tf.tidy(() => {
  const tensor = tf.browser.fromPixels(src);            // [h, w, 3] uint8 → float
  const resized = tf.image.resizeBilinear(tensor, [384, 384]);
  const casted = resized.cast('float32');               // sigue en [0, 255]
  return casted.expandDims(0);                          // [1, 384, 384, 3]
});
```

**No añadas una normalización `/255` ni `(x/127.5)-1`.** Duplicaría el reescalado
interno y degradaría las predicciones en silencio.

Antes de llegar aquí, `camera-context.tsx` ya recorta la captura al **cuadrado central**
y la dibuja en un lienzo de 384×384, tanto para la cámara como para las imágenes subidas.
El `resizeBilinear` posterior es por tanto una red de seguridad, no un redimensionado real.

## 4. Salida y postprocesado

La firma declara `Identity:0` con forma `[batch, 38]`. Trazando el grafo hacia atrás desde
esa salida:

```
Identity  ←  Softmax  ←  _FusedMatMul (dense_1/BiasAdd)  ←  Mean (global_average_pooling2d)
```

**El modelo ya devuelve una distribución de probabilidad**: los 38 valores suman 1.

### Defecto conocido: softmax aplicado dos veces

`endofile-model-context.tsx` calcula un segundo softmax sobre esa salida:

```ts
const maxVal = Math.max(...rawArray);
const expArray = rawArray.map(v => Math.exp(v - maxVal));
const probabilities = expArray.map(v => v / expSum);   // ← softmax sobre probabilidades
```

Efecto medido sobre una predicción con 99 % de confianza real:

| | Valor |
| --- | ---: |
| Probabilidad real del modelo | 99,00 % |
| Tras el segundo softmax | **6,78 %** |
| Referencia: reparto uniforme (1/38) | 2,63 % |

Como el softmax es monótono creciente, **el orden se conserva**: el `argmax` y el top-3
siguen siendo correctos, y por eso la detección funciona. Lo que queda inservible son las
cifras de confianza, comprimidas hacia el reparto uniforme.

**Impacto actual: ninguno visible.** `topPredictions` y `confidence` se exponen en el
contexto pero **ningún componente los muestra**; solo aparecen en el `console.log` de
diagnóstico. El defecto se vuelve visible en cuanto se pinte la confianza en pantalla.

Corrección: sustituir el bloque de softmax por el uso directo de `rawArray` como
probabilidades.

## 5. Ejecución en el navegador

- **Backend**: el que TensorFlow.js elija por defecto, normalmente WebGL.
- **Carga**: `import('@tensorflow/tfjs')` dinámico, para evitar que el paquete entre en el
  render de servidor de Next.js.
- **Calentamiento**: tras cargar se ejecuta una pasada con `tf.zeros([1, 384, 384, 3])`
  para compilar los shaders de WebGL y que la primera captura real no pague esa latencia.
- **Tensores residentes**: 187 tras la carga y el calentamiento, uno por tensor de peso.
- **Memoria**: los tensores intermedios se envuelven en `tf.tidy`, y la entrada y la salida
  se liberan con `tf.dispose` después de cada predicción.

### `executeAsync` frente a `execute`

El código llama a `model.executeAsync()`, y TensorFlow.js responde con un aviso en consola:

> This model execution did not contain any nodes with control flow or dynamic output
> shapes. You can use model.execute() instead.

Es correcto: el grafo no tiene control de flujo ni formas dinámicas (§1), así que
`execute()` síncrono basta y evita el ciclo asíncrono. Pendiente de aplicar.

## 6. Clases

Las 38 clases viven en [`web/app/constants/endofile-classes.ts`](../web/app/constants/endofile-classes.ts).

> **El orden del array es el contrato con el modelo.** El índice de cada clase es su
> posición en el tensor de salida `[batch, 38]`. No reordenar, no ordenar alfabéticamente,
> no filtrar. Cualquier cambio debe acompañar a un modelo reentrenado.

| Sistema | Clases | Identificadores |
| --- | ---: | --- |
| `3d-files` | 3 | `_1-s30`, `_2-f25`, `_3-f30` |
| `rising` | 5 | `_1-17`, `_2-13`, `_3-25`, `_4-30`, `_5-28` |
| `apical-shaper` | 4 | `_1-z30`, `_2-z35`, `_3-z40`, `_4-z50` |
| `blue-shaper` | 4 | `_1-z1`, `_2-z2`, `_3-z3`, `_4-z4` |
| `micromega-one-curve-mini-assorted` | 4 | `_1-n45-0.4`, `_2-n35-0.4`, `_3-n25-0.6`, `_4-n25-0.4` |
| `micromega-remover` | 1 | `_1-n30` |
| `rc-blue` | 3 | `_1-r25`, `_2-r40`, `_3-r50` |
| `re-treaty` | 5 | `_1-bully`, `_2-skinny`, `_3-shapy1`, `_4-shapy2`, `_5-shapy3` |
| `slim-shaper` | 3 | `_zs2`, `_zs1`, `_zs3` |
| `super-files-iii` | 6 | `_1-sx`, `_2-s1`, `_3-s2`, `_4-f1`, `_5-f2`, `_6-f3` |
| **Total** | **38** | 10 sistemas |

Dos irregularidades de nomenclatura, ambas intencionadas y **no corregibles sin
reentrenar**:

- `slim-shaper` no lleva número de secuencia (`_zs2` en vez de `_2-zs2`), y aparece en el
  orden ZS2, ZS1, ZS3.
- `micromega-one-curve-mini-assorted` conserva el sufijo `-assorted`, que el diccionario
  de especificaciones no usa.

El fichero conserva además, comentada, la lista de clases original entregada con el
modelo. Difiere de la vigente en dos puntos —`af-blue-s-one_*` donde ahora hay `rising_*`,
y `slim-shaper_10` donde ahora hay `slim-shaper_zs2`—, así que **es histórica y no debe
usarse**.

### Relación con el resto del repositorio

| Fuente | Cifra |
| --- | --- |
| Clases del modelo | 38 / 10 sistemas |
| [`dataset/limas-endodonticas.csv`](../dataset) | 43 limas / 11 sistemas |
| `ENDOFILE_DICTIONARY` | 50 claves → 47 limas / 12 sistemas |

El modelo predice `blue-shaper` (4 limas), que no está en el CSV, y **no** predice
`MG3-Blue` ni `S-Blue`, que sí están. Detalle completo en el
[README raíz](../README.md).

## 7. Imágenes de prueba

`web/public/model_test/` contiene cuatro fotografías para probar la inferencia sin cámara,
subiéndolas con el botón de carga:

| Fichero | Tamaño |
| --- | ---: |
| `1783529426027.jpg` | 639 KB |
| `1783529678661.jpg` | 700 KB |
| `1783529748280.jpg` | 688 KB |
| `IMG_20260708_133623.jpg` | 1,4 MB |

No consta a qué lima corresponde cada una, así que no sirven como conjunto de validación:
son solo material de prueba manual.

## 8. Lo que no consta en el repositorio

Para evitar suposiciones, esto es lo que **no** puede afirmarse a partir del código:

- **Datos de entrenamiento**: número de imágenes, reparto por clase, condiciones de
  captura, división train/val/test.
- **Métricas**: no hay *accuracy*, matriz de confusión, precisión por clase ni curva de
  entrenamiento en ninguna parte del repositorio.
- **Procedimiento**: hiperparámetros, épocas, aumentación, si hubo *transfer learning* con
  pesos de ImageNet o entrenamiento desde cero, y si el backbone se congeló.
- **Código de entrenamiento**: no está versionado. Solo existe el modelo ya convertido.
- **Procedencia y licencia**: autoría, fecha de entrenamiento y condiciones de uso.

Mientras eso siga sin documentarse, el modelo debe tratarse como una **caja negra sin
validación clínica**, coherente con el aviso del README raíz.

## 9. Mejoras identificadas

| Mejora | Detalle |
| --- | --- |
| Eliminar el softmax duplicado | §4. Necesario antes de mostrar la confianza en pantalla |
| Usar `execute()` en vez de `executeAsync()` | §5. Quita el aviso de consola y un ciclo asíncrono |
| Cuantizar los pesos | `--quantize_uint8` reduciría los 3,61 MiB a ≈0,9 MiB, con pérdida mínima a validar |
| Documentar métricas | Sin ellas no hay forma de saber si una detección errónea es esperable o una regresión |
| Versionar el entrenamiento | Hoy el modelo no es reproducible |
