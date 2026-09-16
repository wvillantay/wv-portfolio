import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/smoothScroll'
import { profile } from '../data/profile'

const MIN_VISIBLE_MS = 1400

export default function Loader({ progress, fontsReady, ready, onDone }) {
  const rootRef = useRef(null)
  const numRef = useRef(null)
  const barRef = useRef(null)
  const seqRef = useRef(null)
  const shown = useRef({ v: 0 })
  const mounted = useRef(performance.now())
  const exiting = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const tlRef = useRef(null)
  const [gone, setGone] = useState(false)

  // Only kill a running exit timeline on unmount, never on a parent re-render
  useEffect(() => () => tlRef.current?.kill(), [])

  // Smoothly chase the real preload progress
  useEffect(() => {
    if (exiting.current) return
    gsap.to(shown.current, {
      v: progress,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => paint(shown.current.v),
    })
  }, [progress])

  function paint(v) {
    if (numRef.current) numRef.current.textContent = String(Math.round(v * 100)).padStart(3, '0')
    if (barRef.current) barRef.current.style.transform = `scaleX(${v})`
    if (seqRef.current)
      seqRef.current.textContent = v >= 0.999 ? 'READY' : `${String(Math.round(v * 100)).padStart(3, '0')} %`
  }

  // Exit choreography once everything is in
  useEffect(() => {
    if (!(ready && fontsReady) || exiting.current) return
    exiting.current = true
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - mounted.current))
    const root = rootRef.current
    const tl = gsap.timeline({ delay: wait / 1000 })
    tlRef.current = tl
    tl.to(shown.current, { v: 1, duration: 0.45, ease: 'power2.out', onUpdate: () => paint(shown.current.v) })
      .to(
        root.querySelectorAll('.ld-line'),
        { opacity: 0, y: -8, duration: 0.35, stagger: 0.06, ease: 'power2.in' },
        '+=0.25',
      )
      .to(root.querySelectorAll('.ld-corner'), { opacity: 0, duration: 0.3 }, '<')
      .to(numRef.current, { yPercent: -30, opacity: 0, duration: 0.5, ease: 'power3.in' }, '<')
      .to(barRef.current, { scaleY: 0, duration: 0.3 }, '<0.1')
      .add(() => onDoneRef.current?.(), '-=0.05')
      .to(root, { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '-=0.05')
      .add(() => setGone(true))
  }, [ready, fontsReady])

  if (gone) return null

  const seqState = ready ? 'READY' : undefined
  const typeState = fontsReady ? 'READY' : 'LOADING'
  const uiState = ready && fontsReady ? 'READY' : 'STANDBY'

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-ink text-fg flex flex-col justify-between px-6 py-6 md:px-10 md:py-8 select-none"
      aria-busy={!ready}
      aria-label="Loading"
    >
      <div className="flex items-start justify-between">
        <div className="ld-corner flex items-center gap-4">
          <span className="text-[15px] font-semibold tracking-tight">WV</span>
          <span className="hud">Portfolio — {profile.year}</span>
        </div>
        <span className="ld-corner hud">Initializing</span>
      </div>

      <div className="max-w-[460px] w-full">
        <div className="hud mb-5 ld-line">System boot</div>
        <Line n="01" label="Portrait sequence" className="ld-line">
          <span ref={seqRef}>{seqState ?? '000 %'}</span>
        </Line>
        <Line n="02" label="Typography" className="ld-line">
          {typeState}
        </Line>
        <Line n="03" label="Interface" className="ld-line">
          {uiState}
        </Line>
      </div>

      <div className="flex items-end justify-between">
        <span className="ld-corner hud hidden sm:block">{profile.name}</span>
        <div
          ref={numRef}
          className="font-semibold tabular-nums leading-none tracking-[-0.05em] text-[clamp(88px,15vw,196px)]"
        >
          000
        </div>
      </div>

      <div
        ref={barRef}
        className="absolute left-0 right-0 bottom-0 h-[2px] bg-fg origin-left"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}

function Line({ n, label, children, className }) {
  return (
    <div className={`flex items-baseline gap-3 py-2 hud ${className}`}>
      <span className="text-dim">[{n}]</span>
      <span className="hud-strong">{label}</span>
      <span className="flex-1 border-b border-dotted border-white/15 translate-y-[-3px]" />
      <span className="tabular-nums">{children}</span>
    </div>
  )
}
