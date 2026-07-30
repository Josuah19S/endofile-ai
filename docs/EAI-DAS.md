# Endofile AI - Documento de Arquitectura de Software

**Versión:** 1.0  
**Fecha:** 2026-07-29  
**Autor:** Josue Carbajal

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

Aplicación web modular con rutas independientes:

| Componente | Propósito | Tech |
|---|---|---|
| **Captura** | Interfaz de cámara y disparador | MediaDevices API, Canvas |
| **Resultado** | Muestra predicción tras clasificación | React, Tailwind |
| **Ficha Técnica** | Detalles de la lima (RPM, torque, etc.) | React Context, Tailwind |
| **Historial** | Rejilla de 20 últimas detecciones | IndexedDB, React hooks |
| **Catálogo** | Listado de 38 limas con búsqueda | Diccionario tipado, Fuse.js (si aplica) |

**Rutas principales:**
- `/` — Pantalla de cámara (entry point)
- `/history` — Historial de detecciones
- `/catalog` — Catálogo completo

### 2.2 Modelo (TensorFlow.js)

**Ubicación:** `web/public/model_proto/`

- **Arquitectura:** MobileNetV3-Small + Dense(38)
- **Formato:** Graph Model de TF.js (peso + archivos de topología)
- **Entrada:** 384×384 px, valores [0, 255], float32
- **Salida:** Probabilidades [0, 1] para 38 clases (softmax incluido)
- **Tamaño:** ~3.61 MiB
- **Precalentamiento:** Tensor de ceros al iniciar para compilar shaders WebGL

**Proceso de inferencia:**

```
Imagen capturada (variable size)
  ↓
Crop al cuadrado central
  ↓
Resize a 384×384
  ↓
Normalización (reescalado en el modelo)
  ↓
Forward pass
  ↓
Salida: [1, 38] probabilidades
  ↓
argmax → clase predicha
```

### 2.3 Base de Datos (IndexedDB)

**Almacenamiento local en el navegador**

Store: `detections`

```
{
  id: string (timestamp + random),
  classId: string,           // ej: "re-treaty_1-bully"
  probability: number,       // 0-1
  timestamp: Date,
  imageBlob: Blob,          // foto capturada
  limaName: string          // nombre legible
}
```

**Límites:**
- Máximo 20 detecciones (FIFO cuando alcanza límite)
- Persistencia: sobrevive a cierres de navegador
- Fallback: si no disponible (modo privado), funciona en memoria

### 2.4 Dataset (CSV + TypeScript)

**Ubicación:** `dataset/limas-endodonticas.csv` + `web/app/constants/endofile-dataset.ts`

Diccionario tipado con especificaciones de cada lima:

```typescript
ENDOFILE_DICTIONARY: {
  "re-treaty_1-bully": {
    system: "RE-Treaty",
    name: "RE-Treaty #1",
    apicalDiameter: "15",      // ISO
    taper: "6%",
    lengths: ["21", "25"],
    rpm: 300,
    torque: 2.5
  },
  // ... 50 claves mapeadas
}
```

**Lista de clases:** `web/app/constants/endofile-classes.ts`

Orden fijo (contrato con modelo): índice 0 = clase 0, etc.

```typescript
export const ENDOFILE_CLASSES = [
  "re-treaty_1-bully",
  "re-treaty_2-red",
  // ... 38 clases totales
]
```

---

## 3. Flujo de Datos

### 3.1 Flujo Completo: Captura → Clasificación → Historial

```
Usuario abre app
  ↓
Solicitar permiso de cámara + Cargar modelo en paralelo
  ↓
Cámara lista + Modelo precalentado
  ↓
Usuario captura foto (o carga desde galería)
  ↓
Preprocesamiento en Canvas:
  - Crop cuadrado central
  - Resize a 384×384
  - Tensor float32
  ↓
Inferencia (TF.js en WebGL)
  - Forward pass
  - Softmax (incluido en modelo)
  - Salida: [1, 38]
  ↓
argmax(salida) = clase predicha
  ↓
Resolver clase a lima en ENDOFILE_DICTIONARY
  ↓
Mostrar resultado + ficha técnica
  ↓
Guardar en IndexedDB:
  {classId, probability, timestamp, imageBlob}
  ↓
Historial actualizado
```

### 3.2 Flujo Alternativo: Consulta sin Captura (Catálogo)

```
Usuario abre "Catálogo"
  ↓
Recorrer ENDOFILE_CLASSES (38 clases)
  ↓
Resolver cada clase contra ENDOFILE_DICTIONARY
  ↓
Mostrar rejilla agrupada por sistema
  ↓
Búsqueda filtra en tiempo real (nombre/sistema/diámetro)
  ↓
Toque en lima → abre ficha técnica
```

---

