// GMOあおぞらネット銀行 API クライアント

const BASE_URL = process.env.GMO_AOZORA_BASE_URL || 'https://api.sunabar.gmo-aozora.com/corporation/v1'
const ACCESS_TOKEN = process.env.GMO_AOZORA_ACCESS_TOKEN || ''
const ACCOUNT_ID = process.env.GMO_AOZORA_ACCOUNT_ID || ''

function getHeaders(): Record<string, string> {
  if (!ACCESS_TOKEN) throw new Error('GMO_AOZORA_ACCESS_TOKEN is not configured')
  return {
    'x-access-token': ACCESS_TOKEN,
    'Accept': 'application/json;charset=UTF-8',
  }
}

// ============================================
// 口座照会
// ============================================

export interface GmoAccount {
  accountId: string
  branchCode: string
  branchName: string
  accountTypeCode: string
  accountTypeName: string
  accountNumber: string
  primaryAccountCode: string
  primaryAccountCodeName: string
  accountName: string
  accountNameKana: string
  currencyCode: string
  currencyName: string
  transferLimitAmount: string
}

interface AccountsResponse {
  baseDate: string
  baseTime: string
  accounts: GmoAccount[]
}

export async function fetchAccounts(): Promise<AccountsResponse> {
  const res = await fetch(`${BASE_URL}/accounts`, { headers: getHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GMO API error (accounts): ${res.status} ${text}`)
  }
  return res.json()
}

// ============================================
// 入出金明細照会
// ============================================

export interface GmoTransaction {
  transactionDate: string      // YYYY-MM-DD
  valueDate: string            // YYYY-MM-DD
  transactionType: string      // "1"=入金, "2"=出金
  amount: string               // 金額（文字列）
  remarks: string              // 摘要（振込人名含む）
  balance: string              // 残高
  itemKey: string              // 明細キー
  applicantName?: string       // 依頼人名
  paymentBankName?: string     // 振込元銀行名
  paymentBranchName?: string   // 振込元支店名
  ediInfo?: string             // EDI情報
}

interface TransactionsResponse {
  accountId: string
  currencyCode: string
  currencyName: string
  dateFrom: string
  dateTo: string
  baseDate: string
  baseTime: string
  hasNext: string             // "true" / "false"
  nextItemKey?: string
  count: string
  transactions: GmoTransaction[]
}

interface FetchTransactionsParams {
  accountId?: string
  dateFrom?: string           // YYYY-MM-DD
  dateTo?: string             // YYYY-MM-DD
  nextItemKey?: string
}

export async function fetchTransactions(params: FetchTransactionsParams = {}): Promise<TransactionsResponse> {
  const accountId = params.accountId || ACCOUNT_ID
  if (!accountId) throw new Error('GMO_AOZORA_ACCOUNT_ID is not configured')

  const query = new URLSearchParams({ accountId })
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.nextItemKey) query.set('nextItemKey', params.nextItemKey)

  const res = await fetch(`${BASE_URL}/accounts/transactions?${query}`, { headers: getHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GMO API error (transactions): ${res.status} ${text}`)
  }
  return res.json()
}

/**
 * ページネーション付きで全明細を取得
 * 1リクエスト最大500件、hasNextで繰り返し
 */
export async function fetchAllTransactions(params: Omit<FetchTransactionsParams, 'nextItemKey'> = {}): Promise<GmoTransaction[]> {
  const all: GmoTransaction[] = []
  let nextItemKey: string | undefined

  do {
    const res = await fetchTransactions({ ...params, nextItemKey })
    all.push(...res.transactions)
    nextItemKey = res.hasNext === 'true' ? res.nextItemKey : undefined
  } while (nextItemKey)

  return all
}

// ============================================
// 残高照会
// ============================================

export interface GmoBalance {
  accountId: string
  accountTypeCode: string
  accountTypeName: string
  balance: string
  baseDate: string
  baseTime: string
  withdrawableAmount: string
  previousDayBalance: string
}

interface BalancesResponse {
  baseDate: string
  baseTime: string
  balances: GmoBalance[]
}

export async function fetchBalances(): Promise<BalancesResponse> {
  const res = await fetch(`${BASE_URL}/accounts/balances`, { headers: getHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GMO API error (balances): ${res.status} ${text}`)
  }
  return res.json()
}

// ============================================
// 取引データ → BankTransaction変換
// ============================================

/**
 * GMOの取引データをDB保存用の形式に変換
 * remarksから振込人名を抽出
 */
export function parseTransaction(txn: GmoTransaction): {
  transactionDate: Date
  senderName: string
  senderNameKana: string | null
  amount: number
  balance: number
  description: string
} {
  // remarks例: "振込 スナバ　タロウ" → 振込人名を抽出
  const senderName = txn.applicantName || extractSenderFromRemarks(txn.remarks)

  return {
    transactionDate: new Date(txn.transactionDate),
    senderName,
    senderNameKana: null, // APIからカナが取れた場合はセット
    amount: Number(txn.amount),
    balance: Number(txn.balance),
    description: txn.remarks,
  }
}

function extractSenderFromRemarks(remarks: string): string {
  // "振込 スナバ　タロウ" → "スナバ　タロウ"
  const match = remarks.match(/振込\s+(.+)/)
  return match ? match[1].trim() : remarks
}
