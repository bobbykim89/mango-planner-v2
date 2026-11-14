import DOMPurify from 'isomorphic-dompurify'
import { Marked } from 'marked'
import markedKatex from 'marked-katex-extension'

// Plan content sits under the plan title (an h2), so its headings start one level
// below it: # becomes h3, ## becomes h4, and so on, capped at h6 (#42).
const HEADING_OFFSET = 2

const marked = new Marked(markedKatex({ throwOnError: false, displayMode: false }), {
  renderer: {
    heading({ tokens, depth }) {
      const level = Math.min(depth + HEADING_OFFSET, 6)
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`
    },
  },
})

export const useMarkdown = (src: string) => {
  const rawHtml = marked.parse(src) as string
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: [
      'math',
      'mrow',
      'mi',
      'mo',
      'mn',
      'msup',
      'msub',
      'mfrac',
      'mspace',
      'mover',
      'munder',
      'mtext',
      'annotation',
      'semantics',
    ],
    ADD_ATTR: ['xmlns', 'display', 'class', 'style', 'aria-hidden'],
  })
}
