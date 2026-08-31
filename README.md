# Endofile AI

Detector de limas endodónticas rotatorias. La aplicación web usa la cámara del móvil para
fotografiar una lima, la clasifica en el propio navegador con un modelo de visión y muestra
sus especificaciones técnicas (calibre, longitud, conicidad, velocidad y torque).

Está pensada para odontólogos y endodoncistas: identificar una lima suelta —fuera de su
blíster o de su secuencia— es lento y propenso a error, y ese es el problema que resuelve.

> Los datos proceden de las fichas de cada fabricante. No están validados clínicamente ni
> homogeneizados entre marcas: la app es una ayuda de consulta, no un criterio clínico.

## Estructura del repositorio

| Carpeta | Contenido |
| --- | --- |
| [`web/`](web) | Aplicación Next.js: cámara, inferencia en el navegador y fichas de lima. |
| [`dataset/`](dataset) | `limas-endodonticas.csv` con las especificaciones técnicas y su [documentación](dataset/README.md). |
| [`model/`](model) | Notebooks de entrenamiento (v1 y v2) y documentación del clasificador: arquitectura, entrada/salida, clases y limitaciones. |
| [`docs/`](docs) | Documentación de proyecto (arquitectura, requisitos, glosario, ficha del modelo, informes por generación). |

## Cómo funciona

1. **Pantalla de arranque** — pide permiso de cámara (`getUserMedia`, cámara trasera por
   defecto) y, en paralelo, carga y precalienta el modelo.
2. **Captura** — el usuario fotografía la lima con la cámara o sube una imagen de la galería.
   Antes del disparo, un bucle de validación revisa el vídeo en vivo una vez por segundo y
   avisa si la imagen está desenfocada, oscura o la lima queda demasiado lejos.
3. **Inferencia** — de cada captura salen dos lienzos con el **mismo recorte 3:4**: uno de
   480×640 para mostrar y guardar, y otro de 448×448 (el 3:4 comprimido a 1:1) que se pasa
   al modelo. Todo ocurre en el cliente; ninguna foto sale del dispositivo.
4. **Resultado** — la lima más probable aparece sobre el visor y, al tocarla, se abre su
   ficha técnica completa junto a la foto capturada. Por debajo del **15 %** de confianza se
   marca como «Lima no identificada» en vez de forzar una clase.
5. **Alternativas** — el modelo conserva sus 6 mejores candidatos. Si el primero no es
   correcto, el botón «Alternativas» abre un cajón con hasta 4 opciones (foto de referencia,
   sistema y nombre); al elegir una, sustituye a la detección guardada. «Continuar» descarta
   la captura y vuelve a la cámara en vivo.
6. **Historial** — las últimas 20 detecciones se guardan en IndexedDB, en el propio
   dispositivo, y sobreviven a recargas y cierres. La predicción principal se guarda sola,
   sin confirmación; elegir una alternativa reemplaza esa entrada en lugar de duplicarla.
   Se pueden borrar todas desde la vista de detecciones recientes.

Además del flujo de cámara, el **catálogo** es una entrada independiente: permite consultar
la ficha de cualquiera de las limas que el modelo activo reconoce sin haberla fotografiado,
agrupadas por sistema y con búsqueda por nombre, sistema o calibre. Al abrirlo, ocupa casi
toda la pantalla y deja visible solo la franja superior (menú y estado del modelo).

### Modelos

La app sirve **dos generaciones del clasificador**, cada una en su propia ruta. El menú
lateral («Modelos IA») permite saltar entre ellas y la insignia de la cabecera indica cuál
está cargada.

| Ruta | Modelo | Backbone | Clases | Pesos | Tamaño |
| --- | --- | --- | ---: | --- | ---: |
| `/` y `/modelv2` | EndoX IA Reduced **v2** | EfficientNetB2 | 29 | `web/public/models/v2/` (9 *shards*) | ~32,6 MiB |
| `/modelv1` | EndoX IA Reduced **v1** | EfficientNetB0 | 28 | `web/public/models/v1/` (5 *shards*) | ~18,3 MiB |

