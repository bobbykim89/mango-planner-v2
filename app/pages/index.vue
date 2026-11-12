<script setup lang="ts">
import type {
  PlanDto,
  PlanFormInput,
  TypeInputLiteralType,
} from '#shared/types'
import DraftsBlock from '@/components/plans/DraftsBlock.vue'
import MobileUtilityBlock from '@/components/plans/MobileUtilityBlock.vue'
import MobileUtilityToggleButton from '@/components/plans/MobileUtilityToggleButton.vue'
import NavigateToInfo from '@/components/plans/NavigateToInfo.vue'
import PlanCollapsable from '@/components/plans/PlanCollapsable.vue'
import PlanInputForm from '@/components/plans/PlanInputForm.vue'
import UtilityBlock from '@/components/plans/UtilityBlock.vue'
import {
  useInitPiniaStore,
  usePlanStore,
  useProfileStore,
  useUserStore,
} from '@/stores'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { AccordionGroup, Modal } from '@bobbykim/manguito-theme'
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import draggable from 'vuedraggable'

const url = useRequestURL()

definePageMeta({
  middleware: ['auth-route'],
})

useHead({
  title: 'Main | Mango Planner',
  meta: [
    { property: 'og:title', content: 'Main | Mango Planner' },
    { property: 'og:url', content: url.href },
    { property: 'twitter:domain', content: url.host },
    { property: 'twitter:url', content: url.href },
    {
      name: 'twitter:title',
      content: 'Main | Mango Planner',
    },
  ],
})

type PlanDisplayStyle = 'all' | 'incomplete' | 'custom' | 'search'
type ModalFormType = 'new' | 'update' | 'draft'

const userStore = useUserStore()
const profileStore = useProfileStore()
const planStore = usePlanStore()
const initPiniaStore = useInitPiniaStore()
const { isAuthenticated } = storeToRefs(userStore)
const { userProfile, darkMode } = storeToRefs(profileStore)
const { mounted } = storeToRefs(initPiniaStore)
const { drafts } = storeToRefs(planStore)
const searchTerm = ref<string>('')
const modalRef = ref<InstanceType<typeof Modal>>()
const modalForm = ref<ModalFormType>('new')
const mobileUtilityToggle = ref<boolean>(false)
const displayStyle = ref<PlanDisplayStyle>('all')
const updateDataForm = reactive<PlanFormInput>({
  title: '',
  content: '',
  type: 'personal',
})
const selectedDraft = ref<string>('')
const draftDataForm = reactive<PlanFormInput>({
  title: '',
  content: '',
  type: 'personal',
})
const customOrderData = ref<PlanDto[]>([])
const selectedPost = ref<string>('')
const isSavingOrder = ref<boolean>(false)
const { polite: announce } = useAnnouncer()

const userProfileStatus = computed<boolean>(() => {
  if (isAuthenticated && userProfile.value !== null) {
    return true
  }
  return false
})

