# Endofile AI - Documento de Especificación de Requisitos

**Versión:** 2.0

---

## 1. Introducción y Propósito

### 1.1 Descripción General

Endofile AI es una aplicación web que permite a odontólogos y endodoncistas identificar y clasificar limas endodónticas rotatorias de forma rápida mediante visión por computadora. La aplicación captura una fotografía de la lima o permite cargar una imagen, la clasifica en tiempo real en el navegador del dispositivo usando un modelo de aprendizaje profundo, y proporciona sus especificaciones técnicas completas.

### 1.2 Problema a Resolver

Identificar una lima endodóntica suelta, fuera de su blíster o secuencia de un sistema, es un proceso lento y propenso a error. Los profesionales deben consultar manuales, fichas técnicas o empaques para determinar calibre, conicidad, longitud, velocidad y torque. Endofile AI automatiza esta tarea.

### 1.3 Restricción Legal y Clínica

> Los datos proceden de las fichas de cada fabricante. No están validados clínicamente ni homogeneizados entre marcas. **La aplicación es una ayuda de consulta, no un criterio clínico.**

### 1.4 Alcance

El proyecto incluye cinco módulos funcionales independientes pero integrados:

1. **Clasificación de limas** — captura desde cámara o carga de imagen.
2. **Corrección de la predicción** — elección entre los candidatos siguientes al primero.
3. **Historial local** — persistencia de detecciones en el dispositivo.
4. **Catálogo de limas** — consulta sin necesidad de captura.
5. **Selección de modelo** — dos generaciones del clasificador disponibles.

---

## 2. Requisitos Funcionales

### 2.1 RF-01: Captura y Carga de Imagen

El usuario puede fotografiar una lima con la cámara o cargar una imagen desde la galería.

- Solicita permiso de cámara al iniciar, en paralelo con la carga del modelo
- Cámara trasera por defecto; permite cambiar de lente, encender la linterna, pausar el vídeo y tocar para reenfocar
- **Zoom** con presets (1×, 1,5×, 2×, 3×), barra fina desplegable y pellizco de dos dedos. Usa el zoom del sensor cuando el navegador expone la capacidad `zoom` de `MediaTrack`; si no, recorta digitalmente tanto la vista previa como la imagen que llega al modelo
- Acceso a galería para cargar PNG, JPEG o WebP
- Modo de vista limpia que oculta los controles auxiliares sin perder el disparador
- Procesamiento sin salir del dispositivo (inferencia local)
- Recorte 3:4 centrado, coincidente con el del dataset de entrenamiento

**Criterios de aceptación:**
- Tras conceder el permiso, el vídeo se muestra sin recargar la página
- El zoom digital que se aplica a la vista previa es el mismo que se aplica al recorte enviado al modelo
- Denegar el permiso no rompe la app: el visor entra en modo simulador y la carga desde galería sigue disponible

---

### 2.2 RF-02: Clasificación en el Navegador

El modelo predice la identidad de la lima en tiempo real desde el cliente.

- Arquitectura: **EfficientNetB2** + cabeza propia `Dense(512) → Dense(256) → Dense(29, softmax)` (modelo v2, por defecto)
- Entrada: imagen 448×448 px, RGB, rango **[0, 255]** `float32`. **El cliente no normaliza**: el grafo lleva su propia normalización
- Salida: tensor `[1, 29]` con probabilidades (softmax incluido en el grafo)
- Ejecución con `executeAsync()`; precalentamiento con tensor de ceros al cargar
- Se conservan los **6 mejores candidatos** de cada predicción
- Umbral mínimo de confianza: **15 %**. Por debajo se devuelve «Lima no identificada» en vez de forzar una clase
- Latencia ≤ 1 segundo en GPU WebGL

**Criterios de aceptación:**
- Las probabilidades del tensor de salida suman 1 sin aplicar softmax adicional en el cliente
- El recuento de tensores vivos (`tf.memory().numTensors`) vuelve al valor previo tras cada predicción
- Una fotografía que no contiene una lima devuelve «Lima no identificada»

---

### 2.3 RF-03: Validación de Calidad de Imagen

La app avisa cuando las condiciones de captura comprometen la clasificación.

**Comprobaciones (independientes, en paralelo):**

| Validación | Método | Umbral por defecto |
|---|---|---|
| Imagen desenfocada | Varianza del Laplaciano | < 35 |
| Imagen demasiado oscura | Brillo medio en escala de grises (0–255) | < 30 |
| Lima demasiado lejos | Contorno mayor: % de área y % del lado más largo | < 0,15 % de área o < 8 % del lado |

