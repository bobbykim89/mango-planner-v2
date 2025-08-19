<script setup lang="ts">
type ApiWeatherType = {
  id: number
  main: string
  description: string
  icon: string
}
type ApiMainType = {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
}
interface ApiReturnType {
  name: string
  weather: ApiWeatherType[]
  main: ApiMainType
}

const props = defineProps<{
  latitude: number
  longitude: number
  apiKey: string
}>()

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
  const { latitude, longitude, apiKey } = props
  if (latitude !== null && latitude !== Infinity) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`
    const res = await $fetch<ApiReturnType>(apiUrl)
    const weatherInfo = res.weather[0]
    if (!weatherInfo) return
    weatherData.city = res.name
    weatherData.icon = weatherInfo.icon
    weatherData.weather = weatherInfo.main
    weatherData.temperature = res.main.temp
  }
}
await useAsyncData('weather-widget', () => getWeatherData())
const iconSrc = computed<string | null>(() => {
  if (weatherData.weather) {
    return new URL(
      `../../assets/images/weather/${weatherData.icon}.png`,
      import.meta.url
    ).href
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
        :alt="weatherData.weather"
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
