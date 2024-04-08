// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Mango Planner',
      // htmlAttrs: {
      //   lang: 'en',
      // },
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
    jwtSecret: process.env.JWT_SECRET,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    public: {
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
    },
  },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  typescript: {
    typeCheck: true,
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
        verbatimModuleSyntax: false,
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
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    viewer: true,
  },
  build: {
    transpile: ['@bobbykim'],
  },
  nitro: {
    plugins: ['~/server/plugin/connectDb.ts'],
  },
})
