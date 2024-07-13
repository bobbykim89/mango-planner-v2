import { useRuntimeConfig } from '#imports'
import { connect } from 'mongoose'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const mongoUrl = `mongodb+srv://${config.mongoId}:${config.mongoPw}@${config.mongoClusterName}.${config.mongoUrl}.mongodb.net/${config.mongoDBName}?retryWrites=true&w=majority`
  try {
    console.log('attempting to connect DB')
    await connect(mongoUrl)
    console.log('MongoDB Connected')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})
