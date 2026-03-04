import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'

export default defineNuxtPlugin({
  name: 'markdown',
  dependsOn: ['pinia'],
  setup() {
    marked.use(
      markedKatex({
        throwOnError: false,
        displayMode: false,
      }),
    )
  },
})
