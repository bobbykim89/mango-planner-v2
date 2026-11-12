import { useRuntimeConfig } from '#imports'
import { RuntimeConfig } from '@nuxt/schema'
import { connect } from 'mongoose'

class DatabaseConfig {
  private config: RuntimeConfig

  constructor() {
    this.config = useRuntimeConfig()
  }

  private setMongoUrl = (): string => {
    if (this.config.mongoUri) return this.config.mongoUri
    return `mongodb+srv://${this.config.mongoId}:${this.config.mongoPw}@${this.config.mongoClusterName}.${this.config.mongoUrl}.mongodb.net/${this.config.mongoDBName}?retryWrites=true&w=majority`
  }
  public connectDb = async (): Promise<void> => {
    const dbUrl = this.setMongoUrl()
    try {
      console.log('attempting to connect DB..')
      console.log('Environment: ', process.env.NODE_ENV)
      await connect(dbUrl)
      console.log('successfully connected to DB!')
    } catch (error) {
      // don't exit the process (serverless); requests will fail and report the error
      console.error('failed to connect to DB:', error)
    }
  }
}

export default defineNitroPlugin(async () => {
  const dbConfig = new DatabaseConfig()
  await dbConfig.connectDb()
})
