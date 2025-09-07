import React from "react";

/** ===== App Fantasy – Amigos del Duero (Next.js + TS) ===== */

type Role = "PT" | "DF" | "MC" | "DL";

const POS: Role[] = ["PT", "DF", "MC", "DL"];
const POS_COLORS: Record<Role, string> = {
  PT: "#f59e0b", // ámbar
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

/** ===== Chips (selector de formación) ===== */
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
        padding: "12px 12px",
        borderRadius: 12,
        border: active ? "1px solid #0f172a" : "1px solid #e5e7eb",
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#111827",
        fontWeight: 900,
        cursor: "pointer",
        width: "100%",
        boxShadow: active ? "0 4px 14px rgba(15,23,42,.25)" : "none",
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function RoleDot({ role, size = 26 }: { role: Role; size?: number }) {
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
        fontSize: size < 26 ? 11 : 12,
        fontWeight: 900,
        pointerEvents: "none",
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
};

function Pitch({ rows }: { rows: Array<{ role: Role; players: Slot[] }> }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          borderRadius: 24,
          padding: 16,
          background: "linear-gradient(135deg,#15803d,#065f46)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,.35)", borderRadius: 20 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((row, idx) => {
            const n = row.players.length || 1;
            const colWidth = Math.max(24, Math.floor(100 / n) - 2);
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                {row.players.map((slot, i) => {
                  const border = slot.player
                    ? `2px solid ${POS_COLORS[slot.role]}`
                    : "2px dashed rgba(255,255,255,.7)";
                  const bg = slot.isCaptain
                    ? "#fde68a" // SOLO dorado si es capitana
                    : slot.player
                    ? "#fff"
                    : "rgba(255,255,255,.10)"; // hueco normal (no dorado)
                  return (
                    <button
                      key={i}
                      onClick={slot.onClick}
                      style={{
                        width: `${colWidth}%`,
                        maxWidth: 220,
                        minHeight: 104,
                        borderRadius: 16,
                        border,
                        background: bg,
                        color: slot.player ? "#111827" : "#fff",
                        padding: 12,
                        cursor: "pointer",
                        boxShadow: slot.isCaptain
                          ? "0 2px 10px rgba(245,158,11,.35)"
                          : slot.player
                          ? "0 2px 6px rgba(0,0,0,.08)"
                          : "none",
                        position: "relative",
                      }}
                    >
                      {slot.player ? (
                        <>
                          {/* Badge rol arriba-izq (sobresale) */}
                          <div style={{ position: "absolute", top: -12, left: -12 }}>
                            <RoleDot role={slot.role} />
                          </div>

                          {/* Nombre centrado */}
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              padding: "0 8px",
                            }}
                          >
                            <span
                              title={slot.player.name}
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                lineHeight: 1.25,
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                              }}
                            >
                              {slot.player.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: "center", fontWeight: 700 }}>Añadir</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** ===== Picker de Capitana ===== */
function CaptainPicker({
  selectedIds,
  getRoleOf,
  captainId,
  setCaptainId,
}: {
  selectedIds: number[];
  getRoleOf: (id: number) => Role | null;
  captainId: number | null;
  setCaptainId: (id: number) => void;
}) {
  if (selectedIds.length === 0) return null;
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>Selecciona capitana</strong>
        {captainId ? <span style={{ fontSize: 12, color: "#065f46" }}>Capitana: {byId[captainId].name}</span> : null}
      </div>

      <div role="radiogroup" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {selectedIds.map((id) => {
          const role = getRoleOf(id) || "DL";
          const active = id === captainId;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              onClick={() => setCaptainId(id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 999,
                border: active ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                background: active ? "#fde68a" : "#fff",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: active ? "0 2px 8px rgba(245,158,11,.25)" : "none",
              }}
              title={`Hacer capitana a ${byId[id].name}`}
            >
              <RoleDot role={role} size={22} />
              <span style={{ fontSize: 13 }}>{byId[id].name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function App() {
  const [formation, setFormation] = React.useState<typeof FORMATIONS[number]>("1-1-1-2");
  const { lineup, setLineup, counts } = useLineup(formation);
  const [captainId, setCaptainId] = React.useState<number | null>(null);
  const [modal, setModal] = React.useState<{ role: Role; index: number } | null>(null);

  const selected = new Set(Object.values(lineup).flat().filter(Boolean) as number[]);
  const selectedIds = Array.from(selected);

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
      const next: Record<Role, Array<number | null>> = { ...prev, [modal!.role]: [...prev[modal!.role]] } as any;
      // Evitar duplicados
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
      const idToClear = prev[modal!.role][modal!.index];
      const arr = [...prev[modal!.role]];
      arr[modal!.index] = null;
      // si quitamos a la capitana, reseteamos
      if (idToClear && idToClear === captainId) setCaptainId(null);
      return { ...prev, [modal!.role]: arr };
    });
    setModal(null);
  }

  const getRoleOf = React.useCallback(
    (id: number): Role | null => {
      for (const r of POS) if ((lineup[r] || []).includes(id)) return r;
      return null;
    },
    [lineup]
  );

  // Filas del campo
  const rows = React.useMemo(() => {
    const displayOrder: Role[] = ["DL", "MC", "DF", "PT"].filter((r) => (counts as any)[r] > 0) as Role[];
    return displayOrder.map((role) => ({
      role,
      players: lineup[role].map((id, i) => ({
        role,
        player: id ? byId[id] : null,
        isCaptain: id === captainId,
        onClick: () => openSlot(role, i),
      })),
    }));
  }, [counts, lineup, captainId]);

  // Envío por email (via API)
  const [participantName, setParticipantName] = React.useState("");
  const [participantEmail, setParticipantEmail] = React.useState("");
  const [botField, setBotField] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function send() {
    const needed = (counts.PT + counts.DF + counts.MC + counts.DL) as number;
    const chosen = Object.values(lineup).flat().filter(Boolean).length;
    if (chosen !== needed) return alert("Completa todos los huecos.");
    if (!captainId) return alert("Selecciona capitana en el apartado correspondiente.");
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

  return (
    <div style={{ minHeight: "100vh", background: "#eef2f7", color: "#111827" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: 16 }}>
        {/* Header + instrucciones */}
        <header
          style={{
            background: "#0f172a",
            color: "#fff",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 10,
            boxShadow: "0 2px 10px rgba(0,0,0,.05)",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 0.2,
              whiteSpace: "normal",
              wordBreak: "keep-all",
            }}
          >
            ⚽ Fantasy – Amigos del&nbsp;Duero
          </h1>
          <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,.85)" }}>
            <div>• Selecciona tu formación y escoge hasta 5 jugadoras.</div>
            <div>
              • Selecciona una <strong>capitana</strong> (los puntos que haga se multiplicarán <strong>x2</strong>).
            </div>
          </div>
        </header>

        {/* Formación 3×3 */}
        <section
          style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, marginBottom: 16 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
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

        {/* Picker de capitana */}
        <CaptainPicker
          selectedIds={selectedIds}
          getRoleOf={getRoleOf}
          captainId={captainId}
          setCaptainId={setCaptainId}
        />

        {/* Datos y envío (centrado) */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
              justifyItems: "center",
              alignItems: "end",
            }}
          >
            <div style={{ width: "min(100%, 380px)" }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu nombre</label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ej. Laura Pérez"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  height: 34,
                }}
              />
            </div>
            <div style={{ width: "min(100%, 380px)" }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Tu email</label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  height: 34,
                }}
              />
            </div>

            {/* Honeypot anti-bots */}
            <div style={{ display: "none" }} aria-hidden>
              <label>Deja esto vacío</label>
              <input value={botField} onChange={(e) => setBotField(e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1", width: "min(100%, 480px)" }}>
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

            <div style={{ gridColumn: "1 / -1", marginTop: 8, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
              <em>Se enviará una copia del equipo que elijas al email indicado.</em>
            </div>
          </div>
        </section>

        {/* Modal selección */}
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
              onClick={(e) => e.stopPropagation()}
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
                {PLAYERS.filter((p) => hasRole(p, modal.role))
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
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <RoleDot role={modal.role} />
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
