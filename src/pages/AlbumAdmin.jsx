import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { albumPublicLink } from "../lib/publicUrl";

export default function AlbumAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQr, setShowQr] = useState(false);

  const publicLink = useMemo(
    () => (album ? albumPublicLink(album.slug) : ""),
    [album]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!album) return;
      const url = await QRCode.toDataURL(publicLink, { margin: 1, scale: 6 });
      setQrDataUrl(url);
    })();
  }, [album, publicLink]);

  async function load() {
    setMsg("");

    const { data: a, error: aErr } = await supabase
      .from("albums")
      .select("*")
      .eq("id", id)
      .single();

    if (aErr) {
      setMsg(aErr.message);
      return;
    }

    setAlbum(a);

    const { data: m, error: mErr } = await supabase
      .from("memories")
      .select("*")
      .eq("album_id", id)
      .order("created_at", { ascending: false });

    if (mErr) setMsg(mErr.message);
    else setItems(m || []);
  }

  async function copyLink() {
    const textoFofo =
      `✨ Fiz um álbum de recordações pra você:\n` +
      `${publicLink}\n\n` +
      `Depois me conta qual foto te deixou mais feliz 💛`;

    await navigator.clipboard.writeText(textoFofo);
    alert("Copiado ✅");
  }

  async function addMemory(e) {
    e.preventDefault();
    if (!album) return;

    setSaving(true);
    setMsg("Salvando...");

    try {
      const fd = new FormData(e.currentTarget);
      const title = (fd.get("title") || "").toString().trim();
      const place = (fd.get("place") || "").toString().trim();
      const time = (fd.get("time") || "").toString().trim();
      const description = (fd.get("description") || "").toString().trim();
      const file = fd.get("photo");

      if (!file || !file.name) throw new Error("Selecione uma foto");

      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = `albums/${album.id}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("fotos")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
      const photo_url = pub.publicUrl;

      const { error: dbErr } = await supabase.from("memories").insert({
        album_id: album.id,
        title,
        place,
        time,
        description,
        photo_url,
      });

      if (dbErr) throw dbErr;

      setMsg("Salvo ✅");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setMsg("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMemory(m) {
    const ok = confirm("Excluir esta recordação?");
    if (!ok) return;

    const { error } = await supabase.from("memories").delete().eq("id", m.id);
    if (error) alert(error.message);
    else load();
  }

  return (
    <div className="adm2">
      <header className="adm2__top">
        <button className="btn" onClick={() => navigate("/dashboard")}>
          ← Voltar
        </button>

        <div className="adm2__title">
          <div className="adm2__h1">Publicar</div>
          <div className="adm2__h2">{album?.title || "Carregando..."}</div>
        </div>

        <div className="adm2__shareTop">
          <a href={publicLink} target="_blank" rel="noreferrer">
            <button className="btn">Abrir</button>
          </a>
        </div>
      </header>

      {msg && (
        <div className={`adm2__msg ${msg.startsWith("Erro") ? "adm2__msg--err" : ""}`}>
          {msg}
        </div>
      )}

      <div className="adm2__grid">
        {/* ESQUERDA */}
        <aside className="left">
          <div className="panel">
            <div className="panel__title">Nova Foto</div>
            <div className="panel__sub">Foto + recado ✨</div>

            <form onSubmit={addMemory} className="form">
              <input name="title" placeholder="Título" required />
              <input name="place" placeholder="Lugar (opcional)" />
              <input name="time" placeholder="Horário (ex: 16/12/2025 19:30)" />
              <textarea
                name="description"
                placeholder="Escreve um recado bonito..."
                rows={5}
              />
              <input name="photo" type="file" accept="image/*" required />

              <button className="btn btn--ok" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Publicar"}
              </button>
            </form>
          </div>

          {/* Compartilhar compacto (span QR) */}
          <div className="panel panel--mini">
            <div className="miniRow">
              <div>
                <div className="panel__title">Compartilhar</div>
                <div className="muted">Link + QR compacto</div>
              </div>

              <button
                className="btn"
                type="button"
                onClick={() => setShowQr((s) => !s)}
              >
                {showQr ? "Fechar QR" : "Ver QR"}
              </button>
            </div>

            <div className="miniLink">{publicLink}</div>

            <div className="miniBtns">
              <button className="btn btn--share" type="button" onClick={copyLink}>
                Copiar link
              </button>

              <a href={publicLink} target="_blank" rel="noreferrer">
                <button className="btn" type="button">
                  Abrir
                </button>
              </a>
            </div>

            {showQr && qrDataUrl && (
              <div className="qrSpan">
                <img src={qrDataUrl} alt="QR Code" />
                <div className="muted">Escaneie e abra ✨</div>
              </div>
            )}
          </div>
        </aside>

        {/* DIREITA */}
        <main className="right">
          <div className="right__head">
            <h3>Publicações</h3>
            <div className="muted">
              {items.length} {items.length === 1 ? "post" : "posts"}
            </div>
          </div>

          <div className="posts">
            {items.map((m) => (
              <article className="post" key={m.id}>
                <div className="post__top">
                  <div>
                    <div className="post__title">{m.title}</div>
                    <div className="post__meta">
                      <span>{m.place || "-"}</span>
                      <span className="dot">•</span>
                      <span>{m.time || "-"}</span>
                    </div>
                  </div>

                  <button className="post__del" onClick={() => deleteMemory(m)}>
                    Excluir
                  </button>
                </div>

                <div className="post__img">
                  <img
                    src={m.photo_url + "?t=" + m.created_at}
                    alt={m.title}
                    loading="lazy"
                  />
                </div>

                {m.description && (
                  <div className="post__text" style={{ whiteSpace: "pre-wrap" }}>
                    {m.description}
                  </div>
                )}
              </article>
            ))}

            {!items.length && (
              <div className="empty">
                <div className="empty__title">Nenhuma publicação ainda</div>
                <div className="muted">Use o formulário à esquerda pra postar ✨</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
