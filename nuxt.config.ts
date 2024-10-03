// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-07-13',
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Mango Planner',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        {
          name: 'description',
          content: 'Simple planner app for daily use',
        },
        { property: 'og:title', content: 'Mango Planner' },
        {
          property: 'og:image',
          content:
            'https://res.cloudinary.com/dwgni1x3t/image/upload/v1712540581/mango-planner/assets/pwa-512x512_y540s7.png',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  runtimeConfig: {
    mongoId: process.env.MONGO_ADMIN_ID,
    mongoPw: process.env.MONGO_ADMIN_PW,
    mongoClusterName: process.env.MONGO_CLUSTER_NAME,
    mongoDBName: process.env.MONGO_DB_NAME,
    mongoUrl: process.env.MONGO_URL,
    jwtSecret: process.env.JWT_SECRET,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    mailerEmailAddress: process.env.MAILER_EMAIL_ADDRESS,
    mailerAppPassword: process.env.MAILER_APP_PASSWORD,
    public: {
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
    },
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt',
  ],
  typescript: {
    typeCheck: true,
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
        verbatimModuleSyntax: false,
        strict: true,
        types: ['vite/client'],
      },
    },
  },
  colorMode: {
    classSuffix: '',
  },
  css: ['~/assets/css/page_transition.scss'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: true,
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  pwa: {
    strategies: 'generateSW',
    manifest: {
      short_name: 'MangoPlanner',
      name: 'Mango Planner',
      description: 'Simple planner app for daily use',
      icons: [
        {
          src: 'favicon.svg',
          type: 'image/svg+xml',
          sizes: '128x128',
        },
        {
          src: 'favicon.ico',
          sizes: '48x48',
          type: 'image/x-icon',
        },
        {
          src: 'mango_planner_logo-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'mango_planner_logo-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'mango_plannable_maskable_512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      display: 'standalone',
      background_color: '#f1ac18',
      theme_color: '#e8e8e8',
      lang: 'en-US',
      start_url: '/',
      screenshots: [
        {
          src: 'screenshot_desktop.png',
          sizes: '2097x1236',
          type: 'image/png',
          form_factor: 'wide',
        },
        {
          src: 'screenshot_mobile.png',
          sizes: '422x784',
          type: 'image/png',
          form_factor: 'narrow',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    registerType: 'autoUpdate',
    devOptions: {
      enabled: false,
      // suppressWarnings: true,
      // navigateFallback: '/',
      // type: 'module',
    },
  },
})
