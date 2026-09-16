import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/smoothScroll'
import { nav, profile, links } from '../data/profile'
import { ProfileIconLinks, profileActions, Wordmark, EXT } from './ProfileLinks'
import { ArrowUpRight } from './Icons'

export default function Nav({ visible }) {
  const ref = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const externals = profileActions()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!visible) return
    gsap.fromTo(ref.current, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.35 })
  }, [visible])

  return (
    <header
      ref={ref}
      className={`fixed top-0 inset-x-0 z-50 opacity-0 transition-[background,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? 'bg-ink/60 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="flex items-center justify-between h-[68px] px-6 md:px-10">
        <a href="#home" className="wordmark" aria-label="Home">
          <Wordmark />
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {nav.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative text-[13px] font-medium text-muted hover:text-fg transition-colors"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-fg transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {/* External profiles (desktop): GitHub / LinkedIn icon buttons + Resume pill; each hidden when unset */}
          <ProfileIconLinks className="hidden md:flex" />
          {links.resume && (
            // wrapper carries the breakpoint: `.btn` sets display itself, so `hidden` on the <a> would lose
            <span className="hidden md:inline-flex">
              <a
                href={links.resume}
                {...EXT}
                className="btn btn-accent btn-sm !h-9"
                aria-label="Resume (PDF, opens in a new tab)"
              >
                Resume
                <ArrowUpRight className="text-[12px] opacity-80" />
              </a>
            </span>
          )}
          <a href="#contact" className="btn btn-ghost !h-9 !px-4 !text-[12px]">
            Hire Me
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            className="md:hidden h-9 w-9 grid place-items-center rounded-full border border-white/15"
          >
            <span className="relative block w-4 h-[10px]">
              <span
                className={`absolute left-0 right-0 h-px bg-fg transition-all ${open ? 'top-1/2 rotate-45' : 'top-0'}`}
              />
              <span
                className={`absolute left-0 right-0 h-px bg-fg transition-all ${open ? 'top-1/2 -rotate-45' : 'bottom-0'}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-500 ${open ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <ul className="px-6 pb-6 flex flex-col gap-4 bg-ink/90 backdrop-blur-xl">
          {nav.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-[15px] font-medium border-b border-white/[0.06]"
              >
                {l.label}
              </a>
            </li>
          ))}
          {externals.length > 0 && (
            <li className="pt-2">
              <span className="hud">Elsewhere</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {externals.map(({ key, label, href, Icon }) => (
                  <a key={key} href={href} {...EXT} className="btn btn-ghost btn-sm">
                    <Icon className="text-[14px]" />
                    {label}
                    <ArrowUpRight className="text-[12px] opacity-70" />
                  </a>
                ))}
              </div>
            </li>
          )}
        </ul>
      </div>
    </header>
  )
}
