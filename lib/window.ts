/**
 * Returns a slice of `text` centred on the first matching pattern.
 *
 * Review and ad pages put their real content far below a wall of navigation,
 * badges and cross-sell carousels — on a G2 product page the first actual
 * review sits around character 54,000. Taking the leading slice throws the
 * substance away and leaves the collector reporting "no data found", which
 * is indistinguishable from an honest empty result. Centring the window on
 * the content keeps prompts the same size while containing what matters.
 *
 * Falls back to the leading slice when no pattern matches, which is the
 * right behaviour for pages whose content genuinely starts at the top.
 */
export function windowAround(text: string, patterns: RegExp[], chars: number): string {
  if (text.length <= chars) return text

  for (const pattern of patterns) {
    const index = text.search(pattern)
    if (index === -1) continue
    const start = Math.max(0, Math.min(index - Math.floor(chars / 4), text.length - chars))
    return text.slice(start, start + chars)
  }

  return text.slice(0, chars)
}
