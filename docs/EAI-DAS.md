# Endofile AI - Documento de Arquitectura de Software

**Versión:** 2.0

---

## 1. Visión General

Endofile AI es una aplicación web que clasifica limas endodónticas en tiempo real. Toda la lógica de inferencia ocurre **en el navegador del usuario**; no hay comunicación con servidores para procesar imágenes. El historial se persiste localmente en IndexedDB.

### Principios de Diseño

- **Privacidad:** Las imágenes nunca salen del dispositivo
- **Rendimiento:** Clasificación en < 1 segundo
- **Portabilidad:** Funciona offline tras la carga inicial
- **Mantenibilidad:** Código tipado (TypeScript), sin dependencias pesadas

---

## 2. Componentes Principales

### 2.1 Frontend (Next.js + React)

**Ubicación:** `web/`

Aplicación de **una sola pantalla**: el visor de cámara ocupa toda la ventana y el resto de vistas (historial, catálogo, ficha, alternativas) se abren en un cajón inferior sobre él. No hay navegación entre páginas dentro del flujo de uso.

| Componente | Propósito | Ubicación |
|---|---|---|
| **Shell de cámara** | Compone visor, cabecera, insignia y cajón; posee el estado del cajón | `components/camera/camera-screen-shell.tsx` |
| **Visor** | Vídeo en vivo, retícula, toque para enfocar, controles de zoom | `components/camera/camera-viewport.tsx` |
| **Insignia de detección** | Resultado, avisos de calidad y botones «Alternativas» / «Continuar» | `components/camera/camera-detection-badge.tsx` |
| **Barra inferior** | Disparador, subida de imagen, cambio de lente; contiene el cajón | `components/camera/camera-bottom-bar.tsx` |
| **Historial** | Rejilla de las 20 últimas detecciones | `components/file/recent-detections-view.tsx` |
| **Catálogo** | Listado agrupado por sistema, con búsqueda | `components/file/file-catalog-view.tsx` |
| **Ficha técnica** | Detalles de la lima (Ø, conicidad, longitud, RPM, torque) | `components/file/file-detail-view.tsx` |
| **Alternativas** | Candidatos siguientes al primero, para corregir la predicción | `components/file/alternatives-view.tsx` |
| **Menú lateral** | Navegación y selector de modelo | `components/overlays/sidebar.tsx` |

**Rutas:**

| Ruta | Modelo cargado |
|---|---|
| `/` | v2 (por defecto) |
| `/modelv2` | v2 — 29 clases |
| `/modelv1` | v1 — 28 clases |

Las tres rutas renderizan el mismo componente (`ModelScannerPage`) con una `version` distinta; toda la diferencia se resuelve en `EndofileContextProvider`. El menú lateral permite saltar entre ellas y la insignia de la cabecera indica cuál está activa.

### 2.2 Modelos (TensorFlow.js)

**Ubicación:** `web/public/models/v1/` y `web/public/models/v2/`

Se sirven **dos generaciones** del clasificador, declaradas en `app/constants/endofile-models.ts` (`MODEL_CONFIGS`). Comparten contrato y código de inferencia; solo cambia la configuración.

| | v2 (por defecto) | v1 |
|---|---|---|
| Arquitectura | EfficientNetB2 + cabeza propia | EfficientNetB0 + cabeza propia |
| Clases | 29 | 28 |
| Parámetros | 8 635 414 | 4 850 111 |
| Tamaño | ~32,6 MiB (9 *shards*) | ~18,3 MiB (5 *shards*) |
| Entrada | `[batch, 448, 448, 3]`, `float32`, **[0, 255]** | idéntica |
| Salida | `[batch, 29]`, probabilidades (softmax incluido) | `[batch, 28]` |
| Formato | Graph Model de TF.js | Graph Model de TF.js |

**Cabeza compartida:** `GlobalAveragePooling2D` → `BatchNorm` → `Dense(512)` → `Dropout` → `Dense(256)` → `BatchNorm` → `Dropout` → `Dense(N, softmax)`.

**Notas de integración:**

