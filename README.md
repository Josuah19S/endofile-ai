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
| [`model/`](model) | Notebook de entrenamiento y documentación del clasificador: arquitectura, entrada/salida, clases y limitaciones. |
| [`docs/`](docs) | Documentación de proyecto (arquitectura, requisitos, glosario, ficha del modelo). |

## Cómo funciona

1. **Pantalla de arranque** — pide permiso de cámara (`getUserMedia`, cámara trasera por
   defecto) y, en paralelo, carga y precalienta el modelo.
2. **Captura** — el usuario fotografía la lima con la cámara o sube una imagen de la galería.
3. **Inferencia** — la imagen se recorta al cuadrado central, se lleva a 448×448 y se pasa
   por el modelo, que devuelve una probabilidad para cada una de las 28 clases. Todo ocurre
   en el cliente; ninguna foto sale del dispositivo.
4. **Resultado** — la lima más probable aparece sobre el visor y, al tocarla, se abre su
   ficha técnica completa junto a la foto capturada. Por debajo del 35 % de confianza se
   marca como «Lima no identificada» en vez de forzar una clase.
5. **Historial** — las últimas 20 detecciones se guardan en IndexedDB, en el propio
   dispositivo, y sobreviven a recargas y cierres. Se pueden borrar desde la vista de
   detecciones recientes.

Además del flujo de cámara, el **catálogo** es una entrada independiente: permite consultar
la ficha de cualquiera de las 47 limas sin haberla fotografiado, agrupadas por sistema y con
búsqueda por nombre, sistema o calibre. Al abrirlo, ocupa casi toda la pantalla y deja visible
solo la franja superior (menú y estado del modelo).

### Modelo

- Segunda generación del clasificador: arquitectura **EfficientNetB0** + cabeza propia
  (`Dense(512)` → `Dense(256)` → `Dense(28, softmax)`), exportada como *graph model* de
  TensorFlow.js (convertidor 4.22, TF 2.19). ~4,85 M parámetros, sin cuantizar (~18,3 MiB).
  Cubre **7 sistemas / 28 limas** — menos que el modelo anterior (38 clases / 10 sistemas),
  recortado a los sistemas con dataset suficiente para entrenar con confianza.
- Entrada `[-1, 448, 448, 3]` en `float32` con píxeles en **[0, 255]**: el modelo lleva su
  propia normalización incorporada, así que el cliente no normaliza antes (ver
  `model/README.md` §3).
- Salida `[-1, 28]` que **ya es una distribución de probabilidad**; el grafo incluye el
  softmax final.
- Entrenado en dos fases (backbone congelado, luego *fine-tuning* de las últimas 30 capas)
  sobre 4 199 fotos propias. 94,64 % de exactitud en validación, 99,88 % top-3. Procedimiento
  completo en [`model/endox_ia_reduced.ipynb`](model/endox_ia_reduced.ipynb).
- Pesos en `web/public/model_proto/` (~18,3 MiB en 5 *shards*) y se sirven como estáticos
  desde la raíz.
- Se ejecuta un *warm-up* con un tensor de ceros al cargar, para compilar los shaders de
  WebGL y evitar la latencia del primer disparo. Los tensores intermedios se liberan con
  `tf.tidy` / `tf.dispose`.
- Imágenes de prueba en `web/public/model_test/`.

Ficha completa, entrenamiento, métricas por clase y limitaciones conocidas en
[`model/README.md`](model/README.md); resumen corto en [`docs/EAI-DMIA.md`](docs/EAI-DMIA.md).

### Datos

El CSV de `dataset/` es la fuente de referencia: 43 limas repartidas en 11 sistemas, con
diámetro apical (ISO), longitudes disponibles, conicidad, rango de rpm y torque. La app
consume una versión tipada en `web/app/constants/endofile-dataset.ts` (`ENDOFILE_DICTIONARY`),
indexada por el identificador de clase del modelo (`re-treaty_1-bully`, `rc-blue_2-r40`, …).

La lista de clases vive aparte, en `web/app/constants/endofile-classes.ts`. **Su orden es el
contrato con el modelo**: cada índice es una posición del tensor de salida, así que no puede
reordenarse ni filtrarse sin reentrenar.

El catálogo no usa esa lista: se construye recorriendo `CATALOG_FILE_IDS` —las 43 limas del
CSV en su mismo orden, más las 4 de `Blue-Shaper`— y resolviendo cada una contra el
diccionario. Contiene las 28 clases del modelo y 19 limas más que el modelo no predice, así
que cada entrada lleva una marca `detectable` según esté o no entre las clases.

Las tres listas todavía no coinciden:

| Fuente | Cifra |
| --- | --- |
| `dataset/limas-endodonticas.csv` | 43 limas / 11 sistemas |
| `ENDOFILE_DICTIONARY` | 50 claves → 47 limas distintas / 12 sistemas |
| Clases del modelo | 28 / 7 sistemas |

