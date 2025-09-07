import React from "react";

// ===== App simple con selección en CAMPO (Next.js + TS) =====
// - Selección libre por posición (PT/DF/MC/DL)
// - Capitana se elige en un módulo aparte (chips), sin “C” en el campo
// - Modal flotante para nombre/email al enviar
// - Envío por email a backend /api/submit

type Role = "PT" | "DF" | "MC" | "DL";
const POS: Role[] = ["PT", "DF", "MC", "DL"];
const POS_COLORS: Record<Role, string> = {
  PT: "#f59e0b", // amarillo
  DF: "#3b82f6", // azul
  MC: "#10b981", // verde
  DL: "#ef4444", // rojo
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

const byId = Object.fromEntries(PLAYERS.map((p) => [p.id, p])) as Record<number, Player>;
const hasRole = (p: Player, r: Role) => (p.roles || []).includes(r);

function formationToCounts(f: typeof FORMATIONS[number]) {
  const [pt, df, mc, dl] = f.split("-").map((n) => parseInt(n, 10));
  return { PT: pt || 0, DF: df || 0, MC: mc || 0, DL: dl || 0 };
}

// ==== modal elegante ====
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          borderRadius: 16,
          background: "#fff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 12px 32px rgba(0,0,0,.25)",
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={String(children)}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: active ? "1px solid #0f172a" : "1px solid #e5e7eb",
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#0f172a",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: active ? "0 2px 8px rgba(0,0,0,.15)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role, size = 30 }: { role: Role; size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 999,
        background: POS_COLORS[role],
        color: "#fff",
        fontSize: Math.max(11, Math.round(size * 0.42)),
        fontWeight: 900,
        boxShadow: "0 1px 2px rgba(0,0,0,.15)",
      }}
    >
      {role}
    </span>
  );
}

type Slot = {
  role: Role;
  player: Player | null;
  onClick?: () => void;
};

