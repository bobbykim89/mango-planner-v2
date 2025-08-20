<script setup lang="ts">
import { PlanDto } from '#shared/types'
import { Collapse, vCollapse } from '@bobbykim/manguito-theme'

const props = withDefaults(
  defineProps<{
    item: PlanDto
    visible?: boolean
    showHandle?: boolean
  }>(),
  {
    visible: false,
    showHandle: false,
  }
)

const emit = defineEmits<{
  (e: 'toggle-complete', event: Event, id: string, complete: boolean): void
  (e: 'edit', event: Event, item: PlanDto): void
  (e: 'delete', event: Event, id: string): void
}>()

const collapseState = ref<boolean>(props.visible)

const toggleCollapse = (visible: boolean) => {
  collapseState.value = visible
  // collapseRef.value?.toggle()
}

const getBorderColor = computed<string>(() => {
  const { complete } = props.item

  return complete ? 'border-success' : 'border-danger'
})
const getCheckColor = computed(() => {
  const { complete } = props.item
  return complete ? 'text-success' : 'text-danger'
})
const getBgColor = computed<string>(() => {
  const { type } = props.item
  if (type === 'work') {
    return 'bg-info/60 dark:bg-info'
  }
  if (type === 'chore') {
    return 'bg-primary/60 dark:bg-primary'
  }
  return 'bg-light-3 dark:bg-dark-3'
})
const getContentBgColor = computed<string>(() => {
  const { type } = props.item
  if (type === 'work') {
    return 'bg-info/25 dark:bg-info/50'
  }
  if (type === 'chore') {
    return 'bg-primary/25 dark:bg-primary/50'
  }
  return 'bg-light-3/25 dark:bg-dark-3/50'
})

const handleToggleCompleteClick = (e: Event) => {
  const { _id, complete } = props.item
  emit('toggle-complete', e, _id.toString(), complete)
}
const handleEditClick = (e: Event) => {
  const { item } = props
  emit('edit', e, item)
}
const handleDeleteClick = (e: Event) => {
  const { _id } = props.item
  emit('delete', e, _id.toString())
}

watch(
  () => props.visible,
  (newValue) => {
    collapseState.value = newValue
  }
)
</script>

<template>
  <div
    class="rounded-md overflow-hidden w-full border-l-4 drop-shadow-md"
    :class="getBorderColor"
  >
    <div
      class="py-xs pl-sm pr-xs cursor-pointer select-none"
      :class="getBgColor"
      v-collapse:[item._id.toString()]
    >
      <div class="flex justify-between items-center">
        <div class="flex gap-4 items-center">
          <svg
            v-if="showHandle"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            fill="currentColor"
            class="min-w-xs h-xs text-dark-3/80 dark:text-light-3/80 handle"
          >
            <!-- !Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
            <path
              d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"
            />
          </svg>
          <h3 class="h3-md text-dark-3 dark:text-light-3">
            {{ item.title }}
          </h3>
        </div>
        <div @click.stop class="cursor-default">
          <!-- toggle button -->
          <button
            class="flex items-center p-3xs hover:opacity-60 focus:opacity-60 transition-opacity duration-300 ease-linear"
            :class="getCheckColor"
            @click="handleToggleCompleteClick"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
              class="h-md"
            >
              <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
              <path
                d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <Collapse
      :id="item._id.toString()"
      @open="toggleCollapse"
      @close="toggleCollapse"
      :class-name="getContentBgColor"
      accordion="plans-accordion"
    >
      <div class="py-xs">
        <div class="flex gap-2xs">
          <div
            class="w-full pl-xs pr-2xs whitespace-pre-line text-dark-3 dark:text-light-3"
            v-html="item.content"
          ></div>
          <div
            class="px-xs border-l-2 border-dark-1 dark:border-light-3 flex flex-col items-center gap-2xs text-dark-1 dark:text-light-3"
          >
            <!-- edit button -->
            <button
              class="p-3xs hover:opacity-60 focus:opacity-60 transition-opacity duration-300 ease-linear"
              @click="handleEditClick"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                fill="currentColor"
                class="h-sm"
              >
                <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <!-- <path
                  d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"
                /> -->
                <path
                  d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"
                />
              </svg>
            </button>
            <!-- delete button -->
            <button
              class="p-3xs hover:opacity-60 focus:opacity-60 transition-opacity duration-300 ease-linear"
              @click="handleDeleteClick"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                fill="currentColor"
                class="h-sm"
              >
                <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <path
                  d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Collapse>
    <div
      class="py-1.5 px-sm cursor-pointer transition-all duration-500 flex justify-center items-center text-dark-3 dark:text-light-3"
      :class="[getBgColor]"
      v-collapse:[item._id.toString()]
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        fill="currentColor"
        class="h-xs"
        :class="[
          !collapseState ? 'rotate-0' : 'rotate-180',
          'transition-transform duration-300 ease-in',
        ]"
      >
        <!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
        <path
          d="M224 416c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L224 338.8l169.4-169.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-192 192C240.4 412.9 232.2 416 224 416z"
        />
      </svg>
    </div>
  </div>
</template>
