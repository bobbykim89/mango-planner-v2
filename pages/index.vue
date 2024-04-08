<script setup lang="ts">
import { Modal } from '@bobbykim/manguito-theme'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import PlanInputForm from '@/components/plans/PlanInputForm.vue'
import type { PlanFormInput, TypeInputLiteralType } from '@/types'
import { useUserStore, useProfileStore, usePlanStore } from '@/stores'
import UtilityBlock from '@/components/plans/UtilityBlock.vue'
import { storeToRefs } from 'pinia'
import PlanCollapsable from '@/components/plans/PlanCollapsable.vue'
import { Plan } from '@/server/models'
import draggable from 'vuedraggable'

definePageMeta({
  middleware: ['auth-route'],
})

useHead({
  title: 'Mango Planner | Home',
  meta: [
    { name: 'description', content: 'Main page' },
    { property: 'og:title', content: 'Mango Planner | Home' },
  ],
})

useHead({
  title: 'Mango Planner | Login',
  meta: [
    { name: 'description', content: 'login page' },
    { property: 'og:title', content: 'Mango Planner | Login' },
  ],
})

type PlanDisplayStyle = 'all' | 'incomplete' | 'custom' | 'search'
type ModalFormType = 'new' | 'update'
const userStore = useUserStore()
const profileStore = useProfileStore()
const planStore = usePlanStore()
const { isAuthenticated } = storeToRefs(userStore)
const { userProfile } = storeToRefs(profileStore)
const searchTerm = ref<string>('')
const modalRef = ref<InstanceType<typeof Modal>>()
const confirmModal = ref<InstanceType<typeof Modal>>()
const modalForm = ref<ModalFormType>('new')
const displayStyle = ref<PlanDisplayStyle>('all')
const updateDataForm = reactive<PlanFormInput>({
  title: '',
  content: '',
  type: 'personal',
})
const customOrderData = ref<InstanceType<typeof Plan>[]>([])
const selectedPost = ref<string>('')

const userProfileStatus = computed<boolean>(() => {
  if (isAuthenticated && userProfile.value !== null) {
    return true
  }
  return false
})

const handleBgColors = computed<ColorPalette>(() => {
  if (userProfile.value !== null && userProfile.value.dark) {
    return 'dark-3'
  }
  return 'light-3'
})

const handleShowAllClick = (e: Event) => {
  e.preventDefault()
  displayStyle.value = 'all'
}
const handleShowIncompleteClick = (e: Event) => {
  e.preventDefault()
  displayStyle.value = 'incomplete'
}
const handleShowCustomClick = (e: Event) => {
  e.preventDefault()
  customOrderData.value = planStore.getPlansByOrder
  displayStyle.value = 'custom'
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
  displayStyle.value = 'search'
  searchTerm.value = text
}

const handleNewFormSubmit = async (e: Event, item: PlanFormInput) => {
  e.preventDefault()
  await planStore.createNewPost(item)
  customOrderData.value = planStore.getPlansByOrder
  modalRef.value?.close()
}
const handleCollapseToggle = async (
  e: Event,
  id: string,
  complete: boolean
) => {
  await planStore.toggleComplete({ id, body: { complete: !complete } })
  customOrderData.value = planStore.getPlansByOrder
  onClear()
}
const handleCollapseEdit = (e: Event, item: InstanceType<typeof Plan>) => {
  e.preventDefault()
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
  e.preventDefault()
  if (process.client && window.confirm('Please confirm to update this item.')) {
    await planStore.updatePost({ id: selectedPost.value, body: data })
  }
  onClear()
  modalRef.value?.close()
}
const handleCollapseDelete = async (e: Event, id: string) => {
  e.preventDefault()
  if (
    process.client &&
    window.confirm('Permanently deleting this item. Please confirm to proceed.')
  ) {
    await planStore.deletePost(id)
  }
  customOrderData.value = planStore.getPlansByOrder
}
const onOrderUpdate = async () => {
  const itemsOrder: string[] = customOrderData.value.map((item) => {
    return item._id.toString()
  })
  await profileStore.updateUserPlansOrder({ plansOrder: itemsOrder })
  await profileStore.getCurrentUserProfile()
  customOrderData.value = planStore.getPlansByOrder
}
const getPlans = computed(() => {
  if (displayStyle.value === 'search') {
    return planStore.getAllPlans.filter((item) => {
      const search = new RegExp(`${searchTerm.value}`, 'gi')
      return item.title.match(search) || item.content?.match(search)
    })
  }
  if (displayStyle.value === 'incomplete') {
    return planStore.getIncompletePlans
  }
  return planStore.getAllPlans
})
</script>

<template>
  <section class="container py-md lg:py-lg min-h-[75vh]">
    <div
      class="grid md:grid-cols-2 gap-md grid-flow-row px-xs"
      @keyup.esc="closeModal(), onClear()"
    >
      <div>
        <!-- input form desktop -->
        <div
          class="bg-light-2 dark:bg-dark-3 rounded-md p-md drop-shadow-md hidden md:block"
        >
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
      <div>
        <Transition name="fade" mode="out-in">
          <div v-if="displayStyle === 'custom'">
            <draggable
              v-model="customOrderData"
              item-key="_id"
              @change="onOrderUpdate"
            >
              <template #item="{ element }">
                <PlanCollapsable
                  :item="element"
                  :key="element._id.toString()"
                  @toggle-complete="handleCollapseToggle"
                  @edit="handleCollapseEdit"
                  @delete="handleCollapseDelete"
                  class="mb-xs last:mb-0"
                ></PlanCollapsable>
              </template>
            </draggable>
          </div>
          <div v-else-if="displayStyle === 'incomplete'">
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
          <div v-else>
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
        </Transition>
      </div>
    </div>
    <Modal
      ref="modalRef"
      placement="center"
      :color="handleBgColors"
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
              class="fill-dark-3 hover:fill-dark-1 focus:fill-dark-1 dark:fill-light-2 dark:hover:fill-light-1 dark:focus:fill-light-1 transition-colors duration-300 ease-linear h-sm"
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-10%);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(10%);
}
</style>
