import type { ProfileInputDark } from '#shared/dto/profile'
import type { ProfileDto } from '#shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  const run = useStoreAction()
  const api = useApi()
  // state
  const userProfile = ref<ProfileDto | null>(null)
  const darkMode = ref<boolean>(false)
  // getters
  const getPlansOrder = computed<string[]>(
    () => userProfile.value?.plansOrder ?? [],
  )
  // every profile route returns the profile, so state comes from the response
  const setProfile = (profile: ProfileDto | null) => {
    userProfile.value = profile
    darkMode.value = profile?.dark ?? false
  }
  // actions
  const fetchProfile = () =>
    run(async () => setProfile(await api<ProfileDto | null>('/api/profile')))
  const createProfile = () =>
    run(
      async () =>
        setProfile(await api<ProfileDto>('/api/profile', { method: 'POST' })),
      { success: 'Successfully created user profile!' },
    )
  /** Shrinks the picture in the browser, then uploads it. */
  const updateProfilePicture = (file: File) =>
    run(
      async () => {
        const form = new FormData()
        form.append('image', await prepareProfilePicture(file))
        setProfile(
          await api<ProfileDto>('/api/profile/profile-picture', {
            method: 'PUT',
            body: form,
          }),
        )
      },
      { success: 'Successfully updated profile picture!' },
    )
  const updatePlansOrder = (plansOrder: string[]) =>
    run(async () =>
      setProfile(
        await api<ProfileDto>('/api/profile/plans-order', {
          method: 'PUT',
          body: { plansOrder },
        }),
      ),
    )
  const toggleDarkMode = (payload: ProfileInputDark) =>
    run(
      async () => {
        const profile = await api<ProfileDto>('/api/profile/dark', {
          method: 'PUT',
          body: payload,
        })
        setProfile(profile)
        return profile
      },
      { success: (p) => `Darkmode ${p.dark ? 'enabled' : 'disabled'}` },
    )
  // the server adds new plans to the front of plansOrder and drops deleted ones;
  // mirror that locally instead of refetching the profile
  const addPlanToOrder = (id: string) => {
    const profile = userProfile.value
    if (!profile || profile.plansOrder.includes(id)) return
    profile.plansOrder = [id, ...profile.plansOrder]
  }
  const removePlanFromOrder = (id: string) => {
    const profile = userProfile.value
    if (!profile) return
    profile.plansOrder = profile.plansOrder.filter((planId) => planId !== id)
  }
  const clear = () => setProfile(null)
  return {
    userProfile,
    darkMode,
    getPlansOrder,
    fetchProfile,
    createProfile,
    updateProfilePicture,
    updatePlansOrder,
    toggleDarkMode,
    addPlanToOrder,
    removePlanFromOrder,
    clear,
  }
})
