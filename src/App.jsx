import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AlbumPublico from "./pages/AlbumPublico";
import AlbumAdmin from "./pages/AlbumAdmin";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 1) Home: se não logar, cai no login */}
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* 2) Login */}
        <Route path="/login" element={<Login />} />

        {/* 3) Dashboard (logado) */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* 4) Admin de um álbum (publicar recordações no álbum certo) */}
        <Route path="/dashboard/album/:id" element={<RequireAuth><AlbumAdmin /></RequireAuth>} />

        {/* 5) Público: link do álbum */}
        <Route path="/a/:slug" element={<AlbumPublico />} />
      </Routes>
    </HashRouter>
  );
}
