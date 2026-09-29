import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
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