# Endofile AI - Documento de Especificación de Requisitos

**Versión:** 1.1  
**Fecha:** 2026-07-28   
**Estado:** Prototipo funcional en desarrollo   
**Autor:** Josue Carbajal   

---

## 1. Introducción y Propósito

### 1.1 Descripción General

Endofile AI es una aplicación web que permite a odontólogos y endodoncistas identificar y clasificar limas endodónticas rotatorias de forma rápida mediante visión por computadora. La aplicación captura una fotografía de la lima o permite cargar una imagen, la clasifica en tiempo real en el navegador del dispositivo usando un modelo de aprendizaje profundo, y proporciona sus especificaciones técnicas completas.

### 1.2 Problema a Resolver

Identificar una lima endodóntica suelta, fuera de su blíster o secuencia de un sistema, es un proceso lento y propenso a error. Los profesionales deben consultar manuales, fichas técnicas o empacar para determinar calibre, conicidad, longitud, velocidad y torque. Endofile AI automatiza esta tarea.

### 1.3 Restricción Legal y Clínica

> Los datos proceden de las fichas de cada fabricante. No están validados clínicamente ni homogeneizados entre marcas. **La aplicación es una ayuda de consulta, no un criterio clínico.**

### 1.4 Alcance

El proyecto incluye tres módulos funcionales independientes pero integrados:
1. **Clasificación de limas** — captura desde cámara o carga de imagen.
2. **Historial local** — persistencia de detecciones en el dispositivo.
3. **Catálogo de limas** — consulta sin necesidad de captura.

---

## 2. Requisitos Funcionales

### 2.1 RF-01: Captura y Carga de Imagen

El usuario puede fotografiar una lima con la cámara o cargar una imagen desde la galería.

- Solicita permiso de cámara al iniciar
- Cámara trasera por defecto; permite cambiar lente, flash y reenfocar
- Acceso a galería para cargar PNG, JPEG o WebP
- Procesamiento sin salir del dispositivo (inferencia local)
- Compatible en orientación vertical y horizontal

---

### 2.2 RF-02: Clasificación en el Navegador

El modelo predice la identidad de la lima en tiempo real desde el cliente.

- Arquitectura: **MobileNetV3-Small** + Dense(38)
- Entrada: imagen 384×384 px, rango [0, 255] float32
- Salida: tensor [1, 38] con probabilidades (softmax incluido)
- Precalentamiento con tensor de ceros al cargar
- Latencia ≤ 1 segundo en GPU WebGL

---

### 2.3 RF-03: Ficha Técnica de Lima

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
- Desde historial: muestra foto capturada + navegación lateral entre detecciones
- Desde catálogo: ficha a ancho completo (sin imagen)

---

### 2.4 RF-04: Historial Local

Registro persistente de hasta 20 detecciones en IndexedDB.

- Almacena: identificador, probabilidad, timestamp, imagen
- Persiste tras cerrar navegador
- Aviso si navegador en modo privado (funciona en memoria)
- Borrado total con confirmación
- Borrado de detecciones individuales

---

### 2.5 RF-05: Vista del Historial

Interfaz de las detecciones guardadas.

- Rejilla (grid) con últimas 20 detecciones
- Cada tarjeta muestra: thumbnail, nombre lima, fecha
- Acceso a ficha técnica con navegación lateral
- Botón para borrar historial completo
- Estado vacío informativo si no hay detecciones

---

### 2.6 RF-06: Catálogo de Limas

Consulta independiente del catálogo de 38 limas detectables.

- Agrupadas por 10 sistemas con encabezados fijos al scroll
- **Búsqueda:** por nombre, sistema o diámetro (case-insensitive, sin acentos)
- Solo muestra limas que el modelo reconoce
- Acceso a ficha técnica desde cada lima

---

## 3. Requisitos No Funcionales

### 3.1 Rendimiento
- Inferencia ≤ 1s (GPU WebGL)
- Carga del modelo ≤ 3s (4G)
- Bundle ≤ 5 MiB
- IndexedDB write < 500ms

### 3.2 Compatibilidad
- Chrome/Edge 90+, Firefox 88+, Safari 14+
- Pantallas 320–1440px con orientación automática

### 3.3 Seguridad
- **Ninguna imagen sale del dispositivo**
- Historial local (IndexedDB); sin servidor
- Sin telemetría
- HTTPS obligatorio en producción

### 3.4 Usabilidad
- Interfaz intuitiva para profesionales
- Controles accesibles con una mano

### 3.5 Calidad
- TypeScript con `strict: true`
- Sin fugas de memoria tras 50+ inferencias

## 4. Criterios de Aceptación Globales (Golden Path)

1. Usuario abre la app en móvil
2. Otorga permiso de cámara; modelo carga
3. Captura foto de una lima
4. Clasificación en < 1 segundo
5. Toca resultado para ver ficha técnica
6. Detección se guarda en historial
7. Historial persiste tras cerrar navegador
8. Acceso al catálogo sin capturar
9. Búsqueda en catálogo funciona