<script setup lang="ts">
import { Collapse, vCollapse } from '@bobbykim/manguito-theme'
import { MclFormGroup, MclInputText, MclInputFile } from '@bobbykim/mcl-forms'

const emit = defineEmits<{
  (e: 'on-username-update', event: Event, name: string): void
  (e: 'on-file-upload', event: Event, file: File): void
}>()
const usernameRef = ref<string>('')
const profilePictureRef = ref<File | undefined>(undefined)

const onUserNameUpdateSubmit = (e: Event) => {
  e.preventDefault()
  emit('on-username-update', e, usernameRef.value)
  usernameRef.value = ''
}
const onFileSubmit = (e: Event) => {
  e.preventDefault()
  // const fileFormData = new FormData()
  if (profilePictureRef.value) {
    // fileFormData.append('image', profilePictureRef.value)
    // for (let item of fileFormData.entries()) {
    //   console.log(item[0] + ',' + item[1])
    // }
    emit('on-file-upload', e, profilePictureRef.value)
  }
  profilePictureRef.value = undefined
}
</script>

<template>
  <div class="px-2xs py-xs bg-dark-4 rounded-md drop-shadow-md">
    <div>
      <h4 class="h4-md mb-xs">Update User Info</h4>
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
  </div>
</template>
