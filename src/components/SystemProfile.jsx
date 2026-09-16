import { useEffect, useRef } from 'react'
import { gsap } from '../lib/smoothScroll'
import { whenSiteReady } from '../lib/siteReady'
import { profile, education } from '../data/profile'
import { GraduationIcon } from './Icons'

export default function SystemProfile() {
  const ref = useRef(null)

  useEffect(() => {
    let ctx
    const off = whenSiteReady(() => {
      ctx = gsap.context(() => {
        gsap.from('.reveal', {
          y: 28,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: 'top 55%', once: true },
        })
      }, ref)
    })
    return () => {
      off()
      ctx?.revert()
    }
  }, [])

  return (
    <section id="about" ref={ref} className="sheet relative z-20 -mt-[100vh] bg-ink min-h-[100svh] overflow-hidden">
      <div className="grid-bg absolute inset-x-0 top-0 h-[75vh] pointer-events-none" />
      <div className="absolute left-1/2 -translate-x-1/2 -top-48 w-[70vw] h-96 rounded-full bg-white/[0.05] blur-[110px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-24 md:pb-32 grid md:grid-cols-[minmax(0,360px)_1fr] gap-12 md:gap-20 items-center">
        {/* Portrait card */}
        <div className="reveal relative rounded-[28px] border border-white/10 bg-surface p-3 shadow-[0_40px_120px_rgba(0,0,0,0.65)] max-w-[360px] w-full mx-auto md:mx-0">
          <div className="relative rounded-[20px] overflow-hidden aspect-[4/5] bg-surface-2">
            <img src="/profile/card.webp" alt={profile.name} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
              <span className="flex items-center gap-2.5 hud hud-strong">
                <span className="dot" /> {profile.availability}
              </span>
              <span className="hud">{profile.year}</span>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div>
          <span className="reveal inline-flex items-center gap-2.5 hud rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fg" /> // System profile
          </span>
          <h2 className="reveal mt-8 text-[clamp(38px,5.2vw,68px)] font-semibold leading-[1] tracking-[-0.04em]">
            {profile.name}
          </h2>
          <p className="reveal mt-6 text-[17px] md:text-[18px] leading-relaxed text-muted max-w-xl">{profile.bio}</p>

          <div className="reveal mt-10 grid grid-cols-3 gap-3">
            {profile.tiles.map((t) => (
              <div key={t.title} className="rounded-2xl border border-white/10 bg-surface-2 p-4 md:p-5">
                <div className="text-[15px] md:text-[17px] font-semibold tracking-tight">{t.title}</div>
                <div className="hud mt-2">{t.sub}</div>
              </div>
            ))}
          </div>

          <div className="reveal mt-8 flex flex-wrap gap-x-10 gap-y-3">
            {profile.meta.map((m) => (
              <div key={m.k} className="hud">
                <span className="text-dim">{m.k}</span> <span className="hud-strong ml-2">{m.v}</span>
              </div>
            ))}
          </div>

          {/* Education — exactly as on the resume */}
          {education.length > 0 && (
            <div className="reveal mt-10 border-t border-white/[0.06] pt-8">
              <span className="inline-flex items-center gap-2 hud">
                <GraduationIcon className="text-[14px]" /> Education
              </span>
              <ul className="mt-4 grid gap-3">
                {education.map((e) => (
                  <li
                    key={e.degree + e.school}
                    className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6"
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold tracking-tight">
                        {e.degree}
                        {e.focus && <span className="font-normal text-muted">, {e.focus}</span>}
                      </div>
                      <div className="text-[13px] text-muted">{e.school}</div>
                    </div>
                    <span className="hud shrink-0 sm:text-right">{e.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
