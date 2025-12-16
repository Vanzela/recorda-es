import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // posições/rotações fixas por id (pra não ficar mudando toda hora)
  const layout = useMemo(() => {
    const map = new Map();
    items.forEach((m) => {
      const rot = (Math.random() * 10 - 5).toFixed(2);
      const left = Math.random();
      const top = Math.random();
      map.set(m.id, { rot, left, top });
    });
    return map;
  }, [items.map((x) => x.id).join("|")]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("memorias")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) setErr(error.message);
      else setItems(data || []);
    }
    load();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openModal(m) {
    setSelected(m);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f12", color: "#fff" }}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Recordações</h2>
        <p style={{ marginTop: 8, opacity: 0.7 }}>
          Clique em uma foto para ver o recado.
        </p>
        {err && <p style={{ color: "tomato" }}>Erro: {err}</p>}
      </div>

      <div
        style={{
          position: "relative",
          margin: "0 auto 24px",
          width: "min(1100px, calc(100vw - 24px))",
          height: "min(78vh, 720px)",
          borderRadius: 26,
          overflow: "hidden",
          background:
            "linear-gradient(180deg,#2a1f14,#1c140f 55%,#120d0a)",
          boxShadow: "0 18px 50px rgba(0,0,0,.55)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        {items.map((m) => {
          const p = layout.get(m.id) || { rot: 0, left: 0.2, top: 0.2 };
          const margin = 26;
          const cardW = 210;
          const cardH = 220;

          // “espalhar” dentro da mesa
          const leftPx = margin + p.left * (1100 - cardW - margin * 2);
          const topPx = margin + p.top * (720 - cardH - margin * 2);

          return (
            <div
              key={m.id}
              onClick={() => openModal(m)}
              style={{
                position: "absolute",
                width: 210,
                padding: 12,
                borderRadius: 16,
                cursor: "pointer",
                background: "rgba(255,255,255,.10)",
                border: "1px solid rgba(255,255,255,.14)",
                boxShadow: "0 16px 40px rgba(0,0,0,.45)",
                transform: `translate(${leftPx}px, ${topPx}px) rotate(${p.rot}deg)`,
                transition: "0.18s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `translate(${leftPx}px, ${
                  topPx - 4
                }px) rotate(${p.rot}deg) scale(1.02)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `translate(${leftPx}px, ${topPx}px) rotate(${p.rot}deg)`;
              }}
            >
              <img
                src={m.foto_url + "?t=" + m.created_at}
                alt={m.titulo}
                style={{
                  width: "100%",
                  height: 150,
                  borderRadius: 12,
                  objectFit: "cover",
                  display: "block",
                }}
                loading="lazy"
              />
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                  opacity: 0.9,
                }}
              >
                <b
                  title={m.titulo}
                  style={{
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.titulo}
                </b>
                <span
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "rgba(0,0,0,.18)",
                    opacity: 0.9,
                  }}
                >
                  {m.lugar || ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {open && selected && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.62)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "min(980px, 100%)",
              background: "rgba(20,20,24,.92)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 30px 90px rgba(0,0,0,.7)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
              }}
            >
              <div style={{ fontWeight: 800 }}>{selected.titulo}</div>
              <button
                onClick={closeModal}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  background: "rgba(255,255,255,.08)",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                Fechar ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr .9fr",
                gap: 14,
                padding: 14,
              }}
            >
              <img
                src={selected.foto_url + "?t=" + selected.created_at}
                alt={selected.titulo}
                style={{
                  width: "100%",
                  height: "min(62vh,520px)",
                  objectFit: "cover",
                  borderRadius: 18,
                }}
              />

              <div
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 18,
                  padding: 14,
                  background: "rgba(255,255,255,.06)",
                }}
              >
                <Field label="Lugar" value={selected.lugar || "-"} />
                <Field label="Horário" value={selected.horario || "-"} />
                <Field label="Descrição / recado" value={selected.descricao || "-"} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14,
        background: "rgba(0,0,0,.14)",
      }}
    >
      <small style={{ opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </small>
      <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}
