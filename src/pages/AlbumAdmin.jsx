import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { albumPublicLink } from "../lib/publicUrl";

export default function AlbumAdmin() {
    const { id } = useParams(); // album_id
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [items, setItems] = useState([]);
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState("");



    const publicLink = album ? albumPublicLink(album.slug) : "";

    useEffect(() => {
        load();
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
            e.target.reset();
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
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
            <div>
                <button onClick={() => navigate("/dashboard")}>← Voltar</button>
                <h2 style={{ marginTop: 10 }}>Publicar no álbum</h2>
                {album && <p style={{ opacity: 0.75 }}><b>{album.title}</b></p>}
                {msg && <p style={{ color: msg.startsWith("Erro") ? "tomato" : "inherit" }}>{msg}</p>}

                <form onSubmit={addMemory} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
                    <input name="title" placeholder="Título" required />
                    <input name="place" placeholder="Lugar" />
                    <input name="time" placeholder="Horário (ex: 16/12/2025 19:30)" />
                    <textarea name="description" placeholder="Descrição / recado" rows={5} />
                    <input name="photo" type="file" accept="image/*" required />
                    <button type="submit" disabled={saving}>
                        {saving ? "Salvando..." : "Salvar recordação"}
                    </button>
                </form>

                <hr style={{ margin: "16px 0", opacity: 0.2 }} />

                <h3>Recordações deste álbum</h3>
                <div style={{ display: "grid", gap: 12 }}>
                    {items.map((m) => (
                        <div key={m.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <b>{m.title}</b>
                                <button onClick={() => deleteMemory(m)} style={{ color: "tomato" }}>
                                    Excluir
                                </button>
                            </div>
                            <div style={{ opacity: 0.75, fontSize: 13 }}>{m.place || "-"} • {m.time || "-"}</div>
                            <div style={{ marginTop: 6, whiteSpace: "pre-wrap", fontSize: 13 }}>{m.description || ""}</div>
                            <img
                                src={m.photo_url + "?t=" + m.created_at}
                                alt={m.title}
                                style={{ width: 220, borderRadius: 10, marginTop: 8 }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Lateral: QR + link + copiar */}
            <aside style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                <h3 style={{ marginTop: 0 }}>Compartilhar</h3>
                {album ? (
                    <>
                        <div style={{ fontSize: 13, opacity: 0.8, wordBreak: "break-word" }}>{publicLink}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            <button onClick={copyLink}>Copiar link fofo</button>
                            <a href={publicLink} target="_blank" rel="noreferrer">
                                <button>Abrir</button>
                            </a>
                        </div>
                        {qrDataUrl && (
                            <div style={{ marginTop: 12 }}>
                                <img src={qrDataUrl} alt="QR Code" style={{ width: "100%", maxWidth: 260 }} />
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ opacity: 0.7 }}>Carregando álbum...</div>
                )}
            </aside>
        </div>
    );
}
