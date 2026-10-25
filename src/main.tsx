import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './services/serviceWorker'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (typeof window !== 'undefined') {
  (window as unknown as { __SPREAD_SPENDS_MOUNTED?: boolean }).__SPREAD_SPENDS_MOUNTED = true
}
