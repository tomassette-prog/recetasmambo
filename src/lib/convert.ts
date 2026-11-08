/**
 * Thermomix → Cecotec Mambo Cooking Total Gourmet conversion engine.
 *
 * SINGLE SOURCE OF TRUTH for every conversion rule. Scripts (scrape-bulk,
 * fix-recipes) and the API route must import from here instead of duplicating
 * logic. Mapping rationale and sources live in
 * docs/CONVERSION-THERMOMIX-MAMBO.md (official Mambo user manual).
 *
 * Principles:
 * - Never invent parameters. Anything not stated in the source text stays null
 *   and the step is flagged (`sin_convertir`, `confianza`).
 * - Mambo limits come from the official manual; violations are flagged, never
 *   silently clamped.
 * - Output step text is native Mambo Spanish (es-ES) using the manual's own
 *   vocabulary (jarra, Cuchara MamboMix, Mariposa, Vaporera de dos niveles…).
 */

import type {
  AccesorioMambo,
  ConfianzaConversion,
  MamboStep,
  Recipe,
  TipoPasoMambo,
} from "./types";

export type { MamboStep } from "./types";

export const MODELO_DESTINO = "Mambo Cooking Total Gourmet";

/** Verified Mambo limits (official user manual, see docs/CONVERSION-THERMOMIX-MAMBO.md). */
export const LIMITES_MAMBO = {
  /** Common speed scale valid on every jar/generation (Unique XL: 0-10, Victory XL: 0-15). */
  velocidadMax: 10,
  /** Max speed per accessory (manual "Velocidad y capacidad para cada accesorio").
   *  "Vaporera" and "Ninguno" have no accessory-specific limit in the manual (the
   *  steamer sits on top of the jar), so only the common 0-10 scale applies. */
  velocidadMaxPorAccesorio: {
    Cuchillas: 10,
    "Cuchara MamboMix": 3,
    Mariposa: 4,
    Vaporera: 10,
    "Cestillo de hervir": 3,
    Ninguno: 10,
    "Pala MamboMix": 3,
  } as Record<AccesorioMambo, number>,
  temperaturaMinC: 37,
  temperaturaMaxC: 180,
  /** Temperatures above this are verified only for the current Mambo CooKing generation. */
  temperaturaMaxGeneracionAnteriorC: 120,
  /** Turbo: 5 s max per pulse, only with blades (manual, "Modo preestablecidos"). */
  turboSegundosMax: 5,
  /** Continuous run without timer (manual, "Velocidad"): */
  minutosVelocidadAlta: 5, // speeds 8+
  minutosVelocidadBaja: 60, // speeds 1-7
  velocidadAltaDesde: 8,
} as const;

export type MamboRecipe = {
  titulo: string;
  modelo_destino: string;
  ingredientes: string[];
  pasos_mambo: MamboStep[];
  /** Sum of real step times (robot + oven + manual), rounded to whole minutes. */
  tiempo_total_min: number;
};

export type ScrapedRecipe = {
  title: string;
  ingredients: string[];
  servings?: string;
  time?: string;
  instructions: string[];
  image?: string;
};

// ---------------------------------------------------------------------------
// Text cleaning: HTML entities + mojibake (UTF-8 read as Latin-1)
// ---------------------------------------------------------------------------

const ENTIDADES_HTML: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  iexcl: "¡",
  iquest: "¿",
  laquo: "«",
  raquo: "»",
  ldquo: "\u201c",
  rdquo: "\u201d",
  lsquo: "\u2018",
  rsquo: "\u2019",
  deg: "°",
  ordm: "º",
  ordf: "ª",
  copy: "©",
  middot: "·",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  uuml: "ü",
  ouml: "ö",
  auml: "ä",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
};

export function decodeEntities(text: string): string {
  let out = text;
  let prev: string | null = null;
  // Repeat: sources contain double-encoded entities such as `&amp;#8230;`.
  for (let i = 0; i < 3 && out !== prev; i++) {
    prev = out;
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
      if (body.startsWith("#")) {
        const code =
          body[1]?.toLowerCase() === "x"
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
      }
      return ENTIDADES_HTML[body] ?? ENTIDADES_HTML[body.toLowerCase()] ?? match;
    });
  }
  return out;
}

function looksLikeMojibake(text: string): boolean {
  // "Ã¡", "Â±", "â€", "ðŸ" are impossible sequences in correctly decoded Spanish.
  return /\u00c2[\u0080-\u00bf]|\u00c3[\u0080-\u00ff]|â€|ðŸ/.test(text);
}

export function fixMojibake(text: string): string {
  if (!looksLikeMojibake(text)) return text;
  try {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code > 0xff) return text; // mixed with real Unicode: leave untouched
      bytes[i] = code;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return text;
  }
}

