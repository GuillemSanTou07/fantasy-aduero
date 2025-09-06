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
  if (botField && botField.trim() !== "") return res.status(200).json({ ok: true, skipped: "honeypot" });

  // Validaciones básicas
  if (!formation || !lineup || !participantName || !participantEmail)
    return res.status(400).json({ ok: false, error: "Campos obligatorios faltan" });

  const counts = formation.split("-").map((n) => parseInt(n, 10));
  const needed = counts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  if (chosen !== needed) return res.status(400).json({ ok: false, error: "Alineación incompleta" });
  if (!captainId) return res.status(400).json({ ok: false, error: "Selecciona capitana" });

  const text = buildSummaryText({
    formation,
    lineup,
    captainId,
    participantName,
    participantEmail,
  });

  // --- SendGrid ---
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: "Falta SENDGRID_API_KEY" });

  sgMail.setApiKey(apiKey);

  const TO = "fantasyamigosdelduero@gmail.com";
  const FROM = "info@fantasyaduero.es"; // dominio ya autenticado en SendGrid

  try {
    await sgMail.send({
      to: TO,
      from: FROM,
      subject: "Fantasy – Nuevo equipo enviado",
      text,
      replyTo: participantEmail, // opcional, para contestar al participante
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[sendgrid] error:", err?.response?.body || err);
    return res.status(500).json({ ok: false, error: "No se pudo enviar el email" });
  }
}
