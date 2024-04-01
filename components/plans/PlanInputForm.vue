<script setup lang="ts">
import {
  MclFormGroup,
  MclInputText,
  MclTextArea,
  MclInputRadio,
} from '@bobbykim/mcl-forms'
import type { TypeInputLiteralType, PlanFormInput } from '@/types'

const props = withDefaults(
  defineProps<{
    prefix?: string
    submitText?: string
  }>(),
  {
    prefix: 'form',
    submitText: 'Save',
  }
)

interface TypeOptions {
  id: string
  text: string
  value: TypeInputLiteralType
}

const emit = defineEmits<{
  (e: 'form-submit', event: Event, data: PlanFormInput): void
}>()
const formContent = reactive<PlanFormInput>({
  title: '',
  content: '',
  type: 'personal',
})
const typeOptions: TypeOptions[] = [
  {
    id: `${props.prefix}-type-personal`,
    text: 'Personal',
    value: 'personal',
  },
  {
    id: `${props.prefix}-type-work`,
    text: 'Work',
    value: 'work',
  },
  {
    id: `${props.prefix}-type-chore`,
    text: 'Chore',
    value: 'chore',
  },
]
const setTypeValue = (e: Event, value: string | number) => {
  formContent.type = value as TypeInputLiteralType
}
const clearInput = () => {
  formContent.title = ''
  formContent.content = ''
  formContent.type = 'personal'
}
const onFormSubmit = (e: Event) => {
  emit('form-submit', e, formContent)
  clearInput()
}
</script>

<template>
  <div>
    <form @submit.prevent="onFormSubmit">
      <MclFormGroup
        :label-for="`${prefix}-title`"
        label="Title:"
        text-color="light-1"
        :text-bold="true"
        class="mb-xs"
      >
        <MclInputText
          :id="`${prefix}-title`"
          highlight-color="warning"
          placeholder="Please write your plan here."
          rounded
          required
          v-model="formContent.title"
        ></MclInputText>
      </MclFormGroup>
      <MclFormGroup
        :label-for="`${prefix}-content`"
        label="Content:"
        text-color="light-1"
        :text-bold="true"
        class="mb-xs"
      >
        <MclTextArea
          :id="`${prefix}-content`"
          highlight-color="warning"
          placeholder="Please write details here"
          rounded
          v-model="formContent.content"
        ></MclTextArea>
      </MclFormGroup>
      <div class="flex justify-center gap-md mb-sm">
        <div
          class="flex items-center gap-2xs"
          v-for="(item, idx) in typeOptions"
          :key="idx"
        >
          <MclInputRadio
            :id="item.id"
            :value="item.value"
            :checked="formContent.type === item.value"
            bg-color="warning"
            @change="setTypeValue"
          ></MclInputRadio>
          <MclFormGroup :label-for="item.id">
            <template #label>
              <p class="text-light-1 font-bold">{{ item.text }}</p>
            </template>
          </MclFormGroup>
        </div>
      </div>
      <button role="submit" class="btn btn-warning btn-full">
        {{ submitText }}
      </button>
    </form>
  </div>
</template>
