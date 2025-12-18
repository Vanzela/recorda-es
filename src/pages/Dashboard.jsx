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
    const [showNew, setShowNew] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [qrAlbum, setQrAlbum] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState("");


    const navigate = useNavigate();

    const baseUrl = useMemo(() => {
        // GH Pages + HashRouter: mantém /recorda-es/ e / no local
        return window.location.origin + window.location.pathname;
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            loadAlbums();
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            setSession(s);
            loadAlbums();
        });

        const closeMenus = () => setOpenMenuId(null);
        window.addEventListener("click", closeMenus);

        return () => {
            sub.subscription.unsubscribe();
            window.removeEventListener("click", closeMenus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
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
            setShowNew(false);
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
        const ok = confirm(
            `Excluir o álbum "${a.title}"? (vai apagar as memórias dele também)`
        );
        if (!ok) return;

        const { error } = await supabase.from("albums").delete().eq("id", a.id);
        if (error) alert(error.message);
        else loadAlbums();
    }

    async function copyFofo(a) {
        const link = `${baseUrl}#/a/${a.slug}`;
        const textoFofo =
            `✨ Separei um álbum de recordações pra você:\n` +
            `${link}\n\n` +
            `Depois me conta qual foto você mais gostou 💛`;

        await navigator.clipboard.writeText(textoFofo);
        alert("Copiado! ✅");
    }

    async function openQr(a) {
        if (qrAlbum?.id === a.id) {
            // se clicar de novo, fecha
            setQrAlbum(null);
            setQrDataUrl("");
            return;
        }

        const link = `${baseUrl}#/a/${a.slug}`;
        const dataUrl = await QRCode.toDataURL(link, { margin: 1, scale: 6 });

        setQrAlbum(a);
        setQrDataUrl(dataUrl);
    }


    async function logout() {
        await supabase.auth.signOut();
        navigate("/login");
    }

    return (
        <div className="dash">
            {/* SIDEBAR */}
            <aside className="dash__side">
                <div className="side__top">
                    <img className="side__logo" src="./src/assets/RTICO.jpg" alt="Logo" />
                    <div className="side__email">
                        Logado como <b>{session?.user?.email}</b>
                    </div>

                    <button
                        className="btn btn--primary"
                        onClick={() => setShowNew((s) => !s)}
                    >
                        {showNew ? "Fechar" : "+ Novo álbum"}
                    </button>

                    {showNew && (
                        <div className="side__panel">
                            <div className="panel__title">Criar novo álbum</div>

                            <form onSubmit={createAlbum} className="form">
                                <input
                                    placeholder="Título do álbum (ex: Eu & Você 💛)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                                <input
                                    placeholder="Slug do link (ex: eu-e-voce)"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                />
                                <button className="btn btn--ok" type="submit">
                                    Criar
                                </button>
                                {msg && <small className="muted">{msg}</small>}
                            </form>
                        </div>
                    )}
                </div>

                <div className="side__bottom">
                    <button className="btn btn--ghost" onClick={logout}>
                        Sair
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="dash__main">
                <header className="main__header">
                    <h2>Álbuns ativos</h2>
                    <div className="muted">
                        {albums.length} {albums.length === 1 ? "álbum" : "álbuns"}
                    </div>
                </header>

                <div className="grid">
                    {albums.map((a) => {
                        const link = `${baseUrl}#/a/${a.slug}`;

                        return (
                            <div key={a.id} className="card">
                                <div className="card__top">
                                    <div>
                                        <div className="card__title">{a.title}</div>
                                        <div className="card__link">
                                            <a href={link} target="_blank" rel="noreferrer">
                                                {link}
                                            </a>
                                        </div>
                                    </div>

                                    {/* menu 3 pontinhos */}
                                    <div className="menuWrap" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="iconBtn"
                                            onClick={() =>
                                                setOpenMenuId((id) => (id === a.id ? null : a.id))
                                            }
                                            aria-label="Menu"
                                        >
                                            ⋯
                                        </button>

                                        {openMenuId === a.id && (
                                            <div className="menu">
                                                <button onClick={() => navigate(`/dashboard/album/${a.id}`)}>
                                                    Gerenciar
                                                </button>
                                                <button onClick={() => openQr(a)}>QR Code</button>
                                                <button onClick={() => editAlbum(a)}>Editar nome do Album</button>
                                                <div className="menu__sep" />
                                                <button className="danger" onClick={() => deleteAlbum(a)}>
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card__actions">
                                    <button className="btn btn--share" onClick={() => copyFofo(a)}>
                                        Compartilhar
                                    </button>

                                    <Link className="link" to={`/a/${a.slug}`}>
                                        Abrir→
                                    </Link>
                                </div>
                                {qrAlbum?.id === a.id && (
                                    <div className="qrBox">
                                        <img src={qrDataUrl} alt="QR Code" />
                                        <div className="qrText">
                                            Escaneie ou compartilhe este álbum ✨
                                        </div>
                                    </div>
                                )}

                            </div>
                        );
                    })}

                    {!albums.length && (
                        <div className="empty">
                            <div className="empty__title">Nenhum álbum ainda</div>
                            <div className="muted">
                                Clique em <b>+ Novo álbum</b> pra começar ✨
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
