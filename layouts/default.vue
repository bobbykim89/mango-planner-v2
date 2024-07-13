<script setup lang="ts">
import MPLogo from '@/assets/images/logo.png'
import {
  CtaTarget,
  HeaderHorizontal,
  Alert,
  Sidebar,
} from '@bobbykim/manguito-theme'
import type { ColorPalette } from '@bobbykim/manguito-theme'
import type { MenuItemType, SocialUrl } from '@bobbykim/mcl-footer'
import { MclFooterA } from '@bobbykim/mcl-footer'
import {
  useInitPiniaStore,
  useAlertStore,
  useUserStore,
  useProfileStore,
} from '@/stores'
import { storeToRefs } from 'pinia'
import WeatherWidget from '@/components/widget/WeatherWidget.vue'
import DarkmodeWidget from '@/components/widget/DarkmodeWidget.vue'
import UserInfoWidget from '@/components/widget/UserInfoWidget.vue'
import CreateProfileWidget from '@/components/widget/CreateProfileWidget.vue'
import { useGeolocation, useWindowScroll } from '@vueuse/core'

const config = useRuntimeConfig()
const router = useRouter()
const initPiniaStore = useInitPiniaStore()
await useAsyncData('initPinia', () => initPiniaStore.initStores())
const alertStore = useAlertStore()
const userStore = useUserStore()
const profileStore = useProfileStore()
const { alert, alertColor } = storeToRefs(alertStore)
const { loading } = storeToRefs(initPiniaStore)
const { currentUser, isAuthenticated } = storeToRefs(userStore)
const { userProfile } = storeToRefs(profileStore)
const sidebarRef = ref<InstanceType<typeof Sidebar>>()
const headerRef = ref<InstanceType<typeof HeaderHorizontal>>()
const { coords } = useGeolocation()
const { y } = useWindowScroll({ behavior: 'smooth' })
const { $pwa } = useNuxtApp()

const footerMenuItems: MenuItemType[] = [
  {
    title: 'Home',
    url: '/',
    target: '_self',
  },
  {
    title: 'Info',
    url: '/info',
    target: '_self',
  },
  {
    title: 'About',
    url: '/about',
    target: '_self',
  },
]

const menuItemData = reactive<{
  title: string
  logo: string
  logoAlt: string
  logoLink: string
  social: SocialUrl
  menu: MenuItemType[]
}>({
  title: 'Mango Planner',
  logo: MPLogo,
  logoAlt: 'Mango Planner Logo',
  logoLink: '/',
  menu: footerMenuItems,
  social: {
    github: 'https://github.com/bobbykim89',
    linkedin: 'https://www.linkedin.com/in/sihun-kim-9baa17165/',
  },
})

const handleBgColors = computed<ColorPalette>(() => {
  if (userProfile.value !== null && userProfile.value.dark) {
    return 'dark-3'
  }
  return 'light-3'
})
const handleFooterMenuColor = computed<ColorPalette>(() => {
  if (userProfile.value !== null && userProfile.value.dark) {
    return 'light-2'
  }
  return 'dark-2'
})
const handleMobileMenuBgColor = computed<ColorPalette>(() => {
  if (userProfile.value !== null && userProfile.value.dark) {
    return 'dark-2'
  }
  return 'light-4'
})

const handleTitleClick = (e: Event, url: string, target: CtaTarget) => {
  e.preventDefault()
  router.push({ path: url })
}
const handleAuthClick = (e: Event, url: string) => {
  e.preventDefault()
  headerRef.value?.headerClose()
  router.push({ path: url })
}
const sidebarOpen = (e: Event) => {
  e.preventDefault()
  sidebarRef.value?.open()
  headerRef.value?.headerClose()
}
const sidebarClose = () => {
  sidebarRef.value?.close()
}
const handleFooterMenuClick = (e: Event, item: MenuItemType) => {
  e.preventDefault()
  router.push({ path: item.url })
}
const onAlertClose = () => {
  alertStore.clearAlert()
}
const onScrollToTop = () => {
  y.value = 0
}
const onLogout = () => {
  userStore.logoutUser()
  sidebarClose()
  headerRef.value?.headerClose()
  useColorMode().preference = 'light'
  router.push({ path: '/auth/login' })
}
const onDarkModeClick = async (e: Event, dark: boolean) => {
  e.preventDefault()
  await profileStore.toggleUserDarkMode({ dark: !dark })
}
const onUsernameChange = async (e: Event, name: string) => {
  e.preventDefault()
  if (import.meta.client && window.confirm('Please confirm username update')) {
    await userStore.updateUsername({ username: name })
  }
  headerRef.value?.headerClose()
}
const onFileUpload = async (e: Event, file: File) => {
  e.preventDefault()
  const fileFormData = new FormData()
  fileFormData.append('image', file)
  if (import.meta.client && window.confirm('Please confirm file upload.')) {
    await profileStore.updateUserProfilePicture(fileFormData)
  }
  headerRef.value?.headerClose()
}
const onPwUpdate = async (e: Event, currPw: string, newPw: string) => {
  e.preventDefault()
  if (import.meta.client && window.confirm('Please confirm password update.')) {
    await userStore.updatePassword({
      currentPassword: currPw,
      newPassword: newPw,
    })
  }
  headerRef.value?.headerClose()
}
const onProfileCreate = async (e: Event) => {
  e.preventDefault()
  await profileStore.postNewUserProfile()
  headerRef.value?.headerClose()
}
watch(
  () => isAuthenticated.value,
  (newValue) => {
    if (newValue === false) {
      useColorMode().preference = 'light'
    }
  }
)
watch(
  () => userProfile.value,
  (newValue) => {
    if (newValue === null) {
      useColorMode().preference = 'light'
    }
    useColorMode().preference = newValue?.dark ? 'dark' : 'light'
  }
)
</script>