**Comportamiento:**
- Se ejecutan sobre el vídeo en vivo una vez por segundo y sobre cada captura
- Usan OpenCV.js; si no ha terminado de cargar, cae automáticamente a una implementación en Canvas 2D
- Son **advertencias, no un bloqueo**: la predicción se ejecuta igualmente y el aviso acompaña al resultado
- La distancia se mide con el lado más largo del *bounding box*, no con su altura, para no penalizar las limas fotografiadas en diagonal

**Criterios de aceptación:**
- El disparador nunca se deshabilita por un aviso de calidad
- Si OpenCV.js no carga, las validaciones siguen produciendo resultado

---

### 2.4 RF-04: Ficha Técnica de Lima

Muestra especificaciones técnicas de la lima clasificada.

**Campos:**
- Diámetro apical (ISO)
- Conicidad
- Longitud(es)
- Velocidad (RPM)
- Torque (Ncm)
- Sistema/marca
- Identificador de clase

**Comportamiento:**
- Desde historial: muestra foto capturada + navegación lateral entre detecciones (izquierda = más reciente)
- Desde catálogo: ficha a ancho completo (sin foto de captura)
- Imagen de referencia del fabricante bajo el nombre, si la lima está fotografiada
- El botón de volver regresa a la vista de origen (historial o catálogo), no a una fija

---

### 2.5 RF-05: Corrección de la Predicción (Alternativas)

Cuando la predicción principal no coincide con la lima real, el usuario puede elegir otra.

- Botón «Alternativas» en la insignia de detección, visible solo mientras hay una detección sin confirmar
- Cajón a pantalla casi completa con hasta **4 candidatos** por debajo del primero
- Cada tarjeta muestra fotografía de referencia, sistema y nombre; sin porcentajes de probabilidad
- Al elegir uno, sustituye a la detección guardada en el historial en lugar de crear una entrada nueva
- Botón «Continuar»: descarta la captura y vuelve al vídeo en vivo sin cambiar nada

**Justificación:** el acierto top-1 es del 97,20 % pero el top-3 es del 100 %. Cuando el modelo se equivoca, la lima correcta está prácticamente siempre entre las siguientes.

**Criterios de aceptación:**
- Elegir una alternativa no deja dos entradas de la misma foto en el historial
- La sintética «Lima no identificada» nunca aparece como opción elegible

---

### 2.6 RF-06: Historial Local

Registro persistente de hasta 20 detecciones en IndexedDB.

- Base `endofile-ai`, *object store* `scan-history`
- Almacena: identificador, `classId`, foto (JPEG data URL del recorte 480×640) y `timestamp`
- La predicción principal se guarda **automáticamente**, sin exigir confirmación
- Persiste tras cerrar el navegador
- Aviso si el navegador no permite persistir (modo privado): la sesión sigue en memoria
- Poda automática de las entradas más antiguas al superar las 20
- Borrado total con confirmación previa
- *Fire and forget*: un fallo de escritura nunca bloquea la captura

**No implementado:** borrado de detecciones individuales. La operación existe en `history-store.ts` pero ningún control la expone.

---

### 2.7 RF-07: Vista del Historial

Interfaz de las detecciones guardadas.

- Rejilla con las últimas 20 detecciones
- Cada tarjeta muestra: miniatura, nombre de la lima y fecha
- Acceso a la ficha técnica con navegación lateral entre detecciones
- Botón para borrar el historial completo
- Estado vacío informativo si no hay detecciones
- Indicador de carga mientras se hidrata desde IndexedDB

---

### 2.8 RF-08: Catálogo de Limas

Consulta independiente de las limas que el modelo activo reconoce: **29 con v2, 28 con v1**.

- Agrupadas por sistema (A→Z), con encabezados fijos al hacer scroll y orden de secuencia dentro de cada grupo
- **Búsqueda** por nombre, sistema o diámetro apical, insensible a mayúsculas y acentos
- Miniatura de referencia en cada lima
- Acceso a ficha técnica desde cada fila
- Al abrirse ocupa casi toda la pantalla, dejando visible solo la franja superior (menú y estado del modelo)

**Decisión de alcance:** el catálogo lista exactamente lo que la cámara puede identificar. Los 4 sistemas fuera del modelo (`Re-Treaty`, `S-Blue`, `RC-Blue`, `Super-Files-III`, 18 limas) conservan ficha y fotografía en el repositorio, pero no aparecen en la app hasta que un modelo los cubra.

