// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
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
