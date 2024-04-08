<script setup lang="ts">
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
import { useUserStore, useInitPiniaStore, useProfileStore } from '@/stores'
import { storeToRefs } from 'pinia'

definePageMeta({
  middleware: ['guest-route'],
})

useHead({
  title: 'Mango Planner | Login',
  meta: [
    { name: 'description', content: 'login page' },
    { property: 'og:title', content: 'Mango Planner | Login' },
  ],
})

const router = useRouter()
const userStore = useUserStore()
const profileStore = useProfileStore()
const initPiniaStore = useInitPiniaStore()
const { userProfile } = storeToRefs(profileStore)
const signUpCred = reactive<{
  userName: string
  email: string
  password: string
}>({
  userName: '',
  email: '',
  password: '',
})
const handleFormSubmit = async () => {
  const { userName, email, password } = signUpCred
  await userStore.signupNewUser({ name: userName, email, password })
  await initPiniaStore.initStores()
  router.push({ path: '/' })
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
        <h2 class="text-warning text-center mb-sm">Signup</h2>
        <MclFormGroup
          label-for="user-name"
          label="Username:"
          :text-color="formTextColor"
          :text-bold="true"
          class="mb-xs"
        >
          <MclInputText
            id="user-name"
            type="text"
            placeholder="Manguito"
            highlight-color="warning"
            rounded
            required
            v-model="signUpCred.userName"
          ></MclInputText>
        </MclFormGroup>
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
              v-model="signUpCred.email"
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
              rounded
              required
              v-model="signUpCred.password"
            ></MclInputText>
          </MclFormGroup>
          <button role="submit" class="btn btn-warning btn-full">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>
