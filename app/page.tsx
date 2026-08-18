import { TeardownForm } from '@/components/TeardownForm'
import { HowItWorks } from '@/components/HowItWorks'

export default function Home() {
  return (
    <div>
      <section className="grain relative overflow-hidden bg-[var(--hero-bg)]">
        <div className="hero-dark-atmosphere pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-start gap-8 px-6 pb-20 pt-20 sm:pb-28 sm:pt-28">
          <p className="animate-rise flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-bright)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-bright)]" />
            Competitor research
          </p>
          <h1
            className="animate-rise max-w-3xl text-[40px] font-semibold leading-[1.03] tracking-[-0.03em] text-[var(--hero-fg)] sm:text-[62px]"
            style={{ animationDelay: '0.08s' }}
          >
            Competitor teardowns,
            <br />
            with the receipts.
          </h1>
          <p
            className="animate-rise max-w-xl text-[17px] leading-relaxed text-[var(--hero-muted)] sm:text-[19px]"
            style={{ animationDelay: '0.16s' }}
          >
            Paste a competitor&rsquo;s URL. Get what they sell, what they charge, what their customers
            complain about, and where they&rsquo;re exposed — every line linked to the source it came from.
          </p>
          <div className="animate-rise w-full max-w-2xl" style={{ animationDelay: '0.24s' }}>
            <TeardownForm />
          </div>
          <a
            href="#how-it-works"
            className="animate-rise text-[14px] font-semibold text-[var(--hero-muted)] underline decoration-[var(--hero-border)] underline-offset-4 transition-colors hover:text-[var(--accent-bright)] hover:decoration-[var(--accent-bright)]/50"
            style={{ animationDelay: '0.3s' }}
          >
            See what it reads ↓
          </a>
        </div>
      </section>

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-24 px-6 py-24">
        <div id="how-it-works" className="scroll-mt-20">
          <HowItWorks />
        </div>
        <footer className="flex w-full flex-col gap-1 border-t border-[var(--border-soft)] pt-6 text-[13px] text-[var(--muted-2)] sm:flex-row sm:items-center sm:justify-between">
          <span>Built by Fernando Peccatiello.</span>
          <span>3 teardowns per day per visitor.</span>
        </footer>
      </main>
    </div>
  )
}
