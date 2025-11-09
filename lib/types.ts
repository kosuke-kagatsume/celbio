// ユーザー役割
export type UserRole = 'admin' | 'contractor';

// ユーザー
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  contractorId?: string;
}

// 工務店
export interface Contractor {
  id: string;
  name: string;
  marginRate: number; // 粗利率（例: 0.3 = 30%）
  createdAt: string;
}

// 見積ステータス
export type QuoteStatus = '依頼受付' | '見積中' | '見積完了';

// 工事範囲
export type WorkScope = 'パネルのみ' | 'パネル+設置工事' | 'パネル+設置工事+電気工事';

// アップロードファイル種類
export type FileType = '配置図' | '平面図' | '立面図' | '屋根仕上げ材資料' | 'その他';

// アップロードファイル
export interface QuoteFile {
  id: string;
  quoteId: string;
  fileType: FileType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

// 見積依頼
export interface Quote {
  id: string;
  contractorId: string;
  contractorName: string;
  userId: string;
  userName: string;
  status: QuoteStatus;
  workScope: WorkScope;
  desiredCapacity: string; // 希望容量（例: "7.27kW"）
  address: string;
  comment?: string;
  files: QuoteFile[];
  createdAt: string;
  updatedAt: string;
  estimatedAt?: string; // 見積完了日時
}

// ダンドリワーク見積
export interface DandoriQuote {
  id: string;
  quoteId: string;
  dandoriProjectId: string;
  manufacturerPdfUrl?: string;
  electricalPdfUrl?: string;
  amountA?: number; // (A) 太陽光機器・機台舎議
  amountB?: number; // (B) 太陽光工事金額
  createdAt: string;
}

// 通知
export interface Notification {
  id: string;
  userId: string;
  quoteId: string;
  type: 'new_quote' | 'quote_approved' | 'quote_completed' | 'quote_rejected';
  message: string;
  read: boolean;
  createdAt: string;
}

// コメント
export interface Comment {
  id: string;
  quoteId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}
