<script setup lang="ts">
import type { WeatherData } from '#shared/types'

const props = defineProps<{
  latitude: number
  longitude: number
}>()

const api = useApi()
const weatherData = reactive<{
  city: string
  weather: string
  icon: string
  temperature: number
}>({
  city: '',
  weather: '',
  icon: '',
  temperature: 0,
})

const getWeatherData = async () => {
  const { latitude, longitude } = props
  if (latitude !== null && latitude !== Infinity) {
    const res = await api<WeatherData>('/api/weather', {
      query: {
        lat: latitude,
        lon: longitude,
      },
    })
    weatherData.city = res.city
    weatherData.icon = res.icon
    weatherData.weather = res.condition
    weatherData.temperature = res.temperature
  }
}
await useAsyncData('weather-widget', () => getWeatherData())
const iconSrc = computed<string | null>(() => {
  if (weatherData.weather && weatherData.icon) {
    return `/img/weather/${weatherData.icon}.png`
  }
  return null
})
</script>

<template>
  <div
    class="px-2xs py-3xs md:px-xs md:py-2xs md:bg-light-4 md:dark:bg-dark-4 rounded-md drop-shadow-md"
  >
    <div class="flex items-center gap-xs justify-center">
      <img
        v-if="iconSrc"
        :src="iconSrc"
        :alt="weatherData.weather.toLowerCase()"
        class="object-center object-cover aspect-square h-xl md:h-auto"
      />
      <div
        class="flex flex-col justify-center items-start text-dark-3 dark:text-light-3"
      >
        <p>{{ weatherData.city }}</p>
        <p>{{ weatherData.temperature }} &deg;F</p>
      </div>
    </div>
  </div>
</template>
