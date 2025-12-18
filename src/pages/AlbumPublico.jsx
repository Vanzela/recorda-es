import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";


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
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    document.body.style.overflow = "auto";
  }

  return (
    <div className="ap">
      {/* Topbar */}
      <header className="ap__header">
        <div className="ap__headerInner">
          <Link to="/login" className="ap__back">
            ← voltar
          </Link>

          <div className="ap__title">
            <h1>{album?.title || "Álbum"}</h1>
            <p>Clique nas fotos pra ver os detalhes ✨</p>
          </div>
        </div>
      </header>

      {err && (
        <div className="ap__errorWrap">
          <div className="ap__error">{err}</div>
        </div>
      )}

      {/* “Mesa” viva */}
      <section className="ap__section">
        <div className="ap__board">
          <div className="ap__grid">
            {items.map((m) => (
              <Polaroid key={m.id} m={m} onClick={() => openModal(m)} />
            ))}
          </div>

          {!items.length && !err && (
            <div className="ap__empty">
              <div className="ap__emptyTitle">Ainda não tem fotos</div>
              <div className="ap__emptySub">Quando tiver, elas vão aparecer aqui 💛</div>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {open && selected && (
        <div
          className="ap__overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="ap__modal">
            <div className="ap__modalHeader">
              <div className="ap__modalTitle">{selected.title}</div>
              <button className="ap__close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="ap__modalContent">
              <img
                src={selected.photo_url + "?t=" + selected.created_at}
                alt={selected.title}
                className="ap__modalImg"
              />

              <div className="ap__info">
                <Field label="Lugar" value={selected.place || "-"} />
                <Field label="Horário" value={selected.time || "-"} />
                <Field label="Descrição / recado" value={selected.description || "-"} />
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
  const tilt = (hash % 2) ? "left" : "right";

  return (
    <button className="ap__polBtn" onClick={onClick} aria-label={`Abrir ${m.title}`}>
      <div className={`ap__pol ${tilt}`} style={{ "--rot": `${rot}deg` }}>
        <img
          src={m.photo_url + "?t=" + m.created_at}
          alt={m.title}
          className="ap__polImg"
          loading="lazy"
        />
        <div className="ap__polCaption">{m.title}</div>
      </div>
    </button>
  );
}

function Field({ label, value }) {
  return (
    <div className="ap__field">
      <div className="ap__fieldLabel">{label}</div>
      <div className="ap__fieldValue" style={{ whiteSpace: "pre-wrap" }}>
        {value}
      </div>
    </div>
  );
}