const handleBgColors = computed<ColorPalette>(() => {
  return darkMode.value ? 'dark-3' : 'light-3'
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
// set when the modal is opened from the mobile tools block, which hides itself first;
// focus then returns to the (still visible) tools toggle instead of a hidden button
const returnFocusToToggle = ref<boolean>(false)
const openModal = () => {
  modalForm.value = 'new'
  returnFocusToToggle.value = mobileUtilityToggle.value
  mobileUtilityToggle.value = false
  modalRef.value!.open()
}
// set after saving an edit: the edited card may re-render collapsed, hiding the Edit
// button the dialog would return focus to, so fall back to the plan's title button
const focusPlanAfterClose = ref<string>('')
const onModalClose = async () => {
  onClear()
  if (!import.meta.client) return
  if (returnFocusToToggle.value) {
    returnFocusToToggle.value = false
    await nextTick()
    document
      .querySelector<HTMLElement>('[aria-controls="mobile-utility"]')
      ?.focus()
    return
  }
  const planId = focusPlanAfterClose.value
  if (planId) {
    focusPlanAfterClose.value = ''
    // let the dialog finish restoring focus first, then repair it only if it was lost
    window.setTimeout(() => {
      const active = document.activeElement as HTMLElement | null
      // getClientRects: works for fixed elements and in Safari < 17.4 (no checkVisibility)
      if (active && active !== document.body && active.getClientRects().length)
        return
      document
        .querySelector<HTMLElement>(`[data-plan-toggle="${planId}"]`)
        ?.focus()
    }, 400)
  }
}
const onClear = () => {
  selectedPost.value = ''
  updateDataForm.title = ''
  updateDataForm.content = ''
  updateDataForm.type = 'personal'
  selectedDraft.value = ''
  draftDataForm.title = ''
  draftDataForm.content = ''
  draftDataForm.type = 'personal'
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
  complete: boolean,
) => {
  await planStore.toggleComplete({ id, body: { complete: !complete } })
  customOrderData.value = planStore.getPlansByOrder
  onClear()
}
const handleCollapseEdit = (e: Event, item: PlanDto) => {
  e.preventDefault()
  modalForm.value = 'update'
  selectedPost.value = item._id!.toString()
  updateDataForm.title = item.title
  updateDataForm.type = item.type as TypeInputLiteralType
  if (item.content) {
    updateDataForm.content = item.content
  }
  modalRef.value?.open()
}
const onEditSubmit = async (e: Event, data: PlanFormInput) => {
  e.preventDefault()
  if (
    import.meta.client &&
    window.confirm('Please confirm to update this item.')
  ) {
    await planStore.updatePost({ id: selectedPost.value, body: data })
  }
  focusPlanAfterClose.value = selectedPost.value
  onClear()
  modalRef.value?.close()
}
const onDraftEditClick = (id: string, data: PlanFormInput) => {
  modalForm.value = 'draft'

  selectedDraft.value = id
  draftDataForm.title = data.title
  draftDataForm.type = data.type
  if (data.content) {
    draftDataForm.content = data.content
  }

  modalRef.value?.open()
}
const onDraftSave = async (e: Event, data: PlanFormInput) => {
  e.preventDefault()
  if (
    import.meta.client &&
    window.confirm('Please confirm to update this item.')
  ) {
    if (selectedDraft.value === 'new') {
      await planStore.createNewPost(data)
      customOrderData.value = planStore.getPlansByOrder
    } else {
      await planStore.updatePost({
        id: selectedDraft.value,
        body: data,
      })
    }
    await planStore.deleteDraft(selectedDraft.value)
    onClear()

    modalRef.value?.close()
  }
}
// ids of the visible plans just before and after `id`, in on-screen order
const neighbourIds = (id: string): { next?: string; prev?: string } => {
  const ids = Array.from(
    document.querySelectorAll<HTMLElement>('[data-plan-toggle]'),
  )
    .filter((el) => el.offsetParent !== null)
    .map((el) => el.dataset.planToggle ?? '')
  const i = ids.indexOf(id)
  return { next: ids[i + 1], prev: ids[i - 1] }
}
const handleCollapseDelete = async (e: Event, id: string) => {
  e.preventDefault()
  if (
    import.meta.client &&
    window.confirm('Permanently deleting this item. Please confirm to proceed.')
  ) {
    const { next, prev } = neighbourIds(id)
    await planStore.deletePost(id)
    customOrderData.value = planStore.getPlansByOrder
    // keep keyboard focus on the list instead of losing it with the removed card
    await nextTick()
    const target =
      [next, prev]
        .map((pid) =>
          pid
            ? document.querySelector<HTMLElement>(`[data-plan-toggle="${pid}"]`)
            : null,
        )
        .find((el) => el && el.offsetParent !== null) ??
      document.querySelector<HTMLElement>('#plans-heading')
    target?.focus()
    return
  }
  customOrderData.value = planStore.getPlansByOrder
}
const onOrderUpdate = async () => {
  isSavingOrder.value = true
  try {
    const itemsOrder: string[] = customOrderData.value.map((item) => {
      return item._id!.toString()
    })
    await profileStore.updateUserPlansOrder({ plansOrder: itemsOrder })
    await profileStore.getCurrentUserProfile()
    customOrderData.value = planStore.getPlansByOrder
  } finally {
    isSavingOrder.value = false
  }
}
// keyboard / tap reordering from the drag handle's Move menu
const movePlan = async (id: string, target: MoveTarget) => {
  if (isSavingOrder.value) return
  const from = customOrderData.value.findIndex(
    (item) => item._id!.toString() === id,
  )
  if (from === -1) return
  const next = reorderPlans(customOrderData.value, from, target)
  const newIndex = next.findIndex((item) => item._id!.toString() === id)
  if (newIndex === from) return
  const title = customOrderData.value[from]!.title
  const focusHandle = async () => {
    if (!import.meta.client) return
    await nextTick()
    document.querySelector<HTMLElement>(`[data-move-handle="${id}"]`)?.focus()
  }
  customOrderData.value = next
  // moving the DOM node blurs it, so refocus the handle before and after saving
  await focusHandle()
  await onOrderUpdate()
  // the store reports a failed save with an alert and the order reverts; only
  // announce success when the plan really is in its new place
  const savedIndex = customOrderData.value.findIndex(
    (item) => item._id!.toString() === id,
  )
  if (savedIndex === newIndex) {
    announce(`"${title}" moved to position ${newIndex + 1} of ${next.length}`)
  }
  await focusHandle()
}
const onMobileUtilityToggle = (open: boolean) => {
  mobileUtilityToggle.value = !open
}
const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const getPlans = computed(() => {
  if (displayStyle.value === 'search') {
    return planStore.getAllPlans.filter((item) => {
      const search = new RegExp(escapeRegExp(searchTerm.value), 'gi')
      return item.title.match(search) || item.content?.match(search)
    })
  }
  if (displayStyle.value === 'incomplete') {
    return planStore.getIncompletePlans
  }
  return planStore.getAllPlans
})
// announce how many plans are shown after search/filter changes (debounced for typing)
const announceCount = useDebounceFn(() => {
  const n =
    displayStyle.value === 'custom'
      ? customOrderData.value.length
      : getPlans.value.length
  announce(`${n} ${n === 1 ? 'plan' : 'plans'} shown`)
}, 500)
watch([displayStyle, searchTerm], () => {
  announceCount()
})
</script>

<template>
  <section class="container py-md lg:py-lg min-h-[75vh]">
    <h1 id="plans-heading" tabindex="-1" class="sr-only">My plans</h1>
    <div
      v-if="mounted"
      class="grid md:grid-cols-2 gap-xs md:gap-md grid-flow-row px-sm md:px-xs relative"
    >
      <!-- mobile utility block -->
      <MobileUtilityToggleButton
        :open="mobileUtilityToggle"
        @toggle="onMobileUtilityToggle"
      ></MobileUtilityToggleButton>
      <Transition name="mobile-utility">
        <MobileUtilityBlock
          v-show="mobileUtilityToggle"
          :hasProfile="userProfileStatus"
          :active="displayStyle"
          @new-post="openModal"
          @show-all="handleShowAllClick"
          @show-incomplete="handleShowIncompleteClick"
          @show-custom="handleShowCustomClick"
          @search-update="updateSearchTerm"
        ></MobileUtilityBlock>
      </Transition>
      <!-- left column -->
      <div>
        <!-- input form desktop -->
        <div
          class="hidden md:block bg-light-2 dark:bg-dark-3 rounded-md p-md drop-shadow-md"
        >
          <h2 class="h3-md text-warning mb-xs">Create New Plan</h2>
          <PlanInputForm
            prefix="desktop-new"
            @form-submit="handleNewFormSubmit"
          ></PlanInputForm>
        </div>
        <!-- utility block -->
        <UtilityBlock
          :hasProfile="userProfileStatus"
          :active="displayStyle"
          @show-all="handleShowAllClick"
          @show-incomplete="handleShowIncompleteClick"
          @show-custom="handleShowCustomClick"
          @search-update="updateSearchTerm"
        ></UtilityBlock>

        <!-- draft block (desktop) -->
        <DraftsBlock
          :visible="drafts.length !== 0"
          :drafts="drafts"
          @draft-click="onDraftEditClick"
        ></DraftsBlock>

        <div class="flex justify-end">
          <!-- mobile new button -->
          <button
            class="btn btn-warning text-dark-3 md:hidden! px-md"
            aria-label="new"
            title="new"
            @click="openModal"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
              class="h-sm mx-auto"
            >
              <!-- Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
              License - https://fontawesome.com/license/free Copyright 2024
              Fonticons, Inc. -->
              <path
                d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
              />
            </svg>
          </button>
        </div>
      </div>
      <!-- right column -->
      <div>
        <NavigateToInfo
          v-if="planStore.getAllPlans.length === 0"
        ></NavigateToInfo>
        <AccordionGroup>
          <Transition name="fade" mode="out-in">
            <div v-if="displayStyle === 'custom'">
              <draggable
                v-model="customOrderData"
                item-key="_id"
                handle=".handle"
                :fallback-tolerance="5"
                :disabled="isSavingOrder"
                @change="onOrderUpdate"
              >
                <template #item="{ element, index }">
                  <PlanCollapsable
                    :item="element"
                    :show-handle="true"
                    :index="index"
                    :total="customOrderData.length"
                    :move-disabled="isSavingOrder"
                    @move="movePlan"
                    :key="element._id.toString()"
                    @toggle-complete="handleCollapseToggle"
                    @edit="handleCollapseEdit"
                    @delete="handleCollapseDelete"
                    class="mb-sm last:mb-0"
                  ></PlanCollapsable>
                </template>
              </draggable>
            </div>
            <div v-else-if="displayStyle === 'incomplete'">
              <PlanCollapsable
                v-for="item in getPlans"
                :item="item"
                :key="item._id!.toString()"
                @toggle-complete="handleCollapseToggle"
                @edit="handleCollapseEdit"
                @delete="handleCollapseDelete"
                class="mb-sm last:mb-0"
              ></PlanCollapsable>
            </div>
            <div v-else>
              <PlanCollapsable
                v-for="item in getPlans"
                :item="item"
                :key="item._id!.toString()"
                @toggle-complete="handleCollapseToggle"
                @edit="handleCollapseEdit"
                @delete="handleCollapseDelete"
                class="mb-sm last:mb-0"
              ></PlanCollapsable>
            </div>
          </Transition>
        </AccordionGroup>
      </div>
    </div>
    <div v-else role="status" class="min-h-[60vh] flex items-center">
      <span class="sr-only">Loading plans</span>
      <div
        class="loader border-light-3 dark:border-light-4 border-t-warning dark:border-t-warning border-20 rounded-full w-50 h-50 mx-auto"
      ></div>
    </div>
    <Modal
      ref="modalRef"
      placement="center"
      :color="handleBgColors"
      custom-class="px-xs rounded-md border dark:border-dark-1"
      width="large"
      @close="onModalClose"
    >
      <template #header="{ close, titleId }">
        <div
          class="flex justify-between py-xs border-b-2 border-b-light-1 dark:border-b-dark-1"
        >
          <h2 :id="titleId" class="h3-md text-warning">
            <span v-if="modalForm === 'new'">Create New Plan</span>
            <span v-else-if="modalForm === 'update'">Update Plan</span>
            <span v-else>Saved Draft</span>
          </h2>
          <button @click="(onClear(), close())" aria-label="close modal">
            <svg
              aria-hidden="true"
              focusable="false"
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
            v-else-if="modalForm === 'update'"
            prefix="update"
            :post-input="updateDataForm"
            submit-text="Update"
            @form-submit="onEditSubmit"
          ></PlanInputForm>
          <PlanInputForm
            v-else
            prefix="draft"
            :post-input="draftDataForm"
            submit-text="Save"
            @form-submit="onDraftSave"
          ></PlanInputForm>
        </div>
      </template>
    </Modal>
  </section>
</template>

<style scoped>
/* plan items transition animation */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-10%);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(10%);
}
/* mobileUtility block transition animation */
.mobile-utility-enter-active,
.mobile-utility-leave-active {
  transition: transform 0.3s ease;
}
.mobile-utility-enter-from,
.mobile-utility-leave-to {
  transform: translateX(-100%);
}

/* spinner animation */
.loader {
  animation: spinner 2s linear infinite;
}
/* reduced motion: no sliding, slower spinner */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    transform: none;
  }
  .mobile-utility-enter-active,
  .mobile-utility-leave-active {
    transition: none;
  }
  .loader {
    animation-duration: 6s;
  }
}
@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
