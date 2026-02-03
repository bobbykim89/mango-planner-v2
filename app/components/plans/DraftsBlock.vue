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
        class="btn btn-no-ring"
        :class="[
          draft.id === 'new'
            ? 'btn-warning'
            : 'btn-dark-1 text-light-1 dark:text-dark-3 dark:btn-light-3',
        ]"
        v-for="draft in drafts"
        :key="draft.id"
        @click="handleButtonClick(draft.id, draft.data)"
      >
        {{ draft.id === 'new' ? 'New' : 'Edit' }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>
