import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis = null

/** Lenis drives scroll; GSAP's ticker drives Lenis; ScrollTrigger listens to Lenis. */
export function initSmoothScroll() {
  if (lenis) return lenis
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  lenis = new Lenis({
    lerp: reduce ? 1 : 0.09,
    wheelMultiplier: 1,
    smoothWheel: !reduce,
    anchors: { offset: 0 },
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  // exposed for automated checks and for the console
  window.__lenis = lenis
  window.__gsap = gsap
  window.__ScrollTrigger = ScrollTrigger
  return lenis
}

export function getLenis() {
  return lenis
}

export { gsap, ScrollTrigger }
