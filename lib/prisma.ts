import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

// Prisma 7: グローバルキャッシュ
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Supabase Supavisor用の設定（非Neonホスト向け）
// pipelineConnect を無効化することで Supabase と互換性を確保
neonConfig.pipelineConnect = false

// Node.js環境（Vercel Serverless）でWebSocketを有効化
// globalThis.WebSocketが未定義の場合、wsモジュールを使用
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws
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
  // Session poolerはprepared statementsをサポート
  // pgbouncer=true パラメータを削除
  connectionString = connectionString
    .replace(':6543/', ':5432/')
    .replace('?pgbouncer=true', '')

  // PrismaNeonアダプターを使用（Supabase Supavisor と互換性あり）
  // Prisma 7では、PrismaNeonがPoolConfigを受け取り内部でPoolを作成
  const adapter = new PrismaNeon({
    connectionString,
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  })

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  globalForPrisma.prisma = prisma

  return prisma
}

export const prisma = createPrismaClient()
