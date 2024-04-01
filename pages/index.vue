<script setup lang="ts">
import { MclInputText } from '@bobbykim/mcl-forms'
import { Modal } from '@bobbykim/manguito-theme'
import PlanInputForm from '@/components/plans/PlanInputForm.vue'
import type { PlanFormInput } from '@/types'
import { useUserStore, useProfileStore } from '@/stores'
import UtilityBlock from '@/components/plans/UtilityBlock.vue'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const profileStore = useProfileStore()
const { isAuthenticated } = storeToRefs(userStore)
const { userProfile } = storeToRefs(profileStore)
const searchTerm = ref<string>('')
const modalRef = ref<InstanceType<typeof Modal>>()

const userProfileStatus = computed<boolean>(() => {
  if (isAuthenticated && userProfile !== null) {
    return true
  }
  return false
})
const handleShowAllClick = (e: Event) => {
  e.preventDefault()
  console.log('show all')
}
const handleShowIncompleteClick = (e: Event) => {
  e.preventDefault()
  console.log('show incomplete')
}
const handleShowCustomClick = (e: Event) => {
  e.preventDefault()
  console.log('show-custom')
}
const openModal = () => {
  modalRef.value!.open()
}
const updateSearchTerm = (text: string) => {
  searchTerm.value = text
}

const handleNewFormSubmit = (e: Event, item: PlanFormInput) => {
  e.preventDefault()
  console.log(item)
}
</script>

<template>
  <section class="container py-md lg:py-lg">
    <div class="grid md:grid-cols-2 gap-sm grid-flow-row">
      <div class="px-xs md:px-0">
        <!-- input form desktop -->
        <div class="bg-dark-3 rounded-md p-md drop-shadow-md hidden md:block">
          <h3 class="h3-md text-warning mb-xs">Create New Plan</h3>
          <PlanInputForm
            prefix="desktop-new"
            @form-submit="handleNewFormSubmit"
          ></PlanInputForm>
        </div>
        <!-- utility block -->
        <UtilityBlock
          :hasProfile="userProfileStatus"
          @new-post="openModal"
          @show-all="handleShowAllClick"
          @show-incomplete="handleShowIncompleteClick"
          @show-custom="handleShowCustomClick"
          @search-update="updateSearchTerm"
        ></UtilityBlock>
      </div>
      <div>Search term: {{ searchTerm }}</div>
    </div>
    <Modal
      ref="modalRef"
      placement="center"
      color="dark-3"
      title="New Plan"
      class-name="px-xs rounded-md"
    >
      <template #header="{ close }">
        <div class="flex justify-between py-xs border-b-2">
          <h3 class="h3-md text-warning">Create New Plan</h3>
          <button @click="close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="1em"
              viewBox="0 0 384 512"
              class="fill-light-2 hover:fill-light-1 focus:fill-light-1 transition-colors duration-300 ease-linear h-sm"
            >
              <!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
              <path
                d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
              />
            </svg>
          </button>
        </div>
      </template>
      <template #body>
        <div class="py-md">
          <PlanInputForm
            prefix="mobile-new"
            @form-submit="handleNewFormSubmit"
          ></PlanInputForm>
        </div>
      </template>
    </Modal>
  </section>
</template>

<style scoped></style>
