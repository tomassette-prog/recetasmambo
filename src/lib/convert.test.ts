import { describe, expect, it } from "vitest";
import {
  cleanText,
  convertStep,
  convertToMambo,
  fixMojibake,
  formatTiempo,
  parseDurationToMinutes,
  parseSpeed,
  parseStepTime,
  parseTemperature,
  rewriteToMambo,
  sumarTiempos,
} from "./convert";

// Real broken examples from data/recipes.json ("Tarta brownie con crema de queso")
// before the engine rewrite, plus additional patterns.

describe("parseStepTime", () => {
  it("parses seconds as fractional minutes", () => {
    expect(parseStepTime("batimos a velocidad 4, durante 20 segundos").minutos).toBeCloseTo(
      20 / 60,
      2
    );
  });

  it("parses plain minutes and hours", () => {
    expect(parseStepTime("programamos 4 minutos").minutos).toBe(4);
    expect(parseStepTime("programamos 1 hora y 30 minutos").minutos).toBe(90);
    expect(parseStepTime("PT1H30M").minutos).toBe(90);
    expect(parseStepTime("media hora").minutos).toBe(30);
  });

  it("parses time ranges", () => {
    const r = parseStepTime("sofreímos 2-3 minutos");
    expect(r.minutos).toBe(2);
    expect(r.maxMinutos).toBe(3);

    const r2 = parseStepTime("dejamos entre 20 y 25 minutos");
    expect(r2.minutos).toBe(20);
    expect(r2.maxMinutos).toBe(25);
  });

  it("flags unquantified time instead of guessing", () => {
    expect(parseStepTime("dejamos unos minutos").sinParsear).toBe(true);
    expect(parseStepTime("reservamos").sinParsear).toBe(false);
  });

  it("does not confuse speeds or ingredients with time", () => {
    expect(parseStepTime("velocidad progresiva 5-7-9").minutos).toBeNull();
    expect(parseStepTime("1 sobre de levadura").minutos).toBeNull();
    expect(parseStepTime("180º").minutos).toBeNull();
  });
});

describe("parseSpeed", () => {
  it("keeps progressive ramps as a progression", () => {
    const s = parseSpeed("rallamos 10 segundos, a velocidad progresiva 5-7-9");
    expect(s.progresiva).toEqual([5, 7, 9]);
    expect(s.velocidad).toBe(9);
  });

  it("parses single progressive ramps", () => {
    const s = parseSpeed("programamos 10 segundos, velocidad progresiva 5");
    expect(s.progresiva).toEqual([5]);
    expect(s.velocidad).toBe(5);
  });

  it("parses Thermomix half speeds and rounds to nearest integer", () => {
    const s = parseSpeed("montamos la nata a velocidad 3 1/2");
    expect(s.velocidad).toBe(4);
    expect(s.aproximada).toBe(true);

    const s2 = parseSpeed("mezclamos a velocidad 1/2");
    expect(s2.velocidad).toBe(1);
    expect(s2.aproximada).toBe(true);
  });

  it("maps special Thermomix speeds", () => {
    expect(parseSpeed("batimos a velocidad turbo").velocidad).toBe("Turbo");
    expect(parseSpeed("removemos a velocidad cuchara").velocidad).toBe(1);
    expect(parseSpeed("amasamos en modo espiga").velocidad).toBe(3);
  });

  it("flags speeds it cannot understand instead of guessing", () => {
    expect(parseSpeed("batimos a velocidad media").sinParsear).toBe(true);
    expect(parseSpeed("sin velocidad").velocidad).toBe(0);
    expect(parseSpeed("sin mover las cuchillas").velocidad).toBe(0);
  });
});

describe("parseTemperature", () => {
  it("understands both º and ° degree signs", () => {
    expect(parseTemperature("batimos 4 minutos, temperatura 37º y velocidad 5").temperatura).toBe(37);
    expect(parseTemperature("programamos 5 minutos, 100º, velocidad 2").temperatura).toBe(100);
    expect(parseTemperature("precalentamos el horno a 180º").temperatura).toBe(180);
  });

  it("treats «sin temperatura» as no heat", () => {
    const t = parseTemperature("3 minutos, velocidad 5 y sin temperatura");
    expect(t.sinCalor).toBe(true);
    expect(t.temperatura).toBeNull();
  });

  it("does not read «a temperatura ambiente» as robot heat", () => {
    const t = parseTemperature("echamos la mantequilla a temperatura ambiente");
    expect(t.sinCalor).toBe(true);
    expect(t.temperatura).toBeNull();
  });

  it("maps Thermomix Varoma to 120 °C with a documented note", () => {
    const t = parseTemperature("programamos 15 minutos, temperatura Varoma, velocidad 1");
    expect(t.temperatura).toBe(120);
    expect(t.nota).toContain("Varoma");
  });

  it("flags temperatures outside the documented Mambo range", () => {
    expect(parseTemperature("programamos 200º").fueraDeRango).toBe(true);
  });
});

