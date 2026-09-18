/**
 * In-site case study state, mirrored to the URL as `#work/<slug>` so a case study can be
 * linked to and the browser's back button closes it. The page behind stays mounted (the
 * pinned hero never reloads); Lenis is stopped while a study is open.
 */
import { useSyncExternalStore } from 'react'
import { work } from '../data/profile'
import { getLenis } from './smoothScroll'
import { jumpTo } from './hashNav'

const PREFIX = '#work/'
let current = null
let returnHash = '' // the section hash (e.g. '#work') that was in the URL when the first study opened
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

export function slugFromHash(hash = window.location.hash) {
  if (!hash.startsWith(PREFIX)) return null
  const slug = decodeURIComponent(hash.slice(PREFIX.length))
  return work.some((w) => w.slug === slug) ? slug : null
}

let savedScroll = 0 // page position behind the sheet (it cannot change while a study is open)

function apply(slug) {
  if (slug === current) return
  const wasOpen = !!current
  current = slug
  const lenis = getLenis()
  if (slug) {
    if (!wasOpen) savedScroll = window.scrollY
    lenis?.stop()
  } else {
    lenis?.start()
    // Put the page back exactly where it was when the study opened. A back/forward traversal to a
    // '#section' URL also makes the browser jump to that element natively between `popstate` and
    // `hashchange` (same task, before paint) — restore again on that hashchange, if one follows.
    const restore = () => jumpTo(savedScroll)
    restore()
    const once = () => {
      window.removeEventListener('hashchange', once)
      restore()
    }
    window.addEventListener('hashchange', once)
    setTimeout(() => window.removeEventListener('hashchange', once), 0)
  }
  document.documentElement.classList.toggle('study-open', !!slug)
  emit()
}

export function openStudy(slug) {
  if (!work.some((w) => w.slug === slug)) return
  if (slugFromHash() !== slug) {
    if (!current) returnHash = slugFromHash() ? '' : window.location.hash
    window.history.pushState({ study: slug }, '', `${PREFIX}${slug}`)
  }
  apply(slug)
}

/** Close via ESC / the close button: the URL goes back to the section hash it had before. */
export function closeStudy() {
  if (!current) return
  if (slugFromHash() === current) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + returnHash)
  }
  apply(null)
}

/** Call once after the site has entered: opens a deep-linked study, then follows history. */
export function initStudyRouting() {
  const onPop = () => apply(slugFromHash())
  window.addEventListener('popstate', onPop)
  const initial = slugFromHash()
  if (initial) apply(initial)
  return () => window.removeEventListener('popstate', onPop)
}

export function useStudy() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null,
  )
}
