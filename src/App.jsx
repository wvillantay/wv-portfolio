import { useEffect, useRef, useState } from 'react'
import { initSmoothScroll, ScrollTrigger } from './lib/smoothScroll'
import { createSequence, fetchManifest } from './sequence/createSequence'
import { markSiteReady } from './lib/siteReady'
import Loader from './components/Loader'
import Nav from './components/Nav'
import Hero from './components/Hero'
import SystemProfile from './components/SystemProfile'
import Skills from './components/Skills'
import Work from './components/Work'
import Contact from './components/Contact'
import CaseStudy from './components/CaseStudy'
import { initStudyRouting, slugFromHash } from './lib/caseStudy'
import { initHashNav, sectionIdFromHash, runColdDeepLink } from './lib/hashNav'
import { initialHash } from './lib/initialHash'

export default function App() {
  const [seq, setSeq] = useState(null)
  const [progress, setProgress] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = initSmoothScroll()
    lenisRef.current = lenis
    lenis.stop() // page is frozen behind the loader
    // Hash routing on a fresh load:
    //   (none)          → open on the hero's first frame (manual scroll restoration, forced to 0)
    //   #work/<slug>    → kept; the case study opens over the hero once entered
    //   #work #profile… → kept; the page scrolls to that section once entered (see the effect below)
    //   anything else   → stripped, opens at 0
    const study = slugFromHash(initialHash)
    const section = sectionIdFromHash(initialHash)
    if (!study && !section) {
      window.scrollTo(0, 0)
      lenis.scrollTo(0, { immediate: true, force: true })
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }

    let cancelled = false
    ;(async () => {
      try {
        const manifest = await fetchManifest()
        const s = createSequence(manifest)
        await s.loadPoster()
        if (cancelled) return
        setSeq(s)
        document.fonts?.ready.then(() => !cancelled && setFontsReady(true))
        await s.load((p) => !cancelled && setProgress(p))
        if (cancelled) return
        setReady(true)
      } catch (err) {
        console.error('[sequence]', err)
        // still let the site open, the hero falls back to the poster / solid ink
        setProgress(1)
        setFontsReady(true)
        setReady(true)
        markSiteReady()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!entered) return
    const lenis = lenisRef.current
    // Which section (if any) this visit deep-links to — from the hash captured at startup, so a
    // later rewrite of the URL can never turn a deep link into a plain load.
    const target = sectionIdFromHash(initialHash)
    if (!target || target === 'home') lenis?.scrollTo(0, { immediate: true, force: true })
    lenis?.start()
    let raf1 = 0
    let stopDeepLink = () => {}
    if (target && target !== 'home') {
      // cold-load deep link: gated on pin measurement + ScrollTrigger refresh + real layout, then
      // one jump with a next-frame verification (see src/lib/hashNav.js)
      stopDeepLink = runColdDeepLink(initialHash)
    } else {
      // layout is final once the loader is gone: re-measure the pin spacer and section tops
      raf1 = requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    // routing starts only once the page is interactive: section hashes (clicks push the hash;
    // back/forward scroll between sections) and case studies (deep link + back button). The
    // section router is registered first so it can see whether a popstate is leaving a study.
    const stopHash = initHashNav()
    const stopStudy = initStudyRouting()
    return () => {
      cancelAnimationFrame(raf1)
      stopDeepLink()
      stopStudy()
      stopHash()
    }
  }, [entered])

  return (
    <>
      <Loader progress={progress} fontsReady={fontsReady} ready={ready} onDone={() => setEntered(true)} />
      <Nav visible={entered} />
      <main>
        <Hero seq={seq} entered={entered} ready={ready} />
        <SystemProfile />
        <Skills />
        <Work />
        <Contact />
      </main>
      <CaseStudy />
    </>
  )
}
