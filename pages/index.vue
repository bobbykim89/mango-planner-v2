<script setup lang="ts">
import { MclInputText } from '@bobbykim/mcl-forms'
import PlanInputForm from '@/components/plans/PlanInputForm.vue'
import type { PlanFormInput } from '@/types'

const searchTerm = ref<string>('')

const handleNewFormSubmit = (e: Event, item: PlanFormInput) => {
  e.preventDefault()
  console.log(item)
}
</script>

<template>
  <section class="container py-md lg:py-lg">
    <div class="grid md:grid-cols-2 gap-sm grid-flow-row">
      <div>
        <!-- input form desktop -->
        <div class="bg-dark-3 rounded-md p-md drop-shadow-md hidden md:block">
          <PlanInputForm @form-submit="handleNewFormSubmit"></PlanInputForm>
        </div>
        <!-- utility block -->
        <div class="bg-dark-3 rounded-md p-md drop-shadow-md md:mt-md">
          <div class="flex gap-2xs">
            <label
              for="search-bar"
              class="mb-0 bg-warning p-2xs text-light-1 h-full rounded-l-md"
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
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
