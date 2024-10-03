import { type PlanModel } from '@/server/models'
import type { PlanInput } from '@/types'
import type { H3Error } from 'h3'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore, useProfileStore, useUserStore } from './'

export const usePlanStore = defineStore('plan', () => {
  const cookie = useAuthToken()
  const alertStore = useAlertStore()
  const profileStore = useProfileStore()
  const userStore = useUserStore()
  // state
  const plans = ref<PlanModel[]>([])
  // getters
  const getAllPlans = computed<PlanModel[]>(() => {
    let incompletePlans: PlanModel[] = []
    let completedPlans: PlanModel[] = []
    for (let i = 0; i < plans.value.length; i++) {
      plans.value[i].complete === true
        ? completedPlans.push(plans.value[i])
        : incompletePlans.push(plans.value[i])
    }
    return [...incompletePlans, ...completedPlans]
  })
  const getIncompletePlans = computed<PlanModel[]>(() => {
    const incomplete = plans.value.filter((item) => {
      return item.complete === false
    })
    return incomplete
  })
  const getPlansByOrder = computed<PlanModel[]>(() => {
    const plansOrder = profileStore.getPlansOrder
    if (plansOrder.length === 0 || plans.value.length === 0) {
      return plans.value
    }

    type OrderType = {
      [key: string]: number
    }
    const order: OrderType = {}
    plansOrder.forEach((id, idx) => {
      order[id] = idx
    })
    const sortedPlans = plans.value.sort((a, b) => {
      return order[a._id!.toString()] - order[b._id!.toString()]
    })
    return sortedPlans
  })
  // actions
  const getAllPostByUser = async () => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      const res = await $fetch<PlanModel[]>('/api/plan', {
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
      const res = await $fetch<PlanModel>('/api/plan', {
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
