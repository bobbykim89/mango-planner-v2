import type { DraftFormInput, PlanDto, PlanInput } from '#shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const usePlanStore = defineStore('plan', () => {
  const run = useStoreAction()
  const api = useApi()
  const draftStorage = useDrafts()
  // state
  const plans = ref<PlanDto[]>([])
  const drafts = ref<DraftFormInput[]>([])
  // getters
  /** Incomplete plans first, then completed ones, each in list order. */
  const getAllPlans = computed<PlanDto[]>(() => [
    ...plans.value.filter((plan) => !plan.complete),
    ...plans.value.filter((plan) => plan.complete),
  ])
  const getIncompletePlans = computed<PlanDto[]>(() =>
    plans.value.filter((plan) => plan.complete === false),
  )
  // The API lists plans by last update, newest first; keep that order locally
  // by moving a changed plan to the front.
  const putFirst = (plan: PlanDto) => {
    const id = plan._id.toString()
    plans.value = [plan, ...plans.value.filter((p) => p._id.toString() !== id)]
  }
  /** Keeps unsaved input in the browser and shows it in the drafts list at once. */
  const saveDraft = async (key: string, data: PlanInput) => {
    await draftStorage.save(key, data)
    if (!import.meta.client) return
    const draft = { id: key, data: data as DraftFormInput['data'] }
    drafts.value = [draft, ...drafts.value.filter((d) => d.id !== key)]
  }
  const isUnrecoverable = (err: unknown) =>
    err instanceof ApiClientError &&
    (err.code === 'PLAN_NOT_FOUND' || err.code === 'FORBIDDEN')
  // actions
  const fetchPlans = () =>
    run(async () => {
      plans.value = await api<PlanDto[]>('/api/plan')
    })
  /** Resolves to the created plan, or null when it failed (the input is kept as a draft). */
  const createPlan = async (formInput: PlanInput): Promise<PlanDto | null> => {
    // copy first: PlanInputForm clears the object it emitted right after emitting
    const input = { ...formInput }
    let created: PlanDto | null = null
    await run(
      async () => {
        created = await api<PlanDto>('/api/plan', { method: 'POST', body: input })
        plans.value = [created, ...plans.value]
      },
      {
        success: 'Successfully created new plan!',
        onError: () => saveDraft('new', input),
      },
    )
    return created
  }
  const updatePlan = (payload: { id: string; body: PlanInput }) => {
    // copy first, as in createPlan
    const { id } = payload
    const body = { ...payload.body }
    return run(
      async () => {
        putFirst(
          await api<PlanDto>(`/api/plan/${id}`, { method: 'PUT', body }),
        )
      },
      {
        success: 'Successfully updated plan!',
        // keep the input as a draft, unless the plan is gone or not this user's:
        // that save can never succeed, so a draft would be stuck in the list
        onError: (err) =>
          isUnrecoverable(err) ? deleteDraft(id) : saveDraft(id, body),
      },
    )
  }
  const togglePlanComplete = (payload: { id: string; body: PlanInput }) =>
    run(
      async () => {
        const plan = await api<PlanDto>(`/api/plan/${payload.id}/toggle`, {
          method: 'PUT',
          body: payload.body,
        })
        putFirst(plan)
        return plan
      },
      {
        success: (plan) =>
          `Successfully marked the plan ${plan.complete ? 'completed' : 'incomplete'}`,
      },
    )
  const deletePlan = (id: string) =>
    run(
      async () => {
        const res = await api<{ id: string }>(`/api/plan/${id}`, {
          method: 'DELETE',
        })
        plans.value = plans.value.filter((p) => p._id.toString() !== res.id)
        await deleteDraft(res.id)
      },
      { success: 'Successfully deleted plan!' },
    )
  const loadDrafts = async () => {
    drafts.value = await draftStorage.list()
  }
  const deleteDraft = async (key: string) => {
    await draftStorage.remove(key)
    drafts.value = drafts.value.filter((draft) => draft.id !== key)
  }
  const clear = () => {
    plans.value = []
    drafts.value = []
  }
  return {
    plans,
    drafts,
    getAllPlans,
    getIncompletePlans,
    fetchPlans,
    createPlan,
    updatePlan,
    togglePlanComplete,
    deletePlan,
    loadDrafts,
    deleteDraft,
    clear,
  }
})
