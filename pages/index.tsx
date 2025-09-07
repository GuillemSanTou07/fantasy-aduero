import React from "react";

/** ===== Config ===== */
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
  { id: 9, name: "Yaiza García", roles: ["DL"] },
  { id: 10, name: "María Alonso", roles: ["PT"] },
  { id: 11, name: "Yaiza García", roles: ["DL"] },
  { id: 12, name: "Andrea Hernández", roles: ["DF", "MC", "DL"] },
  { id: 13, name: "Jasmine Sayagués", roles: ["DF"] },
  { id: 14, name: "Alba Muñiz", roles: ["MC"] },
];
const byId = Object.fromEntries(PLAYERS.map((p) => [p.id, p])) as Record<number, Player>;
const hasRole = (p: Player, r: Role) => (p.roles || []).includes(r);

/** ===== Utils ===== */
function formationToCounts(f: typeof FORMATIONS[number]) {
  const [pt, df, mc, dl] = f.split("-").map((n) => parseInt(n, 10));
  return { PT: pt || 0, DF: df || 0, MC: mc || 0, DL: dl || 0 };
}

/** ===== Hooks ===== */
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

/** ===== UI Atoms ===== */
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
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: active ? "2px solid #0f172a" : "1px solid #e5e7eb",
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#111827",
        fontWeight: 800,
        cursor: "pointer",
        minWidth: 84,
      }}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role, size = 28, offset = -14 }: { role: Role; size?: number; offset?: number }) {
  return (
    <span
      style={{
        position: "absolute",
        top: offset,
        left: offset,
        width: size,
        height: size,
        lineHeight: `${size}px`,
        borderRadius: 999,
        textAlign: "center",
        background: POS_COLORS[role],
        color: "#fff",
        fontSize: size <= 24 ? 11 : 12,
        fontWeight: 900,
        boxShadow: "0 1px 2px rgba(0,0,0,.25)",
      }}
    >
      {role}
    </span>
  );
}

/** ===== Pitch / Card ===== */
type Slot = {
  role: Role;
  player: Player | null;
  onClick?: () => void;
};

function Card({
  role,
  player,
  rowSize,
  onClick,
}: {
  role: Role;
  player: Player | null;
  rowSize: number;
  onClick?: () => void;
}) {
  // nombre un pelín más pequeño si hay 3 en la fila + nunca partir en varias líneas
  const fontSize = rowSize >= 3 ? 14 : 16;

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: `${Math.max(20, Math.floor(100 / rowSize) - 2)}%`,
        maxWidth: 260,
        minWidth: 120,
        minHeight: 96,
        borderRadius: 16,
        border: player ? `3px solid ${POS_COLORS[role]}` : "2px dashed rgba(255,255,255,.8)",
        background: player ? "#fff" : "rgba(255,255,255,.10)",
        color: player ? "#111827" : "#fff",
        padding: 12,
        cursor: "pointer",
        boxShadow: player ? "0 2px 6px rgba(0,0,0,.08)" : "none",
      }}
    >
      {player ? (
        <>
          <RoleBadge role={role} />
          <div
            style={{
              fontSize,
              fontWeight: 800,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 4,
            }}
            title={player.name}
          >
            {player.name}
          </div>
        </>
      ) : (
        <div style={{ fontWeight: 800 }}>Añadir</div>
      )}
    </button>
  );
}

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
        background: "linear-gradient(#15803d,#065f46)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,.35)",
      }}
    >
      <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,.35)", borderRadius: 20 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            {row.players.map((slot, i) => (
              <Card key={i} role={row.role} player={slot.player} rowSize={row.players.length} onClick={slot.onClick} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** ===== Captain Picker (chips sin "C") ===== */
function MiniBadge({ role }: { role: Role }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: POS_COLORS[role],
        color: "#fff",
      }}
    >
      {role}
    </span>
  );
}

