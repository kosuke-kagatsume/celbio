import { User, Contractor, Quote, Notification, Comment, QuoteFile } from './types';

// モック工務店データ
export const mockContractors: Contractor[] = [
  {
    id: 'contractor-1',
    name: '山田工務店',
    marginRate: 0.30, // 30%
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'contractor-2',
    name: '田中建設株式会社',
    marginRate: 0.35, // 35%
    createdAt: '2025-02-10T10:00:00Z',
  },
  {
    id: 'contractor-3',
    name: '佐藤ハウス',
    marginRate: 0.28, // 28%
    createdAt: '2025-03-05T11:00:00Z',
  },
];

// モックユーザーデータ
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@celbio.com',
    name: 'セルビオ管理者',
    role: 'admin',
  },
  {
    id: 'user-1',
    email: 'yamada@example.com',
    name: '山田太郎',
    role: 'contractor',
    contractorId: 'contractor-1',
  },
  {
    id: 'user-2',
    email: 'tanaka@example.com',
    name: '田中花子',
    role: 'contractor',
    contractorId: 'contractor-2',
  },
  {
    id: 'user-3',
    email: 'sato@example.com',
    name: '佐藤次郎',
    role: 'contractor',
    contractorId: 'contractor-3',
  },
];

// モックファイルデータ
const mockFiles: QuoteFile[] = [
  {
    id: 'file-1',
    quoteId: 'quote-1',
    fileType: '配置図',
    fileName: '配置図_物件A.pdf',
    fileUrl: '/mock-files/layout-a.pdf',
    uploadedAt: '2025-08-01T10:00:00Z',
  },
  {
    id: 'file-2',
    quoteId: 'quote-1',
    fileType: '平面図',
    fileName: '平面図_物件A.pdf',
    fileUrl: '/mock-files/floor-a.pdf',
    uploadedAt: '2025-08-01T10:01:00Z',
  },
  {
    id: 'file-3',
    quoteId: 'quote-2',
    fileType: '配置図',
    fileName: '配置図_物件B.pdf',
    fileUrl: '/mock-files/layout-b.pdf',
    uploadedAt: '2025-08-10T14:00:00Z',
  },
];

// モック見積データ
export const mockQuotes: Quote[] = [
  {
    id: 'quote-1',
    contractorId: 'contractor-1',
    contractorName: '山田工務店',
    userId: 'user-1',
    userName: '山田太郎',
    status: '見積完了',
    workScope: 'パネル+設置工事+電気工事',
    desiredCapacity: '7.27kW',
    address: '滋賀県近江八幡市〇〇町123',
    comment: '至急対応希望です。よろしくお願いいたします。',
    files: mockFiles.filter(f => f.quoteId === 'quote-1'),
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: '2025-08-05T15:30:00Z',
    estimatedAt: '2025-08-05T15:30:00Z',
  },
  {
    id: 'quote-2',
    contractorId: 'contractor-2',
    contractorName: '田中建設株式会社',
    userId: 'user-2',
    userName: '田中花子',
    status: '見積中',
    workScope: 'パネル+設置工事',
    desiredCapacity: '5.82kW',
    address: '福井県福井市△△123-45',
    files: mockFiles.filter(f => f.quoteId === 'quote-2'),
    createdAt: '2025-08-10T14:00:00Z',
    updatedAt: '2025-08-10T16:00:00Z',
  },
  {
    id: 'quote-3',
    contractorId: 'contractor-1',
    contractorName: '山田工務店',
    userId: 'user-1',
    userName: '山田太郎',
    status: '依頼受付',
    workScope: 'パネルのみ',
    desiredCapacity: '8.73kW',
    address: '岐阜県岐阜市××1-2-3',
    comment: '新規分譲地案件です。',
    files: [],
    createdAt: '2025-08-15T09:00:00Z',
    updatedAt: '2025-08-15T09:00:00Z',
  },
  {
    id: 'quote-4',
    contractorId: 'contractor-3',
    contractorName: '佐藤ハウス',
    userId: 'user-3',
    userName: '佐藤次郎',
    status: '見積完了',
    workScope: 'パネル+設置工事+電気工事',
    desiredCapacity: '6.5kW',
    address: '三重県四日市市◎◎5-6-7',
    files: [],
    createdAt: '2025-07-20T11:00:00Z',
    updatedAt: '2025-07-25T14:00:00Z',
    estimatedAt: '2025-07-25T14:00:00Z',
  },
];

// モック通知データ
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'admin-1',
    quoteId: 'quote-3',
    type: 'new_quote',
    message: '山田工務店から新規見積依頼が届きました',
    read: false,
    createdAt: '2025-08-15T09:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    quoteId: 'quote-1',
    type: 'quote_completed',
    message: '見積が完成しました。ご確認ください。',
    read: true,
    createdAt: '2025-08-05T15:30:00Z',
  },
  {
    id: 'notif-3',
    userId: 'user-2',
    quoteId: 'quote-2',
    type: 'quote_approved',
    message: 'ご依頼の見積が承認されました。見積作成中です。',
    read: false,
    createdAt: '2025-08-10T16:00:00Z',
  },
];

// モックコメントデータ
export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    quoteId: 'quote-1',
    userId: 'admin-1',
    userName: 'セルビオ管理者',
    userRole: 'admin',
    content: '資料を確認しました。承認いたします。',
    createdAt: '2025-08-01T11:00:00Z',
  },
  {
    id: 'comment-2',
    quoteId: 'quote-1',
    userId: 'user-1',
    userName: '山田太郎',
    userRole: 'contractor',
    content: 'ありがとうございます。よろしくお願いいたします。',
    createdAt: '2025-08-01T12:00:00Z',
  },
  {
    id: 'comment-3',
    quoteId: 'quote-2',
    userId: 'admin-1',
    userName: 'セルビオ管理者',
    userRole: 'admin',
    content: '立面図を追加でアップロードしていただけますか？',
    createdAt: '2025-08-10T15:00:00Z',
  },
];

// 現在のログインユーザー（モック用）
export const currentUser: User = mockUsers[1]; // 山田太郎（工務店ユーザー）
export const currentAdminUser: User = mockUsers[0]; // セルビオ管理者
