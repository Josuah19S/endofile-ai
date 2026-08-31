# Endofile AI - Glosario del Proyecto

**Versión:** 2.0
**Fecha:** 2026-08-31

---

## Términos de Limas Endodónticas

### Lima Endodóntica

Instrumento de metal (acero o níquel-titanio) para remover y modelar el sistema de conductos radiculares. Se clasifican por tamaño, conicidad y sistema de rotación.

---

### Diámetro Apical (ISO)

Diámetro de la punta de la lima (D0), medido según ISO 3630 y expresado en centésimas de milímetro: `25` equivale a 0,25 mm.

**Rango en este dataset:** #13 a #50.

---

### Conicidad (Taper)

Aumento progresivo del diámetro desde la punta hacia la corona. En el CSV se expresa como razón: `0.04` = 4 %.

**Rango en este dataset:** 0,02 a 0,10.

Cada 1 % de conicidad = 0,01 mm de aumento de diámetro por milímetro de longitud. Algunas limas declaran una **conicidad alternativa** (`conicidad_alt`) por ser de conicidad variable o progresiva.

---

### Longitud de Lima

Longitud total de la lima en su presentación comercial.

**Rango en este dataset:** 19 a 31 mm.

Una misma lima puede comercializarse en varias longitudes (`longitud`, `longitud_alt1`, `longitud_alt2`). Son presentaciones alternativas del mismo instrumento, no tramos de una sola pieza, y no están ordenadas de menor a mayor.

---

### Velocidad (RPM)

Revoluciones por minuto de rotación motorizada.

**Rango en este dataset:** 150 a 800 rpm. Algunos sistemas declaran velocidad fija (`3D Files` a 800, `Rising` a 450) en lugar de un intervalo.

---

### Torque (Ncm)

Fuerza de torsión aplicada a la lima en Newton-centímetros.

**Rango en este dataset:** 1 a 3,5 Ncm. No siempre es numérico: `Super File III` y `Apical Shaper` declaran el rango `2-2.5`.

Torque mayor = mayor penetración pero riesgo de fractura si se supera el límite del sistema.

---

### Sistema de Lima

Conjunto normalizado de limas con especificaciones consistentes de un fabricante.

**Los 12 sistemas del dataset (47 limas):**

| Sistema | Limas | ¿Lo detecta el modelo v2? |
|---|---:|---|
| 3D Files | 3 | Sí |
| Apical Shaper | 4 | Sí |
| Blue Shaper | 4 | Sí |
| MG3-Blue | 5 | Sí |
| Micromega One Curve mini | 4 | Sí |
| Micromega Remover | 1 | Sí (nuevo en v2) |
| Rising | 5 | Sí |
| Slim Shaper | 3 | Sí |
| Re-Treaty | 5 | No |
| S-BLUE | 4 | No |
| RC-BLUE | 3 | No |
| Super File III | 6 | No |

**Total clasificable:** 29 limas de 8 sistemas (modelo v2); 28 de 7 sistemas (modelo v1).

Las 18 limas de los cuatro sistemas sin cobertura conservan ficha y fotografía en el repositorio, pero no aparecen en la app hasta que un modelo las cubra.

---

### Secuencia

Orden en que se emplean las limas de un sistema, registrado en la columna `numero`. **No** es orden de calibre: `MG3-Blue` arranca con `SV #20` y sigue con `PX #15`; `Rising` va 17 → 13 → 25 → 30 → 28.

---

### Blíster

Envase de plástico sellado que contiene limas del mismo sistema. Una lima suelta (fuera del blíster) es difícil de identificar sin consultar manuales. **Endofile AI resuelve este problema.**

---

## Términos Técnicos

### Modelo

Red neuronal entrenada para clasificar imágenes de limas. La app sirve dos generaciones.

| | v2 (por defecto) | v1 |
|---|---|---|
| Arquitectura | EfficientNetB2 + cabeza propia | EfficientNetB0 + cabeza propia |
| Entrada | 448×448 px, RGB, [0, 255] | igual |
| Salida | 29 probabilidades | 28 probabilidades |
| Parámetros | 8 635 414 | 4 850 111 |
| Tamaño | ~32,6 MiB | ~18,3 MiB |

---

### Graph Model

Formato de exportación de TensorFlow.js en el que el modelo se congela como grafo de operaciones (no como capas de Keras). Se carga con `loadGraphModel()` y se ejecuta con `executeAsync()`.

**En este proyecto:** los pesos van repartidos en *shards* de 4 MiB junto a un `model.json` con la topología.

---

### Normalización

Transformación de los valores de píxel al rango que espera la red.

**En este proyecto:** ocurre **dentro** del grafo. El cliente pasa píxeles crudos en [0, 255] sin tocarlos. Normalizar antes de entregar la imagen fue un bug real de la segunda generación, y anulaba casi por completo el rango dinámico de la foto.

---

### Softmax

Función que convierte números brutos en probabilidades (0–1) que suman 1.

**En este proyecto:** incluido en el grafo exportado. Aplicarlo otra vez en el cliente fue otro bug real: aplastaba las confianzas y hacía que casi todo cayera por debajo del umbral.

---

### Inferencia

Proceso de pasar una imagen por el modelo para obtener la predicción.

**En este proyecto:** < 1 segundo en GPU WebGL.

---

### Precalentamiento (*warm-up*)

Ejecución del modelo con un tensor de ceros justo después de cargarlo, para que WebGL compile sus shaders antes de la primera captura real y el primer disparo no pague esa latencia.

---

### Umbral de confianza

Probabilidad mínima que debe alcanzar el mejor candidato para aceptarlo como detección.

