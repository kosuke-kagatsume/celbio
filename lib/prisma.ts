import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7: グローバルキャッシュ
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// 接続プールの作成
function createPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool
  }

  // Vercelサーバーレス環境ではDATABASE_URL (pgbouncer経由)を使用
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // コネクションプールの最大数
    idleTimeoutMillis: 30000, // アイドル接続のタイムアウト
    connectionTimeoutMillis: 10000, // 接続タイムアウト
  })

  // 開発環境ではキャッシュ
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }

  return pool
}

// Prismaクライアントの作成
function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const pool = createPool()
  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // 開発環境ではキャッシュ（ホットリロード対策）
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}

export const prisma = createPrismaClient()
