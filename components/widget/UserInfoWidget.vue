<script setup lang="ts">
import { Collapse, vCollapse } from '@bobbykim/manguito-theme'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText, MclInputFile } from '@bobbykim/mcl-forms'
import DefaultProfile from '@/assets/images/defaultProfile.jpeg'

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
    class="px-2xs py-xs bg-light-4 dark:bg-dark-4 text-dark-3 dark:text-light-3 rounded-md drop-shadow-md"
  >
    <div>
      <h4 class="h4-md mb-xs">My Info</h4>
    </div>
    <!-- current user profile -->
    <div
      class="rounded-md drop-shadow-md overflow-hidden mb-xs px-xs py-sm bg-light-3 dark:bg-dark-3 flex flex-col justic-center items-center"
    >
      <img
        v-if="profilePicture !== ''"
        :src="cloudinaryBaseUrl + profilePicture"
        alt="profile picture"
        class="object-center object-cover aspect-square rounded-full h-2xl mb-sm"
      />
      <img
        v-else
        :src="DefaultProfile"
        alt="placeholder profile picture"
        class="object-center object-cover aspect-square rounded-full h-2xl mb-sm"
      />
      <p>{{ username }}</p>
    </div>
    <!-- username update -->
    <div class="rounded-md drop-shadow-md overflow-hidden mb-xs">
      <button
        v-collapse:update-username
        class="block w-full py-3xs px-xs bg-light-3 dark:bg-dark-3 hover:bg-opacity-60 transition-all duration-300 ease-linear text-left"
      >
        Update Username
      </button>
      <Collapse
        id="update-username"
        accordion="update-profile"
        class-name="bg-light-3/65 dark:bg-dark-3/65"
      >
        <div class="px-xs py-xs">
          <form @submit="onUserNameUpdateSubmit">
            <MclFormGroup
              label-for="user-name"
              label="Username:"
              :text-color="formTextColor"
              class="mb-xs"
            >
              <MclInputText
                id="user-name"
                rounded
                required
                highlight-color="warning"
                v-model="usernameRef"
              ></MclInputText>
            </MclFormGroup>
            <div class="flex justify-end">
              <button role="submit" class="btn btn-warning">Save</button>
            </div>
          </form>
        </div>
      </Collapse>
    </div>
    <!-- profile picture update -->
    <div class="rounded-md drop-shadow-md overflow-hidden mb-xs">
      <button
        v-collapse:update-profile-picture
        class="block w-full py-3xs px-xs bg-light-3 dark:bg-dark-3 hover:bg-opacity-60 transition-all duration-300 ease-linear text-left"
      >
        Update Profile Picture
      </button>
      <Collapse
        id="update-profile-picture"
        accordion="update-profile"
        class-name="bg-light-3/65 dark:bg-dark-3/65"
      >
        <div class="px-xs py-xs">
          <form @submit="onFileSubmit">
            <MclFormGroup
              label-for="profile-picture"
              label="Profile picture:"
              :text-color="formTextColor"
              class="mb-xs"
            >
              <MclInputFile
                id="profile-picture"
                button-text="Browse"
                rounded
                is-required
                highlight-color="warning"
                v-model="profilePictureRef"
              ></MclInputFile>
            </MclFormGroup>
            <div class="flex justify-end">
              <button role="submit" class="btn btn-warning">Upload</button>
            </div>
          </form>
        </div>
      </Collapse>
    </div>
    <!-- password update -->
    <div class="rounded-md drop-shadow-md overflow-hidden mb-xs">
      <button
        v-collapse:update-password
        class="block w-full py-3xs px-xs bg-light-3 dark:bg-dark-3 hover:bg-opacity-60 transition-all duration-300 ease-linear text-left"
      >
        Update Password
      </button>
      <Collapse
        id="update-password"
        accordion="update-profile"
        class-name="bg-light-3/65 dark:bg-dark-3/65"
      >
        <div class="px-xs py-xs">
          <form @submit="onPasswordSubmit">
            <MclFormGroup
              label-for="current-pw"
              label="Current password:"
              :text-color="formTextColor"
              class="mb-2xs"
            >
              <MclInputText
                id="current-pw"
                type="password"
                rounded
                required
                highlight-color="warning"
                v-model="currentPasswordRef"
              ></MclInputText>
            </MclFormGroup>
            <MclFormGroup
              label-for="new-pw"
              label="New password:"
              :text-color="formTextColor"
              class="mb-xs"
            >
              <MclInputText
                id="new-pw"
                type="password"
                rounded
                required
                highlight-color="warning"
                v-model="newPasswordRef"
              ></MclInputText>
            </MclFormGroup>
            <div class="flex justify-end">
              <button role="submit" class="btn btn-warning">Save</button>
            </div>
          </form>
        </div>
      </Collapse>
    </div>
  </div>
</template>
