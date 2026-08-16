import { describe, it, expect } from 'vitest'
import { parseRssItems } from '@/lib/collectors/press'

const FEED = `<?xml version="1.0"?>
<rss version="2.0"><channel>
<title>Google News</title>
<item><title>Acme raises $40M Series B</title><link>https://news.example/1</link><pubDate>Mon, 10 Aug 2026 09:00:00 GMT</pubDate></item>
<item><title>Acme launches new pricing</title><link>https://news.example/2</link><pubDate>Tue, 11 Aug 2026 09:00:00 GMT</pubDate></item>
</channel></rss>`

describe('parseRssItems', () => {
  it('extracts headline and link for each item', () => {
    const items = parseRssItems(FEED)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Acme raises $40M Series B')
    expect(items[0].link).toBe('https://news.example/1')
  })

  it('returns an empty array for a feed with no items', () => {
    expect(parseRssItems('<?xml version="1.0"?><rss><channel></channel></rss>')).toEqual([])
  })

  it('returns an empty array for malformed xml instead of throwing', () => {
    expect(parseRssItems('not xml at all <<<')).toEqual([])
  })

  it('caps at 8 items', () => {
    const many = `<?xml version="1.0"?><rss><channel>${
      Array.from({ length: 20 }, (_, i) => `<item><title>T${i}</title><link>https://n/${i}</link></item>`).join('')
    }</channel></rss>`
    expect(parseRssItems(many)).toHaveLength(8)
  })
})
