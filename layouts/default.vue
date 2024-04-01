<script setup lang="ts">
import MPLogo from '@/assets/images/logo.png'
import { CtaTarget, HeaderHorizontal, Alert } from '@bobbykim/manguito-theme'
import type { MenuItemType, SocialUrl } from '@bobbykim/mcl-footer'
import { MclFooterA } from '@bobbykim/mcl-footer'
import { useInitPiniaStore, useAlertStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const router = useRouter()
const initPiniaStore = useInitPiniaStore()
await useAsyncData('initPinia', () => initPiniaStore.initStores())
const alertStore = useAlertStore()
const userStore = useUserStore()
const { loading } = storeToRefs(initPiniaStore)
const { alert } = storeToRefs(alertStore)
const { currentUser } = storeToRefs(userStore)

const footerMenuItems: MenuItemType[] = [
  {
    title: 'Home',
    url: '/',
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

const handleTitleClick = (e: Event, url: string, target: CtaTarget) => {
  e.preventDefault()
  router.push({ path: url })
}
const handleAuthClick = (e: Event, url: string) => {
  e.preventDefault()
  router.push({ path: url })
}
const handleFooterMenuClick = (e: Event, item: MenuItemType) => {
  e.preventDefault()
  router.push({ path: item.url })
}
const onAlertClose = () => {
  alertStore.clearAlert()
}
</script>

<template>
  <div>
    <HeaderHorizontal bg-color="dark-3" :scroll-distance="100">
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
            login-url="/auth/login"
            signup-url="/auth/signup"
            url-target="_self"
            @login-click="handleAuthClick"
            @signup-click="handleAuthClick"
          ></LayoutAuthBlock></div
      ></template>
      <template #mobile-content><div>mewmew</div></template>
    </HeaderHorizontal>
    <div class="bg-dark-2">
      <div class="container pt-xs px-xs md:px-0">
        <Alert :show="alert !== null" dismissible @close="onAlertClose">
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
      <div v-if="!loading">
        {{ currentUser }}
      </div>
      <slot />
    </div>
    <MclFooterA
      :logo="menuItemData.logo"
      :logo-alt="menuItemData.logoAlt"
      :logo-link="menuItemData.logoLink"
      :title="menuItemData.title"
      title-color="warning"
      :logo-as-link="false"
      :menu-item-as-link="false"
      :menu-items="menuItemData.menu"
      :social-links="menuItemData.social"
      social-icon-color="warning"
      highlight-color="warning"
      border-top-color="warning"
      @logo-click="handleTitleClick"
      @menu-click="handleFooterMenuClick"
    ></MclFooterA>
  </div>
</template>

<style scoped></style>
