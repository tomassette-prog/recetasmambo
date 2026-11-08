// Quality metadata for converted steps. See docs/CONVERSION-THERMOMIX-MAMBO.md
export type ConfianzaConversion = "alta" | "media" | "baja";

// Where the step runs: in the robot, in the oven, or by hand.
export type TipoPasoMambo = "robot" | "horno" | "manual";

// Accessory names follow the official Mambo manual vocabulary.
// "Pala MamboMix" is kept as a legacy alias for older stored data.
export type AccesorioMambo =
  | "Cuchillas"
  | "Cuchara MamboMix"
  | "Mariposa"
  | "Vaporera"
  | "Cestillo de hervir"
  | "Ninguno"
  | "Pala MamboMix";

export type MamboStep = {
  paso_numero: number;
  instruccion: string;
  accesorio: AccesorioMambo;
  velocidad: number | "Turbo" | null;
  temperatura_c: number | null;
  potencia_calorifica: number | null;
  /** Duration in minutes (may be fractional, e.g. 20 s = 0.33). */
  tiempo_minutos: number | null;
  /** Upper bound when the source gives a range ("2-3 minutos"). */
  tiempo_max_minutos?: number | null;
  tipo_paso?: TipoPasoMambo;
  /** Conversion confidence: alta (explicit 1:1), media (documented approximation), baja (review needed). */
  confianza?: ConfianzaConversion;
  /** True when the parser could not fully convert the step. Never guess silently. */
  sin_convertir?: boolean;
  /** Progressive speed ramp ("velocidad progresiva 5-7-9"), not programmable on the Mambo. */
  velocidad_progresiva?: number[];
  /** Human-readable conversion notes (mapping rationale, limits exceeded, manual actions). */
  notas_conversion?: string[];
};

export type Recipe = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  categoria: string;
  tiempo_total_min: number;
  comensales: number;
  dificultad: "Fácil" | "Media" | "Difícil";
  ingredientes: string[];
  pasos_mambo: MamboStep[];
  fuente_url?: string;
  creado_en: string;
  destacada?: boolean;
};

export type Category = {
  slug: string;
  nombre: string;
  descripcion: string;
  icono: string;
};
