export type MamboStep = {
  paso_numero: number;
  instruccion: string;
  accesorio: "Cuchillas" | "Pala MamboMix" | "Ninguno";
  velocidad: number | "Turbo";
  temperatura_c: number | null;
  potencia_calorifica: number | null;
  tiempo_minutos: number | null;
};

export type MamboRecipe = {
  titulo: string;
  modelo_destino: string;
  ingredientes: string[];
  pasos_mambo: MamboStep[];
};

function toLower(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) {
      const n = Number(m[1].replace(",", "."));
      if (Number.isFinite(n)) return n;
    }
  }

  return null;
}

function inferCategory(text: string): string {
  const t = toLower(text);

  if (/\bvapor\b/.test(t)) return "vapor";
  if (/\b(hervir|hervor|hirviendo|agua)\b/.test(t)) return "hervir";
  if (/\b(pan|amasar|amasar)\b/.test(t)) return "amasar";
  if (/\b(picar|triturar|turbo|velocidad turbo)\b/.test(t)) return "triturar";
  if (/\bsofrit[oa]|sofrire|rehogar|pochar\b/.test(t)) return "sofrito";
  if (/\bguiso|estofad[oa]|cald[oa]|brasas?\b/.test(t)) return "guiso";
  if (/\barroz|paella|risotto\b/.test(t)) return "arroz";
  if (/\bleche|bechamel|crema|natilla\b/.test(t)) return "lacteo";
  if (/\blicuado|batido|smoothie|pure\b/.test(t)) return "liquido";

  return "general";
}

function mapAccesorio(text: string): MamboStep["accesorio"] {
  const t = toLower(text);

  if (/\b(izquierda|giro a la izquierda|modo espiga|cuchara)\b/.test(t))
    return "Pala MamboMix";

  if (/\b(turbo|triturar|picar|licuado|batido|pure)\b/.test(t))
    return "Cuchillas";

  if (/\b(pala|mambo mix|mambomix)\b/.test(t)) return "Pala MamboMix";

  return "Cuchillas";
}

function inferVelocidad(text: string): MamboStep["velocidad"] {
  const t = toLower(text);

  if (/\bvelocidad\s*(\d{1,2})\b/.test(t)) {
    const v = extractNumber(t, [/\bvelocidad\s*(\d{1,2})\b/]) ?? 2;
    return Math.min(10, Math.max(0, v));
  }

  if (/\bvel\s*\.?\s*(\d{1,2})\b/.test(t)) {
    const v = extractNumber(t, [/\bvel\s*\.?\s*(\d{1,2})\b/]) ?? 2;
    return Math.min(10, Math.max(0, v));
  }

  if (/\bturbo\b/.test(t)) return "Turbo";

  const cat = inferCategory(t);

  if (cat === "triturar") return 6;
  if (cat === "amasar") return "Espiga" as unknown as number; // normalize below
  if (cat === "sofrito") return 2;
  if (cat === "guiso") return 1;
  if (cat === "arroz") return 1;
  if (cat === "lacteo") return 3;
  if (cat === "liquido") return 5;

  return 1;
}

function normalizeSpeed(v: MamboStep["velocidad"]): MamboStep["velocidad"] {
  if (v === ("Espiga" as unknown as number)) return 2;
  if (typeof v === "number") return Math.min(10, Math.max(0, v));
  return v;
}

function inferPotencia(text: string): MamboStep["potencia_calorifica"] {
  const t = toLower(text);

  if (/\b(9|10)\b/.test(t) && /\bvapor|hirviendo|hervir\b/.test(t)) return 9;

  const cat = inferCategory(t);

  if (cat === "vapor" || cat === "hervir") return 9;
  if (cat === "sofrito") return 7;
  if (cat === "guiso") return 5;
  if (cat === "arroz") return 5;
  if (cat === "lacteo") return 4;
  if (cat === "amasar" || cat === "triturar" || cat === "liquido") return null;

  return 5;
}

function inferTemperatura(text: string): MamboStep["temperatura_c"] {
  const explicit = extractNumber(text, [/(\d{2,3})\s*°/]);
  if (explicit) return explicit;

  const t = toLower(text);
  const cat = inferCategory(t);

  if (cat === "vapor") return 120;
  if (cat === "hervir") return 100;
  if (cat === "sofrito") return 135;
  if (cat === "guiso") return 100;
  if (cat === "arroz") return 100;
  if (cat === "lacteo") return 80;
  if (cat === "liquido") return null;
  if (cat === "amasar") return null;

  return 100;
}

function normalizeTime(minutes: number | null): number | null {
  if (minutes === null) return null;
  return Math.max(1, Math.round(minutes));
}

function adjustHeatTime(minutes: number | null, category: string): number | null {
  if (minutes === null) return null;

  if (category === "hervir" || category === "vapor") {
    return Math.max(1, Math.round(minutes * 0.82));
  }

  return minutes;
}

function parseExplicitTimeMinutes(text: string): number | null {
  const m1 = /(\d+)\s*min/.exec(text);
  const m2 = /(\d+)\s*h/.exec(text);
  const m3 = /(\d+)\s*h\s*(\d+)\s*min/.exec(text);

  if (m3) return Number(m3[1]) * 60 + Number(m3[2]);
  if (m2) return Number(m2[1]) * 60;
  if (m1) return Number(m1[1]);

  return null;
}

function buildInstruccion(original: string): string {
  const tips: string[] = [];

  if (/\b(giro a la izquierda|modo espiga|cuchara)\b/i.test(original)) {
    tips.push("Usa la Pala MamboMix.");
  }

  if (/\b(vapor)\b/i.test(original)) {
    tips.push("Programa vapor en Mambo con Potencia 9.");
  }

  if (/\b(120\s*°)\b/i.test(original)) {
    tips.push("Sube a 130-140 ºC para aprovechar la inducción.");
  }

  const base = original.replace(/\s+/g, " ").trim();
  return tips.length > 0 ? `${base} [${tips.join(" ")}]` : base;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function convertToMambo(recipe: { title: string; ingredients: string[]; instructions: string[] }): MamboRecipe {
  const pasos_mambo: MamboStep[] = recipe.instructions.map((text, idx) => {
    const category = inferCategory(text);
    const explicitMin = parseExplicitTimeMinutes(text);
    const timeRaw = explicitMin ?? (category === "amasar" ? 2 : category === "triturar" ? 1 : category === "sofrito" ? 6 : category === "guiso" ? 25 : category === "arroz" ? 18 : category === "lacteo" ? 10 : 10);
    const timeAdj = adjustHeatTime(timeRaw, category);

    return {
      paso_numero: idx + 1,
      instruccion: buildInstruccion(text),
      accesorio: mapAccesorio(text),
      velocidad: normalizeSpeed(inferVelocidad(text)),
      temperatura_c: inferTemperatura(text),
      potencia_calorifica: inferPotencia(text),
      tiempo_minutos: normalizeTime(timeAdj),
    };
  });

  return {
    titulo: recipe.title,
    modelo_destino: "Mambo Cooking Total Gourmet",
    ingredientes: recipe.ingredients,
    pasos_mambo,
  };
}
