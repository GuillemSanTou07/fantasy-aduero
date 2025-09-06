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

const PLAYERS = new Map<number, string>([
  [1, "Ari Rodríguez"], [2, "Paula Díaz"], [3, "Ana García"], [4, "Ana Fernández"],
  [5, "Nata Martín"], [6, "Celia Huon"], [7, "Paula Escola"], [8, "Judith Antón"],
  [9, "Noemi Antón"], [10, "María Alonso"], [11, "Yaiza García"], [12, "Andrea Hernández"],
  [13, "Jasmine Sayagués"], [14, "Alba Muñiz"],
]);

function buildSummaryText(b: Body) {
  const POS: Role[] = ["PT", "DF", "MC", "DL"];
  const roleLines = POS
    .map((r) => {
      const names = (b.lineup[r] || [])
        .map((id) => (id ? `- ${PLAYERS.get(id) || "—"}` : "- —"))
        .join("\n");
      return `${r}:\n${names}`;
    })
    .join("\n\n");
  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";
  return `Fantasy Amigas del Duero – Confirmación de envío

Formación: ${b.formation}

${roleLines}

Capitana: ${cap}

Resultados y clasificación: Instagram @amigasdelduero
Reglas: un equipo por jornada. Si envías varios con el mismo nombre, solo cuenta el último.

Participante: ${b.participantName} <${b.participantEmail}>`;
}

function buildSummaryHtml(b: Body) {
  const POS: Role[] = ["PT", "DF", "MC", "DL"];

  const rows = POS.map((r) => {
    const names = (b.lineup[r] || [])
      .map((id) => `<li style="margin:4px 0;">${id ? (PLAYERS.get(id) || "—") : "—"}</li>`)
      .join("");
    return `
      <tr>
        <td style="padding:10px;border:1px solid #e5e7eb;background:#f9fafb;width:120px;">
          <strong>${r}</strong>
        </td>
        <td style="padding:10px;border:1px solid #e5e7eb;">
          <ul style="margin:0;padding-left:18px;list-style:disc;">${names}</ul>
        </td>
      </tr>`;
  }).join("");

  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";

  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;background:#f3f4f6;padding:24px;">
    <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
      <div style="background:#0f172a;color:#fff;padding:18px 20px;">
        <h1 style="margin:0;font-size:20px;">⚽ Fantasy Amigas del Duero</h1>
        <div style="font-size:13px;opacity:.9;">Confirmación de equipo</div>
      </div>

      <div style="padding:20px;">
        <p style="margin:0 0 12px;">¡Hola <strong>${b.participantName}</strong>! 🎉</p>
        <p style="margin:0 0 16px;">Tu equipo se ha registrado correctamente. Este es el resumen:</p>

        <p style="margin:0 0 8px;"><strong>Formación:</strong> ${b.formation}</p>

        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0;">
          <tbody>
            ${rows}
            <tr>
              <td style="padding:10px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Capitana</strong></td>
              <td style="padding:10px;border:1px solid #e5e7eb;">${cap}</td>
            </tr>
          </tbody>
        </table>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-top:16px;">
          <p style="margin:0 0 6px;">📢 <strong>Resultados y clasificación:</strong> se publicarán en nuestro Instagram oficial 
            <a href="https://instagram.com/amigasdelduero" style="color:#2563eb;text-decoration:none;">@amigasdelduero</a>.
          </p>
          <p style="margin:0;">ℹ️ <strong>Reglas:</strong> cada participante solo podrá enviar un equipo por jornada. Si hay varios equipos con el mismo nombre, <strong>se tomará en cuenta únicamente el último</strong>.</p>
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
      subject: "Fantasy – Nuevo equipo enviado",
      text,
      html,
      replyTo: participantEmail,
    });

    // 2) Mail de confirmación al participante
    const mailToParticipant = sgMail.send({
      to: participantEmail,
      from: FROM,
      subject: "✅ Fantasy Amigas del Duero – Hemos recibido tu equipo",
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
