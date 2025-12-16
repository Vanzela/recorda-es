import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../App.css";

export default function AlbumPublico() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      setErr("");

      const { data: a, error: aErr } = await supabase
        .from("albums")
        .select("*")
        .eq("slug", slug)
        .single();

      if (aErr) {
        setErr("Álbum não encontrado ou privado.");
        return;
      }
      setAlbum(a);

      const { data: m, error: mErr } = await supabase
        .from("memories")
        .select("*")
        .eq("album_id", a.id)
        .order("created_at", { ascending: false });

      if (mErr) setErr(mErr.message);
      else setItems(m || []);
    }

    load();
  }, [slug]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeModal();
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
  <div className="album-page">
    {/* Topbar */}
    <header className="album-header">
      <div className="album-header-inner">
        <Link to="/login" className="back-link">
          ← voltar
        </Link>

        <div className="album-title">
          <h1>{album?.title || "Álbum"}</h1>
          <p>Clique nas fotos pra ver os detalhes ✨</p>
        </div>
      </div>
    </header>

    {err && (
      <div className="error-wrapper">
        <div className="error-box">{err}</div>
      </div>
    )}

    {/* Mesa */}
    <section className="album-section">
      <div className="album-board">
        <div className="album-grid">
          {items.map((m) => (
            <Polaroid key={m.id} m={m} onClick={() => openModal(m)} />
          ))}
        </div>

        {!items.length && !err && (
          <div className="empty-state">Nenhuma foto ainda 🥺</div>
        )}
      </div>
    </section>

    {/* Modal */}
    {open && selected && (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">{selected.title}</div>
            <button className="modal-close" onClick={closeModal}>
              Fechar ✕
            </button>
          </div>

          <div className="modal-content">
            <img
              src={selected.photo_url + "?t=" + selected.created_at}
              alt={selected.title}
              className="modal-image"
            />

            <div className="modal-info">
              <Field label="Lugar" value={selected.place || "-"} />
              <Field label="Horário" value={selected.time || "-"} />
              <Field
                label="Descrição / recado"
                value={selected.description || "-"}
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

}


  function Polaroid({ m, onClick }) {
    const hash = useMemo(
      () => [...(m.id || "")].reduce((a, c) => a + c.charCodeAt(0), 0),
      [m.id]
    );
    const rot = (hash % 11) - 5; // -5..+5

    return (
      <button
        onClick={onClick}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "block",
          userSelect: "none",
        }}
        aria-label={`Abrir ${m.title}`}
      >
        <div
          style={{
            width: 280,
            background: "#fff",
            padding: "14px 14px 26px",
            borderRadius: 10,
            transform: `rotate(${rot}deg)`,
            boxShadow: "0 5px 4px rgba(0,0,0,.40)",
            transition: "transform .18s ease, box-shadow .18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = `rotate(${rot}deg) translateY(-3px) scale(1.03)`;
            e.currentTarget.style.boxShadow = "0 7px 7px rgba(0,0,0,.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = `rotate(${rot}deg)`;
            e.currentTarget.style.boxShadow = "0 5px 4px rgba(0,0,0,.40)";
          }}
        >
          <img
            src={m.photo_url + "?t=" + m.created_at}
            alt={m.title}
            style={{
              width: "100%",
              height: 240,
              objectFit: "cover",
              borderRadius: 6,
              background: "#eee",
            }}
            loading="lazy"
          />

          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              fontSize: 15,
              color: "#111",
              letterSpacing: ".6px",
              lineHeight: 1.2,
            }}
          >
            {m.title}
          </div>
        </div>
      </button>
    );
  }

  function Field({ label, value }) {
    return (
      <div className="info-polaroid">
        <p>{value}</p>
      </div>
    );
  }
