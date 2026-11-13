<script setup lang="ts">
import { useProfileStore, useSessionStore, useUserStore } from '@/stores'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
import { passwordRules } from '#shared/dto/user/passwordRules'
import { storeToRefs } from 'pinia'

const url = useRequestURL()

definePageMeta({
  middleware: ['guest-route'],
})

useHead({
  title: 'Signup | Mango Planner',
  meta: [
    { property: 'og:title', content: 'Signup | Mango Planner' },
    { property: 'og:url', content: url.href },
    { property: 'twitter:domain', content: url.host },
    { property: 'twitter:url', content: url.href },
    {
      name: 'twitter:title',
      content: 'Signup | Mango Planner',
    },
  ],
})

const router = useRouter()
const userStore = useUserStore()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const { darkMode } = storeToRefs(profileStore)
const { currentUser } = storeToRefs(userStore)
const signUpCred = reactive<{
  userName: string
  email: string
  password: string
}>({
  userName: '',
  email: '',
  password: '',
})
const { fieldErrors } = storeToRefs(userStore)
// first password rule the current input breaks (same rules as the server)
const passwordProblem = computed<string | undefined>(() =>
  signUpCred.password === ''
    ? undefined
    : passwordRules.find((rule) => !rule.test.test(signUpCred.password))
        ?.message,
)
const passwordInvalid = computed<boolean>(
  () => !!passwordProblem.value || !!fieldErrors.value.password,
)
const handleFormSubmit = async () => {
  if (passwordProblem.value) return
  const { userName, email, password } = signUpCred
  await userStore.signupNewUser({ name: userName, email, password })
  await sessionStore.init()
  if (currentUser.value !== null) {
    router.push({ path: '/' })
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
        <h1 class="h2-md text-warning text-center mb-sm">Signup</h1>
        <form @submit.prevent="handleFormSubmit">
          <MclFormGroup
            field-id="user-name"
            label="Username:"
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-xs"
          >
            <MclInputText
              id="user-name"
              type="text"
              autocomplete="username"
              placeholder="Manguito"
              highlight-color="warning"
              rounded
              required
              :invalid="!!fieldErrors.name"
              :invalid-feedback="fieldErrors.name ?? ''"
              v-model="signUpCred.userName"
            ></MclInputText>
          </MclFormGroup>
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
              :invalid="!!fieldErrors.email"
              :invalid-feedback="fieldErrors.email ?? ''"
              v-model="signUpCred.email"
            ></MclInputText>
          </MclFormGroup>
          <MclFormGroup
            field-id="password"
            label="Password:"
            help-text="Use at least 8 characters, with an uppercase and a lowercase letter, a number and a special character."
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-sm"
          >
            <MclInputText
              id="password"
              type="password"
              autocomplete="new-password"
              highlight-color="warning"
              rounded
              required
              :invalid="passwordInvalid"
              :invalid-feedback="passwordProblem ?? fieldErrors.password ?? ''"
              v-model="signUpCred.password"
            ></MclInputText>
          </MclFormGroup>
          <button type="submit" class="btn btn-warning btn-full">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>
