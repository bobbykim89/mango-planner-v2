<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed<number>(() => props.error?.statusCode ?? 500)
const message = computed<string>(() =>
  statusCode.value === 404 ? "This page doesn't exist" : 'Something went wrong',
)

useHead({
  title: () => `${statusCode.value} | Mango Planner`,
})
</script>

<template>
  <NuxtLayout name="default">
    <section class="flex min-h-[75vh] items-center">
      <div
        class="mx-auto rounded-md bg-light-3 px-xl py-md text-center text-dark-3 drop-shadow-md dark:bg-dark-3 dark:text-light-3"
      >
        <h1 class="mb-sm text-[4rem] font-bold">{{ statusCode }}</h1>
        <p class="mb-xs text-[1.5rem]">{{ message }}</p>
        <NuxtLink
          to="/"
          class="btn text-light-3 btn-dark-3 dark:text-dark-3 dark:btn-light-3"
          >Back to main page</NuxtLink
        >
      </div>
    </section>
  </NuxtLayout>
</template>
