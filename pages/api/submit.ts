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

// Jugadoras
const PLAYERS = new Map<number, string>([
  [1, "Ari Rodríguez"], [2, "Paula Díaz"], [3, "Ana García"], [4, "Ana Fernández"],
  [5, "Nata Martín"], [6, "Celia Huon"], [7, "Paula Escola"], [8, "Judith Antón"],
  [9, "Noemi Antón"], [10, "María Alonso"], [11, "Yaiza García"], [12, "Andrea Hernández"],
  [13, "Jasmine Sayagués"], [14, "Alba Muñiz"],
]);

// ===== Helpers de render =====
const roleOrder: Role[] = ["DL", "MC", "DF", "PT"]; // arriba -> abajo
const roleColor = (r: Role) =>
  r === "PT" ? "#f59e0b" : r === "DF" ? "#3b82f6" : r === "MC" ? "#10b981" : "#ef4444";

/** Badge de posición, centrado exacto (24x24, line-height:24px) */
function roleBadge(role: Role) {
  return `
    <span style="
      display:inline-block;width:24px;height:24px;line-height:24px;
      border-radius:9999px;text-align:center;color:#fff;font-size:12px;font-weight:900;
      vertical-align:middle;background:${roleColor(role)};">${role}</span>
  `;
}

/** Badge de capitana flotante (sobresale arriba-derecha) */
function captainBadge() {
  return `
    <span style="
      position:absolute;top:-10px;right:-10px;
      display:inline-block;width:22px;height:22px;line-height:22px;
      border-radius:9999px;text-align:center;font-weight:900;font-size:12px;
      background:#fde68a;border:2px solid #f59e0b;color:#92400e;">C</span>
  `;
}

/** Tarjeta: MISMO tamaño siempre; badge + nombre alineados en la MISMA línea */
function card(role: Role, name: string, isCaptain: boolean) {
  return `
    <div style="
      display:inline-block;min-width:150px;max-width:210px;
      background:#ffffff;border-radius:12px;border:2px solid ${roleColor(role)};
      box-shadow:0 2px 6px rgba(0,0,0,.08);padding:10px 12px;margin:6px;
      text-align:left;position:relative;vertical-align:top;">
      ${isCaptain ? captainBadge() : ""}
      <div style="display:inline-flex;align-items:center;">
        ${roleBadge(role)}
        <span style="display:inline-block;margin-left:12px;
          font-size:15px;font-weight:700;white-space:nowrap;
          height:24px;line-height:24px;vertical-align:middle;">${name}</span>
      </div>
    </div>
  `;
}