**En este proyecto:** 15 %. Por debajo, la app devuelve «Lima no identificada» en vez de forzar una clase.

---

### Alternativas (Top-N)

Los candidatos siguientes al primero. El modelo conserva los **6 mejores** de cada predicción; la app ofrece hasta **4** como corrección manual.

**Por qué:** el acierto top-1 es del 97,20 % pero el top-3 es del 100 %. Cuando el modelo se equivoca, la lima correcta está casi siempre entre las siguientes.

---

### TensorFlow.js

Framework JavaScript para ejecutar modelos ML en el navegador (sin servidor).

**Ventaja:** inferencia local → las imágenes nunca salen del dispositivo.

---

### OpenCV.js

Compilación a WebAssembly de la librería de visión por computadora OpenCV.

**En este proyecto:** las tres validaciones de calidad de imagen (desenfoque, brillo, distancia). Si no ha terminado de cargar, la app cae a una implementación equivalente en Canvas 2D puro.

---

### Varianza del Laplaciano

Medida de nitidez: se aplica el operador Laplaciano a la imagen en escala de grises y se calcula la varianza del resultado. Valores bajos = pocos bordes marcados = imagen borrosa.

**Umbral en este proyecto:** < 35 se considera desenfocada.

---

### IndexedDB

Base de datos nativa del navegador para almacenamiento local.

**En este proyecto:** base `endofile-ai`, *object store* `scan-history`. Guarda las últimas 20 detecciones (id, `classId`, foto como data URL y `timestamp`).

---

### Canvas API

API HTML5 para dibujar gráficos 2D.

**Uso:** de cada captura se generan dos lienzos del **mismo recorte 3:4** — uno de 480×640 para mostrar y guardar, y otro de 448×448 (el 3:4 comprimido a 1:1) para el modelo.

---

### MediaDevices API

API nativa para acceder a la cámara del dispositivo (`getUserMedia`).

**Requisito:** contexto seguro. HTTPS en producción; `localhost` sirve en desarrollo.

**Extensiones no estándar que usa el proyecto:** `torch` (linterna), `focusMode` (enfoque) y `zoom`. No todos los navegadores las exponen, así que cada control se deshabilita o cae a su equivalente por software cuando falta.

---

### Zoom óptico vs. digital

**Óptico (hardware):** se aplica al sensor mediante la capacidad `zoom` de `MediaTrack`. No pierde calidad.

**Digital (fallback):** cuando el navegador no expone `zoom`, la app escala la vista previa por CSS y recorta el centro de la imagen al capturar. El recorte que llega al modelo es el mismo que ve el usuario.

---

### Next.js

Framework de React con App Router integrado.

**Versión:** Next.js 16, con React 19.

---

### WebGL

Especificación de gráficos que acelera la inferencia en GPU.

**Fallback:** CPU si WebGL no está disponible.

---

### Manifiesto de fotos

Archivo generado (`app/constants/endofile-photos.ts`) que declara qué limas tienen fotografía de referencia y con qué dimensiones.

**Por qué existe:** para que la UI lo sepa sin sondear la red y provocar 404, y para reservar el hueco antes de que la imagen cargue. Se regenera con `pnpm photos:manifest`.

---

## Abreviaturas Comunes

| Sigla | Significado |
|---|---|
| **AI** | Artificial Intelligence (Inteligencia Artificial) |
| **CNN** | Convolutional Neural Network (Red neuronal convolucional) |
| **CSV** | Comma-Separated Values (formato de datos) |
| **DAS** | Documento de Arquitectura de Software |
| **DER** | Documento de Especificación de Requisitos |
| **DMIA** | Documento del Modelo de IA |
| **GAP** | Global Average Pooling (capa de agrupación) |
| **GPU** | Graphics Processing Unit (procesador gráfico) |
| **HTTPS** | HTTP Secure (protocolo seguro) |
| **IMR** | Informe del Modelo Reducido |
| **ISO** | International Organization for Standardization (estándar) |
| **JSON** | JavaScript Object Notation (formato de datos) |
| **LR** | Learning Rate (tasa de aprendizaje) |
| **ML** | Machine Learning (aprendizaje automático) |
| **Ncm** | Newton-centímetro (unidad de torque) |
| **RPM** | Revolutions Per Minute (revoluciones por minuto) |
| **TF.js** | TensorFlow.js (framework ML) |
| **UI** | User Interface (interfaz) |

---

## Identificador de Clase (classId)

Formato: `{sistema}_{número}-{variante}`

**Ejemplos reales:**
- `re-treaty_1-bully` → Re-Treaty, 1ª de la secuencia, «BullY #25»
- `mg3-blue_4-g2x` → MG3-Blue, 4ª de la secuencia, «G2X #25»
- `micromega-remover_1-n30` → MicroMega Remover, lima única, «N30»
- `micromega-one-curve-mini_3-n25-0.6` → la variante puede llevar guiones propios

Es la clave que une las tres capas del proyecto: el orden de las clases del modelo, las entradas de `ENDOFILE_DICTIONARY` y el nombre de archivo de la fotografía de referencia (`re-treaty_1-bully.png`).

---

### Alias de clase

Clave adicional del diccionario que apunta a la misma lima bajo el id que emitía un modelo anterior.

**Por qué existen:** `3D-Files`, `Slim-Shaper` y `MicroMega One Curve Mini` cambiaron de id entre generaciones. Los alias hacen que una detección guardada en el historial antes del cambio de modelo siga resolviendo su ficha.

**Consecuencia:** el diccionario tiene 57 claves para 47 limas distintas.
