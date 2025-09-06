// pages/index.tsx
import React, { useState } from "react";

type Role = "PT" | "DF" | "MC" | "DL";
const POS: Role[] = ["PT", "DF", "MC", "DL"];
const FORMATIONS = [
  "0-1-1-3","0-1-2-2","0-1-3-1","0-2-1-2","0-2-2-1","0-3-1-1","1-1-1-2","1-1-2-1","1-2-1-1",
];

const PLAYERS: Record<number, string> = {
  1: "Ari Rodríguez", 2: "Paula Díaz", 3: "Ana García", 4: "Ana Fernández",
  5: "Nata Martín", 6: "Celia Huon", 7: "Paula Escola", 8: "Judith Antón",
  9: "Noemi Antón", 10: "María Alonso", 11: "Yaiza García", 12: "Andrea Hernández",
  13: "Jasmine Sayagués", 14: "Alba Muñiz",
};

export default function Home() {
  const [formation, setFormation] = useState(FORMATIONS[6]); // 1-1-1-2 por defecto
  const [lineup, setLineup] = useState<Record<Role, Array<number | null>>>({
    PT: [null], DF: [null], MC: [null], DL: [null, null],
  });
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function playersFor(role: Role) {
    return Object.entries(PLAYERS).map(([id, name]) => (
      <option key={id} value={id}>{name}</option>
    ));
  }

  function onChangeFormation(f: string) {
    setFormation(f);
    const [pt, df, mc, dl] = f.split("-").map(n => parseInt(n, 10) || 0);
    setLineup({
      PT: Array(pt).fill(null),
      DF: Array(df).fill(null),
      MC: Array(mc).fill(null),
      DL: Array(dl).fill(null),
    });
    setCaptainId(null);
  }

  function setSlot(role: Role, idx: number, val: string) {
    setLineup(prev => {
      const copy = { ...prev };
      const arr = [...(copy[role] || [])];
      arr[idx] = val ? parseInt(val, 10) : null;
      copy[role] = arr;
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation, lineup, captainId, participantName, participantEmail, botField: "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error");
      setMsg("✅ Enviado correctamente. Revisa tu email de confirmación.");
    } catch (err: any) {
      setMsg("❌ No se pudo enviar. Revisa los campos e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4">
          Fantasy – Amigas del Duero
        </h1>

        {/* Formaciones */}
        <div className="flex flex-wrap gap-2 bg-white rounded-xl p-3 shadow-sm mb-4">
          {FORMATIONS.map(f => (
            <button
              key={f}
              onClick={() => onChangeFormation(f)}
              className={`px-3 py-1 rounded-full border text-sm
                 ${formation === f ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Campo centrado */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl rounded-3xl p-4"
               style={{ background: "linear-gradient(180deg,#166534,#065f46)" }}>
            <div className="rounded-2xl border border-emerald-900/40 p-3 bg-white/5">
              {/* Slots por rol, de abajo arriba: PT, DF, MC, DL */}
              <div className="space-y-4">
                {[..."DLMCDFPT".match(/(..)/g)!.reverse()].map(r => null)}
                {/* DL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center">
                  {(lineup.DL || []).map((id, i) => (
                    <div key={`DL-${i}`} className="w-full">
                      <select
                        className="w-full rounded-xl bg-white/90 p-3 shadow focus:outline-none"
                        value={id ?? ""}
                        onChange={(e) => setSlot("DL", i, e.target.value)}
                      >
                        <option value="">Añadir DL</option>
                        {playersFor("DL")}
                      </select>
                      <div className="text-xs mt-1 text-slate-500">DL</div>
                    </div>
                  ))}
                </div>
                {/* MC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center">
                  {(lineup.MC || []).map((id, i) => (
                    <div key={`MC-${i}`} className="w-full">
                      <select
                        className="w-full rounded-xl bg-white/90 p-3 shadow focus:outline-none"
                        value={id ?? ""}
                        onChange={(e) => setSlot("MC", i, e.target.value)}
                      >
                        <option value="">Añadir MC</option>
                        {playersFor("MC")}
                      </select>
                      <div className="text-xs mt-1 text-slate-500">MC</div>
                    </div>
                  ))}
                </div>
                {/* DF */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-center">
                  {(lineup.DF || []).map((id, i) => (
                    <div key={`DF-${i}`} className="w-full">
                      <select
                        className="w-full rounded-xl bg-white/90 p-3 shadow focus:outline-none"
                        value={id ?? ""}
                        onChange={(e) => setSlot("DF", i, e.target.value)}
                      >
                        <option value="">Añadir DF</option>
                        {playersFor("DF")}
                      </select>
                      <div className="text-xs mt-1 text-slate-500">DF</div>
                    </div>
                  ))}
                </div>
                {/* PT */}
                <div className="grid grid-cols-1 gap-3 justify-items-center">
                  {(lineup.PT || []).map((id, i) => (
                    <div key={`PT-${i}`} className="w-full">
                      <select
                        className="w-full rounded-xl bg-white/90 p-3 shadow focus:outline-none"
                        value={id ?? ""}
                        onChange={(e) => setSlot("PT", i, e.target.value)}
                      >
                        <option value="">Añadir PT</option>
                        {playersFor("PT")}
                      </select>
                      <div className="text-xs mt-1 text-slate-500">PT</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="mt-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tu nombre</label>
                <input
                  className="w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Ej. Laura Pérez"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tu email</label>
                <input
                  className="w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="tu@email.com"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  required
                  type="email"
                />
              </div>
            </div>

            {/* Capitana */}
            <div className="mt-3">
              <label className="block text-sm text-slate-600 mb-1">Capitana</label>
              <select
                className="w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={captainId ?? ""}
                onChange={(e) => setCaptainId(e.target.value ? parseInt(e.target.value, 10) : null)}
                required
              >
                <option value="">Selecciona capitana</option>
                {Object.entries(PLAYERS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-4 w-full rounded-xl bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Enviar selección"}
            </button>

            {/* Regla bajo el botón (reemplaza la nota antigua) */}
            <p className="text-xs text-slate-500 mt-2">
              Cada participante solo podrá enviar un equipo por jornada. Si hay varios equipos al mismo nombre, se tomará en cuenta únicamente el último.
            </p>

            {msg && <p className="mt-3 text-sm">{msg}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
