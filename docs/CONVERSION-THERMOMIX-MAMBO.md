# Conversión Thermomix → Cecotec Mambo Cooking Total Gourmet

Tabla de equivalencias del motor de conversión (`src/lib/convert.ts`, fuente única de verdad).
Cada fila indica si la equivalencia está **VERIFICADA** contra fuentes oficiales o es
**NO VERIFICADA** (aproximación conservadora documentada; el motor la marca con
`confianza: "media"` y una nota en `notas_conversion`).

> Regla del proyecto: **nunca se inventan datos**. Lo que no se puede convertir con
> garantías se marca con `sin_convertir: true` / `confianza: "baja"` y se revisa a mano.

## Fuentes (consultadas el 2026-11-08)

1. **Manual de usuario oficial Cecotec — «MAMBO COOKING VICTORY / UNIQUE / TOTAL GOURMET»**
   (referencias 04700 / 04701 / 04702; el Total Gourmet incluye las jarras Victory XL y Unique XL).
   PDF oficial: <https://cdn.cecotec.cloud/media/files/mambo-cooking-total-gourmet_user_manual.pdf>
   — secciones citadas: panel de control (pp. 61-64), modos preestablecidos (p. 65),
   «Velocidad y capacidad para cada accesorio» (pp. 66-68), funciones y recomendaciones (pp. 56-58),
   especificaciones técnicas (pp. 72-73). Texto extraído y verificado en todos los bloques de idioma.
2. **Generación anterior «Mambo 8590 / Mambo Cooking Total Gourmet»** (ca. 2021):
   ficha de distribuidor (Fnac, consultada 2026-11-08): 10 velocidades + Turbo + velocidad 0,
   temperatura 37-120 °C, vaso 3,3 L, 1700 W. **NO VERIFICADO** (no se localizó manual oficial de
   esta generación; solo especificaciones de tienda). Todas las equivalencias del motor se limitan
   al rango seguro común de ambas generaciones (velocidades 0-10, temperaturas ≤ 120 °C) salvo
   indicación expresa.

## Especificaciones verificadas de la Mambo (manual oficial)

| Parámetro | Valor documentado | Fuente |
|---|---|---|
| Escala de velocidad | 0-10 (jarra Unique XL) · 0-15 (jarra Victory XL) | manual p. 63 |
| Turbo | Máximo **5 segundos** por pulsación y **solo con cuchillas** | manual p. 65 |
| Rango de temperatura | **37-180 °C** | manual p. 64 (todos los idiomas) |
| Potencia calorífica | Niveles 1-15 (Unique XL) · 0-10 (Victory XL). No funciona sin seleccionar temperatura; el manual recomienda la configuración por defecto para cada temperatura | manual p. 64 |
| Límites de tiempo (sin temporizador) | Calentar sin batir: máx. 12 h · Velocidad 1-7: máx. 1 h · Velocidad 8-15: máx. 5 min | manual p. 63 |
| Capacidad | Total 4,5 L · útil 3,2 L | manual pp. 72-73 |
| Vocabulario del manual | «jarra» (no «vaso»), «Cuchara MamboMix», «Mariposa», «Vaporera de dos niveles», «Cestillo de hervir», «Espátula», «Vaso medidor» | manual pp. 47, 66-68 |

### Velocidad máxima por accesorio (manual pp. 66-68)

| Accesorio | Uso documentado | Velocidad máx. |
|---|---|---|
| Cuchillas / Cuchillas S | Cortar, triturar | 15 (Victory) / 10 (Unique) |
| Cuchara MamboMix | Amasar masa (pan, pizza…), remover (SlowMambo) | 3 (máx. 2000 g de masa en Victory / 2500 g en Unique) |
| Mariposa | Mezclar, batir claras o nata | 4 |
| Sauté Blade (Unique) | Mezclar, remover | 3 |
| Double Wisk (Unique) | Batir claras y nata | 4 |
| Cestillo de hervir | Cocinar al vapor dentro de la jarra | 3 |
| Vaporera de dos niveles | Cocinar al vapor | sin velocidad |
| Espátula | Remover/limpiar (accesorio incluido) | manual |