Ambos comparten el mismo contrato y el mismo código de inferencia
(`web/app/contexts/endofile-model-context.tsx`); solo cambia la configuración declarada en
`web/app/constants/endofile-models.ts`:

- Exportados como *graph model* de TensorFlow.js (convertidor 4.22, TF 2.20), sin cuantizar.
- Entrada `[-1, 448, 448, 3]` en `float32` con píxeles en **[0, 255]**: el modelo lleva su
  propia normalización incorporada, así que el cliente no normaliza antes (ver
  `model/README.md` §3).
- Salida `[-1, N]` que **ya es una distribución de probabilidad**; el grafo incluye el
  softmax final. Se ejecutan con `executeAsync`.
- Cabeza propia idéntica en las dos generaciones: `GAP` → `BatchNorm` → `Dense(512)` →
  `Dropout` → `Dense(256)` → `BatchNorm` → `Dropout` → `Dense(N, softmax)`.
- Se ejecuta un *warm-up* con un tensor de ceros al cargar, para compilar los shaders de
  WebGL y evitar la latencia del primer disparo. Los tensores intermedios se liberan con
  `tf.tidy` / `tf.dispose`.

v2 es el modelo por defecto: ~8,64 M parámetros, cubre **8 sistemas / 29 limas** y añade
`MicroMega-Remover` sobre los 7 sistemas / 28 limas de v1. Entrenado en dos fases (backbone
congelado, luego *fine-tuning* de las últimas 40 capas) sobre 5 364 fotos propias: 97,20 % de
exactitud en validación, 100 % top-3. Procedimiento completo en
[`model/endox_ia_reduced_v2.ipynb`](model/endox_ia_reduced_v2.ipynb).

Imágenes de prueba en `web/public/model_test/`.

Ficha completa, entrenamiento, métricas por clase y limitaciones conocidas en
[`model/README.md`](model/README.md); resumen corto en [`docs/EAI-DMIA.md`](docs/EAI-DMIA.md);
informes breves por generación en [`docs/EAI-IMRV1.md`](docs/EAI-IMRV1.md) y
[`docs/EAI-IMRV2.md`](docs/EAI-IMRV2.md).

### Datos

El CSV de `dataset/` es la fuente de referencia: **47 limas repartidas en 12 sistemas**, con
diámetro apical (ISO), longitudes disponibles, conicidad, rango de rpm y torque. La app
consume una versión tipada en `web/app/constants/endofile-dataset.ts` (`ENDOFILE_DICTIONARY`),
indexada por el identificador de clase del modelo (`re-treaty_1-bully`, `rc-blue_2-r40`, …).

Las listas de clases viven en `web/app/constants/endofile-models.ts`, una por generación
(`FILE_CLASSES_V1`, `FILE_CLASSES_V2`). **Su orden es el contrato con el modelo**: cada
índice es una posición del tensor de salida, así que no puede reordenarse ni filtrarse sin
reentrenar.

El catálogo se construye a partir de esas mismas listas: muestra exactamente las limas que
el modelo cargado puede devolver —29 con v2, 28 con v1—, ni una más. Es deliberado: lo que
aparece en el catálogo es lo que la cámara puede identificar.

Cómo encajan las tres fuentes:

| Fuente | Cifra |
| --- | --- |
| `dataset/limas-endodonticas.csv` | 47 limas / 12 sistemas |
| `ENDOFILE_DICTIONARY` | 57 claves → 47 limas distintas / 12 sistemas |
| Clases del modelo v2 (catálogo) | 29 / 8 sistemas |
| Clases del modelo v1 | 28 / 7 sistemas |

El CSV y el diccionario ya coinciden lima por lima. Las 10 claves de más del diccionario son
**alias**: `3D-Files`, `Slim-Shaper` y `MicroMega One Curve Mini` figuran bajo dos ids cada
lima —uno con el id que usaba el modelo de 38 clases y otro con el id que emiten los modelos
actuales— para que una detección guardada en el historial antes del cambio de modelo siga
resolviendo su ficha.