describe("cleanText / fixMojibake", () => {
  it("decodes double-encoded HTML entities", () => {
    expect(cleanText("la crema&amp;#8230;¡ya está")).toBe("la crema…¡ya está");
  });

  it("repairs UTF-8 read as Latin-1 (mojibake)", () => {
    expect(fixMojibake("DifÃ­cil")).toBe("Difícil");
    expect(cleanText("BuÃ±uelos de viento")).toBe("Buñuelos de viento");
    expect(cleanText("Dificultad: DifÃ­cil")).toBe("Dificultad: Difícil");
  });
});

describe("convertStep (before/after audit cases)", () => {
  it("«temperatura 37º» is 37 °C, not 100 °C (º vs ° bug)", () => {
    const p = convertStep(
      "Ponemos los huevos y el azúcar en el vaso y batimos 4 minutos, temperatura 37º y velocidad 5.",
      0
    );
    expect(p.temperatura_c).toBe(37);
    expect(p.velocidad).toBe(5);
    expect(p.tiempo_minutos).toBe(4);
    expect(p.accesorio).toBe("Cuchillas");
    expect(p.confianza).toBe("alta");
    expect(p.instruccion).toContain("jarra");
    expect(p.instruccion).not.toContain("vaso");
    expect(p.instruccion).toContain("37 °C");
  });

  it("«sin temperatura» means no heat at all", () => {
    const p = convertStep(
      "Una vez terminado ponemos otros 3 minutos, velocidad 5 y sin temperatura.",
      0
    );
    expect(p.temperatura_c).toBeNull();
    expect(p.potencia_calorifica).toBeNull();
    expect(p.velocidad).toBe(5);
    expect(p.tiempo_minutos).toBe(3);
    expect(p.notas_conversion?.join(" ")).toContain("Sin calor");
  });

  it("«20 segundos» is 20 s, not 10 minutes", () => {
    const p = convertStep(
      "Echamos la mantequilla a temperatura ambiente y batimos a velocidad 4, durante 20 segundos.",
      0
    );
    expect(p.tiempo_minutos).toBeCloseTo(20 / 60, 2);
    expect(p.temperatura_c).toBeNull(); // "temperatura ambiente" = the butter, not the robot
    expect(p.velocidad).toBe(4);
  });

  it("«velocidad progresiva 5-7-9» keeps the progression instead of speed 1", () => {
    const p = convertStep(
      "Rallamos el chocolate durante 10 segundos, a velocidad progresiva 5-7-9 y reservamos.",
      0
    );
    expect(p.velocidad_progresiva).toEqual([5, 7, 9]);
    expect(p.velocidad).toBe(9);
    expect(p.tiempo_minutos).toBeCloseTo(10 / 60, 2);
    expect(p.confianza).toBe("media");
    expect(p.instruccion).toContain("progresiva");
    expect(p.notas_conversion?.join(" ")).toContain("a mano");
  });

  it("oven preheat is an oven step with no robot heat", () => {
    const p = convertStep(
      "Para el bizcocho:Precalentamos el horno a 180º, engrasamos y enharinamos el molde con un poco de mantequilla. Reservamos.",
      0
    );
    expect(p.tipo_paso).toBe("horno");
    expect(p.temperatura_c).toBeNull();
    expect(p.velocidad).toBeNull();
    expect(p.tiempo_minutos).toBeNull();
    expect(p.notas_conversion?.join(" ")).toContain("Horno a 180 °C");
  });

  it("oven bakes keep their real time and stay out of the robot", () => {
    const p = convertStep(
      "Vertemos la masa en el molde y lo introducimos en el horno a la misma temperatura durante 40 minutos o hasta que al pincharlo el palito salga limpio.",
      0
    );
    expect(p.tipo_paso).toBe("horno");
    expect(p.tiempo_minutos).toBe(40);
    expect(p.temperatura_c).toBeNull();
    expect(p.notas_conversion?.join(" ")).toContain("misma temperatura");
  });

  it("«velocidad 3 1/2» is an approximation, flagged as media confidence", () => {
    const p = convertStep(
      "Luego montamos la nata, bien fría, a velocidad 3 1/2. Hay que mirar por el bocal hasta que veamos que esté montada y reservamos.",
      0
    );
    expect(p.velocidad).toBe(4);
    expect(p.confianza).toBe("media");
    expect(p.accesorio).toBe("Mariposa"); // manual: "Montar… gracias a su mariposa"
    expect(p.notas_conversion?.join(" ")).toContain("enteras");
    expect(p.instruccion).toContain("abertura de la tapa");
  });

  it("«velocidad cuchara» maps to Cuchara MamboMix, not to a numeric guess", () => {
    const p = convertStep("Removemos la crema a velocidad cuchara, 5 minutos, 90º.", 0);
    expect(p.velocidad).toBe(1);
    expect(p.accesorio).toBe("Cuchara MamboMix");
    expect(p.instruccion).toContain("Cuchara MamboMix, velocidad 1");
  });

  it("«giro a la izquierda» maps to Cuchara MamboMix (SlowMambo)", () => {
    const p = convertStep("Sofreímos 5 minutos, 120º, velocidad 2 y giro a la izquierda.", 0);
    expect(p.accesorio).toBe("Cuchara MamboMix");
    expect(p.instruccion).toContain("SlowMambo");
  });

  it("manual steps get no invented machine parameters", () => {
    const p = convertStep("Vertemos la masa en el molde que tenemos preparado.", 0);
    expect(p.tipo_paso).toBe("manual");
    expect(p.velocidad).toBeNull();
    expect(p.temperatura_c).toBeNull();
    expect(p.tiempo_minutos).toBeNull();
    expect(p.sin_convertir).toBeFalsy();
    expect(p.confianza).toBe("alta");
  });

  it("robot steps with missing parameters are flagged, never guessed", () => {
    const p = convertStep("Batimos la nata.", 0);
    expect(p.sin_convertir).toBe(true);
    expect(p.confianza).toBe("baja");
    expect(p.tiempo_minutos).toBeNull();
    expect(p.velocidad).toBeNull();
    expect(p.notas_conversion?.join(" ")).toContain("revisar manualmente");
  });

  it("flags Turbo beyond the documented 5 s pulse limit", () => {
    const p = convertStep("Trituramos 10 segundos a velocidad Turbo.", 0);
    expect(p.velocidad).toBe("Turbo");
    expect(p.notas_conversion?.join(" ")).toContain("5 s");
  });

  it("flags speeds above the documented accessory limit", () => {
    const p = convertStep("Amasamos 10 minutos, velocidad 6.", 0);
    expect(p.accesorio).toBe("Cuchara MamboMix");
    expect(p.confianza).toBe("baja");
    expect(p.notas_conversion?.join(" ")).toContain("máximo documentado");
  });

  it("flags continuous runs above the documented speed 8-15 time limit", () => {
    const p = convertStep("Trituramos 10 minutos, velocidad 9.", 0);
    expect(p.confianza).toBe("baja");
    expect(p.notas_conversion?.join(" ")).toContain("5 minutos");
  });

  it("rewrites Thermomix vocabulary into native Mambo wording", () => {
    const p = convertStep(
      "Ponemos el agua en el vaso y colocamos el Varoma, 20 minutos, temperatura Varoma, velocidad 1.",
      0
    );
    expect(p.instruccion).toContain("la Vaporera de dos niveles");
    expect(p.instruccion).not.toContain("Varoma");
    expect(p.instruccion).not.toContain("vaso");
    expect(p.accesorio).toBe("Vaporera");
    expect(p.temperatura_c).toBe(120);
  });

  it("mentions of the steamer without machine parameters stay manual", () => {
    const p = convertStep(
      "Mientras, vamos separando la coliflor en ramilletes y los colocamos en el recipiente varoma.",
      0
    );
    expect(p.tipo_paso).toBe("manual");
    expect(p.sin_convertir).toBeFalsy();
    expect(p.confianza).toBe("alta");
  });

  it("resting/cooling times stay manual but still count towards the total", () => {
    const p = convertStep("Dejamos reposar la masa otros 5 minutos, dentro del vaso.", 0);
    expect(p.tipo_paso).toBe("manual");
    expect(p.tiempo_minutos).toBe(5);
    expect(p.sin_convertir).toBeFalsy();
  });

  it("stovetop cooking is not a robot step", () => {
    const p = convertStep(
      "Echamos abundante aceite de girasol en una sartén y la ponemos a calentar, a fuego medio.",
      0
    );
    expect(p.tipo_paso).toBe("manual");
    expect(p.sin_convertir).toBeFalsy();
  });

  it("«horneamos» is an oven step with its time range", () => {
    const p = convertStep("Ponemos papel vegetal en el molde y horneamos entre 30 y 35 minutos.", 0);
    expect(p.tipo_paso).toBe("horno");
    expect(p.tiempo_minutos).toBe(30);
    expect(p.tiempo_max_minutos).toBe(35);
    expect(p.sin_convertir).toBeFalsy();
    expect(p.notas_conversion?.join(" ")).toContain("horno");
  });

  it("does not cap speeds for the steamer (no accessory limit is documented)", () => {
    const p = convertStep(
      "Echamos en el vaso, el agua y lo programamos 10 minutos, temperatura varoma y velocidad 1.",
      0
    );
    expect(p.accesorio).toBe("Vaporera");
    expect(p.velocidad).toBe(1);
    expect(p.confianza).toBe("media"); // Varoma equivalence note, not a limit violation
    expect(p.notas_conversion?.join(" ")).not.toContain("máximo documentado");
    expect(p.instruccion).toContain("la Vaporera de dos niveles");
  });

  it("is idempotent: re-converting rewritten text keeps the same machine parameters", () => {
    const originals = [
      "Ponemos los huevos y el azúcar en el vaso y batimos 4 minutos, temperatura 37º y velocidad 5.",
      "Una vez terminado ponemos otros 3 minutos, velocidad 5 y sin temperatura.",
      "Rallamos el chocolate durante 10 segundos, a velocidad progresiva 5-7-9 y reservamos.",
      "Precalentamos el horno a 180º, engrasamos y enharinamos el molde.",
      "Montamos la nata, bien fría, a velocidad 3 1/2.",
      "Programamos 15 minutos, temperatura Varoma, velocidad 1.",
      "Programamos 10 segundos, velocidad progresiva 5.",
      "Colocamos los ramilletes en el recipiente varoma.",
    ];
    for (const text of originals) {
      const primero = convertStep(text, 0);
      const segundo = convertStep(primero.instruccion, 0);
      expect(segundo.velocidad, text).toEqual(primero.velocidad);
      expect(segundo.temperatura_c, text).toEqual(primero.temperatura_c);
      if (primero.tiempo_minutos === null) {
        expect(segundo.tiempo_minutos, text).toBeNull();
      } else {
        expect(segundo.tiempo_minutos, text).toBeCloseTo(primero.tiempo_minutos, 2);
      }
      expect(segundo.accesorio, text).toEqual(primero.accesorio);
    }
  });
});

