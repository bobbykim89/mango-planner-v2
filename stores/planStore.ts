import { defineStore } from 'pinia'
import { useCookie, useFetch } from '#imports'
import { useProfileStore, useUserStore, useAlertStore } from './'
import { Plan } from '@/server/models'
import { ref, computed } from 'vue'
import type { PlanInput } from '@/types'

type PlanType = InstanceType<typeof Plan>

export const usePlanStore = defineStore('plan', () => {
  const cookie = useCookie('access_token')
  const alertStore = useAlertStore()
  const profileStore = useProfileStore()
  const userStore = useUserStore()
  // state
  const plans = ref<PlanType[]>([])
  // getters
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
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      const { data: res, error } = await useFetch<PlanType[]>('/api/plan', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      if (!res.value || error.value !== null) {
        plans.value = []
        return
      }
      plans.value = res.value
    } catch (error) {
      alertStore.setAlert('Authentication error: Cannot bring user posts')
      plans.value = []
    }
  }
  const createNewPost = async (payload: PlanInput) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      const { data: res, error } = await useFetch<PlanType>('/api/plan', {
        method: 'POST',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getAllPostByUser()
      alertStore.setAlert('Successfully created new plan!')
    } catch (error) {
      alertStore.setAlert('Failed to create new plan, please try again later.')
    }
  }
  const updatePost = async (payload: { id: string; body: PlanInput }) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      const { data: res, error } = await useFetch<PlanType>(
        `/api/plan/${payload.id}`,
        {
          method: 'PUT',
          headers: { Authorization: cookie.value },
          body: payload.body,
        }
      )
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getAllPostByUser()
    } catch (error) {
      alertStore.setAlert('Failed to update plan, please try again later.')
    }
  }
  const deletePost = async (payload: string) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      const { data: res, error } = await useFetch(`/api/plan/${payload}`, {
        method: 'DELETE',
        headers: { Authorization: cookie.value },
      })
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getAllPostByUser()
      alertStore.setAlert('Successfully deleted plan!')
    } catch (error) {
      alertStore.setAlert('Failed to delete plan, please try again later.')
    }
  }
  return {
    plans,
    getPlansByOrder,
    getAllPostByUser,
    createNewPost,
    updatePost,
    deletePost,
  }
})
