/**
 * Section deep links and in-page navigation.
 *
 *   /#work  /#profile  /#stack  /#contact  /#home   (aliases: #about → profile section, #top → home)
 *
 * - On a fresh load the hash is kept in the URL; App scrolls to the section once the loader has
 *   cleared, the hero pin is measured and ScrollTrigger has been refreshed (an immediate jump, no
 *   animation, offset by the fixed nav). Page loads without a hash keep opening on the hero at 0.
 * - Clicks on any same-page `a[href^="#"]` (nav, hero CTAs, contact) scroll smoothly with Lenis and
 *   push the hash into the URL, so back/forward move between sections.
 * - `#work/<slug>` hashes belong to the case-study router (src/lib/caseStudy.js) and are ignored here.
 *
 * The profile section's element id is `about` (the hero's handoff timeline targets it, and that file
 * is frozen), so `profile` resolves to it. Nothing in here touches the hero.
 */
import { getLenis, ScrollTrigger } from './smoothScroll'
import { whenSiteReady } from './siteReady'
import { initialHash } from './initialHash'

const SECTIONS = ['home', 'about', 'stack', 'work', 'contact']
const ALIASES = { profile: 'about', top: 'home' }

/** Section element id for a hash, or null (empty, unknown, or a `#work/<slug>` case-study hash). */
export function sectionIdFromHash(hash = window.location.hash) {
  if (!hash || hash.length < 2) return null
  let raw
  try {
    raw = decodeURIComponent(hash.slice(1))
  } catch {
    return null
  }
  if (raw.includes('/')) return null // case study, not a section
  const id = ALIASES[raw.toLowerCase()] || raw.toLowerCase()
  return SECTIONS.includes(id) && document.getElementById(id) ? id : null
}

function navHeight() {
  const h = document.querySelector('header')
  return h ? Math.round(h.getBoundingClientRect().height) : 68
}

/**
 * Document y for a section: its top minus the fixed nav, except the profile sheet, which lands
 * exactly where its handoff over the pinned hero completes (its top at the viewport top).
 */
export function sectionTargetY(id) {
  if (id === 'home') return 0
  const el = document.getElementById(id)
  if (!el) return null
  const top = el.getBoundingClientRect().top + window.scrollY
  const offset = id === 'about' ? 0 : -navHeight()
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  return Math.min(Math.max(0, Math.round(top + offset)), max)
}

/**
 * Instant jump that keeps Lenis in sync. The window is moved first: Lenis's own scrollTo
 * early-returns when it *believes* it is already at `y` (its scroll-event sync lags a frame
 * behind a native fragment jump), which would otherwise leave the document where the browser put it.
 */
export function jumpTo(y) {
  window.scrollTo(0, y)
  getLenis()?.scrollTo(y, { immediate: true, force: true })
}

/** Scroll to a section. `immediate` jumps (deep links); otherwise Lenis eases there. */
export function scrollToSection(id, { immediate = false } = {}) {
  const y = sectionTargetY(id)
  if (y == null) return false
  const lenis = getLenis()
  if (immediate || !lenis) jumpTo(y)
  else lenis.scrollTo(y, { force: true })
  return true
}

/** Expected viewport-top of a section once landed (0 for the profile sheet, nav height otherwise). */
function expectedTop(id) {
  return id === 'about' ? 0 : navHeight()
}

// 'idle' → 'running' (gates pending) → 'done' (landed). A cancelled run goes back to 'idle' so a
// re-invocation (React StrictMode double effects in dev) can still land; a landed run never repeats.
let deepLinkState = 'idle'
let cancelRunning = null

/**
 * Cold-load deep link: `/#work`, `/#profile`, `/#stack`, `/#contact` on a brand-new visit.
 *
 * Runs once (idempotent), only after every readiness gate has passed, in this order:
 *   1. the loader is gone (`entered` — the caller only invokes this then)
 *   2. Lenis exists and is started
 *   3. the hero pin has been created and measured (`whenSiteReady`)
 *   4. ScrollTrigger has been refreshed with the final layout
 *   5. the target section has a real layout position and the document is tall enough to reach it
 * then jumps (no easing — nothing to animate through on a first paint), and verifies on the next
 * animation frame plus two short follow-ups (fonts / late images / ScrollTrigger's own `load`
 * refresh can still nudge layout). A correction is applied only while the visitor has not
 * interacted, so it never fights real scrolling. Returns a cancel function.
 */
