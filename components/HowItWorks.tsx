const SOURCES = [
  {
    label: 'Their site and pricing',
    detail: 'What they sell, who they say it is for, and what they actually charge — in their own words.',
  },
  {
    label: 'Their customers',
    detail:
      'Verbatim praise and complaints from review sites. The most useful material in the report, and the hardest to get anywhere else.',
  },
  {
    label: 'Their live ads',
    detail: 'The hooks and offers running right now, straight from the ad library.',
  },
  {
    label: 'Their press',
    detail: 'Funding, launches, controversy — what a prospect may already have read about them.',
  },
]

export function HowItWorks() {
  return (
    <div className="flex flex-col gap-14">
      <div className="max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
          What it reads
        </p>
        <h2 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--foreground)] sm:text-[36px]">
          Four sources, one report
        </h2>
        <p className="mt-4 text-[16.5px] leading-relaxed text-[var(--muted)]">
          Each source is read on its own and returns only verbatim quotes. Nothing is summarized before it
          reaches the report, so nothing gets embellished on the way.
        </p>
      </div>

      <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
        {SOURCES.map((source, i) => (
          <li key={source.label}>
            <div className="flex items-baseline gap-3">
              <span className="text-[12px] font-semibold tabular-nums text-[var(--muted-2)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[17px] font-semibold text-[var(--foreground)]">{source.label}</h3>
            </div>
            <p className="mt-2 pl-8 text-[15px] leading-relaxed text-[var(--muted)]">{source.detail}</p>
          </li>
        ))}
      </ul>

      <div className="max-w-2xl border-t border-[var(--border-soft)] pt-10">
        <h2 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--foreground)] sm:text-[36px]">
          Why you can trust it
        </h2>
        <p className="mt-4 text-[16.5px] leading-relaxed text-[var(--muted)]">
          Every claim in the report ends with a marker like{' '}
          <span className="rounded-[5px] bg-[var(--accent-tint)] px-[5px] py-[1px] align-super text-[10px] font-semibold text-[var(--accent-text)]">
            rev-3
          </span>
          . Tap it and you see the exact sentence it came from, and the page it was taken from.
        </p>
        <p className="mt-4 text-[16.5px] leading-relaxed text-[var(--muted)]">
          That is enforced in code, not asked for in a prompt. A claim with no source is removed before you
          ever see it. And when a source has nothing to say, the section stays empty instead of being filled
          with something plausible.
        </p>
      </div>
    </div>
  )
}
