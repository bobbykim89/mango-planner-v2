<script setup lang="ts">
import { MclFormGroup, MclInputText } from '@bobbykim/mcl-forms'
const loginCred = reactive<{
  email: string
  password: string
}>({
  email: '',
  password: '',
})
const handleFormSubmit = () => {
  const { email, password } = loginCred
  console.log({ email, password })
}
</script>

<template>
  <div class="container">
    <div class="flex justify-center items-center min-h-[65vh] md:min-h-[75vh]">
      <div
        class="bg-dark-3 p-md rounded-md drop-shadow-md w-full max-w-[448px] mx-xs"
      >
        <h2 class="text-warning text-center mb-sm">Login</h2>
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
              v-model="loginCred.email"
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
              v-model="loginCred.password"
            ></MclInputText>
          </MclFormGroup>
          <button role="submit" class="btn btn-warning btn-full">Submit</button>
        </form>
      </div>
    </div>
  </div>
</template>
