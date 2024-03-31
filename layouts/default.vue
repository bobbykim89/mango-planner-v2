<script setup lang="ts">
import MPLogo from '@/assets/images/logo.png'
import { CtaTarget, HeaderHorizontal } from '@bobbykim/manguito-theme'
import type { MenuItemType, SocialUrl } from '@bobbykim/mcl-footer'
import { MclFooterA } from '@bobbykim/mcl-footer'
import { useInitPiniaStore, useAlertStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import AlertBlock from '@/components/layout/AlertBlock.vue'

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
      <AlertBlock v-if="alert" :message="alert"></AlertBlock>
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
