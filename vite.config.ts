import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tailwindcss(), react(), cloudflare()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.notafakecloud.uk', '.sslip.io', 'electricgrill.local'],
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.notafakecloud.uk', '.sslip.io', 'electricgrill.local'],
  },
})