import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Admin() {
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState("");
    const [msg, setMsg] = useState("");

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => sub.subscription.unsubscribe();
    }, []);

    async function login() {
        const email = prompt("Seu email (vai receber link mágico):");
        if (!email) return;
        setStatus("Enviando link...");
        const { error } = await supabase.auth.signInWithOtp({ email });
        setStatus(error ? error.message : "Link enviado. Abra seu email e clique. Depois volte aqui.");
    }

    async function logout() {
        await supabase.auth.signOut();
    }

    async function onSubmit(e) {
        e.preventDefault();
        setMsg("Salvando...");

        const fd = new FormData(e.currentTarget);
        const titulo = (fd.get("titulo") || "").toString().trim();
        const lugar = (fd.get("lugar") || "").toString().trim();
        const horario = (fd.get("horario") || "").toString().trim();
        const descricao = (fd.get("descricao") || "").toString().trim();
        const file = fd.get("foto");

        try {
            if (!file || !file.name) throw new Error("Selecione uma foto");

            const ext = file.name.split(".").pop();
            const fileName = `${crypto.randomUUID()}.${ext}`;
            const path = `memorias/${fileName}`;

            const { error: upErr } = await supabase.storage.from("fotos").upload(path, file, { upsert: false, contentType: file.type });

            const { data: pub } = supabase.storage.from("fotos").getPublicUrl(path);
            const foto_url = pub.publicUrl;

            const { error: dbErr } = await supabase.from("memorias").insert({
                titulo,
                lugar,
                horario,
                descricao,
                foto_url,
            });
            if (dbErr) throw dbErr;

            setMsg("Salvo ✅");
            e.target.reset();
        } catch (err) {
            setMsg("Erro: " + err.message);
        }
    }

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
            <h2>Admin</h2>

            {session ? (
                <>
                    <p>Logado como: <b>{session.user.email}</b></p>
                    <button onClick={logout}>Sair</button>

                    <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 10 }}>
                        <input name="titulo" placeholder="Título" required />
                        <input name="lugar" placeholder="Lugar" />
                        <input name="horario" placeholder="Horário (ex: 16/12/2025 19:30)" />
                        <textarea name="descricao" placeholder="Descrição / recado" rows={5} />
                        <input name="foto" type="file" accept="image/*" required />
                        <button type="submit">Salvar</button>
                        {msg && <small>{msg}</small>}
                    </form>
                </>
            ) : (
                <>
                    <button onClick={login}>Login (email)</button>
                    {status && <p>{status}</p>}
                    <p style={{ opacity: 0.7 }}>Faça login para cadastrar memórias.</p>
                </>
            )}
        </div>
    );
}