Los 4 sistemas que ningún modelo predice todavía (`Re-Treaty`, `S-Blue`, `RC-Blue` y
`Super-Files-III`, 18 limas entre los cuatro) siguen en el CSV y en el diccionario, con ficha
y fotografía, listos para cuando haya dataset suficiente para reincorporarlos. Al añadir o
quitar sistemas del modelo hay que revisar `endofile-models.ts`, el diccionario y el CSV.

Un detalle a resolver: las cuatro fichas de `Blue-Shaper` (Z1–Z4) son idénticas campo por
campo a las cuatro primeras de `MG3-Blue` (SV, PX, G1, G2X), en el mismo orden de secuencia.
Si se confirma que son las mismas limas con otro nombre, sobran cuatro entradas del
diccionario y un sistema entero. El esquema del CSV, sus convenciones e incidencias conocidas
están documentados en [`dataset/README.md`](dataset/README.md).

`web/app/constants/endofile-dataset-complete.ts` conserva el catálogo completo de las 47
limas. No se usa en tiempo de ejecución: es la lista contra la que el generador del
manifiesto de fotos valida los nombres de archivo.

### Fotografías de referencia

Las imágenes de las limas viven en `web/public/file_photos/`, un PNG por lima cuyo nombre
es exactamente su identificador de clase (`re-treaty_1-bully.png`). Están las **47 de 47**,
también las de los sistemas que el modelo todavía no predice: el historial y el cajón de
alternativas pueden resolver cualquiera de ellas aunque el catálogo solo liste las del
modelo activo.

El nombre debe coincidir con el id vigente en `CATALOG_FILE_IDS`, que en `3D-Files`,
`Slim-Shaper` y `MicroMega One Curve Mini` es el que emiten los modelos actuales, no el del
modelo de 38 clases (`3d-files_1-f25`, no `3d-files_2-f25`; ver «Datos» arriba). Un PNG cuyo
nombre no esté en esa lista se avisa como huérfano al regenerar y no se muestra.

Qué limas tienen foto se resuelve contra un manifiesto generado, no probando la red: tras
añadir o quitar imágenes hay que regenerarlo.

```bash
cd web
pnpm photos:manifest   # reescribe app/constants/endofile-photos.ts
```

El script lee el tamaño real de cada PNG —así el hueco se reserva antes de que cargue y el
diseño no salta—, añade un `?v=<hash>` como rompecachés y avisa si un archivo no corresponde
a ninguna lima del catálogo.

## Puesta en marcha

Requiere Node.js 20+ y pnpm.

```bash
cd web
pnpm install
pnpm dev
```

El servidor de desarrollo escucha en `0.0.0.0` para poder abrirlo desde el móvil en la misma
red (`http://<ip-del-equipo>:3000`). Ten en cuenta que **los navegadores solo conceden acceso
a la cámara en contextos seguros**: `localhost` funciona, pero desde otro dispositivo
necesitarás HTTPS o un túnel (ngrok, `cloudflared`, etc.).

Otros comandos:

```bash
pnpm build   # build de producción
pnpm start   # servir el build
pnpm lint    # eslint
```

## Stack

- **Next.js 16** (App Router) y **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **TensorFlow.js 4** para la inferencia en el navegador
- **OpenCV.js** (`@techstark/opencv-js`, servido desde `public/js/opencv.js`) para las
  validaciones de calidad de imagen, con respaldo en Canvas 2D puro si no llega a cargar
- **lucide-react** para la iconografía
- **IndexedDB** para el historial, sin envoltorio ni dependencias añadidas

## Interfaz

Una sola pantalla a pantalla completa con el visor de cámara y controles superpuestos.
Todo lo demás vive en un cajón inferior que sube desde la barra de acciones.

**Cámara**

- cambio de lente, linterna/flash, pausa/reanudación del vídeo, toque para reenfocar y
  subida de imagen desde la galería;
