import React from "react";

type Role = "PT" | "DF" | "MC" | "DL";

const POS: Role[] = ["PT", "DF", "MC", "DL"];
const POS_COLORS: Record<Role, string> = { PT: "#f59e0b", DF: "#3b82f6", MC: "#10b981", DL: "#ef4444" };
const FORMATIONS = [
  "0-1-1-3","0-1-2-2","0-1-3-1","0-2-1-2","0-2-2-1","0-3-1-1","1-1-1-2","1-1-2-1","1-2-1-1",
] as const;

type Player = { id: number; name: string; roles: Role[] };

const PLAYERS: Player[] = [
  { id: 1, name: "Ari Rodríguez", roles: ["DL"] },
  { id: 2, name: "Paula Díaz", roles: ["MC", "DF"] },
  { id: 3, name: "Ana García", roles: ["DL"] },
  { id: 4, name: "Ana Fernández", roles: ["DF"] },
  { id: 5, name: "Nata Martín", roles: ["MC"] },
  { id: 6, name: "Celia Huon", roles: ["DL", "MC"] },
  { id: 7, name: "Paula Escola", roles: ["DF"] },
  { id: 8, name: "Judith Antón", roles: ["DF"] },
  { id: 9, name: "Noemi Antón", roles: ["DF"] },
  { id: 10, name: "María Alonso", roles: ["PT"] },
  { id: 11, name: "Yaiza García", roles: ["DL"] },
  { id: 12, name: "Andrea Hernández", roles: ["DF", "MC", "DL"] },
  { id: 13, name: "Jasmine Sayagués", roles: ["DF"] },
  { id: 14, name: "Alba Muñiz", roles: ["MC"] },
];

const hasRole = (p: Player, r: Role) => (p.roles || []).includes(r);
const byId = Object.fromEntries(PLAYERS.map((p) => [p.id, p])) as Record<number, Player>;

function formationToCounts(f: typeof FORMATIONS[number]) {
  const [pt, df, mc, dl] = f.split("-").map((n) => parseInt(n, 10));
  return { PT: pt || 0, DF: df || 0, MC: mc || 0, DL: dl || 0 };
}

// ===== Helper para el texto (si lo necesitas en algún sitio) =====
function buildSummaryText({
  formation, lineup, captainId, participantName, participantEmail,
}: {
  formation: typeof FORMATIONS[number];
  lineup: Record<Role, Array<number | null>>;
  captainId: number | null;
  participantName: string;
  participantEmail: string;
}) {
  const roleLines = POS.map((r) => {
    const names = (lineup[r] || []).map((id) => (id ? byId[id]?.name : "—"));
    return `${r}: ${names.join(", ")}`;
  }).join("\n");
  const cap = captainId ? byId[captainId]?.name : "—";
  return `Fantasy – Amigos del Duero\n\nFormación: ${formation}\n${roleLines}\n\nCapitana: ${cap}\n\nParticipante: ${participantName} <${participantEmail}>`;
}

function useLineup(formation: typeof FORMATIONS[number]) {
  const counts = React.useMemo(() => formationToCounts(formation), [formation]);
  const makeEmpty = React.useMemo(
    () => (r: Role) => Array.from({ length: counts[r] as number }, () => null as number | null),
    [counts]
  );
  const [lineup, setLineup] = React.useState<Record<Role, Array<number | null>>>({
    PT: makeEmpty("PT"), DF: makeEmpty("DF"), MC: makeEmpty("MC"), DL: makeEmpty("DL"),
  });

  React.useEffect(() => {
    setLineup((prev) => {
      const resize = (arr: Array<number | null>, n: number) => {
        const kept = (arr || []).filter(Boolean).slice(0, n) as Array<number | null>;
        while (kept.length < n) kept.push(null);
        return kept;
      };
      return {
        PT: resize(prev.PT, counts.PT),
        DF: resize(prev.DF, counts.DF),
        MC: resize(prev.MC, counts.MC),
        DL: resize(prev.DL, counts.DL),
      };
    });
  }, [counts]);

  return { lineup, setLineup, counts };
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={String(children)} className={`chip ${active ? "chip--active" : ""}`}>
      {children}
      <style jsx>{`
        .chip {
          padding: 8px 12px; border-radius: 999px; border: 1px solid #e5e7eb;
          background: #fff; color: #111827; font-weight: 700; cursor: pointer;
        }
        .chip--active { border-color: #111827; background: #111827; color: #fff; }
      `}</style>
    </button>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      style={{
        display: "inline-block", width: 24, height: 24, lineHeight: "24px",
        textAlign: "center", borderRadius: 999, background: POS_COLORS[role],
        color: "#fff", fontSize: 12, fontWeight: 900, verticalAlign: "middle"
      }}
    >
      {role}
    </span>
  );
}

