import { PipelineRunner } from '@/components/PipelineRunner'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:py-24">
      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--accent-text)]">
          AI Agent Orchestration
        </p>
        <h1 className="text-[32px] font-semibold leading-tight text-[var(--foreground)] sm:text-[40px]">
          battle-room
        </h1>
        <p className="max-w-xl text-[16px] leading-relaxed text-[var(--muted)]">
          Four agents run in sequence against a real competitor: pulling their live ads, drafting your
          battlecard, reading their recent press, and writing an outbound sequence for your target buyer.
        </p>
      </header>
      <PipelineRunner />
      <footer className="mt-8 border-t border-[var(--border)] pt-6 text-[13px] text-[var(--muted)]">
        Built by Fernando Peccatiello as a portfolio demo. 3 runs per day per visitor.
      </footer>
    </main>
  )
}
