import { useRuntimeConfig } from '#imports'
import { RuntimeConfig } from '@nuxt/schema'
import { connect, disconnect } from 'mongoose'

class DatabaseConfig {
  private config: RuntimeConfig

  constructor() {
    this.config = useRuntimeConfig()
  }

  private setMongoUrl = (): string => {
    return `mongodb+srv://${this.config.mongoId}:${this.config.mongoPw}@${this.config.mongoClusterName}.${this.config.mongoUrl}.mongodb.net/${this.config.mongoDBName}?retryWrites=true&w=majority`
  }
  private disconnectDb = async (): Promise<void> => {
    console.log('disconnecting from db..')
    await disconnect()
    console.log('terminating the process..')
    process.exit(1)
  }
  public connectDb = async (): Promise<void> => {
    const dbUrl = this.setMongoUrl()
    try {
      console.log('attempting to connect DB..')
      console.log('Environment: ', process.env.NODE_ENV)
      await connect(dbUrl)
      console.log('successfully connected to DB!')
    } catch (error) {
      console.error(error)
      this.disconnectDb()
    }
  }
}

export default defineNitroPlugin(async () => {
  const dbConfig = new DatabaseConfig()
  await dbConfig.connectDb()
})