export function cleanText(raw: string): string {
  let s = raw ?? "";
  s = fixMojibake(s);
  s = decodeEntities(s);
  s = s.replace(/\[url[^\]]*\][\s\S]*?\[\/url\]/gi, "");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([,.;!?])/g, "$1");
  // "bizcocho:Precalentamos" → "bizcocho: Precalentamos" (only before capitals)
  s = s.replace(/([a-záéíóúñ])(:)(?=[A-ZÁÉÍÓÚÑ])/g, "$1$2 ");
  return s.trim();
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function toLower(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function num(value: string): number {
  return Number(value.replace(",", "."));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function nearestInt(value: number): number {
  return Math.round(value);
}

// ── Time ───────────────────────────────────────────────────────────────────

export type ParsedTime = {
  minutos: number | null;
  maxMinutos: number | null;
  aproximado: boolean;
  sinParsear: boolean;
};

const RE_RANGO_TIEMPO =
  /\b(?:entre\s+)?(\d+(?:[.,]\d+)?)\s*(?:-|–|—|a|y)\s*(\d+(?:[.,]\d+)?)\s*(minutos?|mins?|m|segundos?|segs?|s|horas?|h)\b/i;

const RE_TIEMPO_UNIDAD =
  /\b(\d+(?:[.,]\d+)?)\s*(horas?|h|minutos?|mins?|m|segundos?|segs?|s)\b/gi;

function unitToMinutes(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("h")) return value * 60;
  if (u.startsWith("m")) return value;
  return value / 60;
}

/** Parses "20 segundos", "4 minutos", "1 h 30 min", "2-3 minutos", "media hora", ISO-8601… */
export function parseDurationToMinutes(text: string | undefined | null): number | null {
  const parsed = parseStepTime(text);
  return parsed.minutos;
}

export function parseStepTime(text: string | undefined | null): ParsedTime {
  const empty: ParsedTime = {
    minutos: null,
    maxMinutos: null,
    aproximado: false,
    sinParsear: false,
  };
  if (!text) return empty;
  const t = toLower(text);

  // ISO-8601 durations (PT1H30M) at recipe level
  const iso = /^pt(?:(\d+(?:[.,]\d+)?)h)?(?:(\d+(?:[.,]\d+)?)m)?(?:(\d+(?:[.,]\d+)?)s)?$/i.exec(
    t.trim()
  );
  if (iso && (iso[1] || iso[2] || iso[3])) {
    return {
      minutos: round2(num(iso[1] ?? "0") * 60 + num(iso[2] ?? "0") + num(iso[3] ?? "0") / 60),
      maxMinutos: null,
      aproximado: false,
      sinParsear: false,
    };
  }

  // "media hora", "un cuarto de hora", "minuto y medio"
  if (/\bmedia\s+hora\b/.test(t)) {
    return { minutos: 30, maxMinutos: null, aproximado: true, sinParsear: false };
  }
  if (/\b(?:un\s+cuarto|1\/4)\s+de\s+hora\b/.test(t)) {
    return { minutos: 15, maxMinutos: null, aproximado: true, sinParsear: false };
  }
  if (/\bminuto\s+y\s+medio\b/.test(t)) {
    return { minutos: 1.5, maxMinutos: null, aproximado: true, sinParsear: false };
  }

  // Ranges: "2-3 minutos", "de 2 a 3 minutos", "entre 20 y 25 minutos"
  const rango = RE_RANGO_TIEMPO.exec(t);
  if (rango) {
    const a = unitToMinutes(num(rango[1]), rango[3]);
    const b = unitToMinutes(num(rango[2]), rango[3]);
    return {
      minutos: round2(Math.min(a, b)),
      maxMinutos: round2(Math.max(a, b)),
      aproximado: false,
      sinParsear: false,
    };
  }

  // Sum of plain durations: "1 hora y 30 minutos", "20 segundos"…
  let total = 0;
  let found = false;
  for (const m of t.matchAll(RE_TIEMPO_UNIDAD)) {
    total += unitToMinutes(num(m[1]), m[2]);
    found = true;
  }
  if (found) {
    return {
      minutos: round2(total),
      maxMinutos: null,
      aproximado: /\b(aproximadamente|aprox|unos?\s+\d)/.test(t),
      sinParsear: false,
    };
  }

  // Time mentioned but unquantified: "unos minutos", "un rato"
  const mencionaTiempo = /\b(minutos?|segundos?|horas?|rato|momentos?)\b/.test(t);
  return { ...empty, sinParsear: mencionaTiempo };
}

// ── Speed ──────────────────────────────────────────────────────────────────

export type ParsedSpeed = {
  velocidad: number | "Turbo" | null;
  progresiva: number[] | null;
  aproximada: boolean;
  especial: boolean;
  sinParsear: boolean;
  nota: string | null;
};

const EMPTY_SPEED: ParsedSpeed = {
  velocidad: null,
  progresiva: null,
  aproximada: false,
  especial: false,
  sinParsear: false,
  nota: null,
};

export function parseSpeed(text: string): ParsedSpeed {
  const t = toLower(text);

  // "velocidad progresiva 5-7-9" / "subiendo la velocidad de forma progresiva 5, 7 y 9"
  // → keep the ramp (not programmable on the Mambo)
  const progresiva = /\bvelocidad(?:\s+[a-záéíóúñ]+){0,3}\s+progresiva\s+(?:hasta\s+)?(\d+(?:\s*[-–—,]\s*\d+|\s+y\s+\d+)+)/.exec(
    t
  );
  if (progresiva) {
    const rampa = (progresiva[1].match(/\d+/g) ?? [])
      .map((n) => nearestInt(num(n)))
      .filter((n) => Number.isFinite(n));
    return {
      ...EMPTY_SPEED,
      velocidad: rampa.length > 0 ? rampa[rampa.length - 1] : null,
      progresiva: rampa,
      nota: "La Mambo no dispone de velocidad progresiva programable.",
    };
  }

  // "velocidad progresiva 5" (single target ramp, Thermomix TM31 wording)
  const progresivaSimple = /\bvelocidad(?:\s+[a-záéíóúñ]+){0,3}\s+progresiva\s+(?:hasta\s+)?(\d{1,2})\b/.exec(t);
  if (progresivaSimple) {
    const objetivo = nearestInt(num(progresivaSimple[1]));
    return {
      ...EMPTY_SPEED,
      velocidad: objetivo,
      progresiva: [objetivo],
      nota: "La Mambo no dispone de velocidad progresiva programable: sube la velocidad a mano.",
    };
  }

  if (/\bturbo\b/.test(t)) {
    return { ...EMPTY_SPEED, velocidad: "Turbo" };
  }

  if (/\bvelocidad\s+(?:de\s+)?cuchara\b/.test(t)) {
    return {
      ...EMPTY_SPEED,
      velocidad: 1,
      especial: true,
      nota: "«Velocidad cuchara» de Thermomix: Cuchara MamboMix a velocidad 1 (equivalencia conservadora, sin cifra oficial).",
    };
  }

  if (/\b(?:modo|velocidad)\s+espiga\b/.test(t)) {
    return {
      ...EMPTY_SPEED,
      velocidad: LIMITES_MAMBO.velocidadMaxPorAccesorio["Cuchara MamboMix"],
      especial: true,
      nota: "«Modo espiga» de Thermomix: Cuchara MamboMix a velocidad 3 (máximo documentado para amasar; equivalencia sin cifra oficial).",
    };
  }

  if (/\bvelocidad\s+varoma\b/.test(t)) {
    return {
      ...EMPTY_SPEED,
      velocidad: 1,
      especial: true,
      nota: "«Velocidad Varoma» de Thermomix: no tiene equivalente en Mambo; se propone velocidad 1 (revisar manualmente).",
    };
  }

  // Fractions: "velocidad 3 1/2", "velocidad 1/2" (Thermomix half speeds)
  const mixta = /\bvel(?:ocidad)?\.?\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\b/.exec(t);
  if (mixta) {
    const exacto = num(mixta[1]) + num(mixta[2]) / num(mixta[3]);
    return {
      ...EMPTY_SPEED,
      velocidad: nearestInt(exacto),
      aproximada: true,
      nota: `La Thermomix indicaba velocidad ${mixta[1]} ${mixta[2]}/${mixta[3]}; la Mambo solo admite velocidades enteras (redondeado al entero más cercano).`,
    };
  }
  const fraccion = /\bvel(?:ocidad)?\.?\s*(\d+)\s*\/\s*(\d+)\b/.exec(t);
  if (fraccion) {
    const exacto = num(fraccion[1]) / num(fraccion[2]);
    return {
      ...EMPTY_SPEED,
      velocidad: nearestInt(exacto),
      aproximada: true,
      nota: `La Thermomix indicaba velocidad ${fraccion[1]}/${fraccion[2]}; la Mambo solo admite velocidades enteras (redondeado al entero más cercano).`,
    };
  }

  // Plain integer: "velocidad 5", "vel. 4", "vel 3"
  const entero = /\bvel(?:ocidad)?\.?\s*(\d{1,2})\b/.exec(t);
  if (entero) {
    return { ...EMPTY_SPEED, velocidad: nearestInt(num(entero[1])) };
  }

  if (/\bsin\s+(?:velocidad|mover|remover|cuchillas?\b.*movim)/.test(t)) {
    return { ...EMPTY_SPEED, velocidad: 0 };
  }

  // Speed mentioned but not understood: "velocidad media", "velocidad suave"…
  if (/\bvelocidad\b/.test(t)) {
    return { ...EMPTY_SPEED, sinParsear: true };
  }

  return EMPTY_SPEED;
}

// ── Temperature ────────────────────────────────────────────────────────────

export type ParsedTemp = {
  temperatura: number | null;
  sinCalor: boolean;
  nota: string | null;
  fueraDeRango: boolean;
  inferida: boolean;
};

const EMPTY_TEMP: ParsedTemp = {
  temperatura: null,
  sinCalor: false,
  nota: null,
  fueraDeRango: false,
  inferida: false,
};

export function parseTemperature(text: string): ParsedTemp {
  const t = toLower(text);

  // "sin temperatura" / "sin calor" / "en frío" → NO heat
  if (/\bsin\s+(?:temperatura|calor)\b|\ben\s+frio\b/.test(t)) {
    return {
      ...EMPTY_TEMP,
      sinCalor: true,
      nota: "Sin calor: no seleccionar temperatura ni potencia calorífica.",
    };
  }

  // "mantequilla a temperatura ambiente" refers to the ingredient, not the robot
  if (/\btemperatura\s+ambiente\b/.test(t)) {
    return {
      ...EMPTY_TEMP,
      sinCalor: true,
      nota: "«A temperatura ambiente» se refiere al ingrediente: el paso es sin calor.",
    };
  }

  // "temperatura Varoma" (Thermomix) → 120 °C (boiling/steam reference of the Mambo manual)
  if (/\bvaroma\b/.test(t) && /\btemperatura\b/.test(t)) {
    return {
      ...EMPTY_TEMP,
      temperatura: 120,
      inferida: true,
      nota: "«Temperatura Varoma» de Thermomix ≈ 120 °C (temperatura de referencia del manual Mambo para hervor/vapor).",
    };
  }

  // Explicit values: "37º", "100°", "180 grados", "100 °C", "100 C"
  const patrones = [
    /\b(\d{2,3})(?!\d)\s*(?:º|°|˚)(?:\s*c\b)?/i,
    /\b(\d{2,3})(?!\d)\s*grados\b/i,
    /\b(\d{2,3})(?!\d)\s*º?\s*c(?:elsius)?\b/i,
  ];
  for (const p of patrones) {
    const m = p.exec(t);
    if (m) {
      const valor = nearestInt(num(m[1]));
      const { temperaturaMinC, temperaturaMaxC, temperaturaMaxGeneracionAnteriorC } =
        LIMITES_MAMBO;
      if (valor > temperaturaMaxC || valor < temperaturaMinC) {
        return {
          ...EMPTY_TEMP,
          temperatura: valor,
          fueraDeRango: true,
          nota: `${valor} °C está fuera del rango documentado de la Mambo (${temperaturaMinC}-${temperaturaMaxC} °C).`,
        };
      }
      if (valor > temperaturaMaxGeneracionAnteriorC) {
        return {
          ...EMPTY_TEMP,
          temperatura: valor,
          inferida: true,
          nota: `${valor} °C es válido en Mambo CooKing (37-180 °C) pero no verificado en generaciones anteriores de Mambo (máx. 120 °C).`,
        };
      }
      return { ...EMPTY_TEMP, temperatura: valor };
    }
  }

  return EMPTY_TEMP;
}

// ── Accessory ──────────────────────────────────────────────────────────────

export type ParsedAccesorio = {
  accesorio: AccesorioMambo;
  inferido: boolean;
};

export function parseAccesorio(text: string, velocidad: number | "Turbo" | null): ParsedAccesorio {
  const t = toLower(text);

  if (/\bcestillo\b/.test(t)) return { accesorio: "Cestillo de hervir", inferido: false };
  if (/\bvaporera\b|\bal\s+vapor\b|\bcocinar\s+(?:al\s+)?vapor\b|\bvaroma\b/.test(t))
    return { accesorio: "Vaporera", inferido: false };
  if (/\bmariposa\b/.test(t)) return { accesorio: "Mariposa", inferido: false };
  if (
    /\bmambo\s*mix\b|\bcuchara\s+mambo\b|\bvelocidad\s+(?:de\s+)?cuchara\b|\bespiga\b|\bgiro\s+(?:a\s+la\s+)?izquierda\b|\bgiro\s+inverso\b/.test(
      t
    )
  )
    return { accesorio: "Cuchara MamboMix", inferido: false };
  if (/\bcon\s+la\s+esp[aá]tula\s+(?:colocada|puesta|montada)\b/.test(t))
    return { accesorio: "Cuchara MamboMix", inferido: false };

  // Documented function → accessory pairs from the manual
  if (/\bamas\w*\b/.test(t))
    return { accesorio: "Cuchara MamboMix", inferido: true };
  if (/\bmonta(?:r|mos|ndo)?\b.*\b(?:nata|claras?)\b|\b(?:nata|claras?)\b.*\bmonta(?:r|mos|ndo)?\b/.test(t))
    return { accesorio: "Mariposa", inferido: true };
  if (
    /\b(triturar|tritura\w*|picar|pica\w*|pulveriza\w*|rallar|ralla\w*|licua\w*|moler|muele\w*|trocea\w*|emulsiona\w*|turbo|batir|batimos|batemos|bate\b|batiendo)/.test(
      t
    )
  )
    return { accesorio: "Cuchillas", inferido: false };

  if (velocidad === "Turbo") return { accesorio: "Cuchillas", inferido: false };
  if (typeof velocidad === "number" && velocidad >= 1)
    return { accesorio: "Cuchillas", inferido: false };
  return { accesorio: "Ninguno", inferido: false };
}

// ---------------------------------------------------------------------------
// Step text rewrite → native Mambo Spanish (es-ES), manual vocabulary
// ---------------------------------------------------------------------------

export function rewriteToMambo(text: string, tipo: TipoPasoMambo = "robot"): string {
  let s = text;

  // Thermomix parameter phrasing → Mambo phrasing.
  // In robot steps the steamer is part of the program; in manual/horno steps the
  // phrase usually just describes a liquid's temperature.
  s = s.replace(
    /\btemperatura\s+varoma\b/gi,
    tipo === "robot" ? "120 °C con la Vaporera de dos niveles" : "120 °C"
  );
  s = s.replace(/\bel\s+varoma\b/gi, "la Vaporera de dos niveles");
  s = s.replace(/\bal\s+varoma\b/gi, "a la Vaporera de dos niveles");
  s = s.replace(/\bdel\s+varoma\b/gi, "de la Vaporera de dos niveles");
  s = s.replace(/\bvaroma\b/gi, "Vaporera de dos niveles");

  s = s.replace(/\bvelocidad\s+(?:de\s+)?cuchara\b/gi, "Cuchara MamboMix, velocidad 1");
  s = s.replace(/\b(?:modo|velocidad)\s+espiga\b/gi, "Cuchara MamboMix, velocidad 3");
  s = s.replace(
    /\bgiro\s+(?:a\s+la\s+)?izquierda\b|\bgiro\s+inverso\b/gi,
    "con la Cuchara MamboMix (función SlowMambo)"
  );
  s = s.replace(
    /\b(?:a\s+)?velocidad\s+progresiva\s+(\d+(?:\s*[-–—,]\s*\d+|\s+y\s+\d+)+)/gi,
    (_m, nums: string) => {
      const rampa = nums.match(/\d+/g) ?? [];
      const ultimo = rampa.pop() as string;
      const frase =
        rampa.length > 0
          ? `${rampa.join(", ")} y ${ultimo}`
          : ultimo;
      return `subiendo la velocidad de forma progresiva ${frase} (ajústala a mano: la Mambo no tiene velocidad progresiva)`;
    }
  );
  s = s.replace(
    /\b(?:a\s+)?velocidad\s+progresiva\s+(\d{1,2})\b/gi,
    (_m, objetivo: string) =>
      `subiendo la velocidad de forma progresiva hasta ${objetivo} (ajústala a mano: la Mambo no tiene velocidad progresiva)`
  );

  // Half speeds → nearest integer (documented approximation)
  s = s.replace(
    /\bvelocidad\s+(\d+)\s+(\d+)\s*\/\s*(\d+)\b/gi,
    (_m, a: string, b: string, c: string) => `velocidad ${nearestInt(num(a) + num(b) / num(c))}`
  );
  s = s.replace(
    /\bvelocidad\s+(\d+)\s*\/\s*(\d+)\b/gi,
    (_m, a: string, b: string) => `velocidad ${nearestInt(num(a) / num(b))}`
  );

  s = s.replace(/\bsin\s+temperatura\b/gi, "sin calor");

  // Degrees: "37º", "100°", "180ºC" → "37 °C"
  s = s.replace(/\b(\d{2,3})(?!\d)\s*(?:º|°|˚)(?:\s*c\b)?/gi, "$1 °C");
  s = s.replace(/\b(\d{2,3})(?!\d)\s*grados\b/gi, "$1 °C");
  s = s.replace(/\btemperatura\s+(?=\d)/gi, "");

  // Thermomix vocabulary → Mambo manual vocabulary
  s = s.replace(/\bcon\s+la\s+esp[aá]tula\s+(?:colocada|puesta|montada)\b/gi, "con la Cuchara MamboMix");
  s = s.replace(/\bvaso\s+medidor\b/gi, "vaso medidor");
  s = s.replace(/\bvaso\b/gi, "jarra");
  s = s.replace(/\bEl\s+jarra\b/g, "La jarra");
  s = s.replace(/\bel\s+jarra\b/g, "la jarra");
  s = s.replace(/\bUn\s+jarra\b/g, "Una jarra");
  s = s.replace(/\bun\s+jarra\b/g, "una jarra");
  s = s.replace(/\bdel\s+jarra\b/g, "de la jarra");
  s = s.replace(/\bal\s+jarra\b/g, "a la jarra");
  s = s.replace(/\bbocal\b/gi, "abertura de la tapa");
  s = s.replace(/\bmariposa\b/gi, "Mariposa");

  return s.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Step conversion
// ---------------------------------------------------------------------------

const RE_VERBOS_ROBOT =
  /\b(programar|programamos|programa\b|batir|batimos|batemos|bate\b|batiendo|triturar|trituramos|tritura\w*|picar|picamos|pica\b|pulveriza\w*|rallar|rallamos|ralla\b|licua\w*|moler|molemos|muele\w*|amasar|amasamos|amasa\b|montar\b|montamos|monta\b|montando|sofre\w*|sofr[ií]e\w*|hervir|hervimos|hierv\w*|cocinar|cocinamos|cocina\b|cocinando|calentar|calentamos|calentando|calienta\b|emulsiona\w*|trocea\w*|al\s+vapor)/;
const RE_VERBOS_HORNO = /\bhorn\w*|\bgratin\w*/;
// Cooking that clearly does NOT happen in the robot (stovetop, fridge…) unless
// the step also carries machine parameters.
const RE_CONTEXTO_NO_ROBOT = /\bsart[ée]n\b|\bfuego\b|\bcazuela\b|\bmicroondas\b|\bnevera\b|\bcongelador\b/;
const RE_TIEMPO_ABIERTO = /\bhasta\s+(?:que|obtener|el\s+punto|que\s+est)/;

export function convertStep(raw: string, index: number): MamboStep {
  const text = cleanText(raw);
  const t = toLower(text);
  const notas: string[] = [];
  let confianza: ConfianzaConversion = "alta";
  let sinConvertir = false;

  const time = parseStepTime(t);
  const speed = parseSpeed(t);
  const temp = parseTemperature(t);

  const esHorno = RE_VERBOS_HORNO.test(t) && !/\bvelocidad\b/.test(t);
  const tieneVelocidad = speed.velocidad !== null || speed.progresiva !== null;
  const tipo: TipoPasoMambo = esHorno
    ? "horno"
    : tieneVelocidad
      ? "robot"
      : RE_VERBOS_ROBOT.test(t) && !RE_CONTEXTO_NO_ROBOT.test(t)
        ? "robot"
        : "manual";

  if (time.sinParsear) {
    sinConvertir = true;
    notas.push("El texto menciona un tiempo que no se ha podido convertir; revisar manualmente.");
  }
  if (speed.sinParsear) {
    sinConvertir = true;
    notas.push("El texto menciona una velocidad que no se ha podido convertir; revisar manualmente.");
  }

  let velocidad: number | "Turbo" | null = speed.velocidad;
  let temperaturaC: number | null = temp.temperatura;
  const acc = parseAccesorio(text, velocidad);
  const accesorio: AccesorioMambo = acc.accesorio;
  const inferido = acc.inferido;

  if (tipo === "horno") {
    velocidad = null;
    temperaturaC = null;
    notas.push("Paso de horno: se programa en el horno, no en la Mambo.");
    if (temp.temperatura !== null) {
      notas.push(`Horno a ${temp.temperatura} °C.`);
    } else if (/\bmisma\s+temperatura\b/.test(t)) {
      notas.push("Horno a la misma temperatura del paso anterior.");
    }
    if (time.minutos === null && /\b(minutos?|segundos?|horas?)\b/.test(t)) sinConvertir = true;
  } else if (tipo === "robot") {
    if (velocidad === null && !speed.sinParsear) {
      sinConvertir = true;
      notas.push("El texto original no indica velocidad de la Mambo; hay que revisar manualmente.");
    }
    if (
      time.minutos === null &&
      !time.sinParsear &&
      !RE_TIEMPO_ABIERTO.test(t) &&
      !/\bminutos?\b.*\bno\s+fij/.test(t)
    ) {
      if (/\b(minutos?|segundos?|horas?)\b/.test(t)) {
        // already flagged by sinParsear
      } else {
        sinConvertir = true;
        notas.push("El texto original no indica tiempo de programación; hay que revisar manualmente.");
      }
    }
    if (temp.sinCalor && temp.nota) notas.push(temp.nota);
    if (temp.temperatura !== null && temp.nota) notas.push(temp.nota);
    if (RE_TIEMPO_ABIERTO.test(t) && time.minutos === null) {
      notas.push("Sin tiempo fijo: cocinar según el punto indicado en el texto.");
      confianza = "media";
    }

    // Documented Mambo limits (flag, never clamp)
    if (typeof velocidad === "number") {
      const maxAccesorio = LIMITES_MAMBO.velocidadMaxPorAccesorio[accesorio];
      if (velocidad > maxAccesorio) {
        confianza = "baja";
        notas.push(
          `Velocidad ${velocidad} por encima del máximo documentado del accesorio ${accesorio} (máx. ${maxAccesorio}).`
        );
      }
      if (velocidad > LIMITES_MAMBO.velocidadMax) {
        confianza = "baja";
        notas.push(
          `Velocidad ${velocidad} por encima de la escala común 0-10 (la jarra Victory XL admite hasta 15).`
        );
      }
      if (
        velocidad >= LIMITES_MAMBO.velocidadAltaDesde &&
        time.minutos !== null &&
        time.minutos > LIMITES_MAMBO.minutosVelocidadAlta
      ) {
        confianza = "baja";
        notas.push(
          `La Mambo limita el uso continuo a velocidad ${LIMITES_MAMBO.velocidadAltaDesde} o superior a ${LIMITES_MAMBO.minutosVelocidadAlta} minutos.`
        );
      }
    }
    if (velocidad === "Turbo" && time.minutos !== null && time.minutos * 60 > LIMITES_MAMBO.turboSegundosMax) {
      if (confianza === "alta") confianza = "media";
      notas.push(
        `El Turbo de la Mambo está limitado a ${LIMITES_MAMBO.turboSegundosMax} s por pulsación y solo funciona con cuchillas: repite en pulsos.`
      );
    }
    if (speed.progresiva) {
      if (confianza === "alta") confianza = "media";
      notas.push(
        `Velocidad progresiva ${speed.progresiva.join("-")}: la Mambo no la programa; ajusta la velocidad a mano en ${speed.progresiva.length} tramos.`
      );
    }
    if (speed.aproximada || speed.especial) {
      if (confianza === "alta") confianza = "media";
    }
    if (temp.inferida) {
      if (confianza === "alta") confianza = "media";
    }
    if (speed.nota && (speed.aproximada || speed.especial)) notas.push(speed.nota);
    if (inferido) {
      if (confianza === "alta") confianza = "media";
      notas.push(`Accesorio «${accesorio}» inferido de la acción descrita (no se nombra en el texto).`);
    }
    if (temperaturaC !== null && velocidad === 0 && accesorio === "Ninguno") {
      notas.push("Cocción sin movimiento (velocidad 0).");
    }
    if (temperaturaC !== null) {
      notas.push(
        "Potencia calorífica: deja la configuración por defecto de la Mambo (la Thermomix no controla la potencia)."
      );
    }
  } else {
    // manual
    velocidad = null;
    temperaturaC = null;
  }

  if (sinConvertir) confianza = "baja";

  const paso: MamboStep = {
    paso_numero: index + 1,
    instruccion: rewriteToMambo(text, tipo),
    accesorio,
    velocidad,
    temperatura_c: temperaturaC,
    // Thermomix has no heat-power parameter; the manual recommends the
    // default configuration for each temperature, so we never invent one.
    potencia_calorifica: null,
    tiempo_minutos: time.minutos,
    tiempo_max_minutos: time.maxMinutos,
    tipo_paso: tipo,
    confianza,
    sin_convertir: sinConvertir,
    notas_conversion: notas,
  };
  if (speed.progresiva && speed.progresiva.length > 0) {
    paso.velocidad_progresiva = speed.progresiva;
  }
  return paso;
}

// ---------------------------------------------------------------------------
// Recipe conversion
// ---------------------------------------------------------------------------

export function sumarTiempos(pasos: MamboStep[]): number {
  const total = pasos.reduce(
    (sum, p) => sum + (p.tiempo_max_minutos ?? p.tiempo_minutos ?? 0),
    0
  );
  return Math.round(total);
}

export function convertToMambo(recipe: {
  title: string;
  ingredients: string[];
  instructions: string[];
}): MamboRecipe {
  const pasos_mambo = recipe.instructions.map((text, idx) => convertStep(text, idx));
  return {
    titulo: cleanText(recipe.title),
    modelo_destino: MODELO_DESTINO,
    ingredientes: recipe.ingredients.map((i) => cleanText(i)),
    pasos_mambo,
    tiempo_total_min: sumarTiempos(pasos_mambo),
  };
}

/** Difficulty heuristic kept from the previous pipeline (step count based). */
function dificultadPorPasos(pasos: MamboStep[]): Recipe["dificultad"] {
  if (pasos.length <= 4) return "Fácil";
  if (pasos.length <= 7) return "Media";
  return "Difícil";
}

function parseComensales(servings: string | undefined): number {
  const m = /^(\d+)/.exec(String(servings ?? ""));
  return m ? Math.min(Number(m[1]), 20) : 4;
}

export function convertScrapedRecipe(
  recipe: ScrapedRecipe
): Omit<Recipe, "id" | "creado_en" | "fuente_url"> {
  const mambo = convertToMambo(recipe);
  const tiempo =
    mambo.tiempo_total_min > 0 ? mambo.tiempo_total_min : parseDurationToMinutes(recipe.time) ?? 0;

  return {
    slug: slugify(recipe.title) || Math.random().toString(36).slice(2, 10),
    titulo: mambo.titulo,
    descripcion: `Receta de ${mambo.titulo} adaptada de Thermomix a la Cecotec Mambo Cooking Total Gourmet.`,
    imagen: recipe.image ?? "",
    categoria: clasificarCategoria(mambo.titulo, mambo.ingredientes, recipe.instructions),
    tiempo_total_min: tiempo,
    comensales: parseComensales(recipe.servings),
    dificultad: dificultadPorPasos(mambo.pasos_mambo),
    ingredientes: mambo.ingredientes,
    pasos_mambo: mambo.pasos_mambo,
  };
}

// ---------------------------------------------------------------------------
// Recipe category (shared by scrape-bulk and fix-recipes)
// ---------------------------------------------------------------------------

export function clasificarCategoria(
  title: string,
  ingredients: string[],
  instructions: string[]
): string {
  const all = toLower([title, ...ingredients, ...instructions].join(" "));

  if (
    /\b(tarta|bizcoch|brownie|galleta|helado|postre|natilla|crema|flan|pudin|magdalena|cupcake|donut|muffin|croissant|brioche|panquemad|buñuelo|buñuelos|churro|torrija|arroz.*leche|leche.*frita|tocino.*cielo|santiago|quesada|fartons|ensaimada|hojaldre|rosco|rosquilla|pestiño|polvoron|mantecado|turrón|turron|mazapan|mazapán|fruta.*seca|plum.cake|pastel|fondant)/.test(
      all
    )
  )
    return "postres";
  if (/\b(pan |panecillo|bollo|rosca|hogaza|barra|chapata|focaccia|pizza.*masa|masa.*pizza|naan|pita|pretzel)/.test(all))
    return "panes-masas";
  if (/\b(arroz|paella|risotto|meloso|caldoso|negro.*arroz|arroz.*negro)/.test(all))
    return "arroces";
  if (/\b(pollo|ternera|cerdo|cordero|carne|albondiga|estofad|hamburguesa|chuleta|solomillo|lomo|magro|costilla|chistorra|chorizo|morcilla|salchich)/.test(all))
    return "carnes";
  if (/\b(merluza|salmon|salmón|gamba|atun|atún|pescad|marisco|bacalao|rape|lubina|dorada|sardina|calamar|pulpo|mejillon|almeja|bonito|pez)/.test(all))
    return "pescados";
  if (/\b(verdura|ensalada|gazpacho|crema.*calabaza|crema.*zapallo|crema.*zanahoria|crema.*puerro|pure.*verdura|saltead|guarnicion|guarnición|espinaca|brócoli|brcoli|coliflor|alcachofa|berenjena|calabacin|calabacín|seta|hong)/.test(all))
    return "verduras";
  if (/\b(lenteja|garbanzo|judia|judía|alubia|potaje|fabada|cocid)/.test(all))
    return "legumbres";
  if (/\b(salsa|pesto|mayonesa|aliño|vinagreta|sofrito|sofregit|romesco|pipirrana|mojo|chimichurri)/.test(all))
    return "salsas";
  if (/\b(zumo|batido|smoothie|limonada|horchata|sangria|sangría|tinto.*verano|bebida|infusion|té |te |caf[ée])/.test(all))
    return "bebidas";
  if (/\b(sopa|crema|potaje|caldo|menudo|gazpacho|salmorejo|vichyssoise|consom[ée]|ramen)/.test(all))
    return "sopas-y-cremas";

  return "sopas-y-cremas";
}

// ---------------------------------------------------------------------------
// Display helper
// ---------------------------------------------------------------------------

export function formatTiempo(minutos: number | null, maxMinutos?: number | null): string {
  if (minutos === null || !Number.isFinite(minutos)) return "—";
  const uno = (m: number): string => {
    if (m < 1) return `${Math.round(m * 60)} s`;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rest = Math.round(m % 60);
      return rest ? `${h} h ${rest} min` : `${h} h`;
    }
    return Number.isInteger(m) ? `${m} min` : `${round2(m)} min`;
  };
  if (maxMinutos != null && maxMinutos > minutos) return `${uno(minutos)}-${uno(maxMinutos)}`;
  return uno(minutos);
}
