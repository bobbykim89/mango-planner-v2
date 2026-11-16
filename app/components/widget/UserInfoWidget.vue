<script setup lang="ts">
import DefaultProfile from '@/assets/images/defaultProfile.webp'
import { AccordionGroup, Collapse } from '@bobbykim/manguito-theme'
import { useCollapseTrigger } from '@bobbykim/manguito-theme/composable'
import { MclFormGroup, MclInputFile, MclInputText } from '@bobbykim/mcl-forms'

defineProps<{
  username?: string
  profilePicture?: string
}>()

const emit = defineEmits<{
  (e: 'on-username-update', event: Event, name: string): void
  (e: 'on-file-upload', event: Event, file: File): void
  (e: 'on-pw-update', event: Event, currentPw: string, newPw: string): void
}>()
const usernameRef = ref<string>('')
const profilePictureRef = ref<File | undefined>(undefined)
const currentPasswordRef = ref<string>('')
const newPasswordRef = ref<string>('')
const usernameCollapseRef = ref<InstanceType<typeof Collapse>>()
const pictureCollapseRef = ref<InstanceType<typeof Collapse>>()
const passwordCollapseRef = ref<InstanceType<typeof Collapse>>()
const { attrs: usernameAttrs, toggle: toggleUsername } = useCollapseTrigger(
  usernameCollapseRef,
  { id: 'update-username' },
)
const { attrs: pictureAttrs, toggle: togglePicture } = useCollapseTrigger(
  pictureCollapseRef,
  { id: 'update-profile-picture' },
)
const { attrs: passwordAttrs, toggle: togglePassword } = useCollapseTrigger(
  passwordCollapseRef,
  { id: 'update-password' },
)

const cloudinaryBaseUrl: string =
  'https://res.cloudinary.com/dwgni1x3t/image/upload/c_scale,w_400/q_auto/v1700694621/'

const onUserNameUpdateSubmit = (e: Event) => {
  e.preventDefault()
  emit('on-username-update', e, usernameRef.value)
  usernameRef.value = ''
}
const onFileSubmit = (e: Event) => {
  e.preventDefault()
  if (profilePictureRef.value) {
    emit('on-file-upload', e, profilePictureRef.value)
  }
  profilePictureRef.value = undefined
}
const onPasswordSubmit = (e: Event) => {
  e.preventDefault()
  if (currentPasswordRef.value && currentPasswordRef.value) {
    emit('on-pw-update', e, currentPasswordRef.value, newPasswordRef.value)
  }
  currentPasswordRef.value = ''
  newPasswordRef.value = ''
}
</script>

