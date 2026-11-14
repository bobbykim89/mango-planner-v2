import { describe, expect, it } from 'vitest'
import { useRepeatableAnnouncer } from '@/composables/useRepeatableAnnouncer'

describe('useRepeatableAnnouncer (#40)', () => {
  it('changes the live text even when the same message is announced again', () => {
    const announce = useRepeatableAnnouncer()
    const { message } = useAnnouncer()
    const seen: string[] = []
    for (let i = 0; i < 3; i++) {
      announce('3 plans shown')
      seen.push(message.value)
    }
    // each announcement differs from the one before, so screen readers read it…
    expect(seen[0]).not.toBe(seen[1])
    expect(seen[1]).not.toBe(seen[2])
    // …but it reads the same: only an invisible no-break space is added
    expect(seen.map((m) => m.replace(/ $/, ''))).toEqual(Array(3).fill('3 plans shown'))
  })

  it('announces a new message as is', () => {
    const announce = useRepeatableAnnouncer()
    announce('1 plan shown')
    announce('"Trip" moved to position 2 of 5')
    expect(useAnnouncer().message.value).toBe('"Trip" moved to position 2 of 5')
  })
})
