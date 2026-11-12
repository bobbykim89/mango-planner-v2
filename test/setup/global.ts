import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createWriteStream, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getRandomPort } from 'get-port-please'
import { MongoMemoryServer } from 'mongodb-memory-server'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    baseUrl: string
    mongoUri: string
    serverLog: string
  }
}

const root = resolve(import.meta.dirname, '../..')
const tmpDir = resolve(root, 'test/.tmp')
const serverLog = resolve(tmpDir, 'server.log')

const waitForServer = async (url: string, timeoutMs = 60_000) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`${url}/api/does-not-exist`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error(`Test server did not start within ${timeoutMs} ms`)
}

export default async function setup(project: TestProject) {
  mkdirSync(tmpDir, { recursive: true })

  const mongo = await MongoMemoryServer.create()
  const mongoUri = mongo.getUri('mango-planner-test')

  if (process.env.SKIP_BUILD !== '1') {
    // Build with fake, committed values so the developer's .env is never loaded.
    const build = spawnSync(
      resolve(root, 'node_modules/.bin/nuxt'),
      ['build', '--dotenv', 'test/test.env'],
      {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' },
      },
    )
    if (build.status !== 0)
      throw new Error('nuxt build failed for the API tests')
  }

  const port = await getRandomPort()
  const logStream = createWriteStream(serverLog, { flags: 'w' })
  const server: ChildProcess = spawn('node', ['.output/server/index.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      NITRO_PORT: String(port),
      NUXT_MONGO_URI: mongoUri,
      NUXT_JWT_SECRET: 'test-secret',
      NUXT_APP_URL: 'https://app.test',
      NUXT_MAILER_TRANSPORT: 'log',
      NUXT_OPEN_WEATHER_API_KEY: 'test',
      NUXT_OPEN_WEATHER_URL: 'http://127.0.0.1:9/data/2.5/weather',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout?.pipe(logStream)
  server.stderr?.pipe(logStream)

  const baseUrl = `http://127.0.0.1:${port}`
  await waitForServer(baseUrl)

  project.provide('baseUrl', baseUrl)
  project.provide('mongoUri', mongoUri)
  project.provide('serverLog', serverLog)

  return async () => {
    server.kill()
    await mongo.stop()
  }
}
