<script setup lang="ts">
import { ProfileDto, UserDto } from '#shared/types'
import type { CtaTarget } from '@bobbykim/manguito-theme'
const props = defineProps<{
  loginUrl: string
  signupUrl: string
  urlTarget: CtaTarget
  auth: boolean
  username?: UserDto['name']
  profilePicture?: ProfileDto['profilePicture']
}>()
type AuthTarget = 'login' | 'signup'
const emit = defineEmits<{
  (e: 'login-click', event: Event, link: string): void
  (e: 'signup-click', event: Event, link: string): void
  (e: 'username-click', event: Event): void
}>()

const cloudinaryBaseUrl: string =
  'https://res.cloudinary.com/dwgni1x3t/image/upload/c_scale,w_400/q_auto/v1700694621/'

const handleAuthClick = (e: Event, target: AuthTarget): void => {
  e.preventDefault()
  const { loginUrl, signupUrl } = props
  if (target === 'login') {
    emit('login-click', e, loginUrl)
  } else {
    emit('signup-click', e, signupUrl)
  }
}
const handleUsernameClick = (e: Event) => {
  emit('username-click', e)
}
</script>

<template>
  <div>
    <!-- auth btns -->
    <div
      v-if="auth"
      class="flex justify-center md:justify-normal items-center md:border-l-2 border-warning px-sm hover:opacity-60 transition-opacity duration-300 ease-linear"
    >
      <button
        @click="handleUsernameClick"
        class="flex items-center gap-xs md:gap-2xs"
      >
        <div v-if="profilePicture">
          <img
            :src="cloudinaryBaseUrl + profilePicture"
            alt="profile picture"
            class="h-md rounded-full aspect-square"
          />
        </div>
        <div class="text-lg font-bold text-warning">
          <span>
            {{ username }}
          </span>
        </div>
      </button>
    </div>
    <!-- guest btns -->
    <div
      v-else
      class="flex flex-col md:flex-row justify-center md:justify-normal items-center gap-2xs md:gap-sm md:border-l-2 border-warning px-sm text-dark-3 dark:text-light-3 md:text-warning md:dark:text-warning"
    >
      <!-- login btn -->
      <a
        :href="loginUrl"
        :target="urlTarget"
        @click="handleAuthClick($event, 'login')"
        class="flex items-center gap-3 text-lg font-bold hover:opacity-60 transition-opacity duration-300 ease-linear"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          class="h-xs"
          fill="currentColor"
        >
          <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
          <path
            d="M217.9 105.9L340.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1L32 320c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM352 416l64 0c17.7 0 32-14.3 32-32l0-256c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c53 0 96 43 96 96l0 256c0 53-43 96-96 96l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"
          />
        </svg>
        <span>Login</span>
      </a>
      <!-- signup btn -->
      <a
        :href="signupUrl"
        :target="urlTarget"
        @click="handleAuthClick($event, 'signup')"
        class="flex items-center gap-3 text-lg font-bold hover:opacity-60 transition-opacity duration-300 ease-linear"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          class="h-xs"
          fill="currentColor"
        >
          <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
          <path
            d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"
          />
        </svg>
        <span>Signup</span></a
      >
    </div>
  </div>
</template>

<style scoped></style>
