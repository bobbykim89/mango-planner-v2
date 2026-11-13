import type { PlanDto } from '#shared/types'
import { usePlanStore } from '@/stores/planStore'
import { useProfileStore } from '@/stores/profileStore'

/** The user's plans in their saved custom order; plans missing from the order go last. */
export const usePlansByOrder = () => {
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  return computed<PlanDto[]>(() => {
    const plans = planStore.plans
    const plansOrder = profileStore.getPlansOrder
    if (plansOrder.length === 0 || plans.length === 0) return plans.slice()
    const orderMap = new Map(plansOrder.map((id, idx) => [id, idx]))
    return plans
      .slice()
      .sort(
        (a, b) =>
          (orderMap.get(a._id.toString()) ?? Infinity) -
          (orderMap.get(b._id.toString()) ?? Infinity),
      )
  })
}