<template>
  <NuxtPwaManifest />
  <div class="relative">
    <HeaderHorizontal
      ref="headerRef"
      :bg-color="handleBgColors"
      :mobile-menu-bg-color="handleMobileMenuBgColor"
      :scroll-distance="100"
    >
      <template #content
        ><div class="flex flex-shrink-0 items-center self-center md:py-3xs">
          <div class="h-md md:h-lg mr-2xs md:mr-sm align-middle">
            <a
              :href="menuItemData.logoLink"
              target="_self"
              @click="handleTitleClick($event, menuItemData.logoLink, '_self')"
            >
              <img
                :src="menuItemData.logo"
                :alt="menuItemData.logoAlt"
                class="h-full inline-block"
              />
            </a>
          </div>
          <div class="flex flex-col justify-center ml-2">
            <a
              :href="menuItemData.logoLink"
              target="_self"
              @click="handleTitleClick($event, menuItemData.logoLink, '_self')"
            >
              <h2
                class="inline-block align-middle tracking-wider h2-md text-warning"
              >
                {{ menuItemData.title }}
              </h2>
            </a>
          </div>
        </div></template
      >
      <template #content-right
        ><div>
          <LayoutAuthBlock
            :auth="isAuthenticated"
            login-url="/auth/login"
            signup-url="/auth/signup"
            url-target="_self"
            :username="currentUser?.name"
            :profile-picture="userProfile?.profilePicture"
            @login-click="handleAuthClick"
            @signup-click="handleAuthClick"
            @username-click="sidebarOpen"
          ></LayoutAuthBlock></div
      ></template>
      <template #mobile-content
        ><div>
          <LayoutAuthBlock
            v-if="!isAuthenticated"
            :auth="false"
            login-url="/auth/login"
            signup-url="/auth/signup"
            url-target="_self"
            :username="currentUser?.name"
            :profile-picture="userProfile?.profilePicture"
            @login-click="handleAuthClick"
            @signup-click="handleAuthClick"
            @username-click="sidebarOpen"
            class="py-xs"
          ></LayoutAuthBlock>
        </div>
        <!-- user profile block: visible only when authenticated -->
        <div v-if="isAuthenticated" class="text-light-3 pt-xs px-xs">
          <div
            class="grid gap-4"
            :class="{ 'grid-cols-2': userProfile !== null }"
          >
            <WeatherWidget
              v-if="coords.latitude !== null && coords.latitude !== Infinity"
              :latitude="coords.latitude"
              :longitude="coords.longitude"
              :api-key="config.public.openWeatherApiKey"
            ></WeatherWidget>
            <DarkmodeWidget
              v-if="userProfile !== null"
              :dark="userProfile.dark"
              @dark-click="onDarkModeClick"
              class="self-center"
            ></DarkmodeWidget>
          </div>

          <div v-if="userProfile !== null" class="mt-xs">
            <UserInfoWidget
              :username="currentUser?.name"
              :profile-picture="userProfile?.profilePicture"
              @on-username-update="onUsernameChange"
              @on-file-upload="onFileUpload"
              @on-pw-update="onPwUpdate"
            ></UserInfoWidget>
          </div>
          <div v-else class="mt-xs">
            <CreateProfileWidget
              @btn-click="onProfileCreate"
            ></CreateProfileWidget>
          </div>
        </div>
        <!-- logout button -->
        <div
          v-if="isAuthenticated"
          class="flex justify-center items-center text-dark-3 dark:text-light-3"
        >
          <button
            class="px-xs py-xs flex items-center gap-3 text-lg font-bold hover:opacity-60 transition-opacity duration-300 ease-linear"
            @click="onLogout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              class="h-xs"
              fill="currentColor"
            >
              <!-- !Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
              <path
                d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </template>
    </HeaderHorizontal>
    <div class="bg-light-4 dark:bg-dark-2">
      <div class="container pt-xs px-sm md:px-xs">
        <Alert
          :show="alert !== null"
          :color="alertColor"
          dismissible
          @close="onAlertClose"
        >
          <div class="flex justify-center text-light-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
              class="w-xs mr-2xs"
            >
              <!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
              <path
                d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"
              />
            </svg>
            <span>{{ alert }}</span>
          </div>
        </Alert>
      </div>
      <slot />
      <div
        v-if="$pwa?.needRefresh"
        class="fixed bottom-0 left-0 ml-3xs mb-3xs md:ml-md md:mb-md bg-light-1 dark:bg-dark-4 p-md rounded-md drop-shadow-md text-dark-3 dark:text-light-3 max-w-[90vw]"
      >
        <div class="flex justify-center items-center gap-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
            class="w-md md:w-xs"
          >
            <!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
            <path
              d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"
            />
          </svg>
          <span>New version of SW available, please reload</span>
          <button
            @click="$pwa?.updateServiceWorker()"
            class="p-[6px] bg-warning rounded-md hover:bg-warning/75 transition-all duration-300 ease-linear"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
              class="w-xs"
            >
              <!-- !Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
              <path
                d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"
              />
            </svg>
          </button>
        </div>
      </div>
      <LayoutScrollToTop @scroll-click="onScrollToTop"></LayoutScrollToTop>
      <Sidebar
        ref="sidebarRef"
        :color="handleBgColors"
        placement="right"
        class-name="border-l-4 border-warning"
        width="400"
      >
        <template #header="{ close }">
          <div
            class="flex items-center py-2xs px-3xs bg-light-3 dark:bg-dark-3 drop-shadow-md"
          >
            <button @click="close" class="p-2xs text-dark-3 dark:text-light-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 384 512"
                fill="currentColor"
                class="hover:opacity-60 focus:opacity-60 transition-opacity duration-300 ease-linear h-sm"
              >
                <!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
                <path
                  d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
                />
              </svg>
            </button>
          </div>
        </template>
        <template #body>
          <div class="text-light-3 py-xs px-xs">
            <WeatherWidget
              v-if="coords.latitude !== null && coords.latitude !== Infinity"
              :latitude="coords.latitude"
              :longitude="coords.longitude"
              :api-key="config.public.openWeatherApiKey"
            ></WeatherWidget>
            <div v-if="userProfile !== null" class="mt-xs">
              <DarkmodeWidget
                :dark="userProfile.dark"
                @dark-click="onDarkModeClick"
                class="mb-xs"
              ></DarkmodeWidget>
              <UserInfoWidget
                :username="currentUser?.name"
                :profile-picture="userProfile?.profilePicture"
                @on-username-update="onUsernameChange"
                @on-file-upload="onFileUpload"
                @on-pw-update="onPwUpdate"
              ></UserInfoWidget>
            </div>
            <div v-else class="mt-xs">
              <CreateProfileWidget
                @btn-click="onProfileCreate"
              ></CreateProfileWidget>
            </div>
          </div>
        </template>
        <template #footer>
          <div
            class="flex justify-center items-center bg-light-3 dark:bg-dark-3"
          >
            <button
              class="px-sm py-xs flex items-center gap-3 text-lg font-bold text-warning hover:opacity-60 transition-opacity duration-300 ease-linear"
              @click="onLogout"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                class="h-xs"
                fill="currentColor"
              >
                <!-- !Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
                <path
                  d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </template>
      </Sidebar>
    </div>
    <MclFooterA
      :logo="menuItemData.logo"
      :logo-alt="menuItemData.logoAlt"
      :logo-link="menuItemData.logoLink"
      :bg-color="handleBgColors"
      :title="menuItemData.title"
      title-color="warning"
      :logo-as-link="false"
      :menu-item-as-link="false"
      :menu-items="menuItemData.menu"
      :menu-text-color="handleFooterMenuColor"
      :social-links="menuItemData.social"
      :headline-color="handleFooterMenuColor"
      social-icon-color="warning"
      highlight-color="warning"
      border-top-color="warning"
      @logo-click="handleTitleClick"
      @menu-click="handleFooterMenuClick"
    >
      <div>
        <span class="text-dark-3 dark:text-light-3"
          >&copy; Mango Planner {{ new Date().getFullYear() }}</span
        >
      </div>
    </MclFooterA>
  </div>
</template>

<style scoped></style>