type Slot = {
  role: Role;
  player: Player | null;
  isCaptain?: boolean;
  onClick?: () => void;
  onCaptain?: () => void;
};

function Pitch({ rows }: { rows: Array<{ role: Role; players: Slot[] }> }) {
  return (
    <div className="pitchWrap">
      <div className="pitch" style={{
        borderRadius: 24, padding: 16, background: "linear-gradient(#15803d,#065f46)",
        position: "relative", overflow: "hidden", boxShadow: "inset 0 2px 8px rgba(0,0,0,.35)",
      }}>
        <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,.35)", borderRadius: 20 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((row, idx) => {
            const n = row.players.length || 1;
            const colWidth = Math.max(20, Math.floor(100 / n) - 2);
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                {row.players.map((slot, i) => (
                  <button
                    key={i}
                    onClick={slot.onClick}
                    style={{
                      width: `${colWidth}%`, maxWidth: 220, minWidth: 120, minHeight: 92,
                      borderRadius: 16,
                      border: slot.player ? `2px solid ${POS_COLORS[slot.role]}` : "2px dashed rgba(255,255,255,.7)",
                      background: slot.player ? "#fff" : "rgba(255,255,255,.1)",
                      color: slot.player ? "#111827" : "#fff",
                      padding: 10, cursor: "pointer",
                      boxShadow: slot.player ? "0 2px 6px rgba(0,0,0,.08)" : "none",
                      position: "relative",
                    }}
                  >
                    {slot.player ? (
                      <div style={{ display: "inline-flex", alignItems: "center" }}>
                        <RoleBadge role={slot.role} />
                        <span style={{
                          display: "inline-block", marginLeft: 12, fontSize: 15, fontWeight: 700,
                          height: 24, lineHeight: "24px", verticalAlign: "middle", whiteSpace: "nowrap"
                        }}>
                          {slot.player.name}
                        </span>
                        {/* C de capitana arriba-derecha, sobresaliendo un poco */}
                        {slot.isCaptain && (
                          <span style={{
                            position: "absolute", top: -10, right: -10,
                            display: "inline-block", width: 22, height: 22, lineHeight: "22px",
                            textAlign: "center", borderRadius: 999,
                            background: "#fde68a", border: "2px solid #f59e0b", color: "#92400e",
                            fontWeight: 900, fontSize: 12
                          }}>C</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", fontWeight: 700 }}>Añadir</div>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .pitchWrap { display: flex; justify-content: center; }
        .pitch { width: 100%; max-width: 680px; }
      `}</style>
    </div>
  );
}

export default function App() {
  const [formation, setFormation] = React.useState<typeof FORMATIONS[number]>("1-1-1-2");
  const { lineup, setLineup, counts } = useLineup(formation);
  const [captainId, setCaptainId] = React.useState<number | null>(null);
  const [modal, setModal] = React.useState<{ role: Role; index: number } | null>(null);

  const selected = new Set(Object.values(lineup).flat().filter(Boolean) as number[]);
  const roleOptions = React.useMemo(
    () => ({
      PT: PLAYERS.filter((p) => hasRole(p, "PT")),
      DF: PLAYERS.filter((p) => hasRole(p, "DF")),
      MC: PLAYERS.filter((p) => hasRole(p, "MC")),
      DL: PLAYERS.filter((p) => hasRole(p, "DL")),
    }),
    []
  );

  function openSlot(role: Role, index: number) { setModal({ role, index }); }
  function choosePlayer(id: number) {
    setLineup((prev) => {
      const next: Record<Role, Array<number | null>> = { ...prev, [modal!.role]: [...prev[modal!.role]] } as any;
      POS.forEach((r) => { next[r] = next[r].map((x) => (x === id ? null : x)); });
      next[modal!.role][modal!.index] = id;
      return next;
    });
    setModal(null);
  }
  function clearSlot() {
    setLineup((prev) => {
      const arr = [...prev[modal!.role]];
      arr[modal!.index] = null;
      return { ...prev, [modal!.role]: arr };
    });
    setModal(null);
  }

  // Filas del campo (DL, MC, DF, PT)
  const rows = React.useMemo(() => {
    const displayOrder: Role[] = ["DL", "MC", "DF", "PT"].filter((r) => (counts as any)[r] > 0) as Role[];
    return displayOrder.map((role) => ({
      role,
      players: lineup[role].map((id, i) => ({
        role,
        player: id ? byId[id] : null,
        isCaptain: id === captainId,
        onClick: () => openSlot(role, i),
        onCaptain: () => {
          if (!id) return;
          setCaptainId((c) => (c === id ? null : id));
        },
      })),
    }));
  }, [counts, lineup, captainId]);

  // Formulario / envío
  const [participantName, setParticipantName] = React.useState("");
  const [participantEmail, setParticipantEmail] = React.useState("");
  const [botField, setBotField] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Estado de validez para habilitar el botón
  const needed = (counts.PT + counts.DF + counts.MC + counts.DL) as number;
  const chosen = Object.values(lineup).flat().filter(Boolean).length;
  const isValid = chosen === needed && !!captainId && !!participantName && !!participantEmail;

  // Modal confirmación
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function doSend() {
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation, lineup, captainId, participantName, participantEmail, botField,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Error al enviar");
      setMsg({ type: "ok", text: "✅ Enviado correctamente. Revisa tu email de confirmación." });
      setConfirmOpen(false);
    } catch (e: any) {
      setMsg({ type: "err", text: "❌ No se pudo enviar. Inténtalo de nuevo." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", color: "#111827" }}>
      <div className="outer">
        <header className="header">
          <h1 className="title">Fantasy – Amigos del Duero</h1>
          <a href="https://instagram.com/fansamigosdelduero" target="_blank" rel="noreferrer" className="ig">@fansamigosdelduero</a>
          <div style={{ flex: 1 }} />
        </header>

        {/* Formaciones */}
        <section className="card">
          <div className="chips">
            {FORMATIONS.map((f) => (
              <Chip key={f} active={formation === f} onClick={() => setFormation(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </section>

        {/* Campo */}
        <section style={{ marginBottom: 16 }}>
          <Pitch rows={rows} />
        </section>

        {/* Formulario */}
        <section className="card">
          <div className="formGrid">
            <div>
              <label className="label">Tu nombre</label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ej. Laura Pérez"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Tu email</label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="tu@email.com"
                className="input"
                required
              />
            </div>

            {/* Honeypot */}
            <div style={{ display: "none" }} aria-hidden>
              <label>Deja esto vacío</label>
              <input value={botField} onChange={(e) => setBotField(e.target.value)} />
            </div>

            <div className="fullRow">
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!isValid || sending}
                className={`btn ${(!isValid || sending) ? "btn--disabled" : ""}`}
              >
                {sending ? "Enviando…" : "Confirmar y enviar"}
              </button>
            </div>
          </div>

          <p className="note">
            Cada participante solo podrá enviar un equipo por jornada. Si hay varios equipos al mismo nombre,
            <strong> se tomará en cuenta únicamente el último</strong>.
          </p>

          {msg && (
            <div className={`alert ${msg.type === "ok" ? "ok" : "err"}`}>
              {msg.text}
            </div>
          )}
        </section>

        {/* Modal de confirmación */}
        {confirmOpen && (
          <div className="modalBack" onClick={() => setConfirmOpen(false)}>
            <div className="modalCard" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 8px" }}>Confirmar envío</h3>
              <p style={{ marginTop: 0, color: "#4b5563" }}>
                Formación <strong>{formation}</strong> · {participantName} &lt;{participantEmail}&gt;
              </p>
              <div style={{ marginBottom: 12 }}>
                {/* Mini preview: solo texto simple */}
                <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", maxHeight: 200, overflow: "auto" }}>
{buildSummaryText({ formation, lineup, captainId, participantName, participantEmail })}
                </pre>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btnLight" onClick={() => setConfirmOpen(false)}>Volver</button>
                <button className="btn" onClick={doSend} disabled={sending}>{sending ? "Enviando…" : "Enviar ahora"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .outer { max-width: 1040px; margin: 0 auto; padding: 16px; }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .title { font-size: 22px; font-weight: 900; margin: 0; }
        .ig { font-size: 14px; color: #2563eb; text-decoration: none; }
        .ig:hover { text-decoration: underline; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
        .chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .label { display: block; font-size: 13px; margin-bottom: 6px; }
        .input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #d1d5db; }
        .btn { width: 100%; padding: 12px 14px; background: #111827; color: #fff; border: 0; border-radius: 12px; font-weight: 800; cursor: pointer; }
        .btn--disabled { opacity: .5; cursor: not-allowed; }
        .btnLight { padding: 10px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .note { margin-top: 12px; font-size: 12px; color: #6b7280; }
        .alert { margin-top: 10px; padding: 10px 12px; border-radius: 10px; font-weight: 600; }
        .alert.ok { background: #ecfdf5; color: #065f46; border: 1px solid #10b981; }
        .alert.err { background: #fef2f2; color: #991b1b; border: 1px solid #ef4444; }

        .formGrid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .fullRow { grid-column: 1 / -1; }
        @media (min-width: 768px) { .formGrid { grid-template-columns: 1fr 1fr; } }

        /* Modal */
        .modalBack { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .modalCard { width: 100%; max-width: 640px; background: #fff; border-radius: 16px; padding: 16px; border: 1px solid #e5e7eb; }
      `}</style>
    </div>
  );
}
