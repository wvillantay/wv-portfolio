import { links, profile } from '../data/profile'
import { GitHubIcon, LinkedInIcon, FileIcon, ArrowUpRight } from './Icons'

const EXT = { target: '_blank', rel: 'noopener noreferrer' }

/** The external profile actions, in the order they appear everywhere. `null` links are omitted. */
export function profileActions() {
  const out = []
  if (links.github) out.push({ key: 'github', label: 'GitHub', href: links.github, Icon: GitHubIcon, external: true })
  if (links.linkedin) out.push({ key: 'linkedin', label: 'LinkedIn', href: links.linkedin, Icon: LinkedInIcon, external: true })
  if (links.resume) out.push({ key: 'resume', label: 'Resume', href: links.resume, Icon: FileIcon, external: true })
  return out
}

/**
 * The site wordmark, rendered verbatim from `profile.logo` (e.g. "WV // Portfolio" — no trailing
 * period is added). If the text contains " // ", the part after it is set in the quieter HUD style.
 */
export function Wordmark({ className = '' }) {
  const [head, ...rest] = profile.logo.split(' // ')
  const tail = rest.join(' // ')
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${className}`}>
      <span className="text-[16px] font-semibold tracking-tight text-fg">{head}</span>
      {tail && (
        <span className="ml-2 font-mono text-[12px] tracking-[0.06em] text-muted">{`// ${tail}`}</span>
      )}
    </span>
  )
}

/** Round icon buttons (nav) — Resume is rendered as a labelled pill by the caller. */
export function ProfileIconLinks({ className = '' }) {
  const items = profileActions().filter((a) => a.key !== 'resume')
  if (!items.length) return null
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map(({ key, label, href, Icon }) => (
        <a key={key} href={href} {...EXT} aria-label={`${label} (opens in a new tab)`} title={label} className="icon-btn">
          <Icon className="text-[15px]" />
        </a>
      ))}
    </div>
  )
}

/** Text links with a trailing arrow (footer / contact). `exclude` drops keys already shown nearby. */
export function ProfileTextLinks({ className = '', exclude = [] }) {
  const items = profileActions().filter((a) => !exclude.includes(a.key))
  if (!items.length) return null
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${className}`}>
      {items.map(({ key, label, href }) => (
        <a key={key} href={href} {...EXT} className="hud hud-strong inline-flex items-center gap-1.5 hover:text-accent transition-colors">
          {label}
          <ArrowUpRight className="text-[12px] opacity-70" />
        </a>
      ))}
    </div>
  )
}

export { EXT }