export function runColdDeepLink(hash = initialHash) {
  if (deepLinkState === 'done') return () => {}
  const id = sectionIdFromHash(hash)
  if (!id || id === 'home') return () => {}
  if (deepLinkState === 'running') cancelRunning?.()
  deepLinkState = 'running'

  let cancelled = false
  let userMoved = false
  const timers = []
  const rafs = []
  const cancelOnInput = () => {
    userMoved = true
  }
  const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  inputs.forEach((ev) => window.addEventListener(ev, cancelOnInput, { passive: true }))
  const cleanup = () => {
    cancelled = true
    timers.forEach(clearTimeout)
    rafs.forEach(cancelAnimationFrame)
    inputs.forEach((ev) => window.removeEventListener(ev, cancelOnInput))
    if (deepLinkState === 'running') deepLinkState = 'idle'
    if (cancelRunning === cleanup) cancelRunning = null
  }
  cancelRunning = cleanup
  const raf = (fn) => rafs.push(requestAnimationFrame(fn))
  const later = (ms, fn) => timers.push(setTimeout(fn, ms))

  const el = () => document.getElementById(id)
  const layoutReady = () => {
    const node = el()
    if (!node || node.offsetHeight === 0) return false
    const y = sectionTargetY(id)
    if (y == null) return false
    // reachable: the document must be tall enough that scrolling to `y` is actually possible
    return document.documentElement.scrollHeight - window.innerHeight >= y - 1
  }
  const stats = (window.__wvDeepLink = { id, landed: 0, corrections: [] }) // exposed for automated checks
  const land = () => {
    const y = sectionTargetY(id)
    if (y == null) return
    jumpTo(y)
    ScrollTrigger.update()
    deepLinkState = 'done'
    stats.landed++
  }
  const drift = () => {
    const node = el()
    if (!node) return 0
    return Math.round(node.getBoundingClientRect().top) - expectedTop(id)
  }
  const verify = (label) => {
    if (cancelled || userMoved) return
    const d = drift()
    if (Math.abs(d) > 4) {
      stats.corrections.push({ at: label, drift: d })
      land()
    }
  }

  // 3. hero pin measured
  whenSiteReady(() => {
    if (cancelled) return
    // 4. final layout → refresh ScrollTrigger (pin spacer, section tops), then …
    raf(() => {
      if (cancelled) return
      ScrollTrigger.refresh()
      // 5. … wait until the target has a real, reachable position (bounded: ~1 s of frames)
      let tries = 0
      const attempt = () => {
        if (cancelled) return
        if (!layoutReady() && tries++ < 60) return raf(attempt)
        land()
        // verification on the next frame, then two short follow-ups; each corrects at most once
        raf(() => verify('next frame'))
        later(300, () => verify('+300ms'))
        later(1200, () => verify('+1200ms'))
        later(1300, cleanup)
      }
      raf(attempt)
    })
  })
  return cleanup
}

/**
 * Click delegation for same-page hash links + popstate for section hashes.
 * Call once after the site has entered. Returns a cleanup.
 */
export function initHashNav() {
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest?.('a[href^="#"]')
    if (!a || a.target === '_blank') return
    const href = a.getAttribute('href')
    const id = sectionIdFromHash(href)
    if (!id) return // let case-study links / unknown hashes behave as before
    e.preventDefault()
    if (window.location.hash !== href) window.history.pushState({ section: id }, '', href)
    scrollToSection(id)
  }
  // History traversal (back/forward, or a hash typed into the address bar) is a fragment
  // navigation: between `popstate` and `hashchange` the browser jumps the page to the element
  // natively (no nav offset, no easing). Both events fire in the same task, before any paint, so
  // we note the position at popstate and, at hashchange, put it back and let Lenis ease from there.
  let prePop = null
  let leavingStudy = false
  const onPop = () => {
    prePop = window.scrollY
    // leaving a case study: the study router closes the sheet and restores the page position itself
    leavingStudy = document.documentElement.classList.contains('study-open')
  }
  const onHash = () => {
    if (leavingStudy) {
      leavingStudy = false
      prePop = null
      return
    }
    const hash = window.location.hash
    const id = hash ? sectionIdFromHash(hash) : 'home'
    if (!id) return
    if (prePop != null) jumpTo(prePop) // undo the native jump, then ease from where the user was
    prePop = null
    scrollToSection(id)
  }
  document.addEventListener('click', onClick)
  window.addEventListener('popstate', onPop)
  window.addEventListener('hashchange', onHash)
  return () => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('hashchange', onHash)
  }
}