function CaptainPicker({
  candidateIds,
  captainId,
  onSelect,
}: {
  candidateIds: number[];
  captainId: number | null;
  onSelect: (id: number) => void;
}) {
  if (candidateIds.length === 0) return null;

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Selecciona capitana</h3>
        <div style={{ fontSize: 13, color: "#065f46", fontWeight: 800 }}>
          Capitana: {captainId ? byId[captainId]?.name : "—"}
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
        (los puntos de la capitana se multiplican x2)
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        {candidateIds.map((id) => {
          const p = byId[id];
          const isActive = id === captainId;
          // rol preferente para la chapita del chip (primer rol disponible)
          const role = (p.roles && p.roles[0]) || "DL";
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={p.name}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 999,
                border: isActive ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                boxShadow: isActive ? "0 0 0 3px rgba(245,158,11,.20)" : "none",
              }}
            >
              <MiniBadge role={role} />
              <span style={{ fontWeight: 800 }}>{p.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** ===== Main ===== */
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

  function openSlot(role: Role, index: number) {
    setModal({ role, index });
  }

  function choosePlayer(id: number) {
    setLineup((prev) => {
      const next: Record<Role, Array<number | null>> = { ...prev } as any;
      POS.forEach((r) => (next[r] = [...prev[r]].map((x) => (x === id ? null : x))));
      next[modal!.role] = [...prev[modal!.role]];
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

  // Construcción de filas (de arriba a abajo: DL, MC, DF, PT)
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

  // datos envío
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
      alert("❌ No se pudo enviar: " + e.message);
    } finally {
      setSending(false);
    }
  }

  // ids candidatas para capitana (lo que ya está colocado)
  const candidateIds = React.useMemo(
    () => Object.values(lineup).flat().filter(Boolean) as number[],
    [lineup]
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", color: "#111827" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: 16 }}>
        {/* Título + instrucciones (solo la 1ª línea, como pediste) */}
        <header
          style={{
            background: "#0f172a",
            color: "#fff",
            borderRadius: 16,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>⚽ Fantasy – Amigos del Duero</h1>
          <ul style={{ margin: "8px 0 0 16px", padding: 0, lineHeight: 1.3 }}>
            <li style={{ fontSize: 14 }}>Selecciona tu formación y escoge hasta 5 jugadoras.</li>
          </ul>
        </header>

        {/* Selector de formación (3x3) */}
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

        {/* Selector de capitana (sin “C” en mini-chips y sin marcar nada arriba) */}
        <CaptainPicker
          candidateIds={candidateIds}
          captainId={captainId}
          onSelect={(id) => setCaptainId((c) => (c === id ? null : id))}
        />

        {/* Datos y envío (inline, NO modal) */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu nombre</label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ej. Laura Pérez"
                style={{
                  width: "100%",
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
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            {/* Honeypot */}
            <div style={{ display: "none" }} aria-hidden>
              <label>Deja esto vacío</label>
              <input value={botField} onChange={(e) => setBotField(e.target.value)} />
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
                  fontWeight: 800,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Enviando..." : "Enviar selección"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            Se enviará una copia del equipo que elijas al email indicado.
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
              padding: 12,
            }}
            onClick={() => setModal(null)}
          >
            <div
              style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 16, padding: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>Selecciona {modal.role}</strong>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    border: 0,
                    background: "#f3f4f6",
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </div>

              <div style={{ display: "grid", gap: 8, maxHeight: "60vh", overflow: "auto" }}>
                {roleOptions[modal.role]
                  .filter((p) => !selected.has(p.id) || lineup[modal.role][modal.index] === p.id)
                  .map((p) => (
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
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: POS_COLORS[modal.role],
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {modal.role}
                        </span>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                      </div>
                      <button
                        onClick={() => choosePlayer(p.id)}
                        style={{
                          border: "1px solid #10b981",
                          background: "#ecfdf5",
                          color: "#065f46",
                          padding: "6px 10px",
                          borderRadius: 10,
                          fontWeight: 700,
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
