import { mclTheme } from '@bobbykim/manguito-theme/mcl-theme'
import type { Config } from 'tailwindcss'

/** @type {import('tailwindcss').Config} */
export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './src/**/*.{vue,ts,js,cjs}',
    './node_modules/@bobbykim/**/*.{vue,ts,js,cjs}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    mclTheme({
      colors: {
        primary: '#312e81',
        info: '#14532d',
      },
    }),
  ],
}
