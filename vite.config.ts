import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
  ],
  // Exclude server-only packages from client bundle
  optimizeDeps: {
    exclude: ['pg', 'drizzle-orm', 'ws', 'jsonwebtoken', 'bcryptjs'],
  },
  build: {
    rollupOptions: {
      external: ['pg', 'drizzle-orm', 'ws', 'jsonwebtoken', 'bcryptjs'],
    },
    outDir: 'dist',
  },
  ssr: {
    noExternal: ['@tanstack/react-router', '@tanstack/react-query'],
    external: ['pg', 'drizzle-orm', 'ws', 'jsonwebtoken', 'bcryptjs'],
  },
});
