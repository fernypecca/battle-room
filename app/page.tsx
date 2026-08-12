import { PipelineRunner } from '@/components/PipelineRunner'
import { HowItWorks } from '@/components/HowItWorks'

export default function Home() {
  return (
    <div>
      <section className="grain relative overflow-hidden bg-[var(--hero-bg)]">
        <div className="hero-dark-atmosphere pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-28">
          <p className="animate-rise flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-bright)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-bright)]" />
            AI Agent Orchestration
          </p>
          <h1
            className="animate-rise max-w-3xl text-[38px] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--hero-fg)] sm:text-[58px]"
            style={{ animationDelay: '0.08s' }}
          >
            Growth Agent Orchestrator
          </h1>
          <p
            className="animate-rise max-w-xl text-[17px] leading-relaxed text-[var(--hero-muted)] sm:text-[19px]"
            style={{ animationDelay: '0.16s' }}
          >
            Four agents run in sequence against a real competitor: pulling their live ads, drafting your
            battlecard, reading their recent press, and writing an outbound sequence for your target buyer.
          </p>
          <div className="animate-rise w-full max-w-3xl" style={{ animationDelay: '0.24s' }}>
            <PipelineRunner />
          </div>
          <a
            href="#how-it-works"
            className="animate-rise text-[14px] font-semibold text-[var(--hero-muted)] underline decoration-[var(--hero-border)] underline-offset-4 transition-colors hover:text-[var(--accent-bright)] hover:decoration-[var(--accent-bright)]/50"
            style={{ animationDelay: '0.3s' }}
          >
            See how it works ↓
          </a>
        </div>
      </section>

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-24 px-6 py-24">
        <div id="how-it-works" className="scroll-mt-20">
          <HowItWorks />
        </div>
        <footer className="mx-auto flex w-full max-w-3xl flex-col gap-1 border-t border-[var(--border-soft)] pt-6 text-[13px] text-[var(--muted-2)] sm:flex-row sm:items-center sm:justify-between">
          <span>Built by Fernando Peccatiello as a portfolio demo.</span>
          <span>3 runs per day per visitor.</span>
        </footer>
      </main>
    </div>
  )
}