- **zoom** con presets (1×, 1,5×, 2×, 3×), barra fina desplegable y pellizco de dos dedos.
  Usa el zoom óptico del sensor cuando el navegador lo expone (`MediaTrack` `zoom`) y, si no,
  recorta digitalmente —tanto la vista previa como el recorte que se envía al modelo;
- modo de vista limpia que oculta los controles auxiliares sin perder el disparador;
- avisos de calidad de imagen en vivo (desenfoque, poca luz, lima demasiado lejos). Son
  advertencias: nunca bloquean el disparo.

**Menú lateral**

- accesos al visor, al historial, al catálogo y a la guía de usuario;
- selector de modelo: página principal, Modelo V2 (29 clases) y Modelo V1 (28 clases), con
  la ruta activa resaltada.

**Catálogo de limas**

- las limas del modelo activo agrupadas por sistema, con encabezados fijos al hacer scroll;
- al abrirlo ocupa casi toda la pantalla (deja visible solo la franja superior con el menú y
  el estado del modelo), a diferencia del historial y la ficha de detalle, que se quedan en
  un cajón más bajo;
- búsqueda por nombre, sistema o diámetro apical, sin distinguir mayúsculas ni acentos;
- todas las limas listadas tienen imagen de referencia bajo el nombre.

**Alternativas**

- cajón a pantalla casi completa con hasta 4 candidatos por debajo del primero, cada uno con
  su fotografía de referencia, sistema y nombre;
- solo aparece mientras hay una detección sin confirmar; al elegir una opción se cierra y
  actualiza la entrada del historial.

**Historial de detecciones**

- rejilla con las últimas 20 detecciones, su foto y su fecha;
- borrado completo del historial, con confirmación previa;
- si el navegador no permite persistir (modo privado), se avisa y la sesión sigue
  funcionando en memoria.

**Ficha de lima**

- especificaciones técnicas homogéneas: diámetro apical, conicidad, longitud, velocidad y
  torque;
- abierta desde el historial, muestra la foto y permite navegar lateralmente entre
  detecciones (izquierda = más reciente);
- imagen de referencia del fabricante bajo el nombre, cuando la lima tiene fotografía;
- abierta desde el catálogo ocupa todo el ancho, sin reservar espacio para la foto de la
  captura, que ahí no existe.

## Estado

Prototipo en desarrollo, funcional de extremo a extremo.

Implementado: detección con la cámara o desde una imagen, selección entre dos generaciones
del modelo, corrección de la predicción desde el cajón de alternativas, ficha técnica,
catálogo navegable con búsqueda, validaciones de calidad de imagen e historial persistente
en el dispositivo.

Pendiente:

- **Datos** — verificar contra las fichas de fabricante los valores marcados como dudosos en
  [`dataset/README.md`](dataset/README.md) y decidir si `Blue-Shaper` y las cuatro primeras
  de `MG3-Blue` son la misma secuencia (ver arriba).
- **Modelo** — validar en un dispositivo real que la accuracy medida en el notebook (97,20 %)
  se sostiene en producción; investigar por qué `rising_3-25` empeoró respecto a la
  generación anterior; corregir las dos inconsistencias detectadas en el notebook v2 (la
  celda de verificación de clases con salida desactualizada, y el log de la fase 2 que dice
  "30 capas" cuando el código descongela 40); reforzar `MG3-Blue`, todavía el sistema más
  débil; y evaluar si hay dataset suficiente para reincorporar los 4 sistemas que quedaron
  fuera del modelo reducido ([`model/README.md`](model/README.md) §3, §6, §10).
- **Umbrales** — el mínimo de confianza (15 %) y los umbrales de validación de imagen se
  fijaron por tanteo; hace falta calibrarlos con capturas reales.
- **Interfaz** — borrado de detecciones individuales (la operación existe en
  `history-store.ts`, pero ningún control la expone); la tipografía no sigue los tokens de
  diseño porque `globals.css` fija Arial en `body`.
- **Validación** — el recorrido completo en un dispositivo con cámara real.
