import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

type Lineup = { PT:(number|null)[]; DF:(number|null)[]; MC:(number|null)[]; DL:(number|null)[] };

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

function buildSummaryText({
  formation, lineup, captainId, participantName, participantEmail,
}: {
  formation: string; lineup: Lineup; captainId: number|null;
  participantName: string; participantEmail: string;
}) {
  const POS = ["PT","DF","MC","DL"] as const;
  const byId: Record<number, string> = {
    1:"Ari Rodríguez",2:"Paula Díaz",3:"Ana García",4:"Ana Fernández",5:"Nata Martín",6:"Celia Huon",
    7:"Paula Escola",8:"Judith Antón",9:"Noemi Antón",10:"María Alonso",11:"Yaiza García",12:"Andrea Hernández",
    13:"Jasmine Sayagués",14:"Alba Muñiz",
  };
  const roleLines = POS.map((r) => {
    const names = (lineup as any)[r].map((id:number|null)=> id ? byId[id] : "—");
    return `${r}: ${names.join(", ")}`;
  }).join("\n");
  const cap = captainId ? byId[captainId] : "—";
  return `Fantasy – Selección

Formación: ${formation}
${roleLines}

Capitana: ${cap}

Participante: ${participantName} <${participantEmail}>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });

  const { formation, lineup, captainId, participantName, participantEmail, botField } = req.body || {};
  const from = process.env.MAIL_FROM || "";
  const to = process.env.MAIL_TO || "";

  console.log("[submit] start", {
    hasApiKey: !!process.env.RESEND_API_KEY, from, to,
    botField, hasLineup: !!lineup
  });

  if (typeof botField === "string" && botField.trim() !== "") {
    console.warn("[submit] honeypot triggered, skipping send");
    return res.status(200).json({ ok:true, skipped:"honeypot" });
  }

  if (!from || !to) {
    console.error("[submit] missing FROM/TO", { from, to });
    return res.status(500).json({ ok:false, error:"Server missing MAIL_FROM / MAIL_TO" });
  }
  if (!formation || !lineup || !participantName || !participantEmail) {
    console.error("[submit] missing fields", { formation:!!formation, lineup:!!lineup, participantName, participantEmail });
    return res.status(400).json({ ok:false, error:"Missing fields" });
  }

  const text = buildSummaryText({
    formation, lineup,
    captainId: typeof captainId === "number" ? captainId : null,
    participantName, participantEmail
  });

  try {
    console.log("[submit] calling Resend.emails.send");
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Fantasy – Nuevo equipo enviado",
      text,
      // reply_to: participantEmail,
    });

    if (error) {
      console.error("[submit] Resend error:", error);
      return res.status(500).json({ ok:false, error: String(error) });
    }

    console.log("[submit] resend data", data);
    return res.status(200).json({ ok:true, id: data?.id ?? null });
  } catch (e:any) {
    console.error("[submit] unexpected error:", e?.message || e);
    return res.status(500).json({ ok:false, error: e?.message || "Unexpected error" });
  }
}
