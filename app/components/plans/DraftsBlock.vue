<script setup lang="ts">
import type { DraftFormInput, PlanFormInput } from '#shared/types'

const props = defineProps<{
  visible: boolean
  drafts: DraftFormInput[]
}>()

const emit = defineEmits<{
  (e: 'draft-click', id: string, data: PlanFormInput): void
}>()

const handleButtonClick = (id: string, data: PlanFormInput) => {
  emit('draft-click', id, data)
}
</script>

<template>
  <div
    v-if="visible"
    class="bg-light-2 dark:bg-dark-3 rounded-md p-sm md:p-md drop-shadow-md md:mt-md md:mb-0 mb-xs"
  >
    <p class="font-bold mb-xs dark:text-light-3 text-dark-3 tracking-wide">
      You have {{ drafts.length }} drafts saved.
    </p>
    <div class="flex gap-3">
      <button
        :class="[
          draft.id === 'new'
            ? 'btn-warning'
            : 'btn-dark-1 text-light-1 dark:text-dark-3 dark:btn-light-3',
          'btn btn-no-ring flex gap-2 items-center justify-center',
        ]"
        v-for="draft in drafts"
        :key="draft.id"
        @click="handleButtonClick(draft.id, draft.data)"
      >
        <svg
          v-if="draft.id === 'new'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          fill="currentColor"
          class="h-xs aspect-square"
        >
          <!-- !Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
          <path
            d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          fill="currentColor"
          class="h-xs aspect-square"
        >
          <!-- !Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
          <path
            d="M505 122.9L517.1 135C526.5 144.4 526.5 159.6 517.1 168.9L488 198.1L441.9 152L471 122.9C480.4 113.5 495.6 113.5 504.9 122.9zM273.8 320.2L408 185.9L454.1 232L319.8 366.2C316.9 369.1 313.3 371.2 309.4 372.3L250.9 389L267.6 330.5C268.7 326.6 270.8 323 273.7 320.1zM437.1 89L239.8 286.2C231.1 294.9 224.8 305.6 221.5 317.3L192.9 417.3C190.5 425.7 192.8 434.7 199 440.9C205.2 447.1 214.2 449.4 222.6 447L322.6 418.4C334.4 415 345.1 408.7 353.7 400.1L551 202.9C579.1 174.8 579.1 129.2 551 101.1L538.9 89C510.8 60.9 465.2 60.9 437.1 89zM152 128C103.4 128 64 167.4 64 216L64 488C64 536.6 103.4 576 152 576L424 576C472.6 576 512 536.6 512 488L512 376C512 362.7 501.3 352 488 352C474.7 352 464 362.7 464 376L464 488C464 510.1 446.1 528 424 528L152 528C129.9 528 112 510.1 112 488L112 216C112 193.9 129.9 176 152 176L264 176C277.3 176 288 165.3 288 152C288 138.7 277.3 128 264 128L152 128z"
          />
        </svg>
        <span>
          {{ draft.id === 'new' ? 'New' : 'Edit' }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
