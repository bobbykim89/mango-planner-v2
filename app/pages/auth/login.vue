<script setup lang="ts">
import {
  useAlertStore,
  useProfileStore,
  useSessionStore,
  useUserStore,
} from '@/stores'
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
const route = useRoute()
const userStore = useUserStore()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const { darkMode } = storeToRefs(profileStore)
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
  if (!(await userStore.login({ email, password }))) return
  await sessionStore.init()
  if (currentUser.value !== null) {
    router.push({ path: '/' })
  }
}
// sent here by an expired session (#31): explain, then drop the reason so a
// reload doesn't repeat it. In onMounted: alerts are browser-only (they set timers).
onMounted(() => {
  if (route.query.reason !== 'expired') return
  useAlertStore().setAlert(SESSION_EXPIRED_MESSAGE)
  router.replace({ query: {} })
})
const formTextColor = computed<ColorPalette>(() => {
  return darkMode.value ? 'light-3' : 'dark-3'
})
</script>

<template>
  <div class="container">
    <div class="flex min-h-[75vh] items-center justify-center">
      <div
        class="mx-xs w-full max-w-112 rounded-md bg-light-3 p-md drop-shadow-md dark:bg-dark-3"
      >
        <h1 class="h2-md mb-sm text-center text-warning">Login</h1>
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
              v-model="loginCred.email"
            ></MclInputText>
          </MclFormGroup>
          <MclFormGroup
            field-id="password"
            label="Password:"
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-sm"
          >
            <MclInputText
              id="password"
              type="password"
              autocomplete="current-password"
              highlight-color="warning"
              required
              rounded
              v-model="loginCred.password"
            ></MclInputText>
          </MclFormGroup>
          <button type="submit" class="btn btn-full btn-warning">Submit</button>
        </form>
        <p class="mt-sm text-center text-dark-3 dark:text-light-3">
          <span>Don't have account? Click</span>
          <NuxtLink
            to="/auth/signup"
            class="mcl-link mx-3xs font-bold text-warning"
            >Sign up</NuxtLink
          >
        </p>
        <p class="mt-2xs text-center text-dark-3 dark:text-light-3">
          <span>Forgot Password? Click</span>
          <NuxtLink
            to="/auth/request"
            class="mcl-link mx-3xs font-bold text-warning"
            >Here</NuxtLink
          >
        </p>
      </div>
    </div>
  </div>
</template>
