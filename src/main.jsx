import { initialHash, isDeepLinkHash, BUILD } from './lib/initialHash' // first: captures the hash before anything else runs
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The hero is a pinned timeline: a plain visit must start at the top, never at a restored offset.
// A deep link (#work, #profile, … or #work/<slug>) is left alone — the app scrolls to it itself once
// the loader has cleared and the layout is final (src/lib/hashNav.js), and never touches 0 first.
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
if (!isDeepLinkHash(initialHash)) window.scrollTo(0, 0)
document.documentElement.dataset.build = BUILD

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
