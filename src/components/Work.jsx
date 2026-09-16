import { useEffect, useRef } from 'react'
import { gsap } from '../lib/smoothScroll'
import { whenSiteReady } from '../lib/siteReady'
import { work } from '../data/profile'
import { openStudy } from '../lib/caseStudy'
import { EXT } from './ProfileLinks'
import { ArrowUpRight } from './Icons'
import { RepoAction, DemoNote } from './RepoState'

/**
 * Per-card action row. Every card gets "View Project" (in-site case study). Independently, one
 * repository action derived from `repo` (GitHub ↗ / Private Repository / GitHub Coming Soon /
 * nothing), a "Live Demo" link only when `demo` is set, and a subtle `demoNote` line. Nothing
 * here can be a dead link.
 */
function CardActions({ item }) {
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => openStudy(item.slug)} className="btn btn-ghost btn-sm">
          View Project
          <ArrowUpRight className="text-[12px] opacity-70" />
        </button>
        <RepoAction item={item} size="sm" />
        {item.demo && (
          <a href={item.demo} {...EXT} className="btn btn-ghost btn-sm" aria-label={`${item.title} live demo`}>
            Live Demo
            <ArrowUpRight className="text-[12px] opacity-70" />
          </a>
        )}
      </div>
      <DemoNote item={item} className="mt-4" />
    </>
  )
}

export default function Work() {
  const ref = useRef(null)
  const main = work.filter((w) => !w.earlier)
  const earlier = work.filter((w) => w.earlier)

  useEffect(() => {
    let ctx
    const off = whenSiteReady(() => {
      ctx = gsap.context(() => {
        gsap.from('.wk-reveal', {
          y: 24,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
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
    <section id="work" ref={ref} className="relative z-20 bg-surface border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="wk-reveal flex items-center gap-3">
          <span className="hud">03</span>
          <span className="w-8 h-px bg-white/15" />
          <span className="hud">Selected work</span>
        </div>
        <h2 className="wk-reveal mt-6 text-[clamp(32px,4.4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
          Projects
        </h2>

        {/* Main grid: projects with active / current code */}
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {main.map((w) => (
            <article
              key={w.slug}
              className="wk-reveal group relative rounded-3xl border border-white/10 bg-ink p-6 md:p-7 min-h-[300px] flex flex-col justify-between transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex items-center gap-2.5 text-[13px] font-mono text-dim shrink-0">
                  {w.index}
                  {(w.featured || w.badge) && (
                    <span className="inline-flex items-center gap-1.5 hud text-[10px] whitespace-nowrap">
                      <span className="w-1 h-1 rounded-full bg-accent" />
                      {w.featured ? 'Featured' : w.badge}
                    </span>
                  )}
                </span>
                <span className="hud text-right">{w.tag}</span>
              </div>
              <div className="mt-8">
                <h3 className="text-[24px] font-semibold tracking-tight">{w.title}</h3>
                <p className="mt-2 text-[14px] text-muted leading-relaxed">{w.desc}</p>
                <CardActions item={w} />
              </div>
            </article>
          ))}
        </div>

        {/* Earlier work: factual entries whose source is no longer available — no repository state */}
        {earlier.length > 0 && (
          <div className="mt-20 md:mt-24 border-t border-white/[0.06] pt-10">
            <div className="wk-reveal flex items-center gap-3">
              <span className="hud">Earlier engineering work</span>
            </div>
            <p className="wk-reveal mt-3 text-[14px] text-muted max-w-xl">
              Team projects from college and hackathon work, presented as case studies.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {earlier.map((w) => (
                <article
                  key={w.slug}
                  className="wk-reveal group relative rounded-2xl border border-white/[0.08] bg-ink/60 p-5 md:p-6 flex flex-col transition-[transform,border-color] duration-500 hover:-translate-y-0.5 hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex items-center gap-2.5 text-[12px] font-mono text-dim shrink-0">
                      {w.index}
                      {w.badge && (
                        <span className="inline-flex items-center gap-1.5 hud text-[10px] whitespace-nowrap">
                          <span className="w-1 h-1 rounded-full bg-accent" />
                          {w.badge}
                        </span>
                      )}
                    </span>
                    <span className="hud text-right">{w.tag}</span>
                  </div>
                  <h3 className="mt-5 text-[19px] font-semibold tracking-tight">{w.title}</h3>
                  {(w.study?.role || w.study?.year) && (
                    <p className="mt-1 hud">
                      {[w.study.role, w.study.year].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="mt-2 text-[14px] text-muted leading-relaxed">{w.desc}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => openStudy(w.slug)} className="btn btn-ghost btn-sm">
                      View Project
                      <ArrowUpRight className="text-[12px] opacity-70" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
