<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', open: boolean): void
}>()

const handleButtonClick = () => {
  emit('toggle', props.open)
}
</script>

<template>
  <button
    class="fixed left-0 bottom-0 md:hidden bg-light-4 dark:bg-dark-4 rounded-r-xl drop-shadow-md border-y border-r border-y-light-1 border-r-light-1 dark:border-y-dark-1 dark:border-r-dark-1 z-10 py-sm pr-2xs pl-[6px] mb-xs transition-all duration-300 text-dark-3 dark:text-light-3"
    :class="[open ? 'left-[91.666667%]' : 'left-0']"
    @click="handleButtonClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 512"
      fill="currentColor"
      class="h-xs transition-all duration-300 ease-linear hover:opacity-65"
      :class="[open ? 'rotate-180' : 'rotate-0']"
    >
      <!-- !Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
      <path
        d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
      />
    </svg>
  </button>
</template>
