<script setup lang="ts">
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
const sugnUpCred = reactive<{
  userName: string
  email: string
  password: string
}>({
  userName: '',
  email: '',
  password: '',
})
const handleFormSubmit = () => {
  const { userName, email, password } = sugnUpCred
  console.log({ userName, email, password })
}
</script>

<template>
  <div class="container">
    <div class="flex justify-center items-center min-h-[65vh] md:min-h-[75vh]">
      <div
        class="bg-dark-3 p-md rounded-md drop-shadow-md w-full max-w-[448px] mx-xs"
      >
        <h2 class="text-warning text-center mb-sm">Signup</h2>
        <MclFormGroup
          label-for="user-name"
          label="User Name:"
          text-color="light-1"
          :text-bold="true"
          class="mb-xs"
        >
          <MclInputText
            id="user-name"
            type="text"
            placeholder="Manguito"
            highlight-color="warning"
            v-model="sugnUpCred.userName"
          ></MclInputText>
        </MclFormGroup>
        <form @submit.prevent="handleFormSubmit">
          <MclFormGroup
            label-for="email"
            label="Email:"
            text-color="light-1"
            :text-bold="true"
            class="mb-xs"
          >
            <MclInputText
              id="email"
              type="email"
              placeholder="example@email.com"
              highlight-color="warning"
              v-model="sugnUpCred.email"
            ></MclInputText>
          </MclFormGroup>
          <MclFormGroup
            label-for="password"
            label="Password:"
            text-color="light-1"
            :text-bold="true"
            class="mb-sm"
          >
            <MclInputText
              id="password"
              type="password"
              highlight-color="warning"
              v-model="sugnUpCred.password"
            ></MclInputText>
          </MclFormGroup>
          <button role="submit" class="btn btn-warning btn-full">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>
