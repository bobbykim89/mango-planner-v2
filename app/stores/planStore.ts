import type { PlanModel } from '#shared/models'
import type {
  DraftFormInput,
  DraftRawType,
  PlanDto,
  PlanInput,
} from '#shared/types'
import localforage from 'localforage'
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
  const drafts = ref<DraftFormInput[]>([])
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

    const orderMap = Object.fromEntries(plansOrder.map((id, idx) => [id, idx]))

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
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      const res = await $fetch<PlanDto[]>('/api/plan', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })

      plans.value = res
      await loadAllDrafts()
    } catch (error) {
      handleError(error)
    }
  }
  const createNewPost = async (payload: PlanInput) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      const res = await $fetch<PlanDto>('/api/plan', {
        method: 'POST',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      plans.value = [res, ...plans.value]
      alertStore.setAlert('Successfully created new plan!', 'success')
    } catch (error) {
      await saveDraft('new', payload)
      handleError(error)
    }
  }
  const updatePost = async (payload: { id: string; body: PlanInput }) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      await $fetch<PlanModel>(`/api/plan/${payload.id}`, {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload.body,
      })
      await getAllPostByUser()
      alertStore.setAlert('Successfully updated plan!', 'success')
    } catch (error) {
      await saveDraft(payload.id, payload.body)
      handleError(error)
    }
  }
  const toggleComplete = async (payload: { id: string; body: PlanInput }) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

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
        'success',
      )
    } catch (error) {
      handleError(error)
    }
  }
  const deletePost = async (payload: string) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      await $fetch(`/api/plan/${payload}`, {
        method: 'DELETE',
        headers: { Authorization: cookie.value },
      })
      await getAllPostByUser()
      alertStore.setAlert('Successfully deleted plan!', 'success')
    } catch (error) {
      handleError(error)
    }
  }
  const clearPlanData = () => {
    plans.value = []
    drafts.value = []
  }
  const handleError = (err: unknown) => {
    let errorMessage: string = extractErrorMessage(err)
    let shouldRedirectToLogin: boolean = isAuthError(err)

    console.error(errorMessage)
    alertStore.setAlert(errorMessage)

    if (shouldRedirectToLogin) {
      setTimeout(() => {
        userStore.clearUserStore()
        profileStore.clearProfileData()
        clearPlanData()
        navigateTo('/auth/login')
      }, 1000)
    }
  }
  const saveDraft = async (key: string, data: PlanInput) => {
    try {
      if (import.meta.client) {
        // convert to plain obj and remove any non-serializable values
        const plainData = JSON.parse(JSON.stringify(data))
        const checkExistence = await localforage.getItem(key)
        if (checkExistence !== null) {
          console.log('Removing existing draft...')
          await localforage.removeItem(key)
        }
        await localforage.setItem(key, {
          data: plainData,
          timestamp: Date.now(),
        })
        console.log('Draft saved successfully')
      }
    } catch (error) {
      console.error('Failed to save draft: ', error)
    }
  }
  const getDraft = async (key: string) => {
    try {
      if (import.meta.client) {
        const draft = await localforage.getItem<{
          data: PlanInput
          timestamp: number
        }>(key)
        if (draft === null) throw new Error('Failed to retrieve draft')

        return {
          id: key,
          ...draft?.data,
        }
      }
    } catch (error) {
      handleError(error)
    }
  }
  const deleteDraft = async (key: string) => {
    try {
      if (import.meta.client) {
        await localforage.removeItem(key)
        console.log('Draft deleted successfully')
        drafts.value = drafts.value.filter((draft) => draft.id !== key)
      }
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }
  const loadAllDrafts = async () => {
    try {
      if (import.meta.client) {
        const keys = await localforage.keys()
        const mappedDrafts = await Promise.all(
          keys.map(async (key) => {
            const draft = await localforage.getItem<DraftRawType>(key)
            if (draft !== null) {
              return {
                id: key,
                ...draft,
              }
            }
          }),
        )
        drafts.value = mappedDrafts.filter((item) => item !== undefined)
        console.info(`${drafts.value.length} drafts are found.`)
      }
    } catch (error) {
      console.error('Failed to get all drafts:', error)
    }
  }
  return {
    plans,
    drafts,
    getAllPlans,
    getIncompletePlans,
    getPlansByOrder,
    getAllPostByUser,
    createNewPost,
    updatePost,
    toggleComplete,
    deletePost,
    clearPlanData,
    getDraft,
    deleteDraft,
  }
})
