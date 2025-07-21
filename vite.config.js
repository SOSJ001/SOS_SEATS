import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    include: ["@solana/web3.js"],
  },
  define: {
    "process.env.BROWSER": true,
    "process.env.NODE_DEBUG": JSON.stringify(""),
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
