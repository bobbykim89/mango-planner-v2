import { defineStore } from 'pinia'
import { useCookie } from 'nuxt/app'
import { useRuntimeConfig } from '#imports'
import { useErrorStore } from './errorStore'
import { Plan } from '@/server/models'

type PlanType = InstanceType<typeof Plan>
interface PlanStateType {
  plan: PlanType[]
}

const errorStore = useErrorStore()

export const usePlanStore = defineStore('plan', {
  state: (): PlanStateType => ({
    plan: [],
  }),
  getters: {},
  actions: {},
})
