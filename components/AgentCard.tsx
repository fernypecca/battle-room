import type { ReactNode } from 'react'

export type AgentStatus = 'idle' | 'running' | 'done' | 'empty' | 'error'

interface AgentCardProps {
  index: number
  title: string
  description: string
  status: AgentStatus
  result: string | null
  icon?: ReactNode
  emptyMessage?: string
  errorMessage?: string
  onRetry?: () => void
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Waiting',
  running: 'Running',
  done: 'Done',
  empty: 'No data found',
  error: 'Failed',
}

// Agents occasionally emit inline **bold** even though the system prompts
// only ask for "##" headings and "- " bullets — render it properly instead
// of leaking literal asterisks into otherwise clean typography.
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function renderFormatted(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      return (
        <h4 key={i} className="mb-1.5 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent-text)] first:mt-0">
          {renderInline(trimmed.slice(3))}
        </h4>
      )
    }
    if (trimmed.startsWith('- ')) {
      return (
        <p key={i} className="relative flex gap-2.5 py-0.5 text-[14.5px] leading-relaxed text-[var(--foreground)]">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]/60" />
          <span>{renderInline(trimmed.slice(2))}</span>
        </p>
      )
    }
    if (trimmed.length === 0) return null
    return (
      <p key={i} className="text-[14.5px] leading-relaxed text-[var(--foreground)]">
        {renderInline(trimmed)}
      </p>
    )
  })
}

export function AgentCard({
  index,
  title,
  description,
  status,
  result,
  icon,
  emptyMessage,
  errorMessage,
  onRetry,
}: AgentCardProps) {
  const isActive = status !== 'idle'
  const isExpanded = status === 'done' || status === 'empty' || status === 'error'

  const badgeClass =
    status === 'done'
      ? 'bg-[var(--accent)] text-white'
      : status === 'running'
        ? 'animate-breathe bg-[var(--accent-tint)] text-[var(--accent-text)] ring-1 ring-[var(--accent)]/25'
        : status === 'error'
          ? 'bg-[var(--bad-tint)] text-[var(--bad)]'
          : status === 'empty'
            ? 'bg-[var(--surface)] text-[var(--muted)]'
            : 'border border-[var(--border)] bg-[var(--paper)] text-[var(--muted-2)]'

  const pillClass =
    status === 'done'
      ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
      : status === 'running'
        ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
        : status === 'error'
          ? 'bg-[var(--bad-tint)] text-[var(--bad)]'
          : status === 'empty'
            ? 'bg-[var(--surface)] text-[var(--muted)]'
            : 'border border-[var(--border)] bg-[var(--paper)] text-[var(--muted-2)]'

  return (
    <div
      className={`overflow-hidden rounded-[24px] border p-5 transition-all duration-500 ease-out sm:p-6 ${
        isActive
          ? 'border-[var(--border-soft)] bg-[var(--paper)] shadow-[var(--shadow-md)]'
          : 'border-[var(--border-soft)] bg-[var(--surface)]/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[13px] font-semibold transition-colors duration-300 ${badgeClass}`}
          >
            {icon ?? index}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-snug text-[var(--foreground)]">{title}</p>
            <p className="truncate text-[13px] text-[var(--muted)]">{description}</p>
          </div>
        </div>
        <span
          aria-live="polite"
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-300 ${pillClass}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div
        className={`grid transition-all duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          {status === 'done' && result && (
            <div className="mt-4 border-t border-[var(--border-soft)] pt-4">{renderFormatted(result)}</div>
          )}

          {status === 'empty' && (
            <p className="mt-4 border-t border-[var(--border-soft)] pt-4 text-[14px] text-[var(--muted)]">
              {emptyMessage ?? 'No data found for this input.'}
            </p>
          )}

          {status === 'error' && (
            <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
              <p className="text-[14px] text-[var(--bad)]">{errorMessage ?? 'Something went wrong.'}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-1.5 text-[13px] font-medium text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-all duration-200 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-sm)]"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
