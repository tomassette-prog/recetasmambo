export type MamboStep = {
  paso_numero: number;
  instruccion: string;
  accesorio: "Cuchillas" | "Pala MamboMix" | "Ninguno";
  velocidad: number | "Turbo";
  temperatura_c: number | null;
  potencia_calorifica: number | null;
  tiempo_minutos: number | null;
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
