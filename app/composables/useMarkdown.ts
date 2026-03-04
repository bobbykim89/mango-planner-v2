import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

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
