import { defineStore } from 'pinia'
import { useCookie, useFetch } from 'nuxt/app'
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
    // try {
    const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    // const {
    //   data: res,
    //   pending,
    //   // error,
    // } = await useFetch<PlanType[]>('/api/plan', {
    //   method: 'GET',
    //   // headers: { Authorization: accessToken },
    //   onRequest({ options }) {
    //     options.headers = {
    //       ...options.headers,
    //       Authorization: accessToken,
    //     }
    //     console.log('sending request')
    //   },
    // })
    // console.log({
    //   pending: pending.value,
    //   res: res.value,
    // })
    // initPinaStore.setLoading(pending.value)

    // if (!pending.value && !res.value) {
    //   alertStore.setAlert('Authentication error: Cannot bring user posts')
    //   initPinaStore.setLoading(false)
    //   // plans.value = []
    //   return
    // }
    // plans.value = res.value!
    // initPinaStore.setLoading(false)
    const res = await $fetch<PlanType[]>('/api/plan', {
      method: 'GET',
      headers: { Authorization: cookie.value },
    })
    // console.log(res)
    initPinaStore.setLoading(true)
    if (res === null) {
      alertStore.setAlert('Authentication error: Cannot bring user posts')
      initPinaStore.setLoading(false)
      return
    }
    plans.value = res
    initPinaStore.setLoading(false)
    // } catch (error) {
    //   alertStore.setAlert('Authentication error: Cannot bring user posts')
    //   plans.value = []
    // }
  }
  const createNewPost = async (payload: PlanInput) => {
    // try {
    // console.log(payload)
    const { title, content, type } = payload
    const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
    // console.log({
    //   cookie: cookie.value,
    //   auth: isAuthenticated,
    // })
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    // const res: PlanType = await $fetch('/api/plan', {
    //   method: 'POST',
    //   headers: { Authorization: accessToken },
    //   body: payload,
    // })
    // if (!res) {
    //   alertStore.setAlert(
    //     'Failed to get response from server, please try again'
    //   )
    //   return
    // }
    // const {
    //   data: res,
    //   pending,
    //   // error,
    // } = await useFetch<PlanType>('/api/plan', {
    //   onRequest({ options }) {
    //     options.method = 'POST'
    //     options.headers = {
    //       ...options.headers,
    //       Authorization: cookie.value!,
    //     }
    //     console.log(payload)
    //     options.body = { title, content, type }
    //   },
    //   onRequestError({ error }) {
    //     console.log('request error on POST', error)
    //   },
    //   onResponseError({ error }) {
    //     console.log('Error while posting data', error?.cause)
    //   },
    // })
    // initPinaStore.setLoading(pending.value)
    // if (!pending.value && !res.value) {
    //   alertStore.setAlert(
    //     'Failed to get response from server, please try again'
    //   )
    //   initPinaStore.setLoading(false)
    //   return
    // }
    // await getAllPostByUser()
    const res = await $fetch<PlanType>('/api/plan', {
      method: 'POST',
      headers: { Authorization: cookie.value },
      // body: { title, content, type },
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
    // await getAllPostByUser()
    plans.value = [res, ...plans.value]
    initPinaStore.setLoading(false)
    alertStore.setAlert('Successfully created new plan!')
    // } catch (error) {
    //   alertStore.setAlert('Failed to create new plan, please try again later.')
    // }
  }
  const updatePost = async (payload: { id: string; body: PlanInput }) => {
    // try {
    const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    // const { data: res, error } = await useFetch<PlanType>(
    //   `/api/plan/${payload.id}`,
    //   {
    //     method: 'PUT',
    //     // headers: { Authorization: accessToken },
    //     // body: payload.body,
    //     onRequest({ options }) {
    //       options.headers = {
    //         ...options.headers,
    //         Authorization: accessToken,
    //       }
    //       options.body = payload.body
    //     },
    //   }
    // )
    // if (!res.value || error.value !== null) {
    //   alertStore.setAlert(
    //     'Failed to get response from server, please try again'
    //   )
    //   return
    // }
    // await getAllPostByUser()
    console.log('updatePost payload', payload)
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
    // } catch (error) {
    //   alertStore.setAlert('Failed to update plan, please try again later.')
    // }
  }
  const deletePost = async (payload: string) => {
    // try {
    const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    // const { data: res, error } = await useFetch(`/api/plan/${payload}`, {
    //   method: 'DELETE',
    //   // headers: { Authorization: accessToken },
    //   onRequest({ options }) {
    //     options.headers = {
    //       ...options.headers,
    //       Authorization: cookie.value,
    //     }
    //   },
    // })
    // if (!res.value || error.value !== null) {
    //   alertStore.setAlert(
    //     'Failed to get response from server, please try again'
    //   )
    //   return
    // }
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
    // } catch (error) {
    //   alertStore.setAlert('Failed to delete plan, please try again later.')
    // }
  }
  return {
    plans,
    getAllPlans,
    getIncompletePlans,
    getPlansByOrder,
    getAllPostByUser,
    createNewPost,
    updatePost,
    deletePost,
  }
})
