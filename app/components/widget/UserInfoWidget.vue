<script setup lang="ts">
import DefaultProfile from '@/assets/images/defaultProfile.webp'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { AccordionGroup, Collapse } from '@bobbykim/manguito-theme'
import { useCollapseTrigger } from '@bobbykim/manguito-theme/composable'
import { MclFormGroup, MclInputFile, MclInputText } from '@bobbykim/mcl-forms'

const props = defineProps<{
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

const formTextColor = computed<ColorPalette>(() => {
  if (useColorMode().preference === 'light') {
    return 'dark-3'
  }
  return 'light-3'
})
</script>

<template>
  <div
    class="md:px-2xs md:py-xs md:bg-light-4 md:dark:bg-dark-4 text-dark-3 dark:text-light-3 md:rounded-md md:drop-shadow-md"
  >
    <div class="hidden md:block">
      <h2 class="h4-md mb-xs">My Info</h2>
    </div>
    <!-- current user profile -->
    <div
      class="rounded-t-md md:rounded-md drop-shadow-md overflow-hidden md:mb-xs px-2xs py-2xs md:px-xs md:py-sm bg-light-3 dark:bg-dark-3 flex md:flex-col justify-center items-center gap-xs md:gap-sm"
    >
      <img
        v-if="profilePicture !== ''"
        :src="cloudinaryBaseUrl + profilePicture"
        alt="profile picture"
        class="object-center object-cover aspect-square rounded-full h-md md:h-2xl"
      />
      <img
        v-else
        :src="DefaultProfile"
        alt="placeholder profile picture"
        class="object-center object-cover aspect-square rounded-full h-md md:h-2xl"
      />
      <p class="font-bold">{{ username }}</p>
    </div>
    <AccordionGroup>
      <!-- username update -->
      <div class="md:rounded-md drop-shadow-md overflow-hidden md:mb-xs">
        <button
          type="button"
          v-bind="usernameAttrs"
          @click="toggleUsername"
          class="block w-full py-3xs px-xs bg-light-3 dark:bg-dark-3 hover:bg-light-3/60 dark:hover:bg-dark-3/60 transition-all duration-300 ease-linear text-left"
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
              <MclFormGroup
                field-id="user-name"
                label="Username:"
                :text-color="formTextColor"
                class="mb-xs"
              >
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
                <button type="submit" class="btn btn-warning text-dark-3">
                  Save
                </button>
              </div>
            </form>
          </div>
        </Collapse>
      </div>
      <!-- profile picture update -->
      <div class="md:rounded-md drop-shadow-md overflow-hidden md:mb-xs">
        <button
          type="button"
          v-bind="pictureAttrs"
          @click="togglePicture"
          class="block w-full py-3xs px-xs bg-light-3 dark:bg-dark-3 hover:bg-light-3/60 dark:hover:bg-dark-3/60 transition-all duration-300 ease-linear text-left"
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
              <MclFormGroup
                field-id="profile-picture"
                label="Profile picture:"
                :text-color="formTextColor"
                class="mb-xs"
              >
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
                <button type="submit" class="btn btn-warning text-dark-3">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </Collapse>
      </div>
      <!-- password update -->
      <div
        class="rounded-b-md md:rounded-md drop-shadow-md overflow-hidden md:mb-xs"
      >
        <button
          type="button"
          v-bind="passwordAttrs"
          @click="togglePassword"
          class="block w-full pt-3xs pb-2xs md:py-3xs px-xs bg-light-3 dark:bg-dark-3 hover:bg-light-3/60 dark:hover:bg-dark-3/60 transition-all duration-300 ease-linear text-left"
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
              <MclFormGroup
                field-id="current-pw"
                label="Current password:"
                :text-color="formTextColor"
                class="mb-2xs"
              >
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
              <MclFormGroup
                field-id="new-pw"
                label="New password:"
                :text-color="formTextColor"
                class="mb-xs"
              >
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
                <button type="submit" class="btn btn-warning text-dark-3">
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
