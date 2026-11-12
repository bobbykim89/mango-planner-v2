import { useRuntimeConfig } from '#imports'
import { weatherQuerySchema } from '#shared/dto/weather'
import type { WeatherData } from '#shared/types'
import type { H3Event } from 'h3'
import { BaseController } from '../base.controller'

interface OpenWeatherResponse {
  name: string
  main: { temp: number }
  weather: { main: string; icon: string }[]
}

export class WeatherController extends BaseController {
  /** Current weather for the given coordinates, trimmed to what the widget shows. */
  public getWeather = async (e: H3Event): Promise<WeatherData> => {
    const { lat, lon } = this.validateQuery(e, weatherQuerySchema)
    let res: OpenWeatherResponse
    try {
      res = await $fetch<OpenWeatherResponse>(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          query: {
            lat,
            lon,
            appid: useRuntimeConfig().openWeatherApiKey,
            units: 'imperial',
          },
        },
      )
    } catch (err) {
      console.error('[weather] upstream request failed:', err)
      throw apiError.UPSTREAM_ERROR('Weather is unavailable right now.')
    }
    const current = res.weather?.[0]
    if (!current)
      throw apiError.UPSTREAM_ERROR('Weather is unavailable right now.')
    return {
      city: res.name,
      temperature: res.main.temp,
      condition: current.main,
      icon: current.icon,
    }
  }
}
