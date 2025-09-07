import type { NextApiRequest, NextApiResponse } from "next";
import sgMail from "@sendgrid/mail";

type Role = "PT" | "DF" | "MC" | "DL";
type Body = {
  formation: string;
  lineup: Record<Role, Array<number | null>>;
  captainId: number | null;
  participantName: string;
  participantEmail: string;
  botField?: string;
};

const PLAYERS = new Map<number, string>([
  [1, "Ari Rodríguez"], [2, "Paula Díaz"], [3, "Ana García"], [4, "Ana Fernández"],
  [5, "Nata Martín"], [6, "Celia Huon"], [7, "Paula Escola"], [8, "Judith Antón"],
  [9, "Noemi Antón"], [10, "María Alonso"], [11, "Yaiza García"], [12, "Andrea Hernández"],
  [13, "Jasmine Sayagués"], [14, "Alba Muñiz"],
]);

const POS_COLORS: Record<Role, string> = {
  PT: "#f59e0b", DF: "#3b82f6", MC: "#10b981", DL: "#ef4444"
};

// -------- texto simple para la organización --------
function buildOrgText(b: Body) {
  const POS: Role[] = ["PT", "DF", "MC", "DL"];
  const roleLines = POS
    .map((r) => {
      const names = (b.lineup[r] || []).map((id) => (id ? PLAYERS.get(id) || "—" : "—"));
      // sin comas → más legible
      return `${r}: ${names.join(" · ")}`;
    })
    .join("\n");
  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";
  return `Fantasy – Selección

Formación: ${b.formation}
${roleLines}

Capitana: ${cap}

Participante: ${b.participantName} <${b.participantEmail}>`;
}

// -------- HTML para el participante (bonito + no "texto citado") --------
function buildParticipantHtml(b: Body) {
  const capId = b.captainId;
  const order: Role[] = ["DL", "MC", "DF", "PT"]; // de arriba a abajo en el campo

  // Tarjeta jugadora (HTML inline CSS para emails)
  const card = (role: Role, name: string, isCaptain: boolean) => {
    const border = isCaptain ? "2px solid #f59e0b" : `2px solid ${POS_COLORS[role]}`;
    const glow = isCaptain ? "0 2px 10px rgba(245,158,11,.35)" : "0 2px 6px rgba(0,0,0,.08)";
    return `
      <div style="position:relative;background:#fff;border:${border};border-radius:14px;padding:12px;box-shadow:${glow};margin:8px;min-height:76px;">
        <!-- rol arriba-izq -->
        <span style="position:absolute;left:-10px;top:-10px;width:26px;height:26px;border-radius:999px;background:${POS_COLORS[role]};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;">${role}</span>
        <!-- C arriba-der -->
        <span style="position:absolute;right:-10px;top:-10px;width:26px;height:26px;border-radius:999px;background:${isCaptain ? "#fde68a" : "#fff"};border:${isCaptain ? "2px solid #f59e0b" : "1px solid #e5e7eb"};color:#92400e;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">C</span>
        <div style="text-align:center;font-weight:800;font-size:16px;line-height:1.25;word-break:break-word;">${name}</div>
      </div>
    `;
  };

  // Fila del campo
  const row = (role: Role, ids: Array<number | null>) => {
    const items = (ids || [])
      .map((id) => (id ? card(role, PLAYERS.get(id) || "—", id === capId) : emptyCard()))
      .join("");
    return `<div style="display:flex;justify-content:center;gap:8px;margin:6px 0;">${items}</div>`;
  };

  const emptyCard = () =>
    `<div style="background:rgba(255,255,255,.08);border:2px dashed rgba(255,255,255,.7);border-radius:14px;padding:24px;margin:8px;min-width:120px;"></div>`;

  const pitch = `
    <div style="border-radius:22px;padding:14px;background:linear-gradient(135deg,#15803d,#065f46);box-shadow:inset 0 2px 8px rgba(0,0,0,.35);">
      <div style="border:2px solid rgba(255,255,255,.35);border-radius:18px;padding:10px;">
        ${order
          .filter((r) => (b.lineup[r] || []).length > 0)
          .map((r) => row(r, b.lineup[r]))
          .join("")}
      </div>
    </div>
  `;

  // Contenedor general: evitar “quoted text” → nada de blockquote ni prefijos “>”
  return `
  <!doctype html>
  <html lang="es"><head><meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:16px;">
      <div style="background:#0f172a;color:#fff;border-radius:12px 12px 0 0;padding:12px 16px;">
        <div style="font-weight:900;font-size:18px;">Fantasy – Amigos del Duero</div>
      </div>

      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px;">
        <p style="margin:0 0 8px 0;">¡Hola <strong>${escapeHtml(b.participantName)}</strong>! 🎉</p>
        <p style="margin:0 0 10px 0;">Tu equipo se ha registrado correctamente. Formación <strong>${b.formation}</strong>:</p>

        ${pitch}

        <div style="margin-top:12px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
          <div style="font-weight:800;margin-bottom:6px;">📣 Resultados y clasificación</div>
          <div>Se publicarán en Instagram <a href="https://instagram.com/fansamigosdelduero" style="color:#2563eb;text-decoration:none;">@fansamigosdelduero</a>.</div>
        </div>

        <div style="margin-top:10px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
          <div style="font-weight:800;margin-bottom:6px;">ℹ️ Reglas</div>
          <ul style="margin:0;padding-left:18px;">
            <li>Selecciona tu formación y escoge hasta 5 jugadoras.</li>
            <li>Selecciona una capitana (los puntos que haga se multiplicarán x2).</li>
          </ul>
        </div>

        <p style="color:#6b7280;margin-top:12px;">Si no fuiste tú, ignora este mensaje.</p>
      </div>
    </div>
  </body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { formation, lineup, captainId, participantName, participantEmail, botField } = req.body as Body;

  // Honeypot
  if (botField && botField.trim() !== "") return res.status(200).json({ ok: true, skipped: "honeypot" });

  // Validaciones
  if (!formation || !lineup || !participantName || !participantEmail)
    return res.status(400).json({ ok: false, error: "Campos obligatorios faltan" });

  const counts = formation.split("-").map((n) => parseInt(n, 10));
  const needed = counts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  if (chosen !== needed) return res.status(400).json({ ok: false, error: "Alineación incompleta" });
  if (!captainId) return res.status(400).json({ ok: false, error: "Selecciona capitana" });

  // SendGrid
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "Falta SENDGRID_API_KEY" });
  sgMail.setApiKey(apiKey);

  const ORG_TO = "fantasyamigosdelduero@gmail.com";
  const FROM = "info@fantasyaduero.es";

  const data: Body = { formation, lineup, captainId, participantName, participantEmail };

  try {
    // 1) Organización (texto simple y directo)
    await sgMail.send({
      to: ORG_TO,
      from: FROM,
      subject: "Fantasy – Nuevo equipo enviado",
      text: buildOrgText(data),
      replyTo: participantEmail,
    });

    // 2) Participante (HTML)
    await sgMail.send({
      to: participantEmail,
      from: FROM,
      subject: "Fantasy – Confirmación de tu equipo",
      html: buildParticipantHtml(data),
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[sendgrid] error:", err?.response?.body || err);
    return res.status(500).json({ ok: false, error: "No se pudo enviar el email" });
  }
}
