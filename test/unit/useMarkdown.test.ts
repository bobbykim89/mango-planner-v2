import { describe, expect, it } from 'vitest'
import { useMarkdown } from '@/composables/useMarkdown'

const headingTags = (html: string) => [...html.matchAll(/<(h[1-6])\b/g)].map((m) => m[1])

describe('useMarkdown', () => {
  describe('headings sit below the plan title, an h2 (#42)', () => {
    it('renders # as an h3, not an h1', () => {
      expect(headingTags(useMarkdown('# Packing'))).toEqual(['h3'])
    })

    it('steps each level down by two, capped at h6', () => {
      const html = useMarkdown('## a\n\n### b\n\n#### c\n\n##### d\n\n###### e')
      expect(headingTags(html)).toEqual(['h4', 'h5', 'h6', 'h6', 'h6'])
    })

    it('shifts underlined (setext) headings too', () => {
      expect(headingTags(useMarkdown('Title\n=====\n\nSub\n---'))).toEqual(['h3', 'h4'])
    })

    it('keeps inline formatting inside a heading', () => {
      expect(useMarkdown('# **Bold** title')).toContain('<h3><strong>Bold</strong> title</h3>')
    })
  })

  it('renders KaTeX math', () => {
    expect(useMarkdown('$x^2$')).toContain('class="katex"')
  })

  it('strips unsafe HTML', () => {
    const html = useMarkdown('<img src="x" onerror="alert(1)"> <script>alert(2)</script>')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
  })
})