- Los pesos se cargan con `loadGraphModel()` y se ejecutan con `executeAsync()`.
- **El cliente no normaliza.** Los dos grafos llevan sus capas `Rescaling` + `Normalization` incorporadas y esperan píxeles crudos en [0, 255]. Normalizar antes fue un bug real de la generación anterior (ver `docs/EAI-IMRV1.md` §6).
- **Precalentamiento:** un `tf.zeros([1, 448, 448, 3])` al cargar, para compilar los shaders WebGL y evitar la latencia del primer disparo.
- **Gestión de memoria:** el preprocesado va dentro de `tf.tidy()`; el tensor de entrada y el de salida se liberan con `tf.dispose()` tras cada predicción.

**Proceso de inferencia:**

```
Fotograma de vídeo (o imagen cargada)
  ↓
Recorte 3:4 centrado  ──┬─→ lienzo 480×640  → JPEG data URL (mostrar + historial)
                        └─→ lienzo 448×448  → el 3:4 comprimido a 1:1
  ↓
tf.browser.fromPixels() → cast float32 → expandDims  (SIN normalizar)
  ↓
model.executeAsync()
  ↓
Salida [1, N] = probabilidades
  ↓
Ordenar y quedarse con los 6 mejores (TOP_N)
  ↓
¿top < 15 %? → "Lima no identificada"
¿top ≥ 15 %? → clase predicha + 5 alternativas
```

El recorte 3:4 es deliberado: es la proporción con la que se recortó el dataset de entrenamiento. Se comprime a 1:1 para el modelo en lugar de recortar de nuevo, para no perder los extremos de la lima.

### 2.3 Persistencia (IndexedDB)

**Ubicación:** `app/lib/history-store.ts`

Base `endofile-ai`, *object store* `scan-history` (`keyPath: 'id'`), índice por `timestamp`.

```typescript
interface RecentScanItem {
  id: string;         // createScanId()
  classId: string;    // ej: "re-treaty_1-bully"
  photoUrl: string;   // JPEG data URL del lienzo 480×640
  timestamp: number;  // epoch ms
}
```

**Comportamiento:**

- Máximo 20 entradas; las más antiguas se podan por el índice de `timestamp`.
- La foto se guarda como **data URL**, no como `Blob`: se pinta directamente en un `<img>` sin `URL.createObjectURL()` ni ciclo de vida que gestionar (~35–65 KB por entrada).
- Persiste tras cerrar el navegador. Si IndexedDB no está disponible (modo privado), la app avisa y sigue funcionando en memoria.
- Las escrituras son *fire and forget*: un fallo al guardar nunca bloquea la captura.
- La predicción principal se guarda **automáticamente**. Si el usuario elige después una alternativa sobre la misma foto, la entrada se sustituye en el sitio en lugar de duplicarse.

### 2.4 Dataset (CSV + TypeScript)

**Ubicación:** `dataset/limas-endodonticas.csv` + `web/app/constants/`

| Archivo | Papel |
|---|---|
| `endofile-models.ts` | `FILE_CLASSES_V1` / `FILE_CLASSES_V2` — **contrato con el modelo** — y `MODEL_CONFIGS` |
| `endofile-dataset.ts` | `ENDOFILE_DICTIONARY` (fichas) + construcción del catálogo |
| `endofile-dataset-complete.ts` | Catálogo histórico de las 47 limas; **no se usa en runtime**, solo lo lee el generador del manifiesto de fotos |
| `endofile-photos.ts` | Manifiesto **generado**; no editar a mano |
| `endofile-classes.ts` | `FILE_CLASSES` — copia de la lista de v2, anterior al desdoble por generación. Solo la consume `endofile-dataset-complete.ts`; el contrato vigente es el de `endofile-models.ts` |

```typescript
ENDOFILE_DICTIONARY: {
  're-treaty_1-bully': {
    id: 're-treaty_1-bully',
    sistema: 'Re Treaty',
    numero: 1,               // orden de uso dentro del sistema, no de calibre
    nombre: 'BullY #25',
    diametroApical: 25,      // ISO, centésimas de mm
    longitud: 21,            // mm
    conicidad: 0.07,
    velocidadMin: 350,
    velocidadMax: 500,
    torque: 1.5,             // number | string ("2-2.5")
  },
  // 57 claves → 47 limas distintas (10 son alias, ver §7)
}
```

**Orden de las clases:** cada índice de `FILE_CLASSES_V*` corresponde a una posición del tensor de salida. La lista se copia tal cual del `class_names` del notebook (que ordena los subdirectorios lexicográficamente, por eso `micromega-remover` queda entre `micromega-one-curve-mini` y `rising`). **Nunca reordenar ni filtrar a mano.**

