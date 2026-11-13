import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      // builds the app and calls the real API against an in-memory MongoDB
      {
        test: {
          name: 'api',
          include: ['test/api/**/*.test.ts', 'test/pages/**/*.test.ts'],
          globalSetup: ['test/setup/global.ts'],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 300_000,
        },
      },
      // client stores and composables in the Nuxt environment, API mocked
      await defineVitestProject({
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
        },
      }),
    ],
  },
})
