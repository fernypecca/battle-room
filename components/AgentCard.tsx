export type AgentStatus = 'idle' | 'running' | 'done' | 'empty' | 'error'

interface AgentCardProps {
  index: number
  title: string
  description: string
  status: AgentStatus
  result: string | null
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

function renderFormatted(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      return (
        <h4 key={i} className="mt-4 mb-1 text-[13px] font-semibold text-[var(--foreground)] first:mt-0">
          {trimmed.slice(3)}
        </h4>
      )
    }
    if (trimmed.startsWith('- ')) {
      return (
        <p
          key={i}
          className="relative pl-4 text-[14px] leading-relaxed text-[var(--foreground)] before:absolute before:left-0 before:text-[var(--muted)] before:content-['–']"
        >
          {trimmed.slice(2)}
        </p>
      )
    }
    if (trimmed.length === 0) return null
    return (
      <p key={i} className="text-[14px] leading-relaxed text-[var(--foreground)]">
        {trimmed}
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
  emptyMessage,
  errorMessage,
  onRetry,
}: AgentCardProps) {
  const isActive = status !== 'idle'

  const badgeClass =
    status === 'done'
      ? 'bg-[var(--accent)] text-white'
      : status === 'running'
        ? 'animate-pulse bg-[var(--accent-tint)] text-[var(--accent-text)]'
        : status === 'error'
          ? 'bg-[var(--bad-tint)] text-[var(--bad)]'
          : 'border border-[var(--border)] bg-white text-[var(--muted)]'

  const pillClass =
    status === 'done' || status === 'running'
      ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
      : status === 'error'
        ? 'bg-[var(--bad-tint)] text-[var(--bad)]'
        : status === 'empty'
          ? 'bg-[var(--surface)] text-[var(--muted)]'
          : 'border border-[var(--border)] bg-white text-[var(--muted)]'

  return (
    <div
      className={`rounded-[20px] border p-5 transition-all duration-300 ${
        isActive ? 'border-[var(--accent)]/30 bg-white shadow-[var(--shadow-elevated)]' : 'border-[var(--border)] bg-[var(--surface)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${badgeClass}`}>
            {index}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--foreground)]">{title}</p>
            <p className="text-[13px] text-[var(--muted)]">{description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${pillClass}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'done' && result && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">{renderFormatted(result)}</div>
      )}

      {status === 'empty' && (
        <p className="mt-4 border-t border-[var(--border)] pt-4 text-[14px] text-[var(--muted)]">
          {emptyMessage ?? 'No data found for this input.'}
        </p>
      )}

      {status === 'error' && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-[14px] text-[var(--bad)]">{errorMessage ?? 'Something went wrong.'}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
