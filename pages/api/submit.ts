import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

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
  [1, "Ari Rodríguez"],
  [2, "Paula Díaz"],
  [3, "Ana García"],
  [4, "Ana Fernández"],
  [5, "Nata Martín"],
  [6, "Celia Huon"],
  [7, "Paula Escola"],
  [8, "Judith Antón"],
  [9, "Noemi Antón"],
  [10, "María Alonso"],
  [11, "Yaiza García"],
  [12, "Andrea Hernández"],
  [13, "Jasmine Sayagués"],
  [14, "Alba Muñiz"],
]);

function buildSummaryText(body: Body) {
  const POS: Role[] = ["PT", "DF", "MC", "DL"];
  const roleLines = POS.map((r) => {
    const names = (body.lineup[r] || []).map((id) => (id ? (PLAYERS.get(id) || "—") : "—"));
    return `${r}: ${names.join(", ")}`;
  }).join("\n");
  const cap = body.captainId ? PLAYERS.get(body.captainId) : "—";
  return `Fantasy – Selección\n\nFormación: ${body.formation}\n${roleLines}\n\nCapitana: ${cap}\n\nParticipante: ${body.participantName} <${body.participantEmail}>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  const { formation, lineup, captainId, participantName, participantEmail, botField } = req.body as Body;

  // Honeypot anti-bots
  if (botField) return res.status(400).send("Bad request");

  // Validaciones básicas
  if (!formation || !lineup || !participantName || !participantEmail) {
    return res.status(400).send("Campos obligatorios faltan");
  }
  const counts = formation.split("-").map((n) => parseInt(n, 10));
  const needed = counts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  if (chosen !== needed) return res.status(400).send("Alineación incompleta");
  if (!captainId) return res.status(400).send("Selecciona capitana");

  const text = buildSummaryText({ formation, lineup, captainId, participantName, participantEmail, botField });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.MAIL_TO || "08guillem80@gmail.com";
  const from = process.env.MAIL_FROM || "no-reply@example.com"; // Debe ser un dominio verificado en Resend

  try {
    await resend.emails.send({
      from,
      to,
      subject: "Fantasy – Nuevo equipo enviado",
      text,
    });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    // No exponer detalles de error al cliente
    return res.status(500).send("No se pudo enviar el email");
  }
}
