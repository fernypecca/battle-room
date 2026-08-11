import { PipelineRunner } from '@/components/PipelineRunner'

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-atmosphere pointer-events-none absolute inset-x-0 top-0 h-[560px]" />
      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 pb-24 pt-20 sm:pt-28">
        <header className="flex flex-col items-center gap-5 text-center">
          <p className="animate-rise flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            AI Agent Orchestration
          </p>
          <h1
            className="animate-rise text-[52px] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--foreground)] sm:text-[76px]"
            style={{ animationDelay: '0.08s' }}
          >
            battle-room
          </h1>
          <p
            className="animate-rise max-w-xl text-[17px] leading-relaxed text-[var(--muted)] sm:text-[19px]"
            style={{ animationDelay: '0.16s' }}
          >
            Four agents run in sequence against a real competitor: pulling their live ads, drafting your
            battlecard, reading their recent press, and writing an outbound sequence for your target buyer.
          </p>
        </header>
        <div className="animate-rise mx-auto w-full max-w-3xl" style={{ animationDelay: '0.24s' }}>
          <PipelineRunner />
        </div>
        <footer className="mx-auto flex w-full max-w-3xl flex-col gap-1 border-t border-[var(--border-soft)] pt-6 text-[13px] text-[var(--muted-2)] sm:flex-row sm:items-center sm:justify-between">
          <span>Built by Fernando Peccatiello as a portfolio demo.</span>
          <span>3 runs per day per visitor.</span>
        </footer>
      </main>
    </div>
  )
}