describe("convertToMambo (recipe level)", () => {
  it("computes tiempo_total_min from real step times including oven bakes", () => {
    const result = convertToMambo({
      title: "Tarta brownie con crema de queso",
      ingredients: ["250 g de chocolate"],
      instructions: [
        "Precalentamos el horno a 180º, engrasamos el molde. Reservamos.",
        "Batimos 4 minutos, temperatura 37º y velocidad 5.",
        "Horneamos 40 minutos a la misma temperatura.",
        "Echamos la mantequilla y batimos a velocidad 4, durante 20 segundos.",
      ],
    });
    // 4 + 40 + 0.33 ≈ 44 min (preheat has no stated time and is not invented)
    expect(result.tiempo_total_min).toBe(Math.round(4 + 40 + 20 / 60));
    expect(result.pasos_mambo).toHaveLength(4);
    expect(result.modelo_destino).toBe("Mambo Cooking Total Gourmet");
  });

  it("cleans titles and ingredients", () => {
    const result = convertToMambo({
      title: "BuÃ±uelos de viento",
      ingredients: ["250 g de harina&amp;#8230;"],
      instructions: ["Reservamos."],
    });
    expect(result.titulo).toBe("Buñuelos de viento");
    expect(result.ingredientes[0]).toBe("250 g de harina…");
  });

  it("sums step times helper handles ranges with the upper bound", () => {
    const pasos = [
      convertStep("Sofreímos 2-3 minutos, velocidad 1, 120º.", 0),
      convertStep("Cocinamos 5 minutos, velocidad 1, 100º.", 1),
    ];
    expect(sumarTiempos(pasos)).toBe(8);
  });
});

describe("helpers", () => {
  it("parseDurationToMinutes handles ISO and Spanish formats", () => {
    expect(parseDurationToMinutes("PT45M")).toBe(45);
    expect(parseDurationToMinutes("1 h 30 min")).toBe(90);
    expect(parseDurationToMinutes("20 segundos")).toBeCloseTo(0.33, 2);
  });

  it("formatTiempo renders seconds, minutes and hours", () => {
    expect(formatTiempo(0.33)).toBe("20 s");
    expect(formatTiempo(4)).toBe("4 min");
    expect(formatTiempo(1.5)).toBe("1.5 min");
    expect(formatTiempo(90)).toBe("1 h 30 min");
    expect(formatTiempo(2, 3)).toBe("2 min-3 min");
    expect(formatTiempo(null)).toBe("—");
  });

  it("rewriteToMambo is pure terminology (keeps machine-parseable parameters)", () => {
    const out = rewriteToMambo("Programamos 5 minutos, 100º, velocidad 2 en el vaso.");
    expect(out).toBe("Programamos 5 minutos, 100 °C, velocidad 2 en la jarra.");
  });
});
