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
      const names = (b.lineup[r] || []).map((id) => (id ? PLAYERS.get(id) || "—" : "—"));
      return `${r}: ${names.join(", ")}`;
    })
    .join("\n");
  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";
  return `Fantasy – Selección

Formación: ${b.formation}
${roleLines}

Capitana: ${cap}

Participante: ${b.participantName} <${b.participantEmail}>`;
}

function buildSummaryHtml(b: Body) {
  const POS: Role[] = ["PT", "DF", "MC", "DL"];
  const rows = POS
    .map((r) => {
      const names = (b.lineup[r] || []).map((id) => (id ? PLAYERS.get(id) || "—" : "—"));
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;"><strong>${r}</strong></td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${names.join(", ")}</td>
      </tr>`;
    })
    .join("");

  const cap = b.captainId ? PLAYERS.get(b.captainId) : "—";

  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#111827;">
    <h2 style="margin:0 0 12px;">Fantasy – Confirmación de envío</h2>
    <p style="margin:0 0 16px;">¡Gracias por participar! Este es el resumen de tu equipo:</p>

    <p style="margin:0 0 8px;"><strong>Formación:</strong> ${b.formation}</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;margin:8px 0;">
      <tbody>
        ${rows}
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;"><strong>Capitana</strong></td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${cap}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin:16px 0 0;">Participante: <strong>${b.participantName}</strong> &lt;${b.participantEmail}&gt;</p>
    <p style="font-size:12px;color:#6b7280;">Si no fuiste tú, ignora este mensaje.</p>
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

  // Validación simple del email
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
  const FROM = "info@fantasyaduero.es"; // dominio autenticado en SendGrid

  try {
    // 1) Mail a la organización
    const mailToOrg = sgMail.send({
      to: ORG_TO,
      from: FROM,
      subject: "Fantasy – Nuevo equipo enviado",
      text,
      html: html, // opcional: también HTML para el staff
      replyTo: participantEmail, // para contestar al participante
    });

    // 2) Mail de confirmación al participante
    const mailToParticipant = sgMail.send({
      to: participantEmail,
      from: FROM,
      subject: "✅ Fantasy – Hemos recibido tu equipo",
      text:
        "¡Gracias por participar en Fantasy Amigas del Duero!\n\n" +
        "Este es el resumen de tu equipo:\n\n" +
        text +
        "\n\nSi no fuiste tú, ignora este email.",
      html: html,
    });

    await Promise.all([mailToOrg, mailToParticipant]);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[sendgrid] error:", err?.response?.body || err);
    return res.status(500).json({ ok: false, error: "No se pudo enviar el email" });
  }
}
