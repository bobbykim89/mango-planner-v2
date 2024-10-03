<script setup lang="ts">
import { useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const url = useRequestURL()

useHead({
  title: 'Info | Mango Planner',
  meta: [
    { property: 'og:title', content: 'Info | Mango Planner' },
    { property: 'og:url', content: url.href },
    { property: 'twitter:domain', content: url.host },
    { property: 'twitter:url', content: url.href },
    {
      name: 'twitter:title',
      content: 'Info | Mango Planner',
    },
  ],
})

const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)
</script>

<template>
  <div class="container py-md lg:py-lg min-h-[75vh] px-sm md:px-xs">
    <div class="rounded-md px-sm md:px-md py-lg bg-light-3 dark:bg-dark-3">
      <h2 class="h2-md mb-md text-dark-3 dark:text-light-3">Info Page</h2>
      <div class="mb-md">
        <p class="text-dark-3 dark:text-light-3">
          Here are simple explanation of what each buttons are for:
        </p>
      </div>
      <ul class="mb-md">
        <li>
          <!-- new button -->
          <div class="flex items-center gap-sm md:gap-md mb-sm">
            <button class="btn btn-warning text-dark-3 px-xs min-w-[60px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                fill="currentColor"
                class="h-sm mx-auto"
              >
                <!-- Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
              License - https://fontawesome.com/license/free Copyright 2024
              Fonticons, Inc. -->
                <path
                  d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
                />
              </svg>
            </button>
            <p class="text-dark-3 dark:text-light-3">
              Click this button to add a new plan
            </p>
          </div>
        </li>
        <li>
          <!-- show all -->
          <div class="flex items-center gap-sm md:gap-md mb-sm">
            <button
              class="btn btn-light-4 dark:btn-light-3 text-dark-3 px-xs min-w-[60px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                fill="currentColor"
                class="h-sm mx-auto"
              >
                <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <path
                  d="M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z"
                />
              </svg>
            </button>
            <p class="text-dark-3 dark:text-light-3">
              Click this button to show all plans ordered by
              incomplete/completed plans
            </p>
          </div>
        </li>
        <li>
          <!-- show complete -->
          <div class="flex items-center gap-sm md:gap-md mb-sm">
            <button
              class="btn btn-light-4 dark:btn-light-3 text-dark-3 min-w-[60px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 512"
                fill="currentColor"
                class="h-sm mx-auto"
              >
                <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <path
                  d="M32 32C14.3 32 0 46.3 0 64S14.3 96 32 96H608c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zm0 384c-17.7 0-32 14.3-32 32s14.3 32 32 32H608c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM7 167c-9.4 9.4-9.4 24.6 0 33.9l55 55L7 311c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55L41 167c-9.4-9.4-24.6-9.4-33.9 0zM265 167c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55zM455 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"
                />
              </svg>
            </button>
            <p class="text-dark-3 dark:text-light-3">
              Click this button to show only incomplete plans plans
            </p>
          </div>
        </li>
        <li>
          <!-- show draggable -->
          <div class="flex items-center gap-sm md:gap-md mb-sm">
            <button
              class="btn btn-light-4 dark:btn-light-3 text-dark-3 min-w-[60px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                fill="currentColor"
                class="h-sm mx-auto"
              >
                <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <path
                  d="M96 80c0-26.5 21.5-48 48-48H432c26.5 0 48 21.5 48 48V384H96V80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48H64V416H512V288h16c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V336z"
                />
              </svg>
            </button>
            <p class="text-dark-3 dark:text-light-3">
              Click this button to switch to draggable mode
            </p>
          </div>
        </li>
        <li>
          <p class="text-dark-3 dark:text-light-3 mb-sm">
            Please click on your username to open sidebar containing weather
            widget, toggle darkmode and update user info.
          </p>
        </li>
        <li>
          <p class="text-dark-3 dark:text-light-3">
            <span class="font-bold">In mobile screen: </span>please click arrow
            button on lower left side of screen to toggle utility block.
          </p>
        </li>
      </ul>
      <div class="text-center">
        <NuxtLink
          :to="isAuthenticated ? '/' : '/auth/login'"
          class="btn btn-warning"
          >Go to {{ isAuthenticated ? 'Main' : 'Login' }} page</NuxtLink
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
