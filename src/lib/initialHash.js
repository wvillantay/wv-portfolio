/**
 * The URL hash as it was at the very start of app startup — captured when this module is
 * evaluated (imported first by main.jsx), before React mounts and before anything else can read
 * or rewrite the URL. Deep-link decisions are made from this value, not from a later re-read.
 *
 * Pure: no DOM lookups, so it is safe at module-evaluation time.
 */
export const initialHash = typeof window !== 'undefined' ? window.location.hash : ''

const SECTION_NAMES = new Set(['home', 'top', 'about', 'profile', 'stack', 'work', 'contact'])

/** True for `#work`, `#profile`, … (a section deep link) or `#work/<slug>` (a case-study deep link). */
export function isDeepLinkHash(hash = initialHash) {
  if (!hash || hash.length < 2) return false
  let raw
  try {
    raw = decodeURIComponent(hash.slice(1)).toLowerCase()
  } catch {
    return false
  }
  if (raw.startsWith('work/')) return true
  return SECTION_NAMES.has(raw)
}

/** Build stamp, so the deployed version can be verified from DevTools: `document.documentElement.dataset.build`. */
export const BUILD = '2026-09-18-v9.1-deeplink'
