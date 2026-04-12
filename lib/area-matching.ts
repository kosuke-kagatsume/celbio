import { prisma } from '@/lib/prisma'

/** 都道府県リスト（住所から抽出用） */
const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

/**
 * 住所文字列から都道府県を抽出
 */
export function extractPrefecture(address: string): string | null {
  for (const pref of PREFECTURES) {
    if (address.startsWith(pref)) return pref
  }
  return null
}

/**
 * 住所文字列から市区町村を抽出（都道府県の直後〜最初の数字or町/村/区の手前）
 */
export function extractCity(address: string): string | null {
  const pref = extractPrefecture(address)
  if (!pref) return null
  const rest = address.slice(pref.length)
  // 「○○市」「○○区」「○○郡○○町」などを抽出
  const match = rest.match(/^(.+?[市区町村])/)
  return match ? match[1] : null
}

/**
 * 住所からマッチする電気工事屋パートナーを検索
 * 優先順位: 市区町村一致 > 県全体 > 優先度高い順
 */
export async function findElectriciansForAddress(address: string): Promise<Array<{
  partnerId: string
  partnerName: string
  prefecture: string
  city: string | null
  priority: number
  matchType: 'city' | 'prefecture'
}>> {
  const prefecture = extractPrefecture(address)
  if (!prefecture) return []

  const city = extractCity(address)

  const mappings = await prisma.areaMapping.findMany({
    where: {
      prefecture,
      isActive: true,
      partner: { isActive: true },
    },
    include: {
      partner: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'desc' }],
  })

  // 市区町村一致 > 県全体の順でソート
  const results = mappings.map((m) => ({
    partnerId: m.partner.id,
    partnerName: m.partner.name,
    prefecture: m.prefecture,
    city: m.city,
    priority: m.priority,
    matchType: (m.city && city && m.city === city ? 'city' : 'prefecture') as 'city' | 'prefecture',
  }))

  // 市区町村一致を優先、その中で優先度順
  results.sort((a, b) => {
    if (a.matchType === 'city' && b.matchType !== 'city') return -1
    if (a.matchType !== 'city' && b.matchType === 'city') return 1
    return b.priority - a.priority
  })

  return results
}

/**
 * 電気工事屋パートナーが担当するエリアの案件IDを取得
 */
export async function getProjectIdsForElectrician(partnerId: string): Promise<string[]> {
  // 自分の担当エリアを取得
  const mappings = await prisma.areaMapping.findMany({
    where: { partnerId, isActive: true },
    select: { prefecture: true, city: true },
  })

  if (mappings.length === 0) return []

  // 各マッピングに対応する案件を検索
  const projects = await prisma.project.findMany({
    where: {
      address: { not: null },
      // 発注済以降のステータスの案件が対象
      status: { in: ['ordered', 'in_progress', 'completed'] },
    },
    select: { id: true, address: true },
  })

  // 住所ベースでフィルタリング
  return projects
    .filter((p) => {
      if (!p.address) return false
      const pref = extractPrefecture(p.address)
      if (!pref) return false
      const city = extractCity(p.address)

      return mappings.some((m) => {
        if (m.prefecture !== pref) return false
        // city指定がある場合はcityも一致する必要あり
        if (m.city && city && m.city !== city) return false
        return true
      })
    })
    .map((p) => p.id)
}
