import { weatherController } from '../../controller'

export default defineApiHandler({
  auth: true,
  handler: weatherController.getWeather,
})
