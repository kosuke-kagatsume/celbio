import { prisma } from '@/lib/prisma'

export {
  PROJECT_STATUSES,
  type ProjectStatus,
  isValidStatusTransition,
  FILE_TYPES,
  type ProjectFileType,
} from '@/lib/project-constants'

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
