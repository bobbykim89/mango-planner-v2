export default defineEventHandler(async (evt) => {
  const config = useRuntimeConfig()
  const query = getQuery(evt)
  const { lat, lon } = query

  if (!lat || !lon) {
    throw createError({
      statusCode: 400,
      statusMessage: 'lat and lon query parameters are required',
    })
  }
  const res = await $fetch('https://api.openweathermap.org/data/2.5/weather', {
    query: {
      lat,
      lon,
      appid: config.openWeatherApiKey,
      units: 'imperial',
    },
  })
  return res
})