---

### 2.9 RF-09: Selección de Modelo

El usuario puede elegir con qué generación del clasificador trabajar.

| Ruta | Modelo | Clases | Insignia |
|---|---|---:|---|
| `/` | v2 (por defecto) | 29 | `EndoX v2` |
| `/modelv2` | v2 | 29 | `EndoX v2` |
| `/modelv1` | v1 (EfficientNetB0) | 28 | `EndoX v1` |

- Selector en el menú lateral, sección «Modelos IA», con la ruta activa resaltada
- La insignia de la cabecera indica el modelo cargado; muestra `---` mientras carga
- El catálogo se reconstruye con las clases de la generación activa
- El historial es común a ambas: los alias del diccionario garantizan que una detección guardada con una generación siga resolviendo su ficha con la otra

**Criterios de aceptación:**
- Cambiar de ruta carga y precalienta el grafo correspondiente sin recargar la aplicación entera
- Una detección guardada con v1 abre su ficha correctamente estando en v2

---

### 2.10 RF-10: Guía de Usuario

Instrucciones de uso accesibles en cualquier momento.

- Se abre automáticamente la primera vez que se concede el permiso de cámara
- Reabrible desde el menú lateral
- Cubre: fondo blanco y limpio, encuadre, iluminación y distancia

---

## 3. Requisitos No Funcionales

### 3.1 Rendimiento
- Inferencia ≤ 1 s (GPU WebGL)
- Precalentamiento del modelo al cargar, para que el primer disparo no pague la compilación de shaders
- Validación en vivo a 1 Hz, sin solaparse consigo misma
- IndexedDB write < 500 ms, y en cualquier caso no bloqueante

**Nota:** los pesos del modelo v2 pesan ~32,6 MiB sin cuantizar. La carga inicial en 4G queda por encima del objetivo de 3 s de la versión anterior de este documento; cuantizar es la vía si se convierte en un problema.

### 3.2 Compatibilidad
- Chrome/Edge 90+, Firefox 88+, Safari 14+
- Pantallas 320–1440 px con orientación automática
- Degradación conocida: la linterna, el enfoque programático y el zoom del sensor son extensiones de `MediaTrack` que no todos los navegadores exponen; cada control se deshabilita o cae a su equivalente por software cuando falta

### 3.3 Seguridad y Privacidad
- **Ninguna imagen sale del dispositivo**
- Historial local (IndexedDB); sin servidor
- Sin telemetría, sin autenticación, sin cuentas
- HTTPS obligatorio en producción (`getUserMedia` requiere contexto seguro)
- Los `console.log` informativos se eliminan del bundle de producción (`devLog`, condicionado a `NODE_ENV`)

### 3.4 Usabilidad
- Interfaz intuitiva para profesionales
- Controles accesibles con una mano
- Todos los controles con `aria-label` y `title`
- Los avisos de calidad orientan a la corrección («Mantenga la cámara firme», «Encienda la luz o el flash», «Acerque la cámara a la lima»)

### 3.5 Calidad
- TypeScript con `strict: true`
- Sin fugas de memoria tras 50+ inferencias (verificable con `tf.memory().numTensors`)
- El manifiesto de fotos es un archivo generado: `pnpm photos:manifest` tras cualquier cambio en `public/file_photos/`

---

## 4. Criterios de Aceptación Globales (Golden Path)

1. El usuario abre la app en el móvil
2. Otorga permiso de cámara; el modelo carga y se precalienta en paralelo
3. Aparece la guía de usuario la primera vez
4. Encuadra la lima; los avisos de calidad confirman que la toma es buena
5. Captura la foto
6. La clasificación se resuelve en < 1 segundo
7. La detección se guarda en el historial automáticamente
8. Si la lima no es la correcta, abre «Alternativas» y elige la buena; el historial se corrige en el sitio
9. Toca el resultado para ver la ficha técnica
10. El historial persiste tras cerrar el navegador
11. Accede al catálogo sin capturar y la búsqueda funciona
12. Cambia a `/modelv1` desde el menú lateral y el visor sigue operativo con 28 clases

---

## 5. Fuera de Alcance (versión actual)

- Detección de los sistemas `Re-Treaty`, `S-Blue`, `RC-Blue` y `Super-Files-III`
- Borrado de detecciones individuales
- Sincronización del historial entre dispositivos
- Exportación de detecciones
- Modo offline instalable (PWA)
- Validación clínica de los datos técnicos
