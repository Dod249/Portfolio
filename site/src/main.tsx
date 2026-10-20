import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ACCENT_PRESETS, THEME } from '@/data/site'
import { logoSvg } from '@/lib/logo'

// Apply the accent colour (white when the site is pure black & white).
// In development, ?accent=blue|yellow|none previews a preset without editing the code.
function applyTheme() {
  let theme: { accent: string | null; accentInk: string } = THEME
  if (import.meta.env.DEV) {
    const preset = new URLSearchParams(window.location.search).get('accent')
    if (preset && preset in ACCENT_PRESETS) theme = ACCENT_PRESETS[preset as keyof typeof ACCENT_PRESETS]
  }
  // Favicon: the Duo logo
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.head.appendChild(document.createElement('link'))
  icon.rel = 'icon'
  icon.type = 'image/svg+xml'
  icon.href = 'data:image/svg+xml,' + encodeURIComponent(logoSvg('#0e0e0e', '#f2f2f2', theme.accent ?? '#f2f2f2'))
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
