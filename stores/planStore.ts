import { Plan } from '@/server/models'
import type { PlanInput } from '@/types'
import type { H3Error } from 'h3'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  useAlertStore,
  useInitPiniaStore,
  useProfileStore,
  useUserStore,
} from './'

type PlanType = InstanceType<typeof Plan>

export const usePlanStore = defineStore('plan', () => {
  const cookie = useAuthToken()
  const alertStore = useAlertStore()
  const profileStore = useProfileStore()
  const userStore = useUserStore()
  const initPinaStore = useInitPiniaStore()
  // state
  const plans = ref<PlanType[]>([])
  // getters
  const getAllPlans = computed<PlanType[]>(() => {
    let incompletePlans: PlanType[] = []
    let completedPlans: PlanType[] = []
    for (let i = 0; i < plans.value.length; i++) {
      plans.value[i].complete === true
        ? completedPlans.push(plans.value[i])
        : incompletePlans.push(plans.value[i])
    }
    return [...incompletePlans, ...completedPlans]
  })
  const getIncompletePlans = computed<PlanType[]>(() => {
    const incomplete = plans.value.filter((item) => {
      return item.complete === false
    })
    return incomplete
  })
  const getPlansByOrder = computed<PlanType[]>(() => {
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
      return order[a._id.toString()] - order[b._id.toString()]
    })
    return sortedPlans
  })
  // actions
  const getAllPostByUser = async () => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      const res = await $fetch<PlanType[]>('/api/plan', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      initPinaStore.setLoading(true)
      if (res === null) {
        alertStore.setAlert('Authentication error: Cannot bring user posts')
        initPinaStore.setLoading(false)
        return
      }
      plans.value = res
      initPinaStore.setLoading(false)
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      initPinaStore.setLoading(false)
    }
  }
  const createNewPost = async (payload: PlanInput) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<PlanType>('/api/plan', {
      method: 'POST',
      headers: { Authorization: cookie.value },
      body: payload,
    })
    initPinaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPinaStore.setLoading(false)
      return
    }
    plans.value = [res, ...plans.value]
    initPinaStore.setLoading(false)
    alertStore.setAlert('Successfully created new plan!', 'success')
  }
  const updatePost = async (payload: { id: string; body: PlanInput }) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<PlanType>(`/api/plan/${payload.id}`, {
      method: 'PUT',
      headers: { Authorization: cookie.value },
      body: payload.body,
    })
    initPinaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPinaStore.setLoading(false)
      return
    }
    await getAllPostByUser()
    initPinaStore.setLoading(false)
    alertStore.setAlert('Successfully updated plan!', 'success')
  }
  const toggleComplete = async (payload: { id: string; body: PlanInput }) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<PlanType>(`/api/plan/${payload.id}/toggle`, {
      method: 'PUT',
      headers: { Authorization: cookie.value },
      body: payload.body,
    })
    initPinaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPinaStore.setLoading(false)
      return
    }
    await getAllPostByUser()
    initPinaStore.setLoading(false)
    alertStore.setAlert(
      `Successfully marked the plan ${
        res.complete ? 'completed' : 'incomplete'
      }`,
      'success'
    )
  }
  const deletePost = async (payload: string) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch(`/api/plan/${payload}`, {
      method: 'DELETE',
      headers: { Authorization: cookie.value },
    })
    initPinaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPinaStore.setLoading(false)
      return
    }
    await getAllPostByUser()
    initPinaStore.setLoading(false)
    alertStore.setAlert('Successfully deleted plan!', 'success')
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
