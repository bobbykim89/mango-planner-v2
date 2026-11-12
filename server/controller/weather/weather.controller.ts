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
        useRuntimeConfig().openWeatherUrl,
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
      // log only the status: the request URL carries the API key and the user's location
      const { status, statusText } = (err ?? {}) as {
        status?: number
        statusText?: string
      }
      console.error(
        `[weather] upstream request failed: ${status ?? 'no response'} ${statusText ?? ''}`.trim(),
      )
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
