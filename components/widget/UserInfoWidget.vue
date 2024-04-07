<script setup lang="ts">
import { Collapse, vCollapse } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText, MclInputFile } from '@bobbykim/mcl-forms'

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
</script>

<template>
  <div class="px-2xs py-xs bg-dark-4 rounded-md drop-shadow-md">
    <div>
      <h4 class="h4-md mb-xs">User Info</h4>
    </div>
    <!-- current user profile -->
    <div
      class="rounded-md drop-shadow-md overflow-hidden mb-xs px-xs py-sm bg-dark-3 flex flex-col justic-center items-center"
    >
      <img
        :src="cloudinaryBaseUrl + profilePicture"
        alt="profile picture"
        class="object-center object-cover aspect-square rounded-full h-2xl mb-sm"
      />
      <p>{{ username }}</p>
    </div>
    <!-- username update -->
    <div class="rounded-md drop-shadow-md overflow-hidden mb-xs">
      <button
        v-collapse:update-username
        class="block w-full py-3xs px-xs bg-dark-3 hover:bg-opacity-60 transition-all duration-300 ease-linear text-left"
      >
        Update Username
      </button>
      <Collapse
        id="update-username"
        accordion="update-profile"
        class-name="bg-dark-3 bg-opacity-65"
      >
        <div class="px-xs py-xs">
          <form @submit="onUserNameUpdateSubmit">
            <MclFormGroup
              label-for="user-name"
              label="Username:"
              text-color="light-3"
              class="mb-xs"
            >
              <MclInputText
                id="user-name"
                rounded
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
        class="block w-full py-3xs px-xs bg-dark-3 hover:bg-opacity-60 transition-all duration-300 ease-linear text-left"
      >
        Update Profile Picture
      </button>
      <Collapse
        id="update-profile-picture"
        accordion="update-profile"
        class-name="bg-dark-3 bg-opacity-65"
      >
        <div class="px-xs py-xs">
          <form @submit="onFileSubmit">
            <MclFormGroup
              label-for="profile-picture"
              label="Profile picture:"
              text-color="light-3"
              class="mb-xs"
            >
              <MclInputFile
                id="profile-picture"
                button-text="Browse"
                rounded
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
        class="block w-full py-3xs px-xs bg-dark-3 hover:bg-opacity-60 transition-all duration-300 ease-linear text-left"
      >
        Update Password
      </button>
      <Collapse
        id="update-password"
        accordion="update-profile"
        class-name="bg-dark-3 bg-opacity-65"
      >
        <div class="px-xs py-xs">
          <form @submit="onPasswordSubmit">
            <MclFormGroup
              label-for="current-pw"
              label="Current password:"
              text-color="light-3"
              class="mb-2xs"
            >
              <MclInputText
                id="current-pw"
                type="password"
                rounded
                highlight-color="warning"
                v-model="currentPasswordRef"
              ></MclInputText>
            </MclFormGroup>
            <MclFormGroup
              label-for="new-pw"
              label="New password:"
              text-color="light-3"
              class="mb-xs"
            >
              <MclInputText
                id="new-pw"
                type="password"
                rounded
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
