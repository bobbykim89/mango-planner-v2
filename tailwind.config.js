import { mclTheme } from "@bobbykim/manguito-theme/themeVariables.cjs";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{vue,ts,js,cjs}",
    "./node_modules/@bobbykim/**/*.{vue,ts,js,cjs}",
  ],
  theme: {
    extend: {},
  },
  plugins: [mclTheme()],
};
