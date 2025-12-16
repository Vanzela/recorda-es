import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";

export default function Dashboard() {
    const [session, setSession] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // link base certo pro GitHub Pages + HashRouter
    const isGhPages = window.location.hostname.includes("github.io");

    const baseUrl = isGhPages
        ? window.location.origin + "/recorda-es/" // 🔴 TROQUE pelo nome real do repo
        : window.location.origin + "/";


    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            loadAlbums();
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            setSession(s);
            loadAlbums();
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    async function loadAlbums() {
        const { data, error } = await supabase
            .from("albums")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) setAlbums(data || []);
    }

    function makeSlug(v) {
        return v
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    }

    useEffect(() => {
        if (!slug && title) setSlug(makeSlug(title));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title]);

    async function createAlbum(e) {
        e.preventDefault();
        setMsg("Criando...");

        const owner_id = session?.user?.id;
        if (!owner_id) return;

        const finalSlug = makeSlug(slug || title);
        const { error } = await supabase.from("albums").insert({
            owner_id,
            title: title.trim(),
            slug: finalSlug,
            is_public: true,
        });

        setMsg(error ? error.message : "Álbum criado ✅");
        if (!error) {
            setTitle("");
            setSlug("");
            loadAlbums();
        }
    }

    async function editAlbum(a) {
        const newTitle = prompt("Novo título:", a.title);
        if (!newTitle) return;

        const newSlug = prompt("Novo slug (link):", a.slug);
        if (!newSlug) return;

        const { error } = await supabase
            .from("albums")
            .update({ title: newTitle.trim(), slug: makeSlug(newSlug) })
            .eq("id", a.id);

        if (error) alert(error.message);
        else loadAlbums();
    }

    async function deleteAlbum(a) {
        const ok = confirm(`Excluir o álbum "${a.title}"? (vai apagar as memórias dele também)`);
        if (!ok) return;

        const { error } = await supabase.from("albums").delete().eq("id", a.id);
        if (error) alert(error.message);
        else loadAlbums();
    }

    async function copyLink(a) {
        const link = `${baseUrl}#/a/${a.slug}`;
        const textoFofo =
            `✨ Separei um álbum de recordações pra você:\n` +
            `${link}\n\n` +
            `Depois me conta qual foto você mais gostou 💛`;

        await navigator.clipboard.writeText(textoFofo);
        alert("Copiado! ✅ (com mensagem fofa)");
    }

    async function openQr(a) {
        const link = `${baseUrl}#/a/${a.slug}`;
        const dataUrl = await QRCode.toDataURL(link, { margin: 1, scale: 6 });
        const w = window.open("", "_blank");
        w.document.write(`
      <div style="font-family:system-ui;padding:16px">
        <h3>${a.title}</h3>
        <p><a href="${link}">${link}</a></p>
        <img src="${dataUrl}" style="width:260px;height:260px"/>
        <p>Escaneie o QR e abra o álbum ✨</p>
      </div>
    `);
    }

    async function logout() {
        await supabase.auth.signOut();
        navigate("/login");
    }

    return (
        <div id="body-dashboard">
            <header>
                <h2>Dashboard</h2>
                <div >
                    Logado como <b>{session?.user?.email}</b>
                </div>
                <button id="Button-logout" onClick={logout}>Sair</button>
            </header>

            <hr style={{ margin: "16px 0", opacity: 0.2 }} />

            <h3>Criar novo álbum</h3>
            <form onSubmit={createAlbum} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
                <input
                    placeholder="Título do álbum (ex: Viagem Rio 2025)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    placeholder="Slug do link (ex: viagem-rio-2025)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                />
                <button type="submit">Criar</button>
                {msg && <small>{msg}</small>}
            </form>

            <hr style={{ margin: "16px 0", opacity: 0.2 }} />

            <h3>Meus álbuns</h3>
            <div style={{ display: "grid", gap: 10 }}>
                {albums.map((a) => {
                    const link = `${baseUrl}#/a/${a.slug}`;
                    return (
                        <div key={a.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                <div>
                                    <b>{a.title}</b>{" "}
                                    <span style={{ opacity: 0.7 }}>({a.slug})</span>
                                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                                        Link: <a href={link}>{link}</a>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button onClick={() => navigate(`/dashboard/album/${a.id}`)}>Publicar</button>
                                    <button onClick={() => copyLink(a)}>Copiar link</button>
                                    <button onClick={() => openQr(a)}>QR Code</button>
                                    <button onClick={() => editAlbum(a)}>Editar</button>
                                    <button onClick={() => deleteAlbum(a)} style={{ color: "tomato" }}>Excluir</button>
                                </div>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <Link to={`/a/${a.slug}`}>Abrir público</Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
