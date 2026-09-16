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
    // Always open on the hero's first frame — no restored mid-scroll position, no hash offset.
    // A `#work/<slug>` deep link is kept: it opens the case study sheet over the hero once entered.
    window.scrollTo(0, 0)
    lenis.scrollTo(0, { immediate: true, force: true })
    if (window.location.hash && !slugFromHash()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
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
    lenis?.scrollTo(0, { immediate: true, force: true })
    lenis?.start()
    // layout is final once the loader is gone
    requestAnimationFrame(() => ScrollTrigger.refresh())
    // case-study routing (deep link + back button) starts only once the page is interactive
    return initStudyRouting()
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
