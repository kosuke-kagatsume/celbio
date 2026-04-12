import { prisma } from '@/lib/prisma'

/** 案件ステータス定義 */
export const PROJECT_STATUSES = {
  registered: '依頼登録',
  quoting: '見積依頼中',
  quoted: '見積回答済',
  approved: '工務店承認済',
  payment_confirmed: '入金確認済',
  ordered: '発注済',
  in_progress: '施工中',
  completed: '完了',
} as const

export type ProjectStatus = keyof typeof PROJECT_STATUSES

/** ステータス遷移ルール */
const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  registered: ['quoting'],
  quoting: ['quoted'],
  quoted: ['approved'],
  approved: ['payment_confirmed'],
  payment_confirmed: ['ordered'],
  ordered: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
}

/**
 * ステータス遷移が有効かチェック
 */
export function isValidStatusTransition(current: ProjectStatus, next: ProjectStatus): boolean {
  return STATUS_TRANSITIONS[current]?.includes(next) ?? false
}

/**
 * 案件番号を自動生成（P{YYYYMMDD}-{NNNN}）
 */
export async function generateProjectNumber(): Promise<string> {
  const now = new Date()
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')

  const prefix = `P${dateStr}-`

  // 同日の最大番号を取得
  const latest = await prisma.project.findFirst({
    where: { projectNumber: { startsWith: prefix } },
    orderBy: { projectNumber: 'desc' },
    select: { projectNumber: true },
  })

  let seq = 1
  if (latest) {
    const lastSeq = parseInt(latest.projectNumber.split('-')[1], 10)
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1
    }
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}

/** ファイルタイプ定義 */
export const FILE_TYPES = {
  drawing: '図面',
  roof: '屋根形状',
  lot_map: '区画割り',
  photo: '写真',
  other: 'その他',
} as const

export type ProjectFileType = keyof typeof FILE_TYPES