Las diferencias son conocidas: el diccionario añade el sistema `Blue-Shaper` (4 limas) que
no está en el CSV pero que el modelo sí predice; y `Re-Treaty`, `S-Blue`, `RC-Blue`,
`Super-Files-III` y `Micromega-Remover` (19 limas entre los cinco) están en CSV y diccionario
pero **no** entre las clases del modelo reducido actual. `3D-Files`, `Slim-Shaper` y
`MicroMega One Curve Mini` figuran en el diccionario bajo dos claves cada lima, como alias:
una con el id que usaba el modelo anterior (38 clases) y otra con el id que emite el modelo
actual, para que una detección guardada en el historial antes del cambio de modelo siga
resolviendo su ficha. Al añadir o quitar sistemas del modelo hay que revisar los tres sitios.

Un detalle a resolver al reconciliarlas: las cuatro fichas de `Blue-Shaper` (Z1–Z4) son
idénticas campo por campo a las cuatro primeras de `MG3-Blue` (SV, PX, G1, G2X), en el mismo
orden de secuencia. Si se confirma que son las mismas limas con otro nombre, sobran cuatro
entradas del diccionario y un sistema entero del catálogo. El esquema del CSV, sus convenciones e incidencias conocidas están
documentados en [`dataset/README.md`](dataset/README.md).

### Fotografías de referencia

Las imágenes de las limas viven en `web/public/file_photos/`, un PNG por lima cuyo nombre
es exactamente su identificador de clase (`re-treaty_1-bully.png`). Hoy están las **47 de
47**.

El nombre debe coincidir con el id de clase vigente en `CATALOG_FILE_IDS`, que en
`3D-Files`, `Slim-Shaper` y `MicroMega One Curve Mini` es el que emite el modelo actual, no
el del modelo anterior (`3d-files_1-f25`, no `3d-files_2-f25`; ver «Datos» arriba). Un PNG
cuyo nombre no esté en `CATALOG_FILE_IDS` se avisa como huérfano al regenerar y no se
muestra.

Qué limas tienen foto se resuelve contra un manifiesto generado, no probando la red: tras
añadir o quitar imágenes hay que regenerarlo.

```bash
cd web
pnpm photos:manifest   # reescribe app/constants/endofile-photos.ts
```

El script lee el tamaño real de cada PNG —así el hueco se reserva antes de que cargue y el
diseño no salta— y avisa si un archivo no corresponde a ninguna lima del catálogo.

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
- **lucide-react** para la iconografía
- **IndexedDB** para el historial, sin envoltorio ni dependencias añadidas

## Interfaz

Una sola pantalla a pantalla completa con el visor de cámara y controles superpuestos.
Todo lo demás vive en un cajón inferior que sube desde la barra de acciones.

**Cámara**

- cambio de lente, linterna/flash, toque para reenfocar y subida de imagen desde la galería;
- modo de vista limpia que oculta los controles auxiliares sin perder el disparador.

**Catálogo de limas**

- las 47 limas —las 43 del dataset más `Blue-Shaper`—, agrupadas en 12 sistemas con
  encabezados fijos al hacer scroll;
- al abrirlo ocupa casi toda la pantalla (deja visible solo la franja superior con el menú y
  el estado del modelo), a diferencia del historial y la ficha de detalle, que se quedan en
  un cajón más bajo;
- búsqueda por nombre, sistema o diámetro apical, sin distinguir mayúsculas ni acentos;
- las 19 limas sin clase en el modelo actual (`Re-Treaty`, `S-Blue`, `RC-Blue`,
  `Super-Files-III` y `Micromega-Remover`) aparecen marcadas como «solo consulta»: se pueden
  abrir, pero la cámara nunca las devolverá;
- todas las limas tienen imagen de referencia bajo el nombre — el catálogo de fotos está
  completo (47/47).

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

Implementado: detección con la cámara o desde una imagen, ficha técnica, catálogo navegable
con búsqueda e historial persistente en el dispositivo.

Pendiente:

- **Datos** — reconciliar las tres fuentes de limas (ver arriba) y verificar contra las
  fichas de fabricante los valores marcados como dudosos en
  [`dataset/README.md`](dataset/README.md).
- **Modelo** — validar en un dispositivo real que la normalización de entrada, corregida
  para que coincida con la usada al entrenar, sostiene la accuracy del notebook; investigar
  por qué la fase de *fine-tuning* rinde peor que el backbone congelado; reforzar las clases
  más débiles (`MG3-Blue`, `rising_2-13`); y evaluar si hay dataset suficiente para
  reincorporar los 5 sistemas que quedaron fuera del modelo reducido
  ([`model/README.md`](model/README.md) §3, §6, §10).
- **Interfaz** — borrado de detecciones individuales; la tipografía no sigue los tokens de
  diseño porque `globals.css` fija Arial en `body`.
- **Validación** — el recorrido completo en un dispositivo con cámara real.
