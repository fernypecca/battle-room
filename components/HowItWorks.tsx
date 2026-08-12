import { AGENTS } from './agents'

const USAGE_STEPS = [
  {
    label: 'Tell it who you are',
    detail: 'Your brand and the competitor you want to go up against.',
  },
  {
    label: 'Tell it who you’re selling to',
    detail: 'A short description of the buyer persona — role, company type, whatever you’d tell a new rep.',
  },
  {
    label: 'Watch it work',
    detail: 'The four agents below run one after another, live — each card fills in as its agent finishes.',
  },
]

export function HowItWorks() {
  return (
    <section className="flex flex-col gap-14">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          How it works
        </p>
        <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[var(--foreground)] sm:text-[36px]">
          Four agents, one pipeline
        </h2>
        <p className="text-[16px] leading-relaxed text-[var(--muted)]">
          Enter a competitor once. Four Claude agents run in sequence — each one reads real, live data and
          hands its output to the next — until you have a full competitive kit.
        </p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2">
        {AGENTS.map((agent, i) => (
          <li
            key={agent.title}
            className="flex gap-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--paper)] p-6 shadow-[var(--shadow-sm)]"
          >
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--accent-tint)] text-[var(--accent-text)]">
                {agent.icon}
              </div>
              <span className="text-[11px] font-semibold text-[var(--muted-2)]">{`0${i + 1}`}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[16px] font-semibold text-[var(--foreground)]">{agent.title}</p>
              <p className="text-[14px] leading-relaxed text-[var(--muted)]">{agent.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface)]/60 p-6 sm:p-8">
        <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          Using it takes three steps
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {USAGE_STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-col gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[12px] font-semibold text-white">
                {i + 1}
              </span>
              <p className="text-[15px] font-semibold text-[var(--foreground)]">{step.label}</p>
              <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
