// pages/index.tsx
import React from "react";

type Role = "PT" | "DF" | "MC" | "DL";

const POS: Role[] = ["PT", "DF", "MC", "DL"];
const POS_COLORS: Record<Role, string> = {
  PT: "#f59e0b",
  DF: "#3b82f6",
  MC: "#10b981",
  DL: "#ef4444",
};

const FORMATIONS = [
  "0-1-1-3",
  "0-1-2-2",
  "0-1-3-1",
  "0-2-1-2",
  "0-2-2-1",
  "0-3-1-1",
  "1-1-1-2",
  "1-1-2-1",
  "1-2-1-1",
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
const byId = Object.fromEntries(PLAYERS.map(p => [p.id, p])) as Record<number, Player>;
const hasRole = (p: Player, r: Role) => (p.roles || []).includes(r);

function formationToCounts(f: typeof FORMATIONS[number]) {
  const [pt, df, mc, dl] = f.split("-").map(n => parseInt(n, 10));
  return { PT: pt || 0, DF: df || 0, MC: mc || 0, DL: dl || 0 };
}

function useLineup(formation: typeof FORMATIONS[number]) {
  const counts = React.useMemo(() => formationToCounts(formation), [formation]);
  const makeEmpty = React.useMemo(
    () => (r: Role) => Array.from({ length: counts[r] as number }, () => null as number | null),
    [counts]
  );
  const [lineup, setLineup] = React.useState<Record<Role, Array<number | null>>>({
    PT: makeEmpty("PT"),
    DF: makeEmpty("DF"),
    MC: makeEmpty("MC"),
    DL: makeEmpty("DL"),
  });

  React.useEffect(() => {
    setLineup(prev => {
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
    <button
      onClick={onClick}
      title={String(children)}
      style={{
        padding: "10px 14px",
        borderRadius: 14,
        border: active ? "0" : "1px solid #e5e7eb",
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#111827",
        fontWeight: 800,
        cursor: "pointer",
        minWidth: 96,
        boxShadow: active ? "inset 0 0 0 1px #0f172a, 0 2px 8px rgba(0,0,0,.15)" : "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      {children}
    </button>
  );
}

function RoleDot({ role, size = 28 }: { role: Role; size?: number }) {
  return (
    <span
      style={{
        position: "absolute",
        top: -size / 2 + 4,
        left: -size / 2 + 4,
        width: size,
        height: size,
        borderRadius: 999,
        background: POS_COLORS[role],
        color: "#fff",
        fontSize: Math.max(11, Math.floor(size * 0.38)),
        fontWeight: 900,
        lineHeight: `${size}px`,
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,.25)",
      }}
    >
      {role}
    </span>
  );
}

function CaptainCrown() {
  const size = 24;
  return (
    <span
      aria-label="Capitana"
      title="Capitana"
      style={{
        position: "absolute",
        top: -size / 2 + 4,
        right: -size / 2 + 4,
        width: size,
        height: size,
        borderRadius: 999,
        background: "#fff",
        border: "2px solid #f59e0b",
        color: "#b45309",
        fontSize: 14,
        fontWeight: 900,
        lineHeight: `${size - 4}px`,
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,.25)",
      }}
    >
      👑
    </span>
  );
}

type Slot = {
  role: Role;
  player: Player | null;
  rowSize: number;
  isCaptain?: boolean;
  onClick?: () => void;
};

function CardSlot({ role, player, rowSize, isCaptain, onClick }: Slot) {
  // Fuente adaptativa según cuántas cartas hay en la fila
  const nameFont = rowSize >= 3 ? 15 : rowSize === 2 ? 16 : 18;

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 260,
        minHeight: 96,
        borderRadius: 16,
        background: player ? "#fff" : "rgba(255,255,255,.08)",
        border: player ? `2px solid ${POS_COLORS[role]}` : "2px dashed rgba(255,255,255,.85)",
        color: player ? "#111827" : "#fff",
        padding: 14,
        cursor: "pointer",
        boxShadow: player ? "0 2px 6px rgba(0,0,0,.08)" : "none",
        overflow: "hidden",
      }}
    >
      {player ? (
        <>
          <RoleDot role={role} />
          {isCaptain && <CaptainCrown />}
          <div
            style={{
              // nombre centrado, 1 línea, sin romper palabras
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
              fontSize: nameFont,
              fontWeight: 800,
              padding: "6px 10px 4px",
              marginTop: 4,
            }}
          >
            {player.name}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", fontWeight: 800, opacity: 0.9 }}>Añadir</div>
      )}
    </button>
  );
}

function Pitch({
  rows,
}: {
  rows: Array<{ role: Role; players: Array<{ player: Player | null; isCaptain: boolean }> }>;
}) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 28,
        padding: 18,
        background: "linear-gradient(145deg, #176a3a, #0e5a3a)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 3px 10px rgba(0,0,0,.35)",
      }}
    >
      <div style={{ position: "absolute", inset: 10, border: "2px solid rgba(255,255,255,.38)", borderRadius: 22 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((row, idx) => {
          const rowSize = row.players.length || 1;
          const colWidth = Math.max(22, Math.floor(100 / rowSize) - 2);
          return (
            <div key={idx} style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              {row.players.map((slot, i) => (
                <div key={i} style={{ width: `${colWidth}%`, display: "flex", justifyContent: "center" }}>
                  <CardSlot
                    role={row.role}
                    player={slot.player}
                    rowSize={rowSize}
                    isCaptain={slot.isCaptain}
                    onClick={() => {
                      /* abre modal de selección de jugadora en el contenedor principal */
                      const ev = new CustomEvent("open-slot", { detail: { role: row.role, index: i } });
                      window.dispatchEvent(ev);
                    }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [formation, setFormation] = React.useState<typeof FORMATIONS[number]>("1-1-1-2");
  const { lineup, setLineup, counts } = useLineup(formation);
  const [captainId, setCaptainId] = React.useState<number | null>(null);
  const [modal, setModal] = React.useState<{ role: Role; index: number } | null>(null);

  React.useEffect(() => {
    const handler = (e: any) => setModal(e.detail);
    window.addEventListener("open-slot", handler as any);
    return () => window.removeEventListener("open-slot", handler as any);
  }, []);

  // listado de opciones por rol
  const roleOptions = React.useMemo(
    () => ({
      PT: PLAYERS.filter(p => hasRole(p, "PT")),
      DF: PLAYERS.filter(p => hasRole(p, "DF")),
      MC: PLAYERS.filter(p => hasRole(p, "MC")),
      DL: PLAYERS.filter(p => hasRole(p, "DL")),
    }),
    []
  );
  const selectedIds = new Set<number>(Object.values(lineup).flat().filter(Boolean) as number[]);

  function openSlot(role: Role, index: number) {
    setModal({ role, index });
  }
  function choosePlayer(id: number) {
    setLineup(prev => {
      const next: Record<Role, Array<number | null>> = { ...prev, [modal!.role]: [...prev[modal!.role]] } as any;
      // Evitar duplicados
      POS.forEach(r => {
        next[r] = next[r].map(x => (x === id ? null : x));
      });
      next[modal!.role][modal!.index] = id;
      return next;
    });
    // si la jugadora cambiada era capitana, limpia capitana
    setCaptainId(c => (c && !Object.values(lineup).flat().includes(c) ? null : c));
    setModal(null);
  }
  function clearSlot() {
    if (!modal) return;
    setLineup(prev => {
      const arr = [...prev[modal.role]];
      if (arr[modal.index] === captainId) setCaptainId(null);
      arr[modal.index] = null;
      return { ...prev, [modal.role]: arr };
    });
    setModal(null);
  }

  // filas del campo (de arriba a abajo)
  const rows = React.useMemo(() => {
    const order: Role[] = ["DL", "MC", "DF", "PT"].filter(r => (counts as any)[r] > 0) as Role[];
    return order.map(role => ({
      role,
      players: lineup[role].map(id => ({ player: id ? byId[id] : null, isCaptain: id === captainId })),
    }));
  }, [counts, lineup, captainId]);

  // Selector de capitana: chips con las 5 jugadoras elegidas (sin “C”)
  const chosenPlayers: Array<{ id: number; role: Role; name: string }> = React.useMemo(() => {
    const list: Array<{ id: number; role: Role; name: string }> = [];
    (["PT", "DF", "MC", "DL"] as Role[]).forEach(r => {
      lineup[r].forEach(id => {
        if (id) list.push({ id, role: r, name: byId[id].name });
      });
    });
    return list;
  }, [lineup]);

  // Envío (igual que tenías)
  const [participantName, setParticipantName] = React.useState("");
  const [participantEmail, setParticipantEmail] = React.useState("");
  const [botField, setBotField] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function send() {
    const needed = (counts.PT + counts.DF + counts.MC + counts.DL) as number;
    const chosen = Object.values(lineup).flat().filter(Boolean).length;
    if (chosen !== needed) return alert("Completa todos los huecos.");
    if (!captainId) return alert("Selecciona capitana.");
    if (!participantName || !participantEmail) return alert("Rellena nombre y tu email.");

    setSending(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation,
          lineup,
          captainId,
          participantName,
          participantEmail,
          botField,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Equipo enviado. ¡Suerte!");
    } catch (e: any) {
      alert("❌ No se pudo enviar: " + (e?.message || "Error"));
    } finally {
      setSending(false);
    }
  }

  // UI
  return (
    <div style={{ minHeight: "100vh", background: "#eef2f7", color: "#111827" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: 16 }}>
        {/* Header */}
        <section
          style={{
            background: "#0f172a",
            color: "#fff",
            borderRadius: 16,
            padding: "18px 16px",
            marginBottom: 14,
            boxShadow: "0 6px 18px rgba(0,0,0,.12)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>⚽</span> Fantasy – Amigos del Duero
          </h1>
          <ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.4 }}>
            <li>Selecciona tu formación y escoge hasta 5 jugadoras.</li>
            <li>
              Selecciona una <strong>capitana</strong> (los puntos que haga se multiplicarán <strong>x2</strong>).
            </li>
          </ul>
        </section>

        {/* Formaciones */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 12,
            }}
          >
            {FORMATIONS.map(f => (
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

        {/* Selector de CAPITANA (solo aparece cuando hay jugadoras elegidas) */}
        {chosenPlayers.length > 0 && (
          <section
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Selecciona capitana</h3>
              <div style={{ fontSize: 14, color: "#065f46" }}>
                Capitana:{" "}
                <strong>
                  {captainId ? byId[captainId].name : <span style={{ opacity: 0.6 }}>— sin asignar —</span>}
                </strong>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {chosenPlayers.map(p => {
                const active = p.id === captainId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCaptainId(active ? null : p.id)}
                    title={`Hacer capitana a ${p.name}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 999,
                      border: active ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                      background: active ? "#fff7ed" : "#fff",
                      cursor: "pointer",
                      boxShadow: active ? "0 2px 8px rgba(245, 158, 11, .35)" : "0 1px 4px rgba(0,0,0,.05)",
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: POS_COLORS[p.role],
                        color: "#fff",
                        fontWeight: 900,
                        fontSize: 12,
                        lineHeight: "28px",
                        textAlign: "center",
                      }}
                    >
                      {p.role}
                    </span>
                    <span
                      style={{
                        maxWidth: 160,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 800,
                      }}
                    >
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Datos y envío */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu nombre</label>
              <input
                value={participantName}
                onChange={e => setParticipantName(e.target.value)}
                placeholder="Ej. Laura Pérez"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu email</label>
              <input
                type="email"
                value={participantEmail}
                onChange={e => setParticipantEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: "none" }} aria-hidden>
              <label>Deja esto vacío</label>
              <input value={botField} onChange={e => setBotField(e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button
                onClick={send}
                disabled={sending}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: sending ? "#6b7280" : "#111827",
                  color: "#fff",
                  border: 0,
                  borderRadius: 12,
                  fontWeight: 900,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Enviando..." : "Enviar selección"}
              </button>
              <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                Se enviará una copia del equipo que elijas al email indicado.
              </div>
            </div>
          </div>
        </section>

        {/* Modal selección de jugadora */}
        {modal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
            onClick={() => setModal(null)}
          >
            <div
              style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 16, padding: 16 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>Selecciona {modal.role}</strong>
                <button
                  onClick={() => setModal(null)}
                  style={{ border: 0, background: "#f3f4f6", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}
                >
                  Cerrar
                </button>
              </div>
              <div style={{ display: "grid", gap: 8, maxHeight: "60vh", overflow: "auto" }}>
                {roleOptions[modal.role]
                  .filter(p => !selectedIds.has(p.id) || lineup[modal.role][modal.index] === p.id)
                  .map(p => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 10,
                      }}
                    >
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: POS_COLORS[modal.role],
                            color: "#fff",
                            fontWeight: 900,
                            fontSize: 12,
                            lineHeight: "28px",
                            textAlign: "center",
                            flex: "0 0 auto",
                          }}
                        >
                          {modal.role}
                        </span>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </div>
                      </div>
                      <button
                        onClick={() => choosePlayer(p.id)}
                        style={{
                          border: "1px solid #10b981",
                          background: "#ecfdf5",
                          color: "#065f46",
                          padding: "6px 10px",
                          borderRadius: 10,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Elegir
                      </button>
                    </div>
                  ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <button
                  onClick={clearSlot}
                  style={{ border: 0, background: "#f3f4f6", padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}
                >
                  Vaciar posición
                </button>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Solo puedes alinear jugadoras del equipo.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
