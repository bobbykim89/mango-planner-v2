<script setup lang="ts">
import { Modal } from '@bobbykim/manguito-theme'
import PlanInputForm from '@/components/plans/PlanInputForm.vue'
import type { PlanFormInput, TypeInputLiteralType } from '@/types'
import { useUserStore, useProfileStore, usePlanStore } from '@/stores'
import UtilityBlock from '@/components/plans/UtilityBlock.vue'
import { storeToRefs } from 'pinia'
import PlanCollapsable from '@/components/plans/PlanCollapsable.vue'
import { Plan } from '@/server/models'

type PlanDisplayStyle = 'all' | 'incomplete' | 'custom'
type ModalFormType = 'new' | 'update'
const userStore = useUserStore()
const profileStore = useProfileStore()
const planStore = usePlanStore()
const { isAuthenticated } = storeToRefs(userStore)
const { userProfile } = storeToRefs(profileStore)
const { plans } = storeToRefs(planStore)
const searchTerm = ref<string>('')
const modalRef = ref<InstanceType<typeof Modal>>()
const modalForm = ref<ModalFormType>('new')
const displayStyle = ref<PlanDisplayStyle>('all')
const updateDataForm = reactive<PlanFormInput>({
  title: '',
  content: '',
  type: 'personal',
})
const selectedPost = ref<string>('')

const userProfileStatus = computed<boolean>(() => {
  if (isAuthenticated && userProfile !== null) {
    return true
  }
  return false
})
const handleShowAllClick = (e: Event) => {
  e.preventDefault()
  displayStyle.value = 'all'
  console.log('show all')
}
const handleShowIncompleteClick = (e: Event) => {
  e.preventDefault()
  displayStyle.value = 'incomplete'
  console.log('show incomplete')
}
const handleShowCustomClick = (e: Event) => {
  e.preventDefault()
  displayStyle.value = 'custom'
  console.log('show-custom')
}
const openModal = () => {
  modalForm.value = 'new'
  modalRef.value!.open()
}
const closeModal = () => {
  modalRef.value?.close()
}
const onClear = () => {
  selectedPost.value = ''
  updateDataForm.title = ''
  updateDataForm.content = ''
  updateDataForm.type = 'personal'
}
const updateSearchTerm = (text: string) => {
  searchTerm.value = text
}

const handleNewFormSubmit = async (e: Event, item: PlanFormInput) => {
  e.preventDefault()
  // console.log(item)
  console.log('from submit form', item)
  await planStore.createNewPost(item)
  modalRef.value?.close()
}
const handleCollapseToggle = async (
  e: Event,
  id: string,
  complete: boolean
) => {
  console.log(e, id, complete)
  await planStore.toggleComplete({ id, body: { complete: !complete } })
  onClear()
}
const handleCollapseEdit = (e: Event, item: InstanceType<typeof Plan>) => {
  modalForm.value = 'update'
  selectedPost.value = item._id.toString()
  updateDataForm.title = item.title
  updateDataForm.type = item.type as TypeInputLiteralType
  if (item.content) {
    updateDataForm.content = item.content
  }
  modalRef.value?.open()
}
const onEditSubmit = async (e: Event, data: PlanFormInput) => {
  console.log(selectedPost.value, data)
  await planStore.updatePost({ id: selectedPost.value, body: data })
  onClear()
  modalRef.value?.close()
}
const handleCollapseDelete = async (e: Event, id: string) => {
  console.log(e, id)
  await planStore.deletePost(id)
}
const getPlans = computed(() => {
  if (displayStyle.value === 'incomplete') {
    return planStore.getIncompletePlans
  }
  if (displayStyle.value === 'custom') {
    return planStore.getPlansByOrder
  }
  return planStore.getAllPlans
  // return plans.value
})
</script>

<template>
  <section class="container py-md lg:py-lg">
    <div
      class="grid md:grid-cols-2 gap-sm grid-flow-row"
      @keyup.esc="closeModal(), onClear()"
    >
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
      <!-- right column -->
      <div class="px-xs md:px-0">
        Search term: {{ searchTerm }} Sort logic: {{ displayStyle }}
        <div>
          <PlanCollapsable
            v-for="item in getPlans"
            :item="item"
            :key="item._id.toString()"
            @toggle-complete="handleCollapseToggle"
            @edit="handleCollapseEdit"
            @delete="handleCollapseDelete"
            class="mb-xs last:mb-0"
          ></PlanCollapsable>
        </div>
      </div>
    </div>
    <Modal
      ref="modalRef"
      placement="center"
      color="dark-3"
      title="New Plan"
      class-name="px-xs rounded-md"
      @close="onClear"
    >
      <template #header="{ close }">
        <div class="flex justify-between py-xs border-b-2">
          <h3 class="h3-md text-warning">
            <span v-if="modalForm === 'new'">Create New Plan</span>
            <span v-else>Update Plan</span>
          </h3>
          <button @click="onClear(), close()">
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
            v-if="modalForm === 'new'"
            prefix="mobile-new"
            @form-submit="handleNewFormSubmit"
          ></PlanInputForm>
          <PlanInputForm
            v-else
            prefix="update"
            :post-input="updateDataForm"
            submit-text="Update"
            @form-submit="onEditSubmit"
          ></PlanInputForm>
        </div>
      </template>
    </Modal>
  </section>
</template>

<style scoped></style>
