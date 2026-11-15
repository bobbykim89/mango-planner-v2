// Same base as the Manguito Component Library: the recommended JS and
// typescript-eslint rules plus Vue's bug-catching rules. Formatting is
// Prettier's job (`pnpm format:check`), not ESLint's.
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Vue SFCs: the bug-catching rules only; the stricter presets are template
  // formatting
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      // the core-rule adjustments typescript-eslint applies to .ts files only
      // (no-redeclare off for overloads, prefer-const and no-var on)
      ...tseslint.configs.eslintRecommended.rules,
      // TypeScript already reports undefined names, and no-undef doesn't know
      // Nuxt's auto-imports (ref, computed, useApi, ...)
      'no-undef': 'off',
      // guards against clashing with HTML tags in in-DOM templates; Nuxt pages
      // and layouts (index.vue, default.vue) are single words by design
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // config files and scripts run under Node
    files: ['**/*.{mjs,cjs,js}', 'scripts/**'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      // a leading underscore marks a deliberately unused binding
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // test helpers hand tests the parsed JSON of any response, which they read freely
    files: ['test/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // generated output, served assets and git-ignored scratch dirs
    ignores: [
      '**/node_modules/**',
      '.nuxt/**',
      '.output/**',
      '.vercel/**',
      'dev-dist/**',
      'coverage/**',
      'public/**',
      '.superpowers/**',
    ],
  },
)
