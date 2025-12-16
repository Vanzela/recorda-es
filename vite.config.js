import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/recordacoes/", // 👈 tem que ser o nome do seu repo
});
