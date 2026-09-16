import { EXT } from './ProfileLinks'
import { GitHubIcon, ArrowUpRight, LockIcon, ClockIcon } from './Icons'

/**
 * The single repository action for a project, derived from `repo`:
 *   URL       → "GitHub ↗" link (new tab)
 *   'private' → non-link "Private Repository"
 *   'pending' → non-link "GitHub Coming Soon"
 *   null      → nothing
 * Never renders a dead link.
 */
export function repoState(repo) {
  if (!repo) return 'none'
  if (repo === 'private') return 'private'
  if (repo === 'pending') return 'pending'
  return 'public'
}

export function RepoAction({ item, size = 'sm', solid = false }) {
  const state = repoState(item.repo)
  const sz = size === 'sm' ? 'btn-sm' : ''
  const icon = size === 'sm' ? 'text-[13px]' : 'text-[14px]'
  if (state === 'public') {
    return (
      <a
        href={item.repo}
        {...EXT}
        className={`btn ${solid ? 'btn-solid' : 'btn-ghost'} ${sz}`}
        aria-label={`${item.title} on GitHub (opens in a new tab)`}
      >
        <GitHubIcon className={icon} />
        GitHub
        <ArrowUpRight className="text-[12px] opacity-70" />
      </a>
    )
  }
  if (state === 'private') {
    return (
      <span className={`btn btn-muted ${sz}`} title="Source code is not public">
        <LockIcon className={icon} />
        Private Repository
      </span>
    )
  }
  if (state === 'pending') {
    return (
      <span className={`btn btn-muted ${sz}`} title="The repository is being prepared for publication">
        <ClockIcon className={icon} />
        GitHub Coming Soon
      </span>
    )
  }
  return null
}

/** Subtle one-line note, e.g. "Demo available during interviews". */
export function DemoNote({ item, className = '' }) {
  if (!item.demoNote) return null
  return (
    <p className={`hud flex items-center gap-2 ${className}`}>
      <span className="w-1 h-1 rounded-full bg-accent/80 shrink-0" />
      {item.demoNote}
    </p>
  )
}
