import { defineStore, storeToRefs } from 'pinia'
import {
  useProfileStore,
  useUserStore,
  useAlertStore,
  useInitPiniaStore,
} from './'
import { Plan } from '@/server/models'
import { ref, computed } from 'vue'
import type { PlanInput } from '@/types'

type PlanType = InstanceType<typeof Plan>

export const usePlanStore = defineStore('plan', () => {
  const cookie = useAuthToken()
  const alertStore = useAlertStore()
  const profileStore = useProfileStore()
  const userStore = useUserStore()
  const initPinaStore = useInitPiniaStore()
  const { isAuthenticated } = storeToRefs(userStore)
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
      return order[a.id] - order[b.id]
    })
    return sortedPlans
  })
  // actions
  const getAllPostByUser = async () => {
    if (!cookie.value || !isAuthenticated.value) {
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
  }
  const createNewPost = async (payload: PlanInput) => {
    if (!cookie.value || !isAuthenticated.value) {
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
    alertStore.setAlert('Successfully created new plan!')
  }
  const updatePost = async (payload: { id: string; body: PlanInput }) => {
    if (!cookie.value || !isAuthenticated.value) {
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
    alertStore.setAlert('Successfully updated plan!')
  }
  const toggleComplete = async (payload: { id: string; body: PlanInput }) => {
    if (!cookie.value || !isAuthenticated.value) {
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
      `Successfulled marked the plan ${
        res.complete ? 'completed' : 'incomplete'
      }`
    )
  }
  const deletePost = async (payload: string) => {
    if (!cookie.value || !isAuthenticated.value) {
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
    alertStore.setAlert('Successfully deleted plan!')
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
  }
})
