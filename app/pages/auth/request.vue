<script setup lang="ts">
import { useRequestURL } from '#app'
import { useAlertStore, useProfileStore } from '@/stores'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
import { storeToRefs } from 'pinia'

const url = useRequestURL()

definePageMeta({
  middleware: ['guest-route'],
})

useHead({
  title: 'Request Reset | Mango Planner',
  meta: [
    { property: 'og:title', content: 'Request Reset | Mango Planner' },
    { property: 'og:url', content: url.href },
    { property: 'twitter:domain', content: url.host },
    { property: 'twitter:url', content: url.href },
    {
      name: 'twitter:title',
      content: 'Request Reset | Mango Planner',
    },
  ],
})

const router = useRouter()

const profileStore = useProfileStore()
const alertStore = useAlertStore()
const { darkMode } = storeToRefs(profileStore)
const emailInputRef = ref<string>('')

const api = useApi()
const { extractErrorMessage } = useErrorCheck()
const handleFormSubmit = async () => {
  if (emailInputRef.value === '') return
  try {
    await api('/api/token/send-token', {
      method: 'POST',
      body: { email: emailInputRef.value, url: url.origin },
    })
    alertStore.setAlert('Please check your email', 'success')
    router.push({ path: '/auth/login' })
  } catch (error) {
    alertStore.setAlert(extractErrorMessage(error))
  }
}
const formTextColor = computed<ColorPalette>(() => {
  return darkMode.value ? 'light-3' : 'dark-3'
})
</script>

<template>
  <div class="container">
    <div class="flex justify-center items-center min-h-[75vh]">
      <div
        class="bg-light-3 dark:bg-dark-3 p-md rounded-md drop-shadow-md w-full max-w-112 mx-xs"
      >
        <h1 class="h2-md text-warning text-center mb-sm">Request Reset</h1>
        <form @submit.prevent="handleFormSubmit">
          <MclFormGroup
            field-id="email"
            label="Email:"
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-xs"
          >
            <MclInputText
              id="email"
              type="email"
              autocomplete="email"
              placeholder="example@email.com"
              highlight-color="warning"
              rounded
              required
              v-model="emailInputRef"
            ></MclInputText>
          </MclFormGroup>
          <button type="submit" class="btn btn-warning btn-full">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
