// pages/api/submit.ts
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

// Mapa de jugadoras
const PLAYERS = new Map<number, string>([
  [1, "Ari Rodríguez"], [2, "Paula Díaz"], [3, "Ana García"], [4, "Ana Fernández"],
  [5, "Nata Martín"], [6, "Celia Huon"], [7, "Paula Escola"], [8, "Judith Antón"],
  [9, "Noemi Antón"], [10, "María Alonso"], [11, "Yaiza García"], [12, "Andrea Hernández"],
  [13, "Jasmine Sayagués"], [14, "Alba Muñiz"],
]);

// ====== Texto plano (para clientes que no renderizan HTML) ======
function buildSummaryText(b: Body) {
  const order: Role[] = ["DL", "MC", "DF", "PT"]; // de arriba a abajo
  const roleLines = order.map((r) => {
    const items = (b.lineup[r] || [])
      .map((id) => `- ${id ? PLAYERS.get(id) || "—" : "—"}`)
      .join("\n");
    return `${r}:\n${items}`;
  }).join("\n\n");
  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";

  return `Fantasy – Amigos del Duero · Confirmación de envío

Formación: ${b.formation}

${roleLines}

Capitana: ${cap}

📢 Resultados y clasificación: Instagram @fansamigosdelduero
ℹ️ Regla: un equipo por jornada. Si envías varios con el mismo nombre, cuenta solo el último.

Participante: ${b.participantName} <${b.participantEmail}>`;
}

// ====== HTML “mini-campo” con líneas DL–MC–DF–PT ======
function buildSummaryHtml(b: Body) {
  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";
  const roleColor = (r: Role) =>
    r === "PT" ? "#f59e0b" : r === "DF" ? "#3b82f6" : r === "MC" ? "#10b981" : "#ef4444";
  const order: Role[] = ["DL", "MC", "DF", "PT"]; // arriba->abajo como en el campo

  // Tarjeta de jugadora “tipo app”
  const card = (role: Role, name: string, isCaptain: boolean) => `
    <div style="
      display:inline-block;min-width:120px;max-width:180px;
      background:#ffffff;border-radius:12px;border:2px solid ${roleColor(role)};
      box-shadow:0 2px 6px rgba(0,0,0,.08);padding:10px;margin:6px;text-align:left;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="
          display:inline-flex;align-items:center;justify-content:center;
          width:24px;height:24px;border-radius:999px;color:#fff;font-size:12px;font-weight:900;
          background:${roleColor(role)};">${role}</span>
        <span style="font-size:12px;font-weight:800;opacity:.7">${role}</span>
      </div>
      <div style="position:relative;">
        <div style="font-size:15px;font-weight:700;line-height:1.2;">${name}</div>
        ${
          isCaptain
            ? `<span style="
                 position:absolute;top:-10px;right:-10px;
                 width:24px;height:24px;border-radius:999px;
                 background:#fde68a;border:2px solid #f59e0b;color:#92400e;
                 font-size:12px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">
                 C
               </span>`
            : ""
        }
      </div>
      ${
        isCaptain
          ? `<div style="margin-top:6px;">
               <span style="font-size:11px;font-weight:800;padding:2px 6px;border-radius:999px;
               background:#fde68a;border:1px solid #f59e0b;color:#92400e;">CAPITANA</span>
             </div>`
          : ""
      }
    </div>
  `;

  // Filas por línea de juego
  const rows = order.map((role) => {
    const ids = b.lineup[role] || [];
    const cells = ids
      .map((id) =>
        id
          ? card(role, PLAYERS.get(id) || "—", id === b.captainId)
          : `<div style="display:inline-block;min-width:120px;max-width:180px;
                      border:2px dashed rgba(255,255,255,.85);border-radius:12px;color:#fff;
                      padding:10px;margin:6px;text-align:center;">Añadir</div>`
      )
      .join("");
    return `
      <tr>
        <td style="padding:10px;">
          <div style="text-align:center;">${cells}</div>
        </td>
      </tr>
    `;
  }).join("");

  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;background:#f3f4f6;padding:24px;">
    <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
      <div style="background:#0f172a;color:#fff;padding:18px 20px;">
        <h1 style="margin:0;font-size:20px;">⚽ Fantasy – Amigos del Duero</h1>
        <div style="font-size:13px;opacity:.9;">Confirmación de equipo</div>
      </div>

      <div style="padding:20px;">
        <p style="margin:0 0 12px;">¡Hola <strong>${b.participantName}</strong>! 🎉</p>
        <p style="margin:0 0 12px;">Tu equipo se ha registrado correctamente. Formación <strong>${b.formation}</strong>:</p>

        <!-- Mini campo -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:linear-gradient(#15803d,#065f46);border-radius:16px;">
          <tbody>
            <tr>
              <td style="padding:8px 12px;">
                <div style="border:2px solid rgba(255,255,255,.35);border-radius:12px;padding:8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                    ${rows}
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;">
          <tr>
            <td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
              <strong>Capitana:</strong> ${cap}
            </td>
          </tr>
        </table>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-top:16px;">
          <p style="margin:0 0 6px;">📢 <strong>Resultados y clasificación:</strong> se publicarán en Instagram 
            <a href="https://instagram.com/fansamigosdelduero" style="color:#2563eb;text-decoration:none;">@fansamigosdelduero</a>.
          </p>
          <p style="margin:0;">ℹ️ <strong>Reglas:</strong> un equipo por jornada. Si envías varios con el mismo nombre, <strong>solo cuenta el último</strong>.</p>
        </div>

        <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">Si no fuiste tú, ignora este mensaje.</p>
      </div>
    </div>
  </body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const {
    formation,
    lineup,
    captainId,
    participantName,
    participantEmail,
    botField,
  } = req.body as Body;

  // Honeypot anti-bots
  if (botField && botField.trim() !== "")
    return res.status(200).json({ ok: true, skipped: "honeypot" });

  // Validaciones básicas
  if (!formation || !lineup || !participantName || !participantEmail)
    return res.status(400).json({ ok: false, error: "Campos obligatorios faltan" });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participantEmail);
  if (!emailOk) return res.status(400).json({ ok: false, error: "Email no válido" });

  const counts = formation.split("-").map((n) => parseInt(n, 10));
  const needed = counts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  if (chosen !== needed) return res.status(400).json({ ok: false, error: "Alineación incompleta" });
  if (!captainId) return res.status(400).json({ ok: false, error: "Selecciona capitana" });

  const payload: Body = {
    formation,
    lineup,
    captainId,
    participantName,
    participantEmail,
  };

  const text = buildSummaryText(payload);
  const html = buildSummaryHtml(payload);

  // --- SendGrid ---
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "Falta SENDGRID_API_KEY" });
  sgMail.setApiKey(apiKey);

  const ORG_TO = "fantasyamigosdelduero@gmail.com";
  const FROM = "info@fantasyaduero.es";

  try {
    // 1) Mail a la organización
    const mailToOrg = sgMail.send({
      to: ORG_TO,
      from: FROM,
      subject: "Fantasy – Amigos del Duero · Nuevo equipo enviado",
      text,
      html,
      replyTo: participantEmail,
    });

    // 2) Mail de confirmación al participante
    const mailToParticipant = sgMail.send({
      to: participantEmail,
      from: FROM,
      subject: "✅ Fantasy – Amigos del Duero · Hemos recibido tu equipo",
      text,
      html,
    });

    await Promise.all([mailToOrg, mailToParticipant]);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[sendgrid] error:", err?.response?.body || err);
    return res.status(500).json({ ok: false, error: "No se pudo enviar el email" });
  }
}
