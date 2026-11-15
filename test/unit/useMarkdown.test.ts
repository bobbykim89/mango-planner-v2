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

  describe('line breaks (#49)', () => {
    it('keeps a single line break inside a paragraph as <br>', () => {
      expect(useMarkdown('Pack the night before.\nLeave by 7am.')).toContain(
        '<p>Pack the night before.<br>Leave by 7am.</p>',
      )
    })

    it('still starts a new paragraph after a blank line', () => {
      const html = useMarkdown('First\n\nSecond')
      expect(html).toContain('<p>First</p>')
      expect(html).toContain('<p>Second</p>')
      expect(html).not.toContain('<br>')
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
