import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/smoothScroll'
import { work } from '../data/profile'
import { useStudy, openStudy, closeStudy } from '../lib/caseStudy'
import { EXT } from './ProfileLinks'
import { ArrowUpRight, LockIcon, ClockIcon, CloseIcon, ArrowLeft } from './Icons'
import { RepoAction, DemoNote, repoState } from './RepoState'

/**
 * In-site case study, rendered as a full-screen sheet over the page. The page underneath stays
 * mounted (the pinned hero is never rebuilt); Lenis is stopped while the sheet is open and the
 * sheet scrolls natively (`data-lenis-prevent`).
 */
export default function CaseStudy() {
  const slug = useStudy()
  const item = slug ? work.find((w) => w.slug === slug) : null
  const lastRef = useRef(item)
  if (item) lastRef.current = item
  const shown = item ?? lastRef.current // keep content during the exit tween

  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const scrollRef = useRef(null)
  const closeBtnRef = useRef(null)
  const openerRef = useRef(null)
  const wasOpenRef = useRef(false)

  // Entrance / exit
  useLayoutEffect(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return
    gsap.killTweensOf([root, panel])
    if (item) {
      openerRef.current = document.activeElement
      root.style.pointerEvents = 'auto'
      gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' })
      gsap.fromTo(panel, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
      if (scrollRef.current) scrollRef.current.scrollTop = 0
      // move focus into the sheet so ESC / tab work immediately
      requestAnimationFrame(() => closeBtnRef.current?.focus({ preventScroll: true }))
      wasOpenRef.current = true
    } else if (wasOpenRef.current) {
      root.style.pointerEvents = 'none'
      gsap.to(panel, { y: 24, opacity: 0, duration: 0.35, ease: 'power2.in' })
      gsap.to(root, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' })
      const opener = openerRef.current
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus({ preventScroll: true })
      }
      wasOpenRef.current = false
    }
  }, [item])

  // Escape closes
  useEffect(() => {
    if (!item) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeStudy()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item])

  // Swapping between studies (next project) — scroll the sheet back to top
  useEffect(() => {
    if (item && scrollRef.current) scrollRef.current.scrollTop = 0
  }, [item])

  if (!shown) return null

  const { study } = shown
  const meta = [
    study.role && { k: 'Role', v: study.role },
    study.award && { k: 'Award', v: study.award },
    study.where && { k: 'Where', v: study.where },
    study.status && { k: 'Status', v: study.status },
    study.year && { k: 'Year', v: study.year },
    study.stack?.length && { k: 'Stack', v: study.stack.join(' · ') },
  ].filter(Boolean)

  const i = work.findIndex((w) => w.slug === shown.slug)
  const next = work[(i + 1) % work.length]
  const state = repoState(shown.repo)
  const hasRepo = state === 'public'

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      aria-hidden={!item}
      className="fixed inset-0 z-[90] bg-ink invisible opacity-0 pointer-events-none"
    >
      <div ref={scrollRef} data-lenis-prevent className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div ref={panelRef} className="min-h-full flex flex-col">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-ink/70 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="max-w-6xl mx-auto px-6 md:px-10 h-[68px] flex items-center justify-between">
              <button
                type="button"
                onClick={closeStudy}
                className="inline-flex items-center gap-2 hud hud-strong hover:text-accent transition-colors"
              >
                <ArrowLeft className="text-[14px]" />
                All projects
              </button>
              <span className="hud hidden sm:inline">// Case study · {shown.index}</span>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={closeStudy}
                aria-label="Close case study"
                className="h-9 w-9 grid place-items-center rounded-full border border-white/15 text-muted hover:text-fg hover:border-white/40 transition-colors"
              >
                <CloseIcon className="text-[15px]" />
              </button>
            </div>
          </div>

          {/* Sheet body */}
          <article className="flex-1 bg-ink">
            <div className="max-w-6xl mx-auto px-6 md:px-10 pt-14 md:pt-20 pb-24 grid md:grid-cols-[1fr_minmax(0,320px)] gap-12 md:gap-20">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="hud">{shown.index}</span>
                  <span className="w-8 h-px bg-white/15" />
                  <span className="hud">{shown.tag}</span>
                </div>
                <h2
                  id="case-study-title"
                  className="mt-6 text-[clamp(36px,5.2vw,68px)] font-semibold leading-[1] tracking-[-0.04em]"
                >
                  {shown.title}
                </h2>
                <p className="mt-6 text-[17px] md:text-[18px] leading-relaxed text-muted max-w-xl">
                  {shown.desc}
                </p>

                {/* Action row — one repository action + Live Demo when set; never a dead link */}
                {(state !== 'none' || shown.demo) && (
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <RepoAction item={shown} size="md" solid />
                    {shown.demo && (
                      <a href={shown.demo} {...EXT} className="btn btn-ghost">
                        Live Demo
                        <ArrowUpRight className="text-[13px] opacity-70" />
                      </a>
                    )}
                  </div>
                )}
                <DemoNote item={shown} className="mt-4" />

                <section className="mt-14">
                  <h3 className="hud">Overview</h3>
                  <p className="mt-4 text-[16px] md:text-[17px] leading-relaxed text-fg/90 max-w-2xl">
                    {study.overview}
                  </p>
                </section>

                {study.capabilities?.length > 0 && (
                  <section className="mt-12">
                    <h3 className="hud">Capabilities</h3>
                    <ul className="mt-4 grid gap-3 max-w-2xl">
                      {study.capabilities.map((c, n) => (
                        <li
                          key={n}
                          className="flex gap-4 text-[15px] md:text-[16px] leading-relaxed text-muted"
                        >
                          <span className="font-mono text-[12px] text-dim pt-[5px] shrink-0">
                            {String(n + 1).padStart(2, '0')}
                          </span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {study.highlights?.length > 0 && (
                  <section className="mt-12">
                    <h3 className="hud">Highlights</h3>
                    <ul className="mt-4 grid gap-3 max-w-2xl">
                      {study.highlights.map((h, n) => (
                        <li
                          key={n}
                          className="flex gap-4 text-[15px] md:text-[16px] leading-relaxed text-muted"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-[10px] shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* Meta rail */}
              <aside className="md:pt-24">
                <div className="rounded-3xl border border-white/10 bg-surface p-6 md:p-7">
                  <span className="hud">// Project data</span>
                  <dl className="mt-5 grid gap-4">
                    {meta.map(({ k, v }) => (
                      <div
                        key={k}
                        className="grid gap-1 border-b border-white/[0.06] pb-4 last:border-b-0 last:pb-0"
                      >
                        <dt className="hud">{k}</dt>
                        <dd className="text-[14px] text-fg/90 leading-relaxed">{v}</dd>
                      </div>
                    ))}
                    {state !== 'none' && (
                      <div className="grid gap-1">
                        <dt className="hud">Source</dt>
                        <dd className="text-[14px] text-fg/90 leading-relaxed">
                          {hasRepo ? (
                            <a
                              href={shown.repo}
                              {...EXT}
                              className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
                            >
                              {shown.repo.replace(/^https?:\/\//, '')}
                              <ArrowUpRight className="text-[12px] opacity-70" />
                            </a>
                          ) : state === 'private' ? (
                            <span className="inline-flex items-center gap-1.5 text-muted">
                              <LockIcon className="text-[13px]" /> Private repository
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-muted">
                              <ClockIcon className="text-[13px]" /> GitHub coming soon
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                    {shown.demo && (
                      <div className="grid gap-1">
                        <dt className="hud">Live</dt>
                        <dd className="text-[14px] text-fg/90">
                          <a
                            href={shown.demo}
                            {...EXT}
                            className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
                          >
                            {shown.demo.replace(/^https?:\/\//, '')}
                            <ArrowUpRight className="text-[12px] opacity-70" />
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </aside>
            </div>

            {/* Next project */}
            {next && next.slug !== shown.slug && (
              <div className="border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="hud">Next project</span>
                    <span className="text-[22px] font-semibold tracking-tight">{next.title}</span>
                  </div>
                  <button type="button" onClick={() => openStudy(next.slug)} className="btn btn-ghost">
                    View Project
                    <ArrowUpRight className="text-[13px] opacity-70" />
                  </button>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