Advertencias del manual: no usar la Cuchara MamboMix y el cestillo a la vez (p. 68);
no usar la Mariposa a la vez que la espátula ni por encima de velocidad 4 (p. 55).

### Funciones con cifras oficiales (manual pp. 56-58)

| Función | Programa documentado |
|---|---|
| Hervir | 120 °C, potencia calorífica 10 |
| Baño María | Jarra con 2 L de agua, sin velocidad, 120 °C, potencia 10 (bajar a 9 al hervir) |
| Mantener caliente | 45 °C (sólidos) · 60 °C (con líquido) |
| Fermentar | 50 °C, velocidad 0 |
| Recalentar | 87 °C, potencia calorífica 7 |
| Rallar | Velocidad 10 durante pocos segundos (ingredientes ≤ mitad de la jarra) |
| Montar (claras/nata) | Con la Mariposa |
| Amasar | Con la Cuchara MamboMix (no corta la masa) |
| SlowMambo | Cuchara MamboMix; remueve «como si se hiciera con una cuchara» |
| Velocidad cero | Cocinar sin movimiento (jarra destapada, remover a mano) |

## Equivalencias Thermomix → Mambo aplicadas por el motor

| Thermomix | Mambo | Estado | Notas |
|---|---|---|---|
| Velocidad 0-10 | Velocidad 0-10 (misma escala) | VERIFICADO | Ambas escalas comparten 0-10; la jarra Victory XL llega a 15 pero no se usa. |
| Turbo | Turbo (≤ 5 s por pulsación, solo cuchillas) | VERIFICADO | Si el paso pide más de 5 s se marca `confianza: "media"` con nota «repetir en pulsos». |
| Temperaturas 37-120 °C | Mismo valor | VERIFICADO | Dentro del rango 37-180 °C de la Mambo y del 37-120 °C de la generación anterior. |
| «sin temperatura» | Sin calor (sin temperatura ni potencia) | VERIFICADO | `temperatura_c: null`, nota «Sin calor». |
| «a temperatura ambiente» | Sin calor (se refiere al ingrediente) | VERIFICADO | No se lee como programación de temperatura. |
| Potencia calorífica (sin equivalente en Thermomix) | `potencia_calorifica: null` (configuración por defecto) | VERIFICADO | El manual recomienda la configuración por defecto para cada temperatura; no se inventa ningún nivel. |
| «temperatura Varoma» (≈ 115 °C) | 120 °C + Vaporera de dos niveles | PARCIAL | 120 °C es la temperatura de hervor/vapor de referencia del manual; la etiqueta «Varoma» no existe en Mambo (**NO VERIFICADA** la equivalencia exacta). |
| «velocidad Varoma» | Velocidad 1 | NO VERIFICADO | Sin equivalente oficial; propuesta conservadora dentro del límite del cestillo (3) y marcada `confianza: "media"`. |
| «velocidad cuchara» | Cuchara MamboMix, velocidad 1 | NO VERIFICADO | Equivalencia funcional (remover sin cortar, SlowMambo) verificada; la cifra «1» es conservadora (el accesorio admite hasta 3) y no procede de ninguna tabla oficial. |
| «modo espiga» / «velocidad espiga» | Cuchara MamboMix, velocidad 3 | NO VERIFICADO | 3 es el máximo documentado para amasar con Cuchara MamboMix; no hay tabla oficial de equivalencias de velocidades. |
| «giro a la izquierda» / giro inverso | Cuchara MamboMix (función SlowMambo) | PARCIAL | Accesorio y función SlowMambo verificados; el manual de esta generación **no documenta** un «giro a la izquierda» como tal (**NO VERIFICADO** el giro inverso). |
| Mariposa | Mariposa (máx. velocidad 4) | VERIFICADO | «Montar: … gracias a su mariposa». |
| «espátula» (raspar) | Espátula | VERIFICADO | Accesorio incluido en la caja. |
| «con la espátula colocada/puesta» (accesorio de remover de Thermomix) | Cuchara MamboMix | NO VERIFICADO | En Mambo el accesorio de remover es la Cuchara MamboMix. |
| «velocidad progresiva 5-7-9» | Rampa manual 5 → 7 → 9 | VERIFICADO (limitación) | La Mambo no tiene velocidad progresiva programable (no figura en el manual); el texto indica el ajuste manual y se guarda `velocidad_progresiva: [5, 7, 9]`. |
| Medias velocidades («3 1/2», «1/2») | Entero más cercano (4, 1) | NO VERIFICADO | La Mambo solo admite velocidades enteras; se redondea al entero más cercano y se marca `confianza: "media"` conservando el valor original en la nota. |
| Varoma (recipiente) / cocinar al vapor | Vaporera de dos niveles · Cestillo de hervir (máx. vel. 3) | VERIFICADO | Accesorios y límites del manual. |
| «precalentamos el horno…», «horneamos…» | Paso de horno (`tipo_paso: "horno"`), sin parámetros de robot | VERIFICADO | El horno no es la Mambo: `velocidad: null`, `temperatura_c: null`; la temperatura del horno queda en la nota y el tiempo sí cuenta en el total. |
| Tiempos: segundos / minutos / horas / rangos | Minutos (decimales para segundos), `tiempo_minutos` + `tiempo_max_minutos` en rangos | VERIFICADO | «20 segundos» → 0,33 min; «2-3 minutos» → 2-3 min. |
| Límites de tiempo por velocidad | Se respetan y se avisa | VERIFICADO | Velocidad 8+ más de 5 min o velocidades 1-7 más de 1 h → `confianza: "baja"` + nota (nunca se recorta el tiempo en silencio). |

