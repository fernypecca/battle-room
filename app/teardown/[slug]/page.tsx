import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTeardown } from '@/lib/teardownStore'
import { TeardownReport } from '@/components/TeardownReport'

export const revalidate = 300

const AUTHOR = 'Fernando Peccatiello'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const teardown = await getTeardown(slug)
  if (!teardown) return { title: 'Teardown not found' }

  return {
    title: `${slug} — Competitor Teardown`,
    description: `A sourced teardown of ${slug}: what they sell, how they price, what their customers say, and where they are vulnerable. Every claim links to its source.`,
    authors: [{ name: AUTHOR }],
  }
}

export default async function TeardownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const teardown = await getTeardown(slug)
  if (!teardown) notFound()

  const sourceCount = new Set(teardown.evidence.map((e) => e.source)).size

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pb-32 pt-14 sm:px-6">
      <header className="mb-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">
          Competitor teardown
        </p>
        <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--foreground)] sm:text-[52px]">
          {teardown.slug}
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--muted)]">
          Every claim below carries the source it came from. Tap any marker to read the original text.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[var(--border-soft)] pt-5 text-[13px] text-[var(--muted-2)]">
          <span>{teardown.evidence.length} sources cited</span>
          <span aria-hidden="true">·</span>
          <span>{sourceCount} channels</span>
          <span aria-hidden="true">·</span>
          <span>
            Analysis by <span className="font-medium text-[var(--muted)]">{AUTHOR}</span>
          </span>
        </div>
      </header>

      <TeardownReport sections={teardown.sections} evidence={teardown.evidence} />
    </main>
  )
}
