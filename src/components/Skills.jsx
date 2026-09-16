import { useEffect, useRef } from 'react'
import { gsap } from '../lib/smoothScroll'
import { whenSiteReady } from '../lib/siteReady'
import { skills } from '../data/profile'

export default function Skills() {
  const ref = useRef(null)

  useEffect(() => {
    let ctx
    const off = whenSiteReady(() => {
      ctx = gsap.context(() => {
        gsap.from('.sk-reveal', {
          y: 24,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: ref.current, start: 'top 70%', once: true },
        })
      }, ref)
    })
    return () => {
      off()
      ctx?.revert()
    }
  }, [])

  return (
    <section id="stack" ref={ref} className="relative z-20 bg-ink border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="sk-reveal flex items-center gap-3">
          <span className="hud">02</span>
          <span className="w-8 h-px bg-white/15" />
          <span className="hud">Technical stack</span>
        </div>
        <h2 className="sk-reveal mt-6 text-[clamp(32px,4.4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em] max-w-2xl">
          Technologies I work with
        </h2>
        <p className="sk-reveal mt-4 text-muted text-[16px] max-w-xl">
          Full-stack engineering across modern web, applied AI, and data pipelines.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          {skills.map((g) => (
            <div
              key={g.category}
              className="sk-reveal group rounded-3xl border border-white/10 bg-surface p-6 md:p-7 transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">{g.category}</h3>
                <span className="hud text-dim">{String(g.items.length).padStart(2, '0')}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12.5px] font-medium text-fg/80 transition-colors hover:border-accent/40 hover:text-fg"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
