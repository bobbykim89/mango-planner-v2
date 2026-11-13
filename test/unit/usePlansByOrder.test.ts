import { beforeEach, describe, expect, it } from 'vitest'
import { usePlansByOrder } from '@/composables/usePlansByOrder'
import { usePlanStore, useProfileStore } from '@/stores'
import type { PlanDto, ProfileDto } from '#shared/types'
import { resetState } from './helpers'

const plan = (id: string) => ({ _id: id, title: id }) as unknown as PlanDto

describe('usePlansByOrder', () => {
  beforeEach(() => {
    resetState()
  })

  it('sorts by plansOrder with unknown ids last', () => {
    usePlanStore().plans = [plan('a'), plan('b'), plan('c')]
    useProfileStore().userProfile = {
      _id: 'pr1',
      plansOrder: ['c', 'a'],
      dark: false,
    } as unknown as ProfileDto
    const ordered = usePlansByOrder()
    expect(ordered.value.map((p) => p._id)).toEqual(['c', 'a', 'b'])
  })

  it('returns plans unchanged without a profile', () => {
    usePlanStore().plans = [plan('a'), plan('b')]
    const ordered = usePlansByOrder()
    expect(ordered.value.map((p) => p._id)).toEqual(['a', 'b'])
  })
})
