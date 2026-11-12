import { z } from 'zod'

export const weatherQuerySchema = z.object({
  lat: z.coerce
    .number({ error: 'Latitude must be a number.' })
    .min(-90, 'Latitude must be between -90 and 90.')
    .max(90, 'Latitude must be between -90 and 90.'),
  lon: z.coerce
    .number({ error: 'Longitude must be a number.' })
    .min(-180, 'Longitude must be between -180 and 180.')
    .max(180, 'Longitude must be between -180 and 180.'),
})

export type WeatherQuery = z.infer<typeof weatherQuerySchema>
