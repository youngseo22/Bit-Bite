import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { type UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const baseConfig: UserConfig = {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}

export default defineConfig(baseConfig)
