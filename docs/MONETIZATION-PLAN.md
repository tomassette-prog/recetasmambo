# 📈 Plan de Monetización — Recetas Mambo

## ✅ Implementado Técnicamente

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Pinterest Share** | ✅ Listo | Botón flotante en cada receta con preview de la tarjeta |
| **Rich Pins** | ✅ Listo | Metadatos Open Graph y JSON-LD para Pinterest |
| **Google Analytics** | ✅ Listo | Componente preparado (necesita ID) |
| **Amazon Afiliados** | ✅ Listo | 3 productos con tag `biohackdose-21` |
| **Schema.org Products** | ✅ Listo | JSON-LD para rich snippets en Google |
| **Newsletter** | ✅ Listo | Captura de emails funcional |
| **Tarjetas Pinterest** | ✅ Listo | 96 tarjetas generadas (1000×1500px) |

---

## 🔧 Cuentas que Necesitas Crear

### 1. **Pinterest Business** (GRATIS — Prioridad ALTA)

**Por qué:** Tráfico inmediato. Las recetas son el contenido #1 en Pinterest.

**Pasos:**
1. Ve a [business.pinterest.com](https://business.pinterest.com/)
2. Crea cuenta Business (no personal)
3. **Verifica tu dominio:**
   - Ve a Configuración > Dominios > Añadir dominio
   - Elige "Añadir etiqueta HTML"
   - Yo necesito esa etiqueta para añadirla al `<head>` de tu web
4. **Activa Rich Pins:**
   - Ve a [developers.pinterest.com/tools/url-debugger/](https://developers.pinterest.com/tools/url-debugger/)
   - Pega una URL de receta: `https://recetasmambo.com/recetas/arroz-con-leche-mambo`
   - Haz clic en "Validate"
   - Si aparece "Rich Pin enabled", ¡listo! (ya tienes los metadatos)

**Estrategia de publicación:**
- Publica 5-8 pins diarios durante las primeras 3 semanas
- Horario óptimo: 20:00-22:00 hora España
- Usa las 96 tarjetas generadas en `public/images/pinterest/`
- Programa con [Tailwind](https://www.tailwindapp.com/) o [Buffer](https://buffer.com/) (ambos tienen plan gratuito)

---

### 2. **Google Analytics** (GRATIS — Prioridad ALTA)

**Por qué:** Necesitas datos para optimizar y demostrar tráfico a anunciantes.

**Pasos:**
1. Ve a [analytics.google.com](https://analytics.google.com/)
2. Crea una propiedad > Web
3. Copia tu **Measurement ID** (empieza por `G-`)
4. Añádelo como variable de entorno:
   - En Vercel: Settings > Environment Variables > `NEXT_PUBLIC_GA_ID` = `G-XXXXXXXXXX`
   - En local: crea `.env.local` con `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`

**Métricas clave a monitorizar:**
- Sesiones por día
- Páginas más visitadas
- Fuentes de tráfico (Pinterest, orgánico, directo)
- Tasa de rebote

---

### 3. **Amazon Afiliados** (GRATIS — Prioridad MEDIA)

**Ya lo tienes configurado** con el tag `biohackdose-21`.

**Optimización:**
- Añade más productos relevantes por categoría:
  - Sopas: cucharas medidoras, cuencos
  - Postres: moldes, espátulas
  - Arroces: paelleras, cucharones
- Cada receta debería mostrar productos **relacionados con su categoría**

---

### 4. **Mediavine** (Prioridad MEDIA — para cuando tengas 50k+ sesiones/mes)

**Por qué:** El mejor RPM (ingreso por 1000 visitas) para sitios de recetas en español.

**Requisitos:**
- 50,000 sesiones/mes (aprox. 150k pageviews)
- Contenido original (tus recetas adaptadas cuentan)
- Tráfico mayoritariamente de EE.UU./Europa

**Alternativas si no llegas a 50k:**
- **Google AdSense** — sin mínimo de tráfico, pero RPM bajo (~2-5€)
- **Ezoic** — mínimo 10k visitas/mes, mejor RPM que AdSense

---

### 5. **ConvertKit / Mailchimp** (GRATIS hasta 1000 suscriptores)

**Ya tienes el componente Newsletter.** Solo necesitas conectarlo a un proveedor de email.

**Pasos:**
1. Crea cuenta en [ConvertKit](https://convertkit.com/) (mejor para creators) o [Mailchimp](https://mailchimp.com/)
2. Crea un formulario
3. Obtén la API key
4. Actualiza `src/app/api/newsletter/route.ts` para enviar a tu proveedor

**Monetización del email:**
- Semanal: receta destacada + productos afiliados
- Mensual: ofertas exclusivas de accesorios
- Trimestral: eBook de recetas (producto digital propio)

---

## 📊 Funnel de Monetización Completo

```
Pinterest Pin → recetasmambo.com/recetas/[slug]
                    ↓
         ┌─────────┼─────────┐
         ↓         ↓         ↓
    Afiliados   Newsletter   Ads
    (Amazon)    (ConvertKit) (Mediavine)
```

**Ingresos estimados (con 50k sesiones/mes):**
- Amazon Afiliados: 200-500€/mes
- Display Ads: 300-800€/mes
- Newsletter sponsors: 100-300€/mes
- **Total potencial: 600-1.600€/mes**

---

## 🚀 Acciones Inmediatas (Esta Semana)

1. **HOY:** Crear Pinterest Business y verificar dominio
2. **MAÑANA:** Crear Google Analytics y configurar ID
3. **SEMANA 1:** Publicar los primeros 30 pins en Pinterest
4. **SEMANA 2:** Revisar Analytics y ajustar estrategia
5. **MES 1:** Evaluar Mediavine si llegas a 50k sesiones

---

## 📝 Notas Técnicas

- Las tarjetas Pinterest están en `public/images/pinterest/`
- El script de generación está en `scripts/generate-pinterest-cards.ts`
- Para regenerar: `npx tsx scripts/generate-pinterest-cards.ts`
- Los metadatos Rich Pins se activan automáticamente con Open Graph

---

**Última actualización:** 11 de agosto de 2026
