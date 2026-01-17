import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7: グローバルキャッシュ
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Vercel Serverless環境での接続設定
function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // 接続文字列を取得
  // Supabase Session Pooler (port 5432) を使用
  let connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL must be set')
  }

  // Transaction pooler (6543) をSession pooler (5432) に変換
  // pgbouncer=true パラメータを削除
  connectionString = connectionString
    .replace(':6543/', ':5432/')
    .replace('?pgbouncer=true', '')

  // プールを再利用
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false, // Supabase SSL
    },
  })

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  globalForPrisma.prisma = prisma

  return prisma
}

export const prisma = createPrismaClient()
