<script setup lang="ts">
import { useInitPiniaStore, useProfileStore, useUserStore } from '@/stores'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
import { storeToRefs } from 'pinia'

const url = useRequestURL()

definePageMeta({
  middleware: ['guest-route'],
})

useHead({
  title: 'Login | Mango Planner',
  meta: [
    { property: 'og:title', content: 'Login | Mango Planner' },
    { property: 'og:url', content: url.href },
    { property: 'twitter:domain', content: url.host },
    { property: 'twitter:url', content: url.href },
    {
      name: 'twitter:title',
      content: 'Login | Mango Planner',
    },
  ],
})

const router = useRouter()
const userStore = useUserStore()
const profileStore = useProfileStore()
const initPiniaStore = useInitPiniaStore()
const { userProfile } = storeToRefs(profileStore)
const { currentUser } = storeToRefs(userStore)
const loginCred = reactive<{
  email: string
  password: string
}>({
  email: '',
  password: '',
})
const handleFormSubmit = async () => {
  const { email, password } = loginCred
  await userStore.loginWithCredential({ email, password })
  await initPiniaStore.initStores()
  if (currentUser.value !== null) {
    router.push({ path: '/' })
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
        <h2 class="text-warning text-center mb-sm">Login</h2>
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
              v-model="loginCred.email"
            ></MclInputText>
          </MclFormGroup>
          <MclFormGroup
            label-for="password"
            label="Password:"
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-sm"
          >
            <MclInputText
              id="password"
              type="password"
              highlight-color="warning"
              required
              rounded
              v-model="loginCred.password"
            ></MclInputText>
          </MclFormGroup>
          <button role="button" type="submit" class="btn btn-warning btn-full">
            Submit
          </button>
        </form>
        <p class="mt-sm text-dark-3 dark:text-light-3 text-center">
          <span>Don't have account? Click</span>
          <NuxtLink
            to="/auth/signup"
            class="mx-3xs font-bold mcl-link text-warning"
            >Sign up</NuxtLink
          >
        </p>
        <p class="mt-2xs text-dark-3 dark:text-light-3 text-center">
          <span>Forgot Password? Click</span>
          <NuxtLink
            to="/auth/request"
            class="mx-3xs font-bold mcl-link text-warning"
            >Here</NuxtLink
          >
        </p>
      </div>
    </div>
  </div>
</template>
