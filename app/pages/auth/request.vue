<script setup lang="ts">
import { useRequestURL } from '#app'
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
const { userProfile } = storeToRefs(profileStore)
const emailInputRef = ref<string>('')

const handleFormSubmit = async () => {
  if (emailInputRef.value === '') return
  try {
    await $fetch('/api/token/send-token', {
      method: 'POST',
      body: { email: emailInputRef.value, url: url.origin },
    })
    alertStore.setAlert('Please check your email', 'success')
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
        <h2 class="text-warning text-center mb-sm">Request Reset</h2>
        <form @submit.prevent="handleFormSubmit">
          <MclFormGroup
            label-for="email"
            label="Email:"
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-xs"
          >
            <MclInputText
              id="email"
              type="email"
              placeholder="example@email.com"
              highlight-color="warning"
              rounded
              required
              v-model="emailInputRef"
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
