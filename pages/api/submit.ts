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
  [1, "Ari Rodríguez"], [2, "Paula Díaz"], [3, "Ana García"], [4, "Ana Fernández"],
  [5, "Nata Martín"], [6, "Celia Huon"], [7, "Paula Escola"], [8, "Judith Antón"],
  [9, "Noemi Antón"], [10, "María Alonso"], [11, "Yaiza García"], [12, "Andrea Hernández"],
  [13, "Jasmine Sayagués"], [14, "Alba Muñiz"],
]);

function buildSummaryText(body: Body) {
  const POS: Role[] = ["PT", "DF", "MC", "DL"];
  const roleLines = POS.map((r) => {
    const names = (body.lineup[r] || []).map((id) => (id ? (PLAYERS.get(id) || "—") : "—"));
    return `${r}: ${names.join(", ")}`;
  }).join("\n");
  const cap = body.captainId ? PLAYERS.get(body.captainId) : "—";
  return `Fantasy – Selección

Formación: ${body.formation}
${roleLines}

Capitana: ${cap}

Participante: ${body.participantName} <${body.participantEmail}>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method Not Allowed" });

  const { formation, lineup, captainId, participantName, participantEmail, botField } = req.body as Body;

  // Honeypot anti-bots
  if (botField && botField.trim() !== "") return res.status(200).json({ ok:true, skipped:"honeypot" });

  // Validaciones básicas
  if (!formation || !lineup || !participantName || !participantEmail)
    return res.status(400).json({ ok:false, error:"Campos obligatorios faltan" });

  const counts = formation.split("-").map((n) => parseInt(n, 10));
  const needed = counts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  if (chosen !== needed) return res.status(400).json({ ok:false, error:"Alineación incompleta" });
  if (!captainId) return res.status(400).json({ ok:false, error:"Selecciona capitana" });

  const text = buildSummaryText({ formation, lineup, captainId, participantName, participantEmail });

  const resend = new Resend(process.env.RESEND_API_KEY || "");
  const to   = process.env.MAIL_TO   || "fantasyamigosdelduero@gmail.com";

  // 🔴 Para probar que todo funciona aunque el dominio no esté verificado:
  //    empieza usando "onboarding@resend.dev" como remitente.
  //    Cuando Resend marque tu dominio como Verified, cambia al MAIL_FROM.
  const from = (process.env.MAIL_FROM && process.env.MAIL_FROM.trim().length > 0)
    ? process.env.MAIL_FROM!
    : "onboarding@resend.dev"; // fallback de prueba válido

  try {
    // La librería devuelve { data, error } (NO lanza excepción)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Fantasy – Nuevo equipo enviado",
      text,
      // reply_to: participantEmail, // opcional
    });

    if (error) {
      console.error("[submit] Resend error:", JSON.stringify(error, null, 2));
      return res.status(500).json({ ok:false, error });
    }

    console.log("[submit] resend ok:", JSON.stringify(data, null, 2));
    return res.status(200).json({ ok:true, id: data?.id ?? null });
  } catch (e: any) {
    console.error("[submit] unexpected error:", e?.message || e);
    return res.status(500).json({ ok:false, error: e?.message || "Unexpected error" });
  }
}
