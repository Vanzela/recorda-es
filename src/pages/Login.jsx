import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/dashboard");
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setMsg("Enviando link...");

    const { error } = await supabase.auth.signInWithOtp({ email });
    setMsg(error ? error.message : "Link enviado! Verifique seu email.");
  }

  return (
    <div className="login-page">
      <div className="login-polaroid">
        <div className="login-card">
          <h2>Login</h2>
          <p>Entre com seu email para receber o link mágico</p>

          <form className="login-form" onSubmit={submit}>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit">Entrar</button>
          </form>

          {msg && <p>{msg}</p>}
        </div>
      </div>
    </div>

  );

}
