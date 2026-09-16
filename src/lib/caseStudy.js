/**
 * In-site case study state, mirrored to the URL as `#work/<slug>` so a case study can be
 * linked to and the browser's back button closes it. The page behind stays mounted (the
 * pinned hero never reloads); Lenis is stopped while a study is open.
 */
import { useSyncExternalStore } from 'react'
import { work } from '../data/profile'
import { getLenis } from './smoothScroll'

const PREFIX = '#work/'
let current = null
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

export function slugFromHash(hash = window.location.hash) {
  if (!hash.startsWith(PREFIX)) return null
  const slug = decodeURIComponent(hash.slice(PREFIX.length))
  return work.some((w) => w.slug === slug) ? slug : null
}

function apply(slug) {
  if (slug === current) return
  current = slug
  const lenis = getLenis()
  if (slug) lenis?.stop()
  else lenis?.start()
  document.documentElement.classList.toggle('study-open', !!slug)
  emit()
}

export function openStudy(slug) {
  if (!work.some((w) => w.slug === slug)) return
  if (slugFromHash() !== slug) window.history.pushState({ study: slug }, '', `${PREFIX}${slug}`)
  apply(slug)
}

export function closeStudy() {
  if (!current) return
  if (slugFromHash() === current) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
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
