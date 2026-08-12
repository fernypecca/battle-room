import type { ReactNode } from 'react'

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export interface AgentMeta {
  title: string
  description: string
  detail: string
  icon: ReactNode
}

// Single source of truth for the 4 agents — used by the static "how it
// works" explainer (always visible) and the live PipelineRunner cards
// (appear once the form is submitted), so the two never drift apart.
export const AGENTS: AgentMeta[] = [
  {
    title: 'Ad Intelligence',
    description: "Scrapes the competitor's live ads and extracts their angles.",
    detail: 'Pulls whatever is currently running in the Meta Ad Library for that brand and has Claude read out the recurring hooks, offers, and positioning claims — or says plainly when nothing is running.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1.5-5H10l8 4V6l-8 4H5a2 2 0 0 0-2 2Z" />
        <path d="M18 9v6" />
      </svg>
    ),
  },
  {
    title: 'Battlecard Writer',
    description: 'Drafts your positioning against this competitor.',
    detail: "Takes what the ads revealed (or the lack of it) and drafts a sales battlecard: how to frame your product, what to lead with, and how to answer the objections that competitor's ads are likely to raise.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3 4 6v6c0 4.5 3.2 7.4 8 9 4.8-1.6 8-4.5 8-9V6l-8-3Z" />
        <path d="M9 12.5 11 14.5 15.5 10" />
      </svg>
    ),
  },
  {
    title: 'Media Coverage',
    description: "Summarizes the competitor's recent press.",
    detail: 'Reads recent news coverage of the competitor and summarizes the themes — funding, launches, controversy, sentiment — so you know what a prospect may have already seen about them.',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="14" height="15" rx="1.5" />
        <path d="M7 9h6M7 12.5h6M7 16h4" />
        <path d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8" />
      </svg>
    ),
  },
  {
    title: 'Outbound Sequence',
    description: 'Writes a 3-email sequence for your target persona.',
    detail: 'Combines the battlecard with your target persona to draft a 3-email outbound sequence — personalized to their role, never to an invented name or fact.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4.5 4.5 20 12 4.5 19.5 8 12 4.5 4.5Z" />
        <path d="M8 12h6" />
      </svg>
    ),
  },
]