### 2.5 Validación de calidad de imagen

**Ubicación:** `app/lib/image-validations.ts`, `app/lib/opencv-loader.ts`

Tres comprobaciones independientes, sin IA, que se ejecutan en paralelo:

| Validación | Método | Umbral por defecto |
|---|---|---|
| Desenfoque | Varianza del Laplaciano | < 35 = borrosa |
| Poca luz | Brillo medio en escala de grises | < 30 = oscura |
| Lima lejos | Contorno mayor: % de área y % del lado más largo | < 0,15 % de área o < 8 % del lado |

- Usa **OpenCV.js** (precargado desde `public/js/opencv.js`) y, si no ha cargado todavía, cae a una implementación equivalente en Canvas 2D puro. La app nunca espera a OpenCV para poder disparar.
- Se ejecutan sobre el vídeo en vivo **una vez por segundo** y también sobre cada captura.
- Son **advertencias, no un bloqueo**: la predicción se ejecuta igualmente y el aviso se muestra junto al resultado.
- La distancia se mide con el **lado más largo** del *bounding box*, no con su altura: una lima fotografiada en diagonal tiene una altura mucho menor a la misma distancia real, y medir solo la altura hacía el control sensible a la orientación en vez de a la distancia.

---

## 3. Flujo de Datos

### 3.1 Captura → Clasificación → Historial

```
Usuario abre la app
  ↓
LoadingScreen: permiso de cámara + carga del modelo en paralelo
  ↓
Cámara lista + modelo precalentado → transición al visor
  ↓
Bucle de validación en vivo (1 Hz) sobre el vídeo → avisos en la insignia
  ↓
Usuario dispara (o carga una imagen de la galería)
  ↓
buildCaptureArtifacts(): recorte 3:4 → lienzo 480×640 + lienzo 448×448
  ↓
Validación de la captura → avisos
  ↓
predict(): executeAsync → [1, N] → ranking → TOP_N = 6
  ↓
¿top ≥ 15 %?
  ├─ no → "Lima no identificada" (no se guarda nada)
  └─ sí → limaDetected = top, pendingConfirmation = true
           ↓
       Auto-guardado de la predicción principal en IndexedDB
           ↓
       El usuario puede:
         · tocar el resultado → ficha técnica
         · «Alternativas» → elegir otro candidato → sustituye la entrada guardada
         · «Continuar» → descarta la captura y vuelve al vídeo en vivo
```

### 3.2 Consulta sin captura (Catálogo)

```
Usuario abre "Catálogo"
  ↓
buildCatalogSystems(FILE_CLASSES_V2)   // o V1 según la ruta
  ↓
Resolver cada clase contra ENDOFILE_DICTIONARY
  ↓
Agrupar por sistema (A→Z) y ordenar por `numero` dentro de cada grupo
  ↓
Mostrar lista con encabezados fijos al scroll
  ↓
Búsqueda filtra en tiempo real (nombre / sistema / diámetro, sin acentos ni mayúsculas)
  ↓
Toque en una lima → ficha técnica a ancho completo
```

El catálogo lista **solo las clases del modelo activo**. Es una decisión de producto: lo que se puede consultar es exactamente lo que la cámara puede identificar.

### 3.3 Cambio de modelo

```
Menú lateral → "Modelo V1" / "Modelo V2" / "Página Principal"
  ↓
Navegación de Next a la ruta correspondiente
  ↓
Nuevo EndofileContextProvider con version = 'v1' | 'v2'
  ↓
useEffect detecta el cambio de modelUrl → carga y precalienta el grafo nuevo
  ↓
La insignia de la cabecera pasa a "modelo: EndoX v1" / "EndoX v2"
  ↓
El catálogo se reconstruye con la lista de clases de esa generación
```

El historial **no** se segmenta por modelo: es un único almacén. Los alias del diccionario (§7) existen precisamente para que una detección guardada con una generación siga resolviendo su ficha con otra.

---

