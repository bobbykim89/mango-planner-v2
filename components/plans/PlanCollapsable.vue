<script setup lang="ts">
import { MclCollapseA } from '@bobbykim/mcl-collapse'
import { Plan } from '@/server/models'

type PlanItemType = InstanceType<typeof Plan>
const props = defineProps<{
  item: PlanItemType
}>()
</script>

<template>
  <MclCollapseA :collapse-id="item.id" :title="item.title">
    <template #tab>
      <div>mewmew</div>
    </template>
    <template #content>
      <div v-html="item.content"></div>
    </template>
  </MclCollapseA>
</template>