## Metadatos de calidad por paso

| Campo | Valores | Significado |
|---|---|---|
| `confianza` | `alta` | Todo lo programable aparece explícito en el texto y se mapea 1:1. |
| | `media` | Hay alguna aproximación documentada (redondeo de medias velocidades, equivalencias NO VERIFICADAS, accesorio inferido de la acción, rampas manuales). |
| | `baja` | Algo no se ha podido convertir o se sale de los límites documentados. Requiere revisión humana. |
| `sin_convertir` | `true` | El parser no pudo extraer parámetros que el texto prometía (p. ej. «batimos» sin tiempo/velocidad). Implica `confianza: "baja"`. |
| `tipo_paso` | `robot` / `horno` / `manual` | Dónde se ejecuta el paso. |
| `velocidad_progresiva` | `[5, 7, 9]` | Rampa de velocidad no programable; se conserva íntegra. |
| `notas_conversion` | texto | Motivo de cada aproximación, avisos de límites y acciones manuales. |

## Reglas de texto (es-ES)

El texto de los pasos se reescribe con el vocabulario del manual de la Mambo:
`vaso` → `jarra`, `Varoma` → `Vaporera de dos niveles`, `velocidad cuchara` → `Cuchara MamboMix, velocidad 1`,
`giro a la izquierda` → `con la Cuchara MamboMix (función SlowMambo)`, `bocal` → `abertura de la tapa`,
`sin temperatura` → `sin calor`, `180º` → `180 °C`. Se eliminan entidades HTML
(`&amp;#8230;` → `…`) y se repara el mojibake UTF-8/Latin-1 (`DifÃ­cil` → `Difícil`).

La reescritura es **idempotente**: volver a convertir un paso ya convertido conserva los
mismos parámetros de máquina (cubierto por tests).

## Cálculo del tiempo total

`tiempo_total_min` = suma de los tiempos reales de todos los pasos (robot + horno + manuales
con tiempo indicado), redondeada a minutos enteros. Los rangos aportan su límite superior.
Los pasos sin tiempo declarado **no** aportan minutos inventados.