## 4. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Framework** | Next.js 16 + React 19 | App Router, build optimizado |
| **Lenguaje** | TypeScript 5 | Type safety, DX |
| **Estilos** | Tailwind CSS 4 | Utility-first, responsive |
| **Inferencia** | TensorFlow.js 4 | Modelos en navegador, sin servidor |
| **Visión clásica** | OpenCV.js (`@techstark/opencv-js`) | Validaciones de calidad sin IA, con respaldo en Canvas |
| **Persistencia** | IndexedDB nativo | Local, sin dependencias |
| **Iconografía** | lucide-react | Ligera, mantenida |

**Por qué NO:**
- No hay API backend — todo en cliente
- No hay base de datos remota — solo IndexedDB
- No hay autenticación — datos anónimos locales
- No hay telemetría — privacidad por defecto

---

## 5. Decisiones de Diseño

### D-01: TensorFlow.js en lugar de API remota

**Decisión:** Inferencia 100 % en el cliente.

**Razón:** privacidad (las imágenes nunca salen del dispositivo), latencia (< 1 s frente a > 2 s con ida y vuelta) y funcionamiento offline tras la carga inicial.

**Trade-off:** el peso del modelo se paga en la primera carga (~32,6 MiB en v2) y limita cuánto puede crecer el clasificador.

---

### D-02: IndexedDB en lugar de localStorage

**Decisión:** historial en IndexedDB, con las fotos como data URL.

**Razón:** `localStorage` limita a ~5 MB y es síncrono; IndexedDB es asíncrono y no bloquea la captura. La data URL evita gestionar el ciclo de vida de un `Blob`.

**Trade-off:** sin sincronización entre pestañas (no es requisito).

---

### D-03: Next.js + App Router

**Decisión:** App Router con rutas por generación de modelo.

**Razón:** las tres rutas (`/`, `/modelv1`, `/modelv2`) comparten componente y solo difieren en una prop; el router hace el trabajo de montar y desmontar el contexto del modelo.

**Trade-off:** cambiar de modelo recarga el grafo entero, no lo cachea entre rutas.

---

### D-04: MediaDevices API + Canvas, sin librería de cámara

**Decisión:** `getUserMedia` y `<canvas>` a mano.

**Razón:** control total sobre el recorte (el 3:4 tiene que coincidir con el del entrenamiento) y sin dependencias.

**Trade-off:** hay que declarar a mano los tipos de las extensiones de `MediaTrack` (`torch`, `focusMode`, `zoom`), que `lib.dom` todavía no incluye.

---

### D-05: El modelo lleva su propia normalización

**Decisión:** softmax y normalización dentro del grafo; el cliente pasa píxeles crudos en [0, 255].

**Razón:** la alternativa —normalizar en el cliente— ya causó dos bugs reales: una normalización de MobileNet aplicada a un modelo EfficientNet (que anulaba el rango dinámico de la imagen) y un softmax redundante que aplastaba las confianzas.

**Trade-off:** el contrato es implícito; quien toque el preprocesado tiene que saberlo. De ahí los comentarios en `endofile-model-context.tsx` y `model/README.md` §3.

---

### D-06: Alternativas en vez de una sola predicción

**Decisión:** conservar los 6 mejores candidatos y ofrecer 4 como corrección manual.

**Razón:** el top-1 es del 97 % pero el top-3 es del 100 %. Cuando el modelo falla, la lima correcta está casi siempre entre las siguientes; ofrecerlas convierte un fallo en un toque.

**Trade-off:** la decisión final la toma el usuario, así que el historial refleja su criterio, no la salida del modelo. Deliberado.

---

### D-07: Validaciones que avisan pero no bloquean

**Decisión:** las tres comprobaciones de calidad muestran advertencias y dejan disparar.

**Razón:** un umbral mal calibrado que bloquee el disparo rompe la app; uno que solo avise, no. Los umbrales todavía no están validados con capturas reales.

**Trade-off:** el usuario puede clasificar una foto que el sistema sabe que es mala.

---

### D-08: El catálogo lista solo las clases del modelo activo

**Decisión:** `CATALOG_FILE_IDS = FILE_CLASSES_V2` (o V1 según la ruta).

**Razón:** que lo consultable y lo detectable sean lo mismo. Antes el catálogo mostraba 47 limas con 18 marcadas «solo consulta», lo que llevaba a esperar detecciones que nunca iban a llegar.

**Trade-off:** se pierde la consulta de los 4 sistemas fuera del modelo. Sus fichas y fotos siguen en el repositorio, listas para volver cuando el modelo los cubra.

