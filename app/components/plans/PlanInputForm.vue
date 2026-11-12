<script setup lang="ts">
import type { PlanFormInput, TypeInputLiteralType } from '#shared/types'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import {
  MclFormGroup,
  MclInputRadio,
  MclInputText,
  MclTextArea,
} from '@bobbykim/mcl-forms'

const props = withDefaults(
  defineProps<{
    prefix?: string
    submitText?: string
    postInput?: PlanFormInput
  }>(),
  {
    prefix: 'form',
    submitText: 'Save',
  },
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
  title: props.postInput?.title || '',
  content: props.postInput?.content || '',
  type: props.postInput?.type || 'personal',
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
const typeIndicatorColor: Record<TypeInputLiteralType, ColorPalette> = {
  personal: 'dark-3',
  work: 'info',
  chore: 'primary',
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

const formTextColor = computed<ColorPalette>(() => {
  if (useColorMode().preference === 'dark') {
    return 'light-3'
  }
  return 'dark-3'
})
</script>

<template>
  <div>
    <form @submit.prevent="onFormSubmit">
      <MclFormGroup
        :field-id="`${prefix}-title`"
        label="Title:"
        :text-color="formTextColor"
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
        :field-id="`${prefix}-content`"
        label="Content:"
        :text-color="formTextColor"
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
      <fieldset>
        <legend class="sr-only">Plan type</legend>
        <div class="flex justify-center gap-md mb-sm">
          <div
            class="flex items-center gap-2xs"
            v-for="(item, idx) in typeOptions"
            :key="idx"
          >
            <MclInputRadio
              :id="item.id"
              :name="`${prefix}-type`"
              :value="item.value"
              v-model="formContent.type"
              bg-color="warning"
              checked-bg-color="warning"
              border-color="warning"
              :indicator-color="typeIndicatorColor[item.value]"
            ></MclInputRadio>
            <MclFormGroup :field-id="item.id">
              <template #label>
                <p class="text-dark-3 dark:text-light-3 font-bold">
                  {{ item.text }}
                </p>
              </template>
            </MclFormGroup>
          </div>
        </div>
      </fieldset>
      <button type="submit" class="btn btn-warning btn-full">
        {{ submitText }}
      </button>
    </form>
  </div>
</template>
