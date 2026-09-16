import { useEffect, useRef } from 'react'
import { gsap } from '../lib/smoothScroll'
import { whenSiteReady } from '../lib/siteReady'
import { profile, links } from '../data/profile'
import { ProfileTextLinks, Wordmark, EXT } from './ProfileLinks'
import { ArrowUpRight } from './Icons'

export default function Contact() {
  const ref = useRef(null)
  const bigRef = useRef(null)

  useEffect(() => {
    let ctx
    const off = whenSiteReady(() => {
      ctx = gsap.context(() => {
        gsap.fromTo(
          bigRef.current,
          { yPercent: -18 },
          {
            yPercent: 22,
            ease: 'none',
            scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
        gsap.from('.ct-reveal', {
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
    <section id="contact" ref={ref} className="relative z-20 bg-ink border-t border-white/[0.06] overflow-hidden">
      {/* Oversized wordmark, parallaxed */}
      <div
        ref={bigRef}
        className="absolute inset-x-0 top-8 flex justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="text-[22vw] leading-[0.8] font-semibold tracking-[-0.06em] text-white/[0.04]">CONTACT</span>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-32 md:pt-44 pb-12 flex flex-col gap-24">
        <div className="max-w-2xl">
          <div className="ct-reveal flex items-center gap-3">
            <span className="hud">04</span>
            <span className="w-8 h-px bg-white/15" />
            <span className="hud">Get in touch</span>
          </div>
          <h2 className="ct-reveal mt-6 text-[clamp(36px,5.4vw,72px)] font-semibold leading-[0.98] tracking-[-0.045em]">
            Let&rsquo;s build something that ships.
          </h2>
          <p className="ct-reveal mt-6 text-muted text-[17px] max-w-lg">
            Open to software engineering, AI, and data roles — and to interesting collaborations.
          </p>
          <div className="ct-reveal mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${links.email}`} className="btn btn-solid">
              Email me
            </a>
            {links.resume && (
              <a href={links.resume} {...EXT} className="btn btn-ghost">
                Resume
                <ArrowUpRight className="text-[13px] opacity-70" />
              </a>
            )}
            <a href="#work" className="btn btn-ghost">
              See the work
            </a>
          </div>
          {/* GitHub / LinkedIn text links — only the ones that are set (Resume is the pill above) */}
          <ProfileTextLinks className="ct-reveal mt-8" exclude={['resume']} />
        </div>

        <footer className="flex flex-col md:flex-row gap-6 md:items-end justify-between border-t border-white/[0.06] pt-6">
          <div className="flex flex-col gap-1">
            <Wordmark />
            <span className="hud">{profile.title}</span>
          </div>
          <div className="flex flex-col md:items-end gap-2">
            <ProfileTextLinks className="md:justify-end" />
            <a href={`mailto:${links.email}`} className="hud hud-strong hover:text-accent transition-colors">
              {links.email}
            </a>
            <span className="hud">
              © {new Date().getFullYear()} {profile.name}
            </span>
          </div>
        </footer>
      </div>
    </section>
  )
}
