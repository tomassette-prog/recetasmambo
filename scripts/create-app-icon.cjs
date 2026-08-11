const sharp = require("sharp");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F59E0B"/>
      <stop offset="100%" style="stop-color:#D97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <text x="256" y="200" font-family="'Segoe UI', Arial, sans-serif" font-size="120" fill="white" text-anchor="middle" font-weight="800">🍳</text>
  <text x="256" y="360" font-family="'Segoe UI', Arial, sans-serif" font-size="80" fill="white" text-anchor="middle" font-weight="800">RM</text>
</svg>`;

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(path.join(ROOT, "public", "images", "pinterest-app-icon.png"))
  .then(() => console.log("✅ Icon created at public/images/pinterest-app-icon.png"))
  .catch((err) => console.error("Error:", err));
