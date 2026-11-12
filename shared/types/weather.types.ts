/** Current weather as returned by GET /api/weather. */
export interface WeatherData {
  city: string
  temperature: number
  condition: string
  icon: string
}
