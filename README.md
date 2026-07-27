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

## Cómo funciona

1. **Pantalla de arranque** — pide permiso de cámara (`getUserMedia`, cámara trasera por
   defecto) y, en paralelo, carga y precalienta el modelo.
2. **Captura** — el usuario fotografía la lima con la cámara o sube una imagen de la galería.
3. **Inferencia** — la imagen se redimensiona a 384×384, se pasa por el modelo y se aplica
   *softmax* sobre las 38 clases. Todo ocurre en el cliente; ninguna foto sale del dispositivo.
4. **Resultado** — se muestra la clase más probable con su confianza; el detalle abre la
   ficha completa de la lima y las 3 mejores predicciones.
5. **Historial** — las últimas 20 detecciones quedan disponibles en la sesión (en memoria,
   no se persisten).

### Modelo

- Arquitectura **MobileNetV3-Small**, exportado como *graph model* de TensorFlow.js
  (convertidor 4.22, TF 2.19).
- Entrada `[-1, 384, 384, 3]` en `float32`; salida `[-1, 38]` con logits sin normalizar
  (la *softmax* se calcula en el cliente, en `endofile-model-context.tsx`).
- Pesos en `web/public/model_proto/` (~3,7 MB) y se sirven como estáticos desde la raíz.
- Se ejecuta un *warm-up* con un tensor de ceros al cargar, para compilar los shaders de
  WebGL y evitar la latencia del primer disparo. Los tensores intermedios se liberan con
  `tf.tidy` / `tf.dispose`.
- Imágenes de prueba en `web/public/model_test/`.

### Datos

El CSV de `dataset/` es la fuente de referencia: 43 limas repartidas en 11 sistemas, con
diámetro apical (ISO), longitudes disponibles, conicidad, rango de rpm y torque. La app
consume una versión tipada en `web/app/constants/endofile-dataset.ts` (`ENDOFILE_DICTIONARY`),
indexada por el identificador de clase del modelo (`re-treaty_1-bully`, `rc-blue_2-r40`, …).

Las dos listas todavía no coinciden del todo —el modelo distingue `blue-shaper` y `rising`,
que el CSV agrupa de otra forma, y el diccionario tiene 50 entradas frente a 38 clases—, así
que al añadir sistemas conviene revisar los tres sitios. El esquema del CSV, sus convenciones
e incidencias conocidas están documentados en [`dataset/README.md`](dataset/README.md).

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

## Interfaz

Una sola pantalla a pantalla completa con el visor de cámara y controles superpuestos:

- cambio de lente, linterna/flash, toque para reenfocar y subida de imagen desde la galería;
- modo de vista limpia que oculta los controles auxiliares sin perder el disparador;
- cajón inferior con historial de detecciones, ficha de lima y catálogo;
- la ficha permite navegar lateralmente entre detecciones (izquierda = más reciente).

La vista de catálogo completo es todavía un marcador de posición.

## Estado

Prototipo en desarrollo. Pendiente: catálogo navegable, persistencia del historial y
verificar contra las fichas de fabricante los valores marcados como dudosos en el dataset.
