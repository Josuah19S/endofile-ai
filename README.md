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
| [`model/`](model) | Documentación del clasificador: arquitectura, entrada/salida, clases y limitaciones. |

## Cómo funciona

1. **Pantalla de arranque** — pide permiso de cámara (`getUserMedia`, cámara trasera por
   defecto) y, en paralelo, carga y precalienta el modelo.
2. **Captura** — el usuario fotografía la lima con la cámara o sube una imagen de la galería.
3. **Inferencia** — la imagen se recorta al cuadrado central, se lleva a 384×384 y se pasa
   por el modelo, que devuelve una probabilidad para cada una de las 38 clases. Todo ocurre
   en el cliente; ninguna foto sale del dispositivo.
4. **Resultado** — la lima más probable aparece sobre el visor y, al tocarla, se abre su
   ficha técnica completa junto a la foto capturada.
5. **Historial** — las últimas 20 detecciones se guardan en IndexedDB, en el propio
   dispositivo, y sobreviven a recargas y cierres. Se pueden borrar desde la vista de
   detecciones recientes.

Además del flujo de cámara, el **catálogo** es una entrada independiente: permite consultar
la ficha de cualquiera de las 38 limas sin haberla fotografiado, agrupadas por sistema y con
búsqueda por nombre, sistema o calibre.

### Modelo

- Arquitectura **MobileNetV3-Small** + `Dense(38)`, exportado como *graph model* de
  TensorFlow.js (convertidor 4.22, TF 2.19). 945 442 parámetros, sin cuantizar.
- Entrada `[-1, 384, 384, 3]` en `float32` con píxeles en **[0, 255]**: el modelo lleva su
  propia capa de reescalado, así que no hay que normalizar antes.
- Salida `[-1, 38]` que **ya es una distribución de probabilidad**; el grafo incluye el
  softmax final.
- Pesos en `web/public/model_proto/` (3,61 MiB) y se sirven como estáticos desde la raíz.
- Se ejecuta un *warm-up* con un tensor de ceros al cargar, para compilar los shaders de
  WebGL y evitar la latencia del primer disparo. Los tensores intermedios se liberan con
  `tf.tidy` / `tf.dispose`.
- Imágenes de prueba en `web/public/model_test/`.

Ficha completa, clases y limitaciones conocidas en [`model/README.md`](model/README.md).

### Datos

El CSV de `dataset/` es la fuente de referencia: 43 limas repartidas en 11 sistemas, con
diámetro apical (ISO), longitudes disponibles, conicidad, rango de rpm y torque. La app
consume una versión tipada en `web/app/constants/endofile-dataset.ts` (`ENDOFILE_DICTIONARY`),
indexada por el identificador de clase del modelo (`re-treaty_1-bully`, `rc-blue_2-r40`, …).

La lista de clases vive aparte, en `web/app/constants/endofile-classes.ts`. **Su orden es el
contrato con el modelo**: cada índice es una posición del tensor de salida, así que no puede
reordenarse ni filtrarse sin reentrenar. El catálogo se construye recorriendo esa lista y
resolviendo cada clase contra el diccionario, no al revés.

Las tres listas todavía no coinciden:

| Fuente | Cifra |
| --- | --- |
| `dataset/limas-endodonticas.csv` | 43 limas / 11 sistemas |
| `ENDOFILE_DICTIONARY` | 50 claves → 47 limas distintas / 12 sistemas |
| Clases del modelo | 38 / 10 sistemas |

Las diferencias son conocidas: el diccionario añade el sistema `Blue-Shaper` (4 limas) que
no está en el CSV pero que el modelo sí predice, mientras que `MG3-Blue` y `S-Blue` están en
CSV y diccionario pero **no** entre las clases del modelo; y las tres limas de `3D-Files`
figuran en el diccionario bajo dos claves cada una, como alias. Al añadir sistemas hay que
revisar los tres sitios. El esquema del CSV, sus convenciones e incidencias conocidas están
documentados en [`dataset/README.md`](dataset/README.md).

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

- las 38 limas detectables, agrupadas en 10 sistemas con encabezados fijos al hacer scroll;
- búsqueda por nombre, sistema o diámetro apical, sin distinguir mayúsculas ni acentos;
- solo aparecen limas que el modelo reconoce: listar las que no puede detectar prometería
  algo que la aplicación no cumple.

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
- abierta desde el catálogo, ocupa todo el ancho: no hay fotografías de referencia de las
  limas, así que no se reserva espacio para una imagen que no existe.

## Estado

Prototipo en desarrollo, funcional de extremo a extremo.

Implementado: detección con la cámara o desde una imagen, ficha técnica, catálogo navegable
con búsqueda e historial persistente en el dispositivo.

Pendiente:

- **Datos** — reconciliar las tres fuentes de limas (ver arriba) y verificar contra las
  fichas de fabricante los valores marcados como dudosos en
  [`dataset/README.md`](dataset/README.md).
- **Modelo** — eliminar el softmax duplicado y documentar métricas y procedimiento de
  entrenamiento, hoy inexistentes en el repositorio ([`model/README.md`](model/README.md)).
- **Interfaz** — borrado de detecciones individuales; la tipografía no sigue los tokens de
  diseño porque `globals.css` fija Arial en `body`.
- **Validación** — el recorrido completo en un dispositivo con cámara real.
