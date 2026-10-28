import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
			"next/image": path.resolve(import.meta.dirname, "./src/shims/next-image.tsx"),
			"next/link": path.resolve(import.meta.dirname, "./src/shims/next-link.tsx"),
			"next/navigation": path.resolve(import.meta.dirname, "./src/shims/next-navigation.ts"),
		},
	},
	server: {
		port: 3001,
		strictPort: true,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/aurabook": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
			"/graphql": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
			"/media": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
		},
	},
});
