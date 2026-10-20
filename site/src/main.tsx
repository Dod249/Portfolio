import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ACCENT_PRESETS, THEME } from '@/data/site'

// Apply the accent colour (white when the site is pure black & white).
// In development, ?accent=blue|yellow|none previews a preset without editing the code.
function applyTheme() {
  let theme: { accent: string | null; accentInk: string } = THEME
  if (import.meta.env.DEV) {
    const preset = new URLSearchParams(window.location.search).get('accent')
    if (preset && preset in ACCENT_PRESETS) theme = ACCENT_PRESETS[preset as keyof typeof ACCENT_PRESETS]
  }
  if (!theme.accent) return
  const root = document.documentElement.style
  root.setProperty('--color-accent', theme.accent)
  root.setProperty('--color-accent-ink', theme.accentInk)
  root.setProperty('--color-label', theme.accent)
}
applyTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
