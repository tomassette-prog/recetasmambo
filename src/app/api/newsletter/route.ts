import fs from "node:fs";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "data", "newsletter.json");

function loadEmails(): string[] {
  try {
    if (fs.existsSync(STORE_PATH)) return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  } catch {}
  return [];
}

function saveEmail(email: string): void {
  const emails = loadEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(emails, null, 2), "utf-8");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email || !email.includes("@")) {
      return Response.json({ ok: false, error: "Email inválido." }, { status: 400 });
    }

    saveEmail(email);
    return Response.json({ ok: true, message: "¡Suscrito! Revisa tu correo." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
