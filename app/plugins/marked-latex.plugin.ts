import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'

marked.use(
  markedKatex({
    throwOnError: false,
    displayMode: false,
  }),
)

export default defineNuxtPlugin(() => {})
