<script setup lang="ts">
import { MclInputText } from '@bobbykim/mcl-forms'

const props = defineProps<{
  hasProfile: boolean
}>()

const emit = defineEmits<{
  (e: 'show-all', event: Event): void
  (e: 'show-incomplete', event: Event): void
  (e: 'show-custom', event: Event): void
  // (e: 'new-post', event: Event): void
  (e: 'search-update', searchTerm: string): void
}>()
const searchTerm = ref<string>('')

const onShowAllClick = (e: Event) => {
  emit('show-all', e)
}
const onShowIncompleteClick = (e: Event) => {
  emit('show-incomplete', e)
}
const onShowCustomClick = (e: Event) => {
  emit('show-custom', e)
}
// const onNewPostClick = (e: Event) => {
//   emit('new-post', e)
// }
watch(
  () => searchTerm.value,
  (newValue) => {
    emit('search-update', newValue)
  }
)
</script>

<template>
  <!-- utility block -->
  <div
    class="hidden md:block bg-light-2 dark:bg-dark-3 rounded-md p-md drop-shadow-md md:mt-md"
  >
    <!-- search bar -->
    <div class="flex gap-2xs mb-2xs">
      <label
        for="search-bar"
        class="mb-0 bg-warning p-2xs text-light-1 h-full rounded-l-md"
        title="Search"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          fill="currentColor"
          class="h-sm"
        >
          <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
          <path
            d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
          />
        </svg>
      </label>
      <MclInputText
        id="search-bar"
        highlight-color="warning"
        placeholder="Search"
        class="w-full"
        v-model="searchTerm"
      ></MclInputText>
    </div>
    <!-- sort buttons -->
    <div class="btn-group w-full">
      <!-- sort list -->
      <button
        class="btn btn-light-4 dark:btn-light-3 btn-full text-dark-3"
        aria-label="all"
        title="all"
        @click="onShowAllClick"
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
      <!-- sort incomplete -->
      <button
        class="btn btn-light-4 dark:btn-light-3 btn-full text-dark-3"
        aria-label="incomplete"
        title="incomplete"
        @click="onShowIncompleteClick"
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
      <!-- sort custom: display only when user has profile -->
      <button
        class="btn btn-light-4 dark:btn-light-3 btn-full text-dark-3"
        aria-label="custom"
        title="custom"
        v-if="hasProfile"
        @click="onShowCustomClick"
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
      <!-- new -- mobile -->
      <!-- <button
        class="btn btn-warning btn-full text-dark-3 md:!hidden"
        aria-label="new"
        title="new"
        @click="onNewPostClick"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          fill="currentColor"
          class="h-sm mx-auto"
        >
          !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.
          <path
            d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
          />
        </svg>
      </button> -->
    </div>
  </div>
</template>