---

## 6. Patrones Utilizados

### Context API para el estado compartido

Dos contextos anidados, con una dirección de dependencia clara:

```
EndofileContextProvider   // modelo, predicción, historial
  └─ ImageValidationProvider
      └─ CameraContextProvider   // stream, zoom, captura
```

`CameraContext` consume `EndofileAiContext` (llama a `predict`, `confirmCandidate`), nunca al revés.

### Unión discriminada para el estado del cajón

```typescript
type DrawerState =
  | { view: 'recents' }
  | { view: 'catalog' }
  | { view: 'detail'; target: DetailTarget; from: 'recents' | 'catalog' }
  | { view: 'alternatives' };
```

Hace imposible llegar a `detail` sin destino y elimina las comprobaciones defensivas en el renderizado.

### `tf.tidy()` + `tf.dispose()`

```typescript
const inputTensor = tf.tidy(() => {
  const tensor = tf.browser.fromPixels(cleanCanvas);
  return tensor.cast('float32').expandDims(0);
});
const prediction = await model.executeAsync(inputTensor);
// ...
tf.dispose(inputTensor);
tf.dispose(prediction);
```

`tf.tidy` no puede envolver la ejecución porque `executeAsync` es asíncrona; el tensor de entrada y el de salida se liberan a mano.

### Logging condicionado al entorno

`app/lib/logger.ts` expone `devLog()`, que comprueba `process.env.NODE_ENV`. Next sustituye esa constante en tiempo de build, así que el *bundler* elimina las llamadas y sus argumentos en producción. `console.warn` y `console.error` **no** se envuelven: son problemas reales que deben verse en cualquier entorno.

### Manifiesto generado en vez de sondeo de red

`pnpm photos:manifest` recorre `public/file_photos/`, lee ancho y alto de los bytes del PNG y escribe `endofile-photos.ts`. Así la UI sabe qué limas tienen foto sin provocar 404, y reserva el hueco antes de que la imagen cargue. El hash del contenido va como `?v=` para romper cachés al reemplazar una foto sin renombrarla.

---

## 7. Escalabilidad Futura

### Añadir limas o sistemas (v3+)

1. Reentrenar con las clases nuevas.
2. Exportar a graph model y colocar los pesos en `web/public/models/v3/`.
3. Añadir la entrada a `MODEL_CONFIGS` con su `FILE_CLASSES_V3` (copiada literalmente del `class_names` del notebook).
4. Crear la ruta `app/modelv3/page.tsx` y añadirla al selector del menú lateral.
5. Completar `ENDOFILE_DICTIONARY` con las fichas que falten y el CSV con sus filas.
6. Añadir las fotos a `public/file_photos/` y regenerar el manifiesto.
7. Cambiar `DEFAULT_MODEL_VERSION` cuando la generación nueva pase a ser la principal.

Los pasos 3 y 5 son los únicos que tocan el contrato con el modelo; el resto es dato.

### Telemetría (si alguna vez se quiere, respetando la privacidad)

1. API backend mínima.
2. Enviar solo `timestamp`, `classId` y confianza. **Ninguna imagen.**
3. Opt-in explícito y conforme al RGPD.

---

## 8. Monitoreo y Debugging

### En desarrollo

```bash
cd web
pnpm dev      # escucha en 0.0.0.0
```

Desde el móvil: `http://<ip-de-la-máquina>:3000` en la misma red. La cámara **solo** funciona en contexto seguro: `localhost` sirve, pero desde otro dispositivo hace falta HTTPS o un túnel (ngrok, `cloudflared`).

### Modo depuración del modelo

`EndofileContextProvider` acepta `debug` (por defecto `false`). Activado, registra la carga del grafo, el rango de valores del tensor de entrada, el top-10 de cada predicción y el recuento de tensores vivos tras cada inferencia. Es la vía para comprobar que el preprocesado no está normalizando de más.

### Inspección de IndexedDB

Chrome DevTools → Application → IndexedDB → `endofile-ai` → `scan-history`

### Rendimiento

- **Carga del modelo:** DevTools → Network → filtrar por `models/v2/`
- **Latencia de inferencia:** activar `debug` y medir alrededor de `predict()`
- **Fugas de memoria:** `tf.memory().numTensors` debe volver al mismo valor tras cada predicción; el modo depuración lo imprime
