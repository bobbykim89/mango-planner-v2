import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import DraftsBlock from '@/components/plans/DraftsBlock.vue'

const draft = (id: string, title: string) => ({
  id,
  data: { title, content: '', type: 'personal' as const },
})

describe('DraftsBlock', () => {
  it('names each draft by its title, so several new drafts can be told apart (#30)', async () => {
    const wrapper = await mountSuspended(DraftsBlock, {
      props: {
        visible: true,
        drafts: [draft('new-1', 'Groceries'), draft('new-2', 'Call mom'), draft('p1', 'Trip plan')],
      },
    })
    const buttons = wrapper.findAll('button')
    // the spacing around '·' comes from CSS gap, so compare without whitespace
    expect(buttons.map((b) => b.text().replace(/\s+/g, ''))).toEqual([
      'New·Groceries',
      'New·Callmom',
      'Edit·Tripplan',
    ])
    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual([
      'New draft "Groceries"',
      'New draft "Call mom"',
      'Edit draft "Trip plan"',
    ])
    expect(buttons[1]!.classes()).toContain('btn-warning')
    expect(buttons[2]!.classes()).not.toContain('btn-warning')
  })
})
