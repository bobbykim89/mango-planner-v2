import { defineStore } from 'pinia'
import { useRuntimeConfig, useCookie } from '#imports'
import { useErrorStore } from './errorStore'
import { User } from '@/server/models'

type UserType = InstanceType<typeof User>
interface UserStateType {
  currentUser: UserType | null
  isAuthenticated: boolean
}

const errorStore = useErrorStore()

export const useUserStore = defineStore('user', {
  state: (): UserStateType => ({
    currentUser: null,
    isAuthenticated: false,
  }),
  getters: {
    getCurrentAuthInfo(state): UserStateType {
      return {
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }
    },
  },
  actions: {},
})
