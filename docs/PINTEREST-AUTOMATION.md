# 📌 Pinterest Automation Guide

## Flujo Automatizado Completo

```
Scrape → Images → Pinterest Cards → Publish → Deploy
   ↓         ↓           ↓              ↓         ↓
daily    download    generate-      publish-   vercel
-scrape   -images    pinterest     pinterest    --prod
                      -cards         .ts
```

## Scripts Creados

| Script | Función | Ejecución |
|--------|---------|-----------|
| `generate-pinterest-cards.ts` | Genera tarjetas verticales (1000×1500) | `npx tsx scripts/generate-pinterest-cards.ts` |
| `publish-pinterest.ts` | Publica pins en Pinterest API | `npx tsx scripts/publish-pinterest.ts --limit 10` |
| `daily-scrape.ts` | Pipeline completo (incluye Pinterest) | `npx tsx scripts/daily-scrape.ts` |

## Configuración Requerida

### 1. Pinterest Developer App

1. Ve a https://developers.pinterest.com/apps/
2. Crea una nueva aplicación
3. Obtén el **Access Token** (OAuth 2.0)
4. Configura las variables de entorno:

```bash
# En .env.local (para desarrollo local)
PINTEREST_ACCESS_TOKEN=tu_token_aquí
PINTEREST_BOARD_ID=tu_board_id_aquí

# En Vercel (para producción)
# Settings → Environment Variables
```

### 2. Obtener el Board ID

1. Ve a tu tablero de Pinterest
2. Copia el ID de la URL de la API o usa:
   ```bash
   curl -H "Authorization: Bearer TU_TOKEN" \
     "https://api.pinterest.com/v5/boards?bookmark="
   ```

## Uso Manual

```bash
# Generar tarjetas para todas las recetas
npx tsx scripts/generate-pinterest-cards.ts

# Publicar pins (dry run primero)
npx tsx scripts/publish-pinterest.ts --limit 5 --dry-run

# Publicar pins reales
npx tsx scripts/publish-pinterest.ts --limit 5

# Pipeline completo
npx tsx scripts/daily-scrape.ts
```

## Estrategia de Publicación

- **Primeras 3 semanas:** 5-8 pins diarios
- **Horario óptimo:** 20:00-22:00 hora España
- **Límite diario:** 8 pins (para evitar spam)
- **Espera entre pins:** 1 segundo (rate limiting)

## Monitoreo

- **Pinterest Analytics:** https://analytics.pinterest.com/
- **Pins publicados:** `data/pinterest-published.json`
- **Tarjetas generadas:** `public/images/pinterest/`

## Próximos Pasos

1. ✅ Cuenta Pinterest Business creada
2. ✅ Dominio verificado (meta tag añadido)
3. ⏳ Obtener Access Token de Pinterest API
4. ⏳ Configurar Board ID
5. ⏳ Ejecutar primer `publish-pinterest.ts --dry-run`
6. ⏳ Ejecutar publicación real

---

**Última actualización:** 11 de agosto de 2026
