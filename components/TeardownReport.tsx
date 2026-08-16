import { Citation } from './Citation'
import type { Evidence } from '@/lib/evidence'
import type { Section } from '@/lib/synthesize'

const CITATION_RE = /\[([a-z]+-\d+)\]/g

/** Splits a line into text and citation chips so ids never render literally. */
function renderLine(line: string, byId: Map<string, Evidence>, key: number) {
  const nodes: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  CITATION_RE.lastIndex = 0
  while ((match = CITATION_RE.exec(line)) !== null) {
    if (match.index > last) nodes.push(line.slice(last, match.index))
    const evidence = byId.get(match[1])
    if (evidence) nodes.push(<Citation key={`${key}-${match.index}`} evidence={evidence} />)
    last = match.index + match[0].length
  }
  if (last < line.length) nodes.push(line.slice(last))

  return nodes
}

/**
 * Verbatim customer voice gets a pull-quote treatment so it reads as
 * evidence, not synthesized analysis — the accent rule and serif-leaning
 * display size are the only difference from the standard bullet; the
 * tokens and spacing rhythm stay identical to the rest of the report.
 */
function QuoteBody({ body, byId }: { body: string; byId: Map<string, Evidence> }) {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => {
        const isBullet = line.startsWith('- ')
        const content = isBullet ? line.slice(2) : line
        return (
          <blockquote
            key={i}
            className="rounded-[14px] border-l-2 border-[var(--accent)]/50 bg-[var(--surface)]/60 py-3 pl-5 pr-4"
          >
            <p className="text-[16px] font-[450] italic leading-[1.6] tracking-[-0.005em] text-[var(--foreground)]">
              {renderLine(content, byId, i)}
            </p>
          </blockquote>
        )
      })}
    </div>
  )
}

function SectionBody({ body, byId }: { body: string; byId: Map<string, Evidence> }) {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <div className="flex flex-col gap-2.5">
      {lines.map((line, i) => {
        const isBullet = line.startsWith('- ')
        const content = isBullet ? line.slice(2) : line
        return (
          <p key={i} className="flex gap-3 text-[15.5px] leading-[1.65] text-[var(--foreground)]">
            {isBullet && <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]/60" />}
            <span>{renderLine(content, byId, i)}</span>
          </p>
        )
      })}
    </div>
  )
}

export function TeardownReport({ sections, evidence }: { sections: Section[]; evidence: Evidence[] }) {
  const byId = new Map(evidence.map((e) => [e.id, e]))

  return (
    <div className="flex flex-col gap-14">
      {sections.map((section, i) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="text-[12px] font-semibold tabular-nums text-[var(--muted-2)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">
              {section.title}
            </h2>
          </div>

          {section.hasData ? (
            section.id === 'customers' ? (
              <QuoteBody body={section.body} byId={byId} />
            ) : (
              <SectionBody body={section.body} byId={byId} />
            )
          ) : (
            <p className="rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-4 py-3.5 text-[14.5px] text-[var(--muted)]">
              Nothing found for this section. That is the finding, not a failure — no invented content is
              shown here.
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