function lineupRowsHTML(b: Body) {
  return roleOrder
    .map((role) => {
      const ids = b.lineup[role] || [];
      const cells = ids
        .map((id) =>
          id
            ? card(role, PLAYERS.get(id) || "—", id === b.captainId!)
            : `<div style="display:inline-block;min-width:150px;max-width:210px;
                 border:2px dashed rgba(255,255,255,.85);border-radius:12px;color:#fff;
                 padding:10px 12px;margin:6px;text-align:center;">—</div>`
        )
        .join("");
      return `
        <tr>
          <td style="padding:10px;">
            <div style="text-align:center;">${cells}</div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ===== Emails =====

// Participante (HTML bonito)  << CAMBIADO: se eliminan contenedores “caja” para evitar quote
function buildParticipantHtml(b: Body) {
  const rows = lineupRowsHTML(b);
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

        <!-- Secciones en texto plano para evitar “Mostrar texto citado” en Gmail -->
        <div style="margin-top:14px;">
          <p style="margin:0 0 6px 0;">
            📣 <strong>Resultados y clasificación:</strong> se publicarán en Instagram
            <a href="https://instagram.com/fansamigosdelduero" style="color:#2563eb;text-decoration:none;">@fansamigosdelduero</a>.
          </p>
          <p style="margin:10px 0 4px 0;"><strong>ℹ️ Reglas</strong></p>
          <ul style="margin:0;padding-left:18px;">
            <li>Selecciona tu formación y escoge hasta 5 jugadoras.</li>
            <li>Selecciona una capitana (los puntos que haga se multiplicarán x2).</li>
          </ul>
        </div>

        <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">Si no fuiste tú, ignora este mensaje.</p>
      </div>
    </div>
  </body>
</html>`;
}

// Participante (texto)
function buildParticipantText(b: Body) {
  const lines = roleOrder
    .map((r) => (b.lineup[r] || []).map((id) => `- ${id ? PLAYERS.get(id) || "—" : "—"}`).join("\n"))
    .join("\n\n");
  return `Fantasy – Amigos del Duero · Confirmación de envío

Formación: ${b.formation}

${lines}

Resultados y clasificación: Instagram @fansamigosdelduero
Regla: un equipo por jornada (si envías varios con el mismo nombre, cuenta el último).`;
}

// Organización (solo lo esencial)
function buildOrgHtml(b: Body) {
  const rows = lineupRowsHTML(b);
  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:16px;">
    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#0f172a;color:#fff;padding:14px 16px;">
        <h2 style="margin:0;font-size:18px;">Fantasy – Amigos del Duero · Nuevo equipo</h2>
      </div>
      <div style="padding:16px;">
        <p style="margin:0 0 6px;"><strong>Participante:</strong> ${b.participantName} &lt;${b.participantEmail}&gt;</p>
        <p style="margin:0 0 10px;"><strong>Formación:</strong> ${b.formation}</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:linear-gradient(#15803d,#065f46);border-radius:12px;">
          <tbody>
            <tr>
              <td style="padding:8px 12px;">
                <div style="border:2px solid rgba(255,255,255,.35);border-radius:10px;padding:8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                    ${rows}
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </body>
</html>`;
}

function buildOrgText(b: Body) {
  const lines = roleOrder
    .map((r) => (b.lineup[r] || []).map((id) => `- ${id ? PLAYERS.get(id) || "—" : "—"}`).join("\n"))
    .join("\n\n");
  return `Fantasy – Amigos del Duero · Nuevo equipo

Participante: ${b.participantName} <${b.participantEmail}>
Formación: ${b.formation}

${lines}`;
}

// ===== Handler API =====
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { formation, lineup, captainId, participantName, participantEmail, botField } = req.body as Body;

  // Honeypot
  if (botField && botField.trim() !== "") return res.status(200).json({ ok: true, skipped: "honeypot" });

  // Validaciones
  if (!formation || !lineup || !participantName || !participantEmail)
    return res.status(400).json({ ok: false, error: "Campos obligatorios faltan" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participantEmail))
    return res.status(400).json({ ok: false, error: "Email no válido" });

  const counts = formation.split("-").map((n) => parseInt(n, 10));
  const needed = counts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  if (chosen !== needed) return res.status(400).json({ ok: false, error: "Alineación incompleta" });
  if (!captainId) return res.status(400).json({ ok: false, error: "Selecciona capitana" });

  const payload: Body = { formation, lineup, captainId, participantName, participantEmail };

  const participantText = buildParticipantText(payload);
  const participantHtml = buildParticipantHtml(payload);
  const orgText = buildOrgText(payload);
  const orgHtml = buildOrgHtml(payload);

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "Falta SENDGRID_API_KEY" });
  sgMail.setApiKey(apiKey);

  const ORG_TO = "fantasyamigosdelduero@gmail.com";
  const FROM = "info@fantasyaduero.es";

  try {
    const mailToOrg = sgMail.send({
      to: ORG_TO,
      from: FROM,
      subject: "Fantasy – Amigos del Duero · Nuevo equipo",
      text: orgText,
      html: orgHtml,
      replyTo: participantEmail,
    });

    const mailToParticipant = sgMail.send({
      to: participantEmail,
      from: FROM,
      subject: "✅ Fantasy – Amigos del Duero · Hemos recibido tu equipo",
      text: participantText,
      html: participantHtml,
    });

    await Promise.all([mailToOrg, mailToParticipant]);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[sendgrid] error:", err?.response?.body || err);
    return res.status(500).json({ ok: false, error: "No se pudo enviar el email" });
  }
}
