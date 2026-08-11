import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Recipe {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  categoria: string;
  tiempo_total_min: number;
  comensales: number;
  dificultad: string;
  ingredientes: string[];
}

// ---------------------------------------------------------------------------
// Categories (inlined to avoid ESM import issues)
// ---------------------------------------------------------------------------
const categories: { slug: string; nombre: string; icono: string }[] = [
  { slug: "sopas-y-cremas", nombre: "Sopas y Cremas", icono: "🥣" },
  { slug: "arroces", nombre: "Arroces", icono: "🍚" },
  { slug: "carnes", nombre: "Carnes", icono: "🥩" },
  { slug: "pescados", nombre: "Pescados", icono: "🐟" },
  { slug: "postres", nombre: "Postres", icono: "🍰" },
  { slug: "salsas", nombre: "Salsas", icono: "🫙" },
  { slug: "panes-masas", nombre: "Panes y Masas", icono: "🍞" },
  { slug: "verduras", nombre: "Verduras", icono: "🥦" },
  { slug: "bebidas", nombre: "Bebidas", icono: "🥤" },
  { slug: "legumbres", nombre: "Legumbres", icono: "🫘" },
];

// ---------------------------------------------------------------------------
// Color palette by category
// ---------------------------------------------------------------------------
const categoryColors: Record<string, { primary: string; secondary: string; text: string }> = {
  "sopas-y-cremas": { primary: "#F59E0B", secondary: "#D97706", text: "#FFFFFF" },
  arroces:          { primary: "#EAB308", secondary: "#CA8A04", text: "#FFFFFF" },
  carnes:           { primary: "#EF4444", secondary: "#DC2626", text: "#FFFFFF" },
  pescados:         { primary: "#06B6D4", secondary: "#0891B2", text: "#FFFFFF" },
  postres:          { primary: "#EC4899", secondary: "#DB2777", text: "#FFFFFF" },
  salsas:           { primary: "#F59E0B", secondary: "#D97706", text: "#FFFFFF" },
  "panes-masas":    { primary: "#A16207", secondary: "#854D0E", text: "#FFFFFF" },
  verduras:         { primary: "#22C55E", secondary: "#16A34A", text: "#FFFFFF" },
  bebidas:          { primary: "#3B82F6", secondary: "#2563EB", text: "#FFFFFF" },
  legumbres:        { primary: "#A855F7", secondary: "#9333EA", text: "#FFFFFF" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 2);
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len - 3) + "..." : str;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// ---------------------------------------------------------------------------
// SVG template
// ---------------------------------------------------------------------------
function generateSVG(recipe: Recipe): string {
  const cat = categories.find((c) => c.slug === recipe.categoria);
  const colors = categoryColors[recipe.categoria] ?? { primary: "#6366F1", secondary: "#4F46E5", text: "#FFFFFF" };
  const icon = cat?.icono ?? "🍽️";
  const titleLines = wrapText(recipe.titulo, 28);
  const ingredientPreview = recipe.ingredientes.slice(0, 5);

  const diffColors: Record<string, string> = { "Fácil": "#22C55E", "Media": "#F59E0B", "Difícil": "#EF4444" };
  const diffColor = diffColors[recipe.dificultad] ?? "#6B7280";

  const titleY = 280;
  const titleSpacing = 80;
  const extraLines = titleLines.length - 1;
  const baseBelow = titleY + extraLines * titleSpacing;

  return `<svg width="1000" height="1500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}"/>
      <stop offset="100%" style="stop-color:${colors.secondary}"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0)"/>
      <stop offset="60%" style="stop-color:rgba(0,0,0,0.05)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.3)"/>
    </linearGradient>
  </defs>

  <rect width="1000" height="1500" fill="url(#bg)"/>
  <rect width="1000" height="1500" fill="url(#overlay)"/>

  <circle cx="850" cy="200" r="120" fill="rgba(255,255,255,0.08)"/>
  <circle cx="150" cy="1350" r="90" fill="rgba(255,255,255,0.06)"/>

  <rect x="60" y="80" rx="30" ry="30" width="280" height="60" fill="rgba(255,255,255,0.2)"/>
  <text x="90" y="120" font-family="'Segoe UI', Arial, sans-serif" font-size="28" fill="${colors.text}" font-weight="500">${icon}  ${escapeXml(cat?.nombre ?? recipe.categoria)}</text>

  <rect x="370" y="80" rx="30" ry="30" width="150" height="60" fill="${diffColor}"/>
  <text x="395" y="120" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="#FFFFFF" font-weight="600">${escapeXml(recipe.dificultad)}</text>

  <rect x="550" y="80" rx="30" ry="30" width="200" height="60" fill="rgba(255,255,255,0.2)"/>
  <text x="580" y="120" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="${colors.text}" font-weight="500">⏱  ${recipe.tiempo_total_min} min</text>

  ${titleLines.map((line, i) => `<text x="500" y="${titleY + i * titleSpacing}" font-family="'Segoe UI', Arial, sans-serif" font-size="${titleLines.length > 1 ? 62 : 72}" fill="${colors.text}" font-weight="800" text-anchor="middle">${escapeXml(line)}</text>`).join("\n  ")}

  <rect x="80" y="${baseBelow + 30}" rx="4" ry="4" width="840" height="4" fill="rgba(255,255,255,0.3)"/>

  <text x="80" y="${baseBelow + 100}" font-family="'Segoe UI', Arial, sans-serif" font-size="36" fill="${colors.text}" font-weight="700">🥘  Ingredientes principales</text>

  ${ingredientPreview.map((ing, i) => `<circle cx="110" cy="${baseBelow + 160 + i * 55}" r="8" fill="rgba(255,255,255,0.6)"/>
  <text x="135" y="${baseBelow + 172 + i * 55}" font-family="'Segoe UI', Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.9)">${escapeXml(truncate(ing, 50))}</text>`).join("\n  ")}

  <rect x="60" y="${baseBelow + 470}" rx="20" ry="20" width="880" height="280" fill="rgba(255,255,255,0.12)"/>
  <text x="500" y="${baseBelow + 540}" font-family="'Segoe UI', Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-weight="500">📝 ${recipe.ingredientes.length} ingredientes  ·  ${recipe.comensales} comensales</text>
  <text x="500" y="${baseBelow + 600}" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.5)" text-anchor="middle">Adaptada para Mambo Cooking Total Gourmet</text>
  <text x="500" y="${baseBelow + 650}" font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.4)" text-anchor="middle">recetas completas en recetasmambo.com</text>

  <rect x="0" y="1380" width="1000" height="120" fill="rgba(0,0,0,0.25)"/>
  <text x="500" y="1448" font-family="'Segoe UI', Arial, sans-serif" font-size="34" fill="#FFFFFF" text-anchor="middle" font-weight="700" letter-spacing="2">RECETASMAMBO.COM</text>
  <text x="500" y="1478" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="middle" letter-spacing="1">Recetas Thermomix adaptadas a Mambo Cooking</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const ROOT = path.resolve(__dirname, "..");
  const recipesPath = path.join(ROOT, "data", "recipes.json");
  const recipes: Recipe[] = JSON.parse(fs.readFileSync(recipesPath, "utf-8"));

  const outDir = path.join(ROOT, "public", "images", "pinterest");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n🖼  Generando tarjetas Pinterest para ${recipes.length} recetas...\n`);

  let generated = 0;
  let errors = 0;

  for (const recipe of recipes) {
    const outFile = path.join(outDir, `${recipe.slug}.png`);
    try {
      const svg = generateSVG(recipe);
      await sharp(Buffer.from(svg)).resize(1000, 1500).png({ quality: 90 }).toFile(outFile);
      generated++;
      if (generated % 10 === 0) console.log(`   ✅ ${generated}/${recipes.length} generadas...`);
    } catch (err) {
      errors++;
      console.error(`   ❌ Error en "${recipe.titulo}":`, (err as Error).message);
    }
  }

  console.log(`\n✨ Listo: ${generated} tarjetas generadas en public/images/pinterest/`);
  if (errors > 0) console.log(`   ⚠️  ${errors} errores`);
}

main();