<template>
  <div
    class="text-dark-3 md:rounded-md md:bg-light-4 md:px-2xs md:py-xs md:drop-shadow-md dark:text-light-3 md:dark:bg-dark-4"
  >
    <div class="hidden md:block">
      <h2 class="h4-md mb-xs">My Info</h2>
    </div>
    <!-- current user profile -->
    <div
      class="flex items-center justify-center gap-xs overflow-hidden rounded-t-md bg-light-3 px-2xs py-2xs drop-shadow-md md:mb-xs md:flex-col md:gap-sm md:rounded-md md:px-xs md:py-sm dark:bg-dark-3"
    >
      <img
        v-if="profilePicture !== ''"
        :src="cloudinaryBaseUrl + profilePicture"
        alt="profile picture"
        class="aspect-square h-md rounded-full object-cover object-center md:h-2xl"
      />
      <img
        v-else
        :src="DefaultProfile"
        alt="placeholder profile picture"
        class="aspect-square h-md rounded-full object-cover object-center md:h-2xl"
      />
      <p class="min-w-0 text-center font-bold wrap-anywhere">{{ username }}</p>
    </div>
    <AccordionGroup>
      <!-- username update -->
      <div class="overflow-hidden drop-shadow-md md:mb-xs md:rounded-md">
        <button
          type="button"
          v-bind="usernameAttrs"
          @click="toggleUsername"
          class="block w-full bg-light-3 px-xs py-3xs text-left transition-all duration-300 ease-linear hover:bg-light-3/60 dark:bg-dark-3 dark:hover:bg-dark-3/60"
        >
          Update Username
        </button>
        <Collapse
          ref="usernameCollapseRef"
          id="update-username"
          custom-class="bg-light-3/65 dark:bg-dark-3/65"
        >
          <div class="px-xs py-xs">
            <form @submit="onUserNameUpdateSubmit">
              <MclFormGroup field-id="user-name" class="mb-xs">
                <template #label>
                  <span
                    class="mb-2xs block text-md text-dark-3 dark:text-light-3"
                    >Username:</span
                  >
                </template>
                <MclInputText
                  id="user-name"
                  autocomplete="username"
                  rounded
                  required
                  highlight-color="warning"
                  v-model="usernameRef"
                ></MclInputText>
              </MclFormGroup>
              <div class="flex justify-end">
                <button type="submit" class="btn text-dark-3 btn-warning">
                  Save
                </button>
              </div>
            </form>
          </div>
        </Collapse>
      </div>
      <!-- profile picture update -->
      <div class="overflow-hidden drop-shadow-md md:mb-xs md:rounded-md">
        <button
          type="button"
          v-bind="pictureAttrs"
          @click="togglePicture"
          class="block w-full bg-light-3 px-xs py-3xs text-left transition-all duration-300 ease-linear hover:bg-light-3/60 dark:bg-dark-3 dark:hover:bg-dark-3/60"
        >
          Update Profile Picture
        </button>
        <Collapse
          ref="pictureCollapseRef"
          id="update-profile-picture"
          custom-class="bg-light-3/65 dark:bg-dark-3/65"
        >
          <div class="px-xs py-xs">
            <form @submit="onFileSubmit">
              <MclFormGroup field-id="profile-picture" class="mb-xs">
                <template #label>
                  <span
                    class="mb-2xs block text-md text-dark-3 dark:text-light-3"
                    >Profile picture:</span
                  >
                </template>
                <MclInputFile
                  id="profile-picture"
                  accept="image/*"
                  button-text="Browse"
                  rounded
                  required
                  highlight-color="warning"
                  v-model="profilePictureRef"
                ></MclInputFile>
              </MclFormGroup>
              <div class="flex justify-end">
                <button type="submit" class="btn text-dark-3 btn-warning">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </Collapse>
      </div>
      <!-- password update -->
      <div
        class="overflow-hidden rounded-b-md drop-shadow-md md:mb-xs md:rounded-md"
      >
        <button
          type="button"
          v-bind="passwordAttrs"
          @click="togglePassword"
          class="block w-full bg-light-3 px-xs pt-3xs pb-2xs text-left transition-all duration-300 ease-linear hover:bg-light-3/60 md:py-3xs dark:bg-dark-3 dark:hover:bg-dark-3/60"
        >
          Update Password
        </button>
        <Collapse
          ref="passwordCollapseRef"
          id="update-password"
          custom-class="bg-light-3/65 dark:bg-dark-3/65"
        >
          <div class="px-xs py-xs">
            <form @submit="onPasswordSubmit">
              <MclFormGroup field-id="current-pw" class="mb-2xs">
                <template #label>
                  <span
                    class="mb-2xs block text-md text-dark-3 dark:text-light-3"
                    >Current password:</span
                  >
                </template>
                <MclInputText
                  id="current-pw"
                  type="password"
                  autocomplete="current-password"
                  rounded
                  required
                  highlight-color="warning"
                  v-model="currentPasswordRef"
                ></MclInputText>
              </MclFormGroup>
              <MclFormGroup field-id="new-pw" class="mb-xs">
                <template #label>
                  <span
                    class="mb-2xs block text-md text-dark-3 dark:text-light-3"
                    >New password:</span
                  >
                </template>
                <MclInputText
                  id="new-pw"
                  type="password"
                  autocomplete="new-password"
                  rounded
                  required
                  highlight-color="warning"
                  v-model="newPasswordRef"
                ></MclInputText>
              </MclFormGroup>
              <div class="flex justify-end">
                <button type="submit" class="btn text-dark-3 btn-warning">
                  Save
                </button>
              </div>
            </form>
          </div>
        </Collapse>
      </div>
    </AccordionGroup>
  </div>
</template>
