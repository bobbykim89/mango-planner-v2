<script setup lang="ts">
import { useAlertStore, useProfileStore } from '@/stores'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
import type { H3Error } from 'h3'
import { storeToRefs } from 'pinia'

const url = useRequestURL()

definePageMeta({
  middleware: ['guest-route'],
})

useHead({
  title: 'Reset Password | Mango Planner',
  meta: [
    { property: 'og:title', content: 'Reset Password | Mango Planner' },
    { property: 'og:url', content: url.href },
    { property: 'twitter:domain', content: url.host },
    { property: 'twitter:url', content: url.href },
    {
      name: 'twitter:title',
      content: 'Reset Password | Mango Planner',
    },
  ],
})

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const alertStore = useAlertStore()
const { userProfile } = storeToRefs(profileStore)
const passwordInputRef = ref<string>('')

const handleFormSubmit = async () => {
  const userId = route.query.user
  const token = route.query.token
  if (!userId) return
  if (!token) return
  if (passwordInputRef.value === '') return
  try {
    await $fetch('/api/token/reset-password', {
      method: 'POST',
      body: { userId, token, password: passwordInputRef.value },
    })
    alertStore.setAlert('Successfully updated password', 'success')
    router.push({ path: '/auth/login' })
  } catch (error) {
    alertStore.setAlert((error as H3Error).statusMessage!)
  }
}
const formTextColor = computed<ColorPalette>(() => {
  if (userProfile.value !== null && userProfile.value.dark) {
    return 'light-3'
  }
  return 'dark-3'
})
</script>

<template>
  <div class="container">
    <div class="flex justify-center items-center min-h-[75vh]">
      <div
        class="bg-light-3 dark:bg-dark-3 p-md rounded-md drop-shadow-md w-full max-w-[448px] mx-xs"
      >
        <h2 class="text-warning text-center mb-sm">Reset Password</h2>
        <form @submit.prevent="handleFormSubmit">
          <MclFormGroup
            label-for="new-password"
            label="New Password:"
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-xs"
          >
            <MclInputText
              id="new-password"
              type="password"
              highlight-color="warning"
              rounded
              required
              v-model="passwordInputRef"
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$"
              invalid-feedback="Password must include one number, one uppercase and lowercase letter, one special character with at least 8 characters length."
            ></MclInputText>
          </MclFormGroup>
          <button role="button" type="submit" class="btn btn-warning btn-full">
            Submit
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
