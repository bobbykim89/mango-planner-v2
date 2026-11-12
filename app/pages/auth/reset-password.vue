<script setup lang="ts">
import { passwordRules } from '#shared/dto/user/passwordRules'
import { useAlertStore, useProfileStore } from '@/stores'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
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
const { darkMode } = storeToRefs(profileStore)
const passwordInputRef = ref<string>('')

// first password rule the current input breaks (same rules as the server)
const passwordProblem = computed<string | undefined>(() =>
  passwordInputRef.value === ''
    ? undefined
    : passwordRules.find((rule) => !rule.test.test(passwordInputRef.value))
        ?.message,
)
// password message from the server's VALIDATION_FAILED response
const serverPasswordError = ref<string>('')
const passwordInvalid = computed<boolean>(
  () => !!passwordProblem.value || !!serverPasswordError.value,
)
const api = useApi()
const { extractErrorMessage } = useErrorCheck()
const handleFormSubmit = async () => {
  const userId = route.query.user
  const token = route.query.token
  if (!userId) return
  if (!token) return
  if (passwordInputRef.value === '' || passwordProblem.value) return
  serverPasswordError.value = ''
  try {
    await api('/api/token/reset-password', {
      method: 'POST',
      body: { userId, token, password: passwordInputRef.value },
    })
    alertStore.setAlert('Successfully updated password', 'success')
    router.push({ path: '/auth/login' })
  } catch (error) {
    serverPasswordError.value = fieldMap(error).password ?? ''
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
        <h1 class="h2-md text-warning text-center mb-sm">Reset Password</h1>
        <form @submit.prevent="handleFormSubmit">
          <MclFormGroup
            field-id="new-password"
            label="New Password:"
            help-text="Use at least 8 characters, with an uppercase and a lowercase letter, a number and a special character."
            :text-color="formTextColor"
            :text-bold="true"
            class="mb-xs"
          >
            <MclInputText
              id="new-password"
              type="password"
              autocomplete="new-password"
              highlight-color="warning"
              rounded
              required
              v-model="passwordInputRef"
              :invalid="passwordInvalid"
              :invalid-feedback="passwordProblem ?? serverPasswordError"
            ></MclInputText>
          </MclFormGroup>
          <button type="submit" class="btn btn-warning btn-full">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
