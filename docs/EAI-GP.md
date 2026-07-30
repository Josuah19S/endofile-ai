# Endofile AI - Glosario del Proyecto

**Versión:** 1.0  
**Fecha:** 2026-07-29

---

## Términos de Limas Endodónticas

### Lima Endodóntica

Instrumento de metal (acero o níquel-titanio) para remover y modelar el sistema de conductos radiculares. Se clasifican por tamaño, conicidad y sistema de rotación.

---

### Diámetro Apical (ISO)

Diámetro de la punta de la lima, medido según ISO 3630.

**Rangos:** #10, #15, #20, #25, #30, #35, #40, #45, #50, #60, #70, #80

Cada incremento suma 0.05 mm.

---

### Conicidad (Taper)

Aumento progresivo del diámetro desde la punta hacia la corona. Expresada como porcentaje.

**Rangos:** 2%, 4%, 6%, 8% (estándar), 10%, 12%

Cada 1% de conicidad = 0.01 mm de aumento de diámetro por milímetro de longitud.

---

### Longitud de Lima

Distancia desde la punta de corte hasta el mango.

**Rango típico:** 21–31 mm

Un mismo diámetro ISO puede tener múltiples longitudes (21, 25, 28, 31 mm).

---

### Velocidad (RPM)

Revoluciones por minuto de rotación motorizada.

**Rangos:** 200–300 RPM (rotación continua) / 500–1000 RPM (sistemas reciprocantes)

---

### Torque (Ncm)

Fuerza de torsión aplicada a la lima en Newton-centímetros.

**Rangos:** 1.5–6 Ncm según tamaño de lima.

Torque mayor = mayor penetración pero riesgo de fractura si se supera el límite del sistema.

---

### Sistema de Lima

Conjunto normalizado de limas con especificaciones consistentes de un fabricante.

**Sistemas en este proyecto (10 total):**
- ProTaper — Rotativo continuo, perfil progresivo
- Hyflex — Níquel-titanio, movimiento recíproco
- RE-Treaty — Rotativo, torque controlado
- WaveOne — Lima única, reciprocante
- Reciproc — Limas reciprocantes individuales
- Protaper Next — Versión moderna de ProTaper
- OneShape — Lima única para conformación
- Twisted File — Espiral continua
- K3 — Sistema rotativo clásico
- Flexmaster — Tapers variables

**Total clasificable:** 38 limas de 10 sistemas.

---

### Blíster

Envase de plástico sellado que contiene 6 limas del mismo tamaño y longitud. Una lima suelta (fuera del blíster) es difícil de identificar sin consultar manuales. **Endofile AI resuelve este problema.**

---

## Términos Técnicos

### Modelo

Red neuronal entrenada para clasificar imágenes de limas.

**Especificaciones:**
- Arquitectura: **MobileNetV3-Small**
- Entrada: imagen 384×384 píxeles
- Salida: 38 probabilidades (una por lima)
- Tamaño: ~3.6 MiB

---

### Inferencia

Proceso de pasar una imagen por el modelo para obtener la predicción.

**En este proyecto:** < 1 segundo en GPU WebGL.

---

### Clasificación

Resultado final: identificador de la lima + probabilidad + especificaciones técnicas.

---

### TensorFlow.js

Framework JavaScript para ejecutar modelos ML en el navegador (sin servidor).

**Ventaja:** Inferencia local → imágenes nunca salen del dispositivo.

---

### IndexedDB

Base de datos nativa del navegador para almacenamiento local de datos y blobs (imágenes).

**En este proyecto:** Almacena las últimas 20 detecciones (identificador, probabilidad, timestamp, foto).

---

### Canvas API

API HTML5 para dibujar gráficos 2D.

**Uso:** Redimensionar y recortar imágenes capturadas a 384×384 píxeles antes de la inferencia.

---

### MediaDevices API

API nativa para acceder a cámara del dispositivo (`getUserMedia`).

**Requisito:** HTTPS en producción (solo localhost en desarrollo).

---

### Next.js

Framework de React con App Router integrado.

**Versión:** Next.js 16

---

### Softmax

Función matemática que convierte números brutos en probabilidades (0–1) que suman 1.

**En este proyecto:** Incluido en el modelo exportado. Salida = [prob_clase_0, prob_clase_1, ..., prob_clase_37].

---

### WebGL

Especificación de gráficos que acelera la inferencia en GPU.

**Fallback:** CPU si WebGL no disponible.

---

## Abreviaturas Comunes

| Sigla | Significado |
|---|---|
| **AI** | Artificial Intelligence (Inteligencia Artificial) |
| **CNN** | Convolutional Neural Network (Red neuronal convolucional) |
| **CSV** | Comma-Separated Values (formato de datos) |
| **DAS** | Documento de Arquitectura de Software |
| **DER** | Documento de Especificación de Requisitos |
| **GPU** | Graphics Processing Unit (procesador gráfico) |
| **HTTPS** | HTTP Secure (protocolo seguro) |
| **ISO** | International Organization for Standardization (estándar) |
| **JSON** | JavaScript Object Notation (formato de datos) |
| **ML** | Machine Learning (aprendizaje automático) |
| **Ncm** | Newton-centímetro (unidad de torque) |
| **RPM** | Revolutions Per Minute (revoluciones por minuto) |
| **TF.js** | TensorFlow.js (framework ML) |
| **UI** | User Interface (interfaz) |

---

## Identificador de Clase (classId)

Formato: `{sistema}_{número}-{variante}`

**Ejemplos:**
- `re-treaty_1-bully` → RE-Treaty tamaño 1
- `protaper_s2-red` → ProTaper S2
- `hyflex_sm-yellow` → Hyflex SM
