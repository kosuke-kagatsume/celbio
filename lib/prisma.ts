import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function getPool() {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool
  }

  // Vercelサーバーレス環境ではDATABASE_URL (pgbouncer経由)を使用
  const connectionString = process.env.DATABASE_URL

  const pool = new Pool({
    connectionString,
    max: 1, // サーバーレス環境では最小限のコネクション
  })

  globalForPrisma.pool = pool
  return pool
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const pool = getPool()
  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  globalForPrisma.prisma = prisma
  return prisma
}

export const prisma = getPrismaClient()