function Pitch({
  rows,
}: {
  rows: Array<{ role: Role; players: Slot[] }>;
}) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 24,
        padding: 16,
        background: "linear-gradient(142deg,#157347,#0b5e3f)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,.35)",
      }}
    >
      {/* líneas del campo */}
      <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,.35)", borderRadius: 20 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((row, idx) => {
          const n = row.players.length || 1;
          const colWidth = Math.max(20, Math.floor(100 / n) - 2);
          return (
            <div key={idx} style={{ display: "flex", justifyContent: "center", gap: 12, padding: "0 6px" }}>
              {row.players.map((slot, i) => {
                const nameFont = n >= 3 ? 15 : 17; // ✅ más pequeño con 3 en la línea
                return (
                  <button
                    key={i}
                    onClick={slot.onClick}
                    style={{
                      width: `${colWidth}%`,
                      maxWidth: 240,
                      minHeight: 96,
                      borderRadius: 16,
                      border: slot.player ? `2px solid ${POS_COLORS[slot.role]}` : "2px dashed rgba(255,255,255,.8)",
                      background: slot.player ? "#fff" : "rgba(255,255,255,.08)",
                      color: slot.player ? "#0f172a" : "#fff",
                      padding: 10,
                      cursor: "pointer",
                      position: "relative",
                      boxShadow: slot.player ? "0 2px 6px rgba(0,0,0,.10)" : "none",
                    }}
                  >
                    {slot.player ? (
                      <>
                        {/* badge solapado arriba-izq */}
                        <div
                          style={{
                            position: "absolute",
                            top: -14,
                            left: -14,
                          }}
                        >
                          <RoleBadge role={slot.role} size={34} />
                        </div>
                        <div
                          style={{
                            fontSize: nameFont,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            textAlign: "center",
                            whiteSpace: "nowrap",          // ⛔️ no partir
                            overflow: "hidden",
                            textOverflow: "ellipsis",       // … si no cabe
                            marginTop: 6,
                            padding: "8px 8px",
                          }}
                        >
                          {slot.player.name}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", fontWeight: 800, opacity: 0.9 }}>Añadir</div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
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

export default function App() {
  const [formation, setFormation] = React.useState<typeof FORMATIONS[number]>("1-1-1-2");
  const { lineup, setLineup, counts } = useLineup(formation);
  const [captainId, setCaptainId] = React.useState<number | null>(null);
  const [modal, setModal] = React.useState<{ role: Role; index: number } | null>(null);

  // modal de envío
  const [askInfoOpen, setAskInfoOpen] = React.useState(false);
  const [participantName, setParticipantName] = React.useState("");
  const [participantEmail, setParticipantEmail] = React.useState("");
  const [botField, setBotField] = React.useState(""); // honeypot
  const [sending, setSending] = React.useState(false);

  const selectedIds = new Set(Object.values(lineup).flat().filter(Boolean) as number[]);

  const roleOptions = React.useMemo(
    () => ({
      PT: PLAYERS.filter((p) => hasRole(p, "PT")),
      DF: PLAYERS.filter((p) => hasRole(p, "DF")),
      MC: PLAYERS.filter((p) => hasRole(p, "MC")),
      DL: PLAYERS.filter((p) => hasRole(p, "DL")),
    }),
    []
  );

  function openSlot(role: Role, index: number) {
    setModal({ role, index });
  }
  function choosePlayer(id: number) {
    setLineup((prev) => {
      const next: Record<Role, Array<number | null>> = {
        PT: [...prev.PT],
        DF: [...prev.DF],
        MC: [...prev.MC],
        DL: [...prev.DL],
      };
      // Evitar duplicados: quitarlo de cualquier otro sitio
      POS.forEach((r) => {
        next[r] = next[r].map((x) => (x === id ? null : x));
      });
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

  // Construir filas para el campo (arriba->abajo: DL, MC, DF, PT)
  const rows = React.useMemo(() => {
    const displayOrder: Role[] = ["DL", "MC", "DF", "PT"].filter((r) => (counts as any)[r] > 0) as Role[];
    return displayOrder.map((role) => ({
      role,
      players: lineup[role].map((id, i) => ({
        role,
        player: id ? byId[id] : null,
        onClick: () => openSlot(role, i),
      })),
    }));
  }, [counts, lineup]);

  // chips de capitana con las 5 seleccionadas
  const chosenPlayers: Player[] = React.useMemo(() => {
    const ids = (Object.values(lineup).flat().filter(Boolean) as number[]).map((id) => id!);
    return ids.map((id) => byId[id]);
  }, [lineup]);

  async function send() {
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
      setAskInfoOpen(false);
    } catch (e: any) {
      alert("❌ No se pudo enviar: " + (e?.message || "Error"));
    } finally {
      setSending(false);
    }
  }

  function beginSend() {
    const needed = (counts.PT + counts.DF + counts.MC + counts.DL) as number;
    const chosen = Object.values(lineup).flat().filter(Boolean).length;
    if (chosen !== needed) return alert("Completa todos los huecos.");
    if (!captainId) return alert("Selecciona capitana en el apartado inferior.");
    setAskInfoOpen(true);
  }

  const TITLE = "Fantasy – Amigos del Duero";

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", color: "#0f172a" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
        {/* Título */}
        <header
          style={{
            background: "#0f172a",
            color: "#fff",
            borderRadius: 16,
            padding: "14px 18px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>⚽</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>{TITLE}</h1>
        </header>

        {/* Selector de formación (3x3) */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 12,
            }}
          >
            {FORMATIONS.map((f) => (
              <Chip key={f} active={formation === f} onClick={() => setFormation(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </section>

        {/* Subtítulo centrado */}
        <div style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 10 }}>
          Selecciona tu formación y escoge hasta 5 jugadoras.
        </div>

        {/* CAMPO – perfectamente centrado */}
        <section style={{ margin: "0 auto 16px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 980 }}>
            <Pitch rows={rows} />
          </div>
        </section>

        {/* Seleccionar capitana */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Selecciona capitana</h2>
          </div>
          <div style={{ marginTop: 2, color: "#6b7280", fontSize: 13 }}>
            (los puntos de la capitana se multiplican x2)
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {chosenPlayers.length === 0 && (
              <div style={{ color: "#6b7280", fontSize: 14 }}>Aún no has elegido jugadoras.</div>
            )}
            {chosenPlayers.map((p) => {
              // No “C” aquí. Resaltado con borde dorado si es la capitana.
              const isCap = captainId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setCaptainId(isCap ? null : p.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: isCap ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                    background: "#fff",
                    boxShadow: isCap ? "0 0 0 3px rgba(245,158,11,.25)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <RoleBadge role={(p.roles && p.roles[0]) || "DL"} size={28} />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Botón enviar (sin inputs fijos; se pide en modal) */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}
        >
          {/* Honeypot oculto */}
          <div style={{ display: "none" }}>
            <input aria-hidden value={botField} onChange={(e) => setBotField(e.target.value)} />
          </div>

          <button
            onClick={beginSend}
            disabled={sending}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: sending ? "#6b7280" : "#0f172a",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              fontWeight: 900,
              cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Enviando..." : "Enviar selección"}
          </button>
        </section>

        {/* Modal de confirmación de datos */}
        <Modal open={askInfoOpen} onClose={() => setAskInfoOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Datos para el envío</h3>
            <button
              onClick={() => setAskInfoOpen(false)}
              style={{
                border: "1px solid #e5e7eb",
                background: "#f3f4f6",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 10,
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu nombre</label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ej. Laura Pérez"
                style={{
                  width: "100%",                 // ✅ caben dentro del modal
                  maxWidth: "520px",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu email</label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{
                  width: "100%",                 // ✅ caben dentro del modal
                  maxWidth: "520px",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>

            <button
              onClick={send}
              disabled={sending}
              style={{
                width: "min(520px, 100%)",
                padding: "12px 14px",
                background: sending ? "#6b7280" : "#0f172a",
                color: "#fff",
                border: 0,
                borderRadius: 12,
                fontWeight: 900,
                cursor: sending ? "not-allowed" : "pointer",
                marginTop: 2,
              }}
            >
              {sending ? "Enviando..." : "Confirmar y enviar"}
            </button>

            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Se enviará una copia del equipo que elijas al email indicado.
            </div>
          </div>
        </Modal>

        {/* Modal selección de jugadora */}
        {modal && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90 }}
            onClick={() => setModal(null)}
          >
            <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 16, padding: 16 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>Selecciona {modal.role}</strong>
                <button onClick={() => setModal(null)} style={{ border: 0, background: "#f3f4f6", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}>
                  Cerrar
                </button>
              </div>
              <div style={{ display: "grid", gap: 8, maxHeight: "58vh", overflow: "auto" }}>
                {roleOptions[modal.role]
                  .filter((p) => !selectedIds.has(p.id) || lineup[modal.role][modal.index] === p.id)
                  .map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <RoleBadge role={modal.role} />
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</div>
                      </div>
                      <button
                        onClick={() => choosePlayer(p.id)}
                        style={{ border: "1px solid #10b981", background: "#ecfdf5", color: "#065f46", padding: "6px 10px", borderRadius: 10, fontWeight: 800, cursor: "pointer" }}
                      >
                        Elegir
                      </button>
                    </div>
                  ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <button onClick={clearSlot} style={{ border: 0, background: "#f3f4f6", padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}>
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
