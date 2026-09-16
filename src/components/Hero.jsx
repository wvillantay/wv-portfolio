import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/smoothScroll'
import { markSiteReady } from '../lib/siteReady'
import { renderBackdrop } from '../lib/backdrop'
import { profile } from '../data/profile'

/** Scroll distance the timeline is scrubbed over, then the extra distance the hero
 *  stays pinned while the profile sheet slides over it. */
const SCRUB_DISTANCE = '300%'
const PIN_DISTANCE = '400%'

export default function Hero({ seq, entered, ready }) {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const introRef = useRef(null)
  const titleRef = useRef(null)
  const railRef = useRef(null)
  const counterRef = useRef(null)
  const scrubRef = useRef(null)
  const dimRef = useRef(null)
  const state = useRef({ progress: 0 })
  const renderRef = useRef(() => {})

  /* Canvas + scroll wiring, created once the sequence adapter exists */
  useEffect(() => {
    if (!seq) return
    const section = sectionRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cw = 0
    let ch = 0
    let raf = 0
    let backdrop = null // offscreen, device-resolution, dithered studio backdrop
    let backdropTimer = 0

    const total = String(seq.count - 1).padStart(3, '0')
    const paintHud = (p) => {
      const idx = String(seq.frameIndex(p)).padStart(3, '0')
      if (counterRef.current) counterRef.current.textContent = `FR ${idx} / ${total}`
      if (railRef.current) railRef.current.style.transform = `scaleX(${p})`
    }

    const render = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const p = reduce ? 1 : state.current.progress
        if (seq.hasAlpha && backdrop) {
          // float-rendered, dithered backdrop under the transparent subject frames
          ctx.drawImage(backdrop, 0, 0, cw, ch)
        } else if (seq.hasAlpha) {
          ctx.clearRect(0, 0, cw, ch)
        } else {
          ctx.fillStyle = '#060607'
          ctx.fillRect(0, 0, cw, ch)
        }
        seq.draw(ctx, p, cw, ch)
        paintHud(p)
      })
    }
    renderRef.current = render

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cw = window.innerWidth
      ch = window.innerHeight
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (seq.hasAlpha) {
        // first paint: render synchronously; later resizes: stretch the old one, re-render after settling
        if (!backdrop) backdrop = renderBackdrop(cw, ch, dpr)
        clearTimeout(backdropTimer)
        backdropTimer = setTimeout(() => {
          backdrop = renderBackdrop(cw, ch, dpr)
          render()
        }, 180)
      }
      render()
    }
    resize()
    window.addEventListener('resize', resize)

    if (reduce) {
      // Static fallback: final frame, title visible, nothing pinned.
      gsap.set(titleRef.current, { opacity: 1, y: 0 })
      gsap.set(introRef.current, { opacity: 0 })
      markSiteReady()
      return () => {
        window.removeEventListener('resize', resize)
        clearTimeout(backdropTimer)
        cancelAnimationFrame(raf)
      }
    }

    const gctx = gsap.context(() => {
      // One master timeline pins the stage AND scrubs everything inside the pin range.
      // (Separate triggers on an already-pinned element get offset by the pin spacer — the
      //  classic ScrollTrigger ordering trap — so pin + scrub live on the same trigger.)
      // Timeline units: 1 = 100vh of scroll. 0–3 scrubs the portrait, 3–4 is the handoff.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${PIN_DISTANCE}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.6,
          refreshPriority: 1, // measure the pin before every section below it
          invalidateOnRefresh: true,
        },
      })

      const scrubUnits = parseFloat(SCRUB_DISTANCE) / 100
      const pinUnits = parseFloat(PIN_DISTANCE) / 100
      // Pad the timeline to the full pin length so the portrait finishes at 3/4 of the pin,
      // leaving the last unit for the sheet handoff.
      tl.set({}, {}, pinUnits)
      tl.to(state.current, { progress: 1, duration: scrubUnits, onUpdate: render }, 0)
        .fromTo(
          introRef.current,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -14, duration: 0.5, immediateRender: false },
          1.5,
        )
        .fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.75 }, 1.75)
        .fromTo(scrubRef.current, { opacity: 1 }, { opacity: 0.4, duration: 0.3, immediateRender: false }, 2.7)

      // Handoff: the profile sheet (negative top margin) rises over the still-pinned stage
      // during the last unit; this trigger is on the sheet itself so it is scroll-exact.
      // (An earlier version tweened `filter: brightness(0.3)` from `filter: none`, which GSAP
      //  reads as brightness(0) — the stage snapped to black at the first pixel of the handoff.
      //  A dim overlay with an explicit 0 -> 0.72 opacity ramp is exact and cheaper to composite.)
      const handoff = gsap.timeline({
        scrollTrigger: {
          trigger: document.querySelector('#about'),
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      handoff
        .fromTo(stageRef.current, { scale: 1 }, { scale: 0.92, ease: 'none' }, 0)
        .fromTo(dimRef.current, { opacity: 0 }, { opacity: 0.72, ease: 'none' }, 0)
    }, section)

    // Pin exists: re-measure, then let the sections below create their own triggers.
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
    markSiteReady()

    return () => {
      window.removeEventListener('resize', resize)
      clearTimeout(backdropTimer)
      cancelAnimationFrame(raf)
      gctx.revert()
    }
  }, [seq])

  /* Poster was on screen while frames loaded — repaint once they're all in */
  useEffect(() => {
    if (ready) renderRef.current()
  }, [ready])

  /* Entrance after the loader clears */
  useEffect(() => {
    if (!entered) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(
      canvasRef.current,
      { scale: 1.08, opacity: 0.001 },
      { scale: 1, opacity: 1, duration: 1.8, ease: 'power2.out' },
      0,
    ).fromTo(
      [introRef.current, scrubRef.current, ...document.querySelectorAll('.hero-cta')],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.09 },
      0.55,
    )
    return () => tl.kill()
  }, [entered])

  return (
    <section id="home" ref={sectionRef} className="relative z-10 h-[100svh] overflow-hidden bg-ink">
      {/* Stage: scaled + dimmed during the handoff */}
      <div ref={stageRef} className="absolute inset-0 origin-center will-change-transform">
        {/* CSS underlay only (shows for the instant before the canvas paints); the real backdrop is
            rendered in float + dithered on the canvas — see lib/backdrop.js */}
        <div className="hero-backdrop absolute inset-0" aria-hidden="true" />
        <canvas ref={canvasRef} className="absolute inset-0 block opacity-0" />
        {/* light legibility overlays for the subject only — the backdrop carries its own (dithered) darkening */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(6,6,7,0.45)_0%,rgba(6,6,7,0)_40%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(6,6,7,0.3)_0%,rgba(6,6,7,0)_24%)]" />
        {/* handoff dim: opacity is scrubbed 0 -> 0.72 as the profile sheet rises */}
        <div ref={dimRef} className="absolute inset-0 pointer-events-none bg-ink opacity-0" />
      </div>

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">
        <p ref={introRef} className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 hud hud-strong">
          Hi, I&rsquo;m <span className="underline decoration-1 underline-offset-[7px]">{profile.firstName}</span>
        </p>

        <div
          ref={titleRef}
          className="absolute left-6 md:left-10 bottom-[31%] md:bottom-[22%] max-w-[92vw] md:max-w-[40vw] opacity-0"
        >
          <h1 className="text-[clamp(42px,6vw,84px)] font-semibold leading-[0.94] tracking-[-0.045em]">
            {profile.name}
          </h1>
          <p className="hud mt-5">{profile.title}</p>
        </div>

        <div ref={scrubRef} className="absolute left-6 md:left-10 bottom-[84px] md:bottom-10 flex items-center gap-4">
          <span className="hud hud-strong flex items-center gap-2">
            <svg
              className="w-3 h-3 animate-bounce"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M6 1.5v9M2.5 7l3.5 3.5L9.5 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Scroll to scrub timeline
          </span>
          <span className="hidden md:block relative w-[140px] h-px bg-white/15 overflow-hidden">
            <span ref={railRef} className="absolute inset-0 bg-fg origin-left" style={{ transform: 'scaleX(0)' }} />
          </span>
          <span ref={counterRef} className="hud tabular-nums hidden md:block">
            FR 000 / 000
          </span>
        </div>

        <div className="absolute left-6 right-6 md:left-auto md:right-10 bottom-6 md:bottom-10 flex items-center gap-3 pointer-events-auto">
          <a href="#work" className="btn btn-solid hero-cta opacity-0">
            View My Work
          </a>
          <a href="#contact" className="btn btn-ghost hero-cta opacity-0">
            Contact Me
          </a>
        </div>

        {seq?.isPlaceholder && (
          <span className="absolute right-6 md:right-10 top-[84px] hud text-dim">Placeholder sequence</span>
        )}
      </div>
    </section>
  )
}
