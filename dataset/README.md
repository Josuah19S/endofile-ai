# Dataset: limas endodónticas

`limas-endodonticas.csv` contiene las especificaciones técnicas de limas rotatorias de
endodoncia, agrupadas por sistema y en el orden de secuencia en que se emplean.

- **Formato**: CSV, codificación UTF-8, separador `,`, primera fila de encabezados.
- **Registros**: 47 limas repartidas en 12 sistemas.
- **Campos vacíos**: una celda en blanco significa "no aplica / no disponible" para esa
  lima; no debe interpretarse como cero.

## Esquema

| Columna | Tipo | Unidad | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| `sistema` | texto | — | sí | Nombre del sistema o kit al que pertenece la lima. Actúa como clave de agrupación. |
| `numero` | entero | — | sí | Posición de la lima dentro de la secuencia de su sistema, empezando en 1. Es orden de uso, no orden de calibre. |
| `nombre` | texto | — | sí | Denominación comercial de la lima tal como aparece impresa/etiquetada. |
| `diametro_apical` | entero | centésimas de mm (ISO) | sí | Diámetro de la punta (D0). `25` equivale a 0,25 mm. |
| `longitud` | decimal | mm | sí | Longitud total de la lima en su presentación principal. |
| `longitud_alt1` | decimal | mm | no | Primera longitud alternativa disponible del mismo modelo. |
| `longitud_alt2` | decimal | mm | no | Segunda longitud alternativa disponible del mismo modelo. |
| `conicidad` | decimal | mm/mm | sí | Conicidad principal expresada como razón: `0.04` = 4 %. |
| `conicidad_alt` | decimal | mm/mm | no | Conicidad secundaria, para limas de conicidad variable o progresiva. |
| `velocidad_min` | entero | rpm | sí | Velocidad de rotación mínima recomendada. |
| `velocidad_max` | entero | rpm | sí | Velocidad de rotación máxima recomendada. Igual a `velocidad_min` cuando el fabricante indica una velocidad fija. |
| `torque` | texto | N·cm | sí | Torque recomendado. Normalmente numérico, pero admite rangos (`2-2.5`). |

Las tres columnas de longitud son excluyentes entre sí: describen las presentaciones en
que se comercializa **la misma** lima, no tramos de una sola pieza. No están ordenadas de
menor a mayor (p. ej. `Apical Shaper` registra 25 / 21 / 31 y `Micromega Remover`, 23 / 19).

## Sistemas incluidos

Las filas siguen el orden en que aparecen en el CSV.

| Sistema | Limas | Ø apical (ISO) | Longitudes (mm) | Conicidades | Velocidad (rpm) | Torque (N·cm) |
| --- | ---: | --- | --- | --- | --- | --- |
| Re-Treaty | 5 | 20–30 | 21, 25 | 0.04–0.07 | 350–500 | 1.5 |
| MG3-Blue | 5 | 15–25 | 19, 21.25 | 0.03–0.10 | 300–350 | 2 y 3 |
| S-BLUE | 4 | 17–35 | 19, 25, 31 | 0.04–0.10 | 425–500 | 2.5 |
| RC-BLUE | 3 | 25–50 | 21, 25, 31 | 0.05–0.08 | 250–350 | 3.5 |
| Super File III | 6 | 17–30 | 19, 21, 25, 31 | 0.02–0.09 | 150–300 | 2-2.5 |
| Apical Shaper | 4 | 30–50 | 21, 25, 31 | 0.03 | 150–350 | 2-2.5 |
| 3D Files | 3 | 25–30 | 25 | 0.02, 0.04 | 800 | 1 |
| Micromega Remover | 1 | 30 | 19, 23 | 0.07 | 400–800 | 2.5 |
| Rising | 5 | 13–30 | 19, 25 | 0.03–0.10 | 450 | 2.5 |
| Slim Shaper | 3 | 15–25 | 25 | 0.02, 0.04 | 300–500 | 3 |
| Micromega One Curve mini | 4 | 25–45 | 21, 25, 31 | 0.04, 0.06 | 300–450 | 2.5 |
| Blue Shaper | 4 | 15–25 | 19, 21.25 | 0.03–0.10 | 300–350 | 2 y 3 |

## Convenciones y particularidades

- **Nomenclatura heterogénea**: `nombre` sigue la convención de cada fabricante. Unos
  incorporan el calibre ISO (`BullY #25`, `G2X #25`), otros la conicidad (`N25 6%`), otros
  usan códigos en minúscula (`z30`, `f25`), en `Blue Shaper` son códigos correlativos que
  no expresan el calibre (`Z1`–`Z4`) y en `Rising` el nombre coincide con el número de
  calibre. Los datos normalizados están en `diametro_apical` y `conicidad`; `nombre` es
  únicamente una etiqueta.
- **`numero` no implica calibre creciente**: `MG3-Blue` arranca con `SV #20` y sigue con
  `PX #15`; `Rising` va 17 → 13 → 25 → 30 → 28; `Micromega One Curve mini` es directamente
  decreciente (45 → 35 → 25 → 25).
- **`nombre` no es único globalmente**: solo el par (`sistema`, `numero`) identifica una
  fila de forma inequívoca. Úsalo como clave primaria compuesta.
- **Velocidad fija**: `3D Files` (800 rpm) y `Rising` (450 rpm) repiten el mismo valor en
  `velocidad_min` y `velocidad_max`, es decir, no operan en rango sino a velocidad única.
  El resto de sistemas declara un intervalo.
- **`torque` no es numérico puro**: `Super File III` y `Apical Shaper` declaran el rango
  `2-2.5`. Al parsear la columna hay que contemplar ese formato.
- **Separador decimal**: punto. Se conservan ceros no significativos tal como fueron
  transcritos (`0.10` en `Rising` frente a `0.1` en `MG3-Blue`, `Blue Shaper` y `S-BLUE`);
  son el mismo valor.

## Incidencias conocidas

- `Micromega Remover` aporta una sola lima; no es una secuencia completa.
- Los valores proceden de las indicaciones de cada fabricante y no están validados
  clínicamente ni homogeneizados entre marcas.