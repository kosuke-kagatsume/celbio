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

  // Supabase直接接続URLを使用
  // Pooler (pgbouncer) はpgライブラリと互換性の問題があるため
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL must be set')
  }

  // プールを再利用
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString,
    max: 1, // サーバーレス環境では最小限
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
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
