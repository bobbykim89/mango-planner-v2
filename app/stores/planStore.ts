import type { PlanModel } from '#shared/models'
import type { PlanDto, PlanInput } from '#shared/types'
import type { H3Error } from 'h3'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore } from './alertStore'
import { useProfileStore } from './profileStore'
import { useUserStore } from './userStore'

export const usePlanStore = defineStore('plan', () => {
  const cookie = useAuthToken()
  const alertStore = useAlertStore()
  const profileStore = useProfileStore()
  const userStore = useUserStore()
  // state
  const plans = ref<PlanDto[]>([])
  // getters
  const getAllPlans = computed<PlanDto[]>(() => {
    let incompletePlans: PlanDto[] = []
    let completedPlans: PlanDto[] = []
    for (let i = 0; i < plans.value.length; i++) {
      const plan = plans.value[i]
      if (plan !== undefined) {
        plan.complete === true
          ? completedPlans.push(plan)
          : incompletePlans.push(plan)
      }
    }

    return [...incompletePlans, ...completedPlans]
  })
  const getIncompletePlans = computed<PlanDto[]>(() => {
    const incomplete = plans.value.filter((item) => {
      return item.complete === false
    })
    return incomplete
  })
  const getPlansByOrder = computed<PlanDto[]>(() => {
    const plansOrder = profileStore.getPlansOrder
    if (plansOrder.length === 0 || plans.value.length === 0) {
      return plans.value.slice()
    }

    // const order: Record<string, number> = {}
    // plansOrder.forEach((id, idx) => {
    //   order[id] = idx
    // })

    const orderMap = Object.fromEntries(plansOrder.map((id, idx) => [id, idx]))

    // return plans.value.sort((a, b) => {
    //   const objA = order[a._id.toString()]
    //   const objB = order[b._id.toString()]
    //   if (!objA || !objB) return 0
    //   return objA - objB
    // })
    return plans.value
      .slice() // avoid mutating original array
      .sort((a, b) => {
        const idxA = orderMap[a._id.toString()] ?? Infinity
        const idxB = orderMap[b._id.toString()] ?? Infinity
        return idxA - idxB
      })
  })
  // actions
  const getAllPostByUser = async () => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      const res = await $fetch<PlanDto[]>('/api/plan', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      plans.value = res
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const createNewPost = async (payload: PlanInput) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      const res = await $fetch<PlanDto>('/api/plan', {
        method: 'POST',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      plans.value = [res, ...plans.value]
      alertStore.setAlert('Successfully created new plan!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const updatePost = async (payload: { id: string; body: PlanInput }) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      await $fetch<PlanModel>(`/api/plan/${payload.id}`, {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload.body,
      })
      await getAllPostByUser()
      alertStore.setAlert('Successfully updated plan!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const toggleComplete = async (payload: { id: string; body: PlanInput }) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      const res = await $fetch<PlanModel>(`/api/plan/${payload.id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload.body,
      })
      await getAllPostByUser()
      alertStore.setAlert(
        `Successfully marked the plan ${
          res.complete ? 'completed' : 'incomplete'
        }`,
        'success'
      )
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const deletePost = async (payload: string) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      await $fetch(`/api/plan/${payload}`, {
        method: 'DELETE',
        headers: { Authorization: cookie.value },
      })
      await getAllPostByUser()
      alertStore.setAlert('Successfully deleted plan!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const clearPlanData = () => {
    plans.value = []
  }
  return {
    plans,
    getAllPlans,
    getIncompletePlans,
    getPlansByOrder,
    getAllPostByUser,
    createNewPost,
    updatePost,
    toggleComplete,
    deletePost,
    clearPlanData,
  }
})
