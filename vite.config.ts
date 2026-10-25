import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'

const plugins: PluginOption[] = [tailwindcss(), react()]

// Cloudflare worker/pages plugin only supported on desktop/server OS (not Android bionic)
if (process.platform !== 'android') {
  try {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    plugins.push(cloudflare())
  } catch {
    // plugin or workerd not available
  }
}

export default defineConfig({
  plugins,
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})

