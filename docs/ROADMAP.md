# ROADMAP — recetasmambo.com

> Auditoría 2026-11-16. Todo lo detectado, por orden de prioridad de ejecución.
> Cada item se cierra con su comprobación de verificación. Regla de oro: **NO tocar el cron diario** (funciona, 3/3 verde) y **todo dato que se publique va verificado**.

## Estado actual (resumen de la auditoría)

**Sano:**
- Sitio en vivo ✅ (home 200, sitemap 652 URLs, robots OK)
- Contenido real y diferencial: los pasos convertidos a Mambo con parámetros por paso (accesorio, velocidad, temperatura, tiempo, notas de conversión) — poca competencia puede replicarlo
- Schema `Recipe` en las páginas de receta ✅
- Pipeline diario funcionando (661 recetas en `data/recipes.json`)

**Roto / pendiente:**
- `www.recetasmambo.com` con certificado TLS inválido (error de seguridad para el visitante)
- 661/661 descripciones son la MISMA plantilla ("Receta de X adaptada de Thermomix…")
- Sin canonical en las páginas de receta
- 45 recetas finas (<3 pasos o ingredientes cortos)
- 4 grupos de imágenes duplicadas (fallbacks de categoría)
- `AffiliateProducts` con precios hardcodeados y enlaces de búsqueda (tag biohackdose-21)
- Sitemaps de 2021 (WordPress) con error en GSC; URLs legacy sin redirect
- Deploy de Vercel por git falla en silencio (requiere deploy manual)

---

## P0 — Visibilidad y acceso (bloquea todo lo demás)

### ✅ 0.1 GSC verificado + sitemap real enviado (HECHO 16/11/2026)
DOS propiedades verificadas con la cuenta ziarresamot: `https://recetasmambo.com/` (archivo HTML `googleb7bd36c9b3269236.html` — NO eliminar) y la de **dominio completo** `sc-domain:recetasmambo.com` (registro TXT DNS en Namecheap — NO quitar; cubre www y todos los subdominios). `/sitemap.xml` enviado en ambas. Antes solo había 3 sitemaps rotos de 2021.
- **Verificación:** GSC → Sitemaps muestra `/sitemap.xml` procesándose sin error.

### ✅ 0.2 Arreglar www (cert TLS roto) — HECHO 16/11/2026
`www.recetasmambo.com` presentaba certificado solo para el dominio sin www → error de seguridad para el visitante. Diagnóstico: el DNS ya estaba bien (Namecheap: `@` A → 76.76.21.21, `www` CNAME → cname.vercel-dns.com) — faltaba emitir el certificado de www en Vercel (`vercel certs issue www.recetasmambo.com`). Verificado en vivo: TLS estricto OK, SAN `www.recetasmambo.com`, redirect 307 → apex.
- **Verificación (cumplida):** `https://www.recetasmambo.com/` redirige (307) a `https://recetasmambo.com/` sin error de certificado.

### ✅ 0.3 Canonical en páginas de receta — HECHO 16/11/2026
Añadido `alternates.canonical` self-referencing en `generateMetadata` de `src/app/recetas/[slug]/page.tsx` (commit 6258182, deploy manual + probe en vivo OK).
- **Verificación (cumplida):** el HTML de una receta contiene canonical con su propia URL.

---

## P1 — Contenido (decide si Google posiciona)

### ✅ 1.1 Descripciones únicas por receta (661/661) — HECHO 16/11/2026
Descripciones generadas SOLO con datos reales de cada receta (categoría, comensales, tiempo, ingredientes principales, nº de pasos) — cero afirmaciones inventadas. El generador (`generarDescripcion` en `src/lib/convert.ts`) repara además la fuente (el motor de conversión del cron diario). De paso se corrigió el clasificador de categorías (`crema`/`hojaldre` clasificaban sopas y hojaldres salados como postres — 72 recetas reclasificadas). Guard `check-content.mjs` encadenado a `npm run lint` (detecta plantillas, duplicados, descripciones cortas).
- **Verificación (cumplida):** guard en verde (661 descripciones únicas, 0 plantillas) + muestra en producción (meta description nueva + categoría corregida).

### ✅ 1.5 Revisar 72 recetas con tiempos sospechosos (<5 min) — HECHO 16/11/2026
Las 72 se contrastaron contra `fuente_url` con `fix-times.ts` (dry-run primero, luego escritura): **8 tenían el tiempo mal** — peor caso `spinacini-nuggets-de-pollo-y-espinacas` 1 min → real 30 min (también quesadillas 1→20, granizado 3→10) — corregidas con descripciones regeneradas. **64 son rápidas de verdad** (zumos, batidos, cremas frías, salsas): la fuente confirma PT00H01M–PT00H04M. De paso se sincronizaron casos donde el dato guardado no coincidía con la fuente (p. ej. guacamole 2→3). El aviso del guard (<5 min) queda como recordatorio permanente de revisión: las 64 restantes están verificadas contra fuente.
- **Verificación (cumplida):** 72/72 contrastadas con la fuente, 0 fallos, muestra en producción (30/20/10 min visibles).

### 🆕 1.6 Revisar categorías ambiguas (~casos puntuales)
Clasificación correcta en general tras la corrección de 1.1, pero nombres ambiguos siguen en categorías equivocadas ("Pastel de atún" → postres, "Sopa fría de melón" → bebidas). Revisión manual puntual de los casos que el clasificador no puede decidir por palabras.
- **Verificación:** muestra manual de 20 nombres de receta coherentes con su categoría.

### ✅ 1.2 Las recetas "finas" — REVISADO 16/11/2026 (sin acción de contenido)
Las 45 recetas con ≤2 pasos se auditaron contra sus fuentes (`fuente_url`): las 18 con perfil sospechoso (8-12 ingredientes, 2 pasos) se re-scrapearon y **las fuentes confirman que son de 2 pasos de verdad** — cero contenido perdido en la conversión. No son contenido fino de Google: son recetas legítimamente simples (batidos, salsas, cremas). **No se enriquece ni se retira nada.** Lo real que quedó de esta revisión va en 1.5 (tiempos) y 1.6 (categorías ambiguas).

### ✅ 1.3 Imágenes duplicadas y hotlinking — HECHO 16/11/2026
El problema real era mayor que el audit inicial (4 grupos): **~540 recetas hacían hotlinking** a los blogs de origen (solo 112 imágenes eran locales) + 13 recetas compartiendo 7 fotos + 3 usaban banners de categoría. Recuperador `fix-recipe-images.ts` localizó 560 imágenes remotas desde las fuentes (portada + cuerpo del artículo, hash-único, rate-limit 400ms) y `_fix-image-stragglers.mjs` resolvió las 4 restantes (imágenes lazy-load en .webp que el primer lote no veía). De paso se encontró y corrigió una **colisión de slugs** (2 pares de recetas con título idéntico compartían slug — una de cada par era invisible): renombradas a `-2` (coincide con su URL fuente) y `scrape-bulk.ts` ahora garantiza unicidad. Guard `check-content.mjs` ampliado: imágenes hash-únicas, sin banners de categoría, slugs únicos, imágenes seed en uso.
- **Verificación (cumplida):** guard en verde (0 violaciones) + sondeo en vivo (4 páginas 200, 4 imágenes nuevas sirviendo, hotlink eliminado).

### ✅ 1.4 Revisar `AffiliateProducts` — HECHO 16/11/2026
Campos fabricados retirados del componente (precio/precioNum/sku/InStock — 729 caracteres de datos inventados); JSON-LD queda solo con name/description/url reales. Sin precios fijados en código.
- **Pendiente (humano):** decidir si el tag `biohackdose-21` compartido con biohackdose es intencionado.

---

## P2 — Higiene técnica

### 2.1 Limpiar sitemaps de 2021 en GSC
`/sitemap_index.xml`, `/page-sitemap.xml`, `/post-sitemap.xml` (restos del WordPress, todos con error) → quitarlos del panel para que el informe sea legible.

### 2.2 Redirects de URLs legacy (WordPress)
`next.config.ts` no tiene redirects. Con los datos de GSC (en cuanto lleguen) se listan las URLs antiguas que aparezcan y se redirige 301 a su equivalente actual (o a la home si no existe).
- **Verificación:** ninguna URL legacy devuelva 404.

### 2.3 Deploy fiable (regla operativa + probe)
El git-integration de Vercel falla en silencio en este proyecto. **Regla: todo push se despliega con `npx vercel --prod --yes` y se verifica en vivo**. Añadir `scripts/check-live.mjs` (como el de biohackdose) para comprobar URLs tras cada despliegue.
- **Verificación:** `npm run check:live` en verde tras el despliegue.

---

## P3 — Crecimiento (solo con datos de GSC)

### 3.1 Nuevas recetas SOLO por demanda real
Cuando GSC tenga datos (~2 semanas): publicar recetas que la gente busque, no catálogo. Misma regla que biohackdose: sin demanda → sin página.

### 3.2 Enlazado interno por categorías
267 recetas de postres, 66 de sopas, etc. → páginas de categoría fuertes que enlzan a sus recetas y viceversa (autoridad concentrada).

### 3.3 Medición semanal
GSC por query/página cada semana: posiciones, impresiones, clics. Lo que se mueve se refuerza; lo que no, se revisa o se retira.

---

## Reglas permanentes
1. **El cron diario NO se toca.**
2. **Todo dato publicado va verificado** (nada de precios, valoraciones ni afirmaciones inventadas).
3. Cada item se marca como hecho solo tras su **verificación** en vivo.
