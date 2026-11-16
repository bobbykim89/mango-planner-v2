// One-off migration: plans and users stored their creation time as `date`; the
// models now call it `createdAt` (like profiles). This renames the stored field
// in place, so every document keeps its original value.
//
// Without it, Mongoose fills a missing `createdAt` with its default (the time of
// the query) when it loads an old document.
//
// Run it once per database, right after deploying the rename:
//   node --env-file=.env.local scripts/migrate-created-at.ts --dry-run   # count only
//   node --env-file=.env.local scripts/migrate-created-at.ts             # rename
// (use --env-file=.env for production). Running it again changes nothing.
import mongoose from 'mongoose'
import { pathToFileURL } from 'node:url'

type Db = mongoose.mongo.Db

const COLLECTIONS = ['plans', 'users'] as const

export interface CollectionReport {
  /** documents that still have `date` and no `createdAt` */
  pending: number
  /** documents renamed by this run (0 on a dry run) */
  renamed: number
}

export const migrateCreatedAt = async (
  db: Db,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<Record<(typeof COLLECTIONS)[number], CollectionReport>> => {
  // a document created after the deploy already has createdAt; leave it alone
  const filter = { date: { $exists: true }, createdAt: { $exists: false } }
  const report = {} as Record<(typeof COLLECTIONS)[number], CollectionReport>
  for (const name of COLLECTIONS) {
    const collection = db.collection(name)
    const pending = await collection.countDocuments(filter)
    let renamed = 0
    if (!dryRun && pending > 0) {
      const res = await collection.updateMany(filter, {
        $rename: { date: 'createdAt' },
      })
      renamed = res.modifiedCount
    }
    report[name] = { pending, renamed }
  }
  return report
}

/** The same connection string the app builds in server/plugins/connectDb.ts. */
const mongoUrl = (env: NodeJS.ProcessEnv): string => {
  if (env.MONGO_URI) return env.MONGO_URI
  const parts = [
    'MONGO_ADMIN_ID',
    'MONGO_ADMIN_PW',
    'MONGO_CLUSTER_NAME',
    'MONGO_URL',
    'MONGO_DB_NAME',
  ]
  const missing = parts.filter((key) => !env[key])
  if (missing.length) {
    throw new Error(
      `Missing ${missing.join(', ')}; pass the app's env file with --env-file`,
    )
  }
  return `mongodb+srv://${env.MONGO_ADMIN_ID}:${env.MONGO_ADMIN_PW}@${env.MONGO_CLUSTER_NAME}.${env.MONGO_URL}.mongodb.net/${env.MONGO_DB_NAME}?retryWrites=true&w=majority`
}

const main = async () => {
  const dryRun = process.argv.includes('--dry-run')
  await mongoose.connect(mongoUrl(process.env))
  try {
    const db = mongoose.connection.db
    if (!db) throw new Error('Connected without a database')
    console.log(`Database: ${db.databaseName}${dryRun ? ' (dry run)' : ''}`)
    const report = await migrateCreatedAt(db, { dryRun })
    for (const [name, { pending, renamed }] of Object.entries(report)) {
      console.log(
        dryRun
          ? `${name}: ${pending} document(s) to rename`
          : `${name}: renamed ${renamed} of ${pending}`,
      )
    }
  } finally {
    await mongoose.disconnect()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
}