## 4. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend Framework** | Next.js 16 + React 19 | SSR, App Router, rendimiento |
| **Lenguaje** | TypeScript 5 | Type safety, DX |
| **Estilos** | Tailwind CSS 4 | Utility-first, responsive |
| **ML Inference** | TensorFlow.js 4 | Modelos en navegador, sin servidor |
| **Persistencia** | IndexedDB nativo | Local, sin dependencias |
| **Iconografía** | lucide-react | Ligera, mantenida |
| **Empaquetado** | Next.js + Webpack | Automático, optimizado |

**Por qué NO:**
- No hay API backend — todo en cliente
- No hay base de datos remota — solo IndexedDB
- No hay autenticación — datos anónimos locales
- No hay telemetría — privacidad por defecto

---

## 5. Decisiones de Diseño

### D-01: TensorFlow.js en lugar de API remota

**Decisión:** Inferencia 100% en el cliente

**Razón:**
- Privacidad: imágenes nunca salen del dispositivo
- Latencia: < 1s vs > 2s con round-trip
- Funciona offline tras carga inicial

**Trade-off:** Modelo limitado a 38 clases (tamaño MobileNetV3-Small)

---

### D-02: IndexedDB en lugar de localStorage

**Decisión:** Almacenamiento de blobs (imágenes) en IndexedDB

**Razón:**
- localStorage limita a ~5MB de texto
- IndexedDB soporta Blobs sin serializar
- Mejor rendimiento para 20 imágenes

**Trade-off:** No hay sincronización en múltiples pestañas (no es requisito)

---

### D-03: Next.js + App Router

**Decisión:** Aplicación web full-stack con App Router

**Razón:**
- Routing nativo sin Reach Router
- Layouts compartidos (cámara siempre visible)
- Build optimizado automático

**Trade-off:** Overhead mínimo (~100KB gzipped) para una SPA

---

### D-04: Canvas + MediaDevices API vs WebRTC

**Decisión:** MediaDevices API nativa (getUserMedia) + Canvas manual

**Razón:**
- Control total sobre redimensionamiento
- Mejor rendimiento en dispositivos lentos
- Sin dependencias

**Trade-off:** Menos features (ej: filtros en tiempo real)

---

### D-05: Modelo con softmax incluido

**Decisión:** Softmax en el grafo del modelo, no en el código

**Razón:**
- Consistencia: siempre devuelve probabilidades válidas
- Simula producción

**Trade-off:** Softmax duplicado actual (a eliminar en v1.0)

---

## 6. Patrones Utilizados

### React Hooks (Estado Local)

```typescript
const [isModelReady, setIsModelReady] = useState(false);
const [predictions, setPredictions] = useState<Prediction[]>([]);
```

### Context API (Estado Global Opcional)

Para compartir:
- Estado del modelo cargado
- Acceso al diccionario

```typescript
<ModelProvider>
  <App />
</ModelProvider>
```

### Canvas para Preprocesamiento

Redimensionamiento y normalización manual antes de pasar al modelo.

```typescript
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');
ctx.drawImage(video, ...); // crop al cuadrado central
canvas.toBlob(blob => {
  // Convertir a tensor
});
```

### tf.tidy() para Gestión de Memoria

```typescript
const prediction = tf.tidy(() => {
  const tensor = tf.browser.fromPixels(canvas);
  return model.predict(tensor);
});
```

Libera tensores intermedios automáticamente.

---

## 7. Limitaciones Arquitectónicas Conocidas

| Limitación | Causa | Impacto |
|---|---|---|
| 38 clases fijas | Tamaño del modelo (3.6 MiB) | No se pueden añadir nuevas limas sin reentrenar |
| MobileNetV3-Small | Balance tamaño/precisión | Precisión < ResNet50 (aceptable para prototipo) |
| Sin autenticación | Datos anónimos + offline | No hay análisis de uso |
| Historial local | No hay sincronización | 20 últimas detecciones por dispositivo |
| Softmax duplicado | Exportación del modelo | Eliminar en v1.0 |

---

## 8. Escalabilidad Futura

### Si queremos agregar nuevas limas (v1.1+)

1. Reentrenar modelo con nuevas clases
2. Aumentar tamaño (4-5 MiB aceptable)
3. Actualizar ENDOFILE_CLASSES
4. Agregar especificaciones a ENDOFILE_DICTIONARY
5. Actualizar CSV dataset

### Si queremos análisis/telemetría (respetando privacidad)

1. Agregar API backend (Node.js/Python)
2. Enviar solo: timestamp, classId, confidence
3. Ninguna imagen
4. Voluntario (opt-in) + GDPR compliant

---

## 9. Monitoreo y Debugging

### En Desarrollo

```bash
cd web
pnpm dev
# http://localhost:3000
```

Acceder desde móvil: `http://<ip-máquina>:3000` (mismo WiFi)

### Inspección de IndexedDB

Chrome DevTools → Application → IndexedDB → endofile-ai → detections

### Performance

- **Carga del modelo:** DevTools Network → model_proto files
- **Latencia de inferencia:** Console.time() en clasificación
- **Memoria:** DevTools Memory → Heap snapshots antes/después de inferencias