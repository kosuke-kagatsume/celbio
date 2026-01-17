import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Prisma 7: アダプター経由で直接接続
const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function createSupabaseUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // ユーザーが既に存在する場合は取得
    if (error.message.includes('already been registered')) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users.find((u) => u.email === email);
      return existingUser?.id || null;
    }
    console.error(`Error creating user ${email}:`, error.message);
    return null;
  }

  return data.user?.id || null;
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. カテゴリの作成
  console.log('Creating categories...');
  const categoryData = [
    { code: 'CAT001', name: '太陽光関連', flowType: 'B', description: '太陽光パネル、パワコン等', sortOrder: 1 },
    { code: 'CAT002', name: '断熱材', flowType: 'A', description: '断熱パネル、断熱材', sortOrder: 2 },
    { code: 'CAT003', name: '外壁材', flowType: 'A', description: '外壁パネル、サイディング', sortOrder: 3 },
    { code: 'CAT004', name: '屋根材', flowType: 'A', description: '屋根材、防水シート', sortOrder: 4 },
    { code: 'CAT005', name: '住宅設備', flowType: 'B', description: 'キッチン、バス等', sortOrder: 5 },
    { code: 'CAT006', name: '窓・サッシ', flowType: 'B', description: '窓、サッシ、ガラス', sortOrder: 6 },
  ];

  const categories: { id: string; code: string }[] = [];
  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat,
    });
    categories.push({ id: category.id, code: category.code });
  }
  console.log('✅ Categories created\n');

  // 2. メーカーの作成
  console.log('Creating partners...');
  const partnerData = [
    {
      code: 'P001',
      name: 'ソーラーテック株式会社',
      nameKana: 'ソーラーテックカブシキガイシャ',
      email: 'info@solartech.example.com',
      phone: '03-1111-2222',
      address: '東京都港区芝1-1-1',
      bankName: '三菱UFJ銀行',
      bankBranch: '新橋支店',
      bankAccountType: '普通',
      bankAccountNumber: '1234567',
      bankAccountName: 'ソーラーテック（カ',
    },
    {
      code: 'P002',
      name: '断熱マテリアル株式会社',
      nameKana: 'ダンネツマテリアルカブシキガイシャ',
      email: 'info@insulation.example.com',
      phone: '03-3333-4444',
      address: '東京都中央区日本橋2-2-2',
      bankName: 'みずほ銀行',
      bankBranch: '日本橋支店',
      bankAccountType: '普通',
      bankAccountNumber: '2345678',
      bankAccountName: 'ダンネツマテリアル（カ',
    },
    {
      code: 'P003',
      name: '外装建材工業株式会社',
      nameKana: 'ガイソウケンザイコウギョウ',
      email: 'info@gaiso.example.com',
      phone: '06-5555-6666',
      address: '大阪府大阪市中央区本町3-3-3',
      bankName: '三井住友銀行',
      bankBranch: '本町支店',
      bankAccountType: '普通',
      bankAccountNumber: '3456789',
      bankAccountName: 'ガイソウケンザイコウギョウ（カ',
    },
    {
      code: 'P004',
      name: 'ウィンドウシステム株式会社',
      nameKana: 'ウィンドウシステム',
      email: 'info@window-sys.example.com',
      phone: '052-7777-8888',
      address: '愛知県名古屋市中区錦4-4-4',
      bankName: 'りそな銀行',
      bankBranch: '名古屋支店',
      bankAccountType: '普通',
      bankAccountNumber: '4567890',
      bankAccountName: 'ウィンドウシステム（カ',
    },
  ];

  const partners: { id: string; code: string; name: string }[] = [];
  for (const p of partnerData) {
    const partner = await prisma.partner.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
    partners.push({ id: partner.id, code: partner.code, name: partner.name });
  }
  console.log('✅ Partners created\n');

  // 3. 加盟店の作成
  console.log('Creating members...');
  const memberData = [
    {
      code: 'M001',
      name: '株式会社サンプル工務店',
      nameKana: 'カ）サンプルコウムテン',
      email: 'info@sample-koumuten.example.com',
      phone: '06-1111-2222',
      address: '大阪府大阪市北区梅田1-1-1',
      payerName: 'サンプルコウムテン',
    },
    {
      code: 'M002',
      name: '有限会社テスト建設',
      nameKana: 'ユ）テストケンセツ',
      email: 'info@test-kensetsu.example.com',
      phone: '052-3333-4444',
      address: '愛知県名古屋市中区栄2-2-2',
      payerName: 'テストケンセツ',
    },
    {
      code: 'M003',
      name: '株式会社関東ホーム',
      nameKana: 'カ）カントウホーム',
      email: 'info@kanto-home.example.com',
      phone: '03-5555-6666',
      address: '東京都世田谷区用賀3-3-3',
      payerName: 'カントウホーム',
    },
    {
      code: 'M004',
      name: '九州建設株式会社',
      nameKana: 'キュウシュウケンセツ',
      email: 'info@kyushu-kensetsu.example.com',
      phone: '092-7777-8888',
      address: '福岡県福岡市博多区博多駅前4-4-4',
      payerName: 'キュウシュウケンセツ',
    },
    {
      code: 'M005',
      name: '北海道ハウジング株式会社',
      nameKana: 'ホッカイドウハウジング',
      email: 'info@hokkaido-housing.example.com',
      phone: '011-9999-0000',
      address: '北海道札幌市中央区大通5-5-5',
      payerName: 'ホッカイドウハウジング',
    },
  ];

  const members: { id: string; code: string; name: string }[] = [];
  for (const m of memberData) {
    const member = await prisma.member.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
    members.push({ id: member.id, code: member.code, name: member.name });
  }
  console.log('✅ Members created\n');

  // 4. Supabase認証ユーザーとDBユーザーの作成
  console.log('Creating users...');

  const testPassword = 'Test1234!';
  const createdUsers: { id: string; email: string; role: string; memberId?: string; partnerId?: string }[] = [];

  // 管理者ユーザー
  const adminSupabaseId = await createSupabaseUser('admin@celibio.com', testPassword);
  if (adminSupabaseId) {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@celibio.com' },
      update: { supabaseUserId: adminSupabaseId },
      create: {
        email: 'admin@celibio.com',
        name: 'セリビオ管理者',
        role: 'admin',
        supabaseUserId: adminSupabaseId,
      },
    });
    createdUsers.push({ id: admin.id, email: admin.email, role: admin.role });
    console.log('✅ Admin user created: admin@celibio.com');
  }

  // 加盟店ユーザー
  const memberUsers = [
    { email: 'member@example.com', name: '山田太郎', memberCode: 'M001' },
    { email: 'yamamoto@sample-koumuten.com', name: '山本次郎', memberCode: 'M001' },
    { email: 'tanaka@test-kensetsu.com', name: '田中三郎', memberCode: 'M002' },
    { email: 'suzuki@kanto-home.com', name: '鈴木四郎', memberCode: 'M003' },
    { email: 'takahashi@kyushu-kensetsu.com', name: '高橋五郎', memberCode: 'M004' },
  ];

  for (const mu of memberUsers) {
    const member = members.find((m) => m.code === mu.memberCode);
    if (member) {
      const supabaseId = await createSupabaseUser(mu.email, testPassword);
      if (supabaseId) {
        const user = await prisma.user.upsert({
          where: { email: mu.email },
          update: { supabaseUserId: supabaseId },
          create: {
            email: mu.email,
            name: mu.name,
            role: 'member',
            memberId: member.id,
            supabaseUserId: supabaseId,
          },
        });
        createdUsers.push({ id: user.id, email: user.email, role: user.role, memberId: member.id });
        console.log(`✅ Member user created: ${mu.email}`);
      }
    }
  }

  // メーカーユーザー
  const partnerUsers = [
    { email: 'partner@example.com', name: '佐藤花子', partnerCode: 'P001' },
    { email: 'kimura@solartech.com', name: '木村一郎', partnerCode: 'P001' },
    { email: 'ito@insulation.com', name: '伊藤二郎', partnerCode: 'P002' },
    { email: 'watanabe@gaiso.com', name: '渡辺三郎', partnerCode: 'P003' },
    { email: 'nakamura@window-sys.com', name: '中村四郎', partnerCode: 'P004' },
  ];

  for (const pu of partnerUsers) {
    const partner = partners.find((p) => p.code === pu.partnerCode);
    if (partner) {
      const supabaseId = await createSupabaseUser(pu.email, testPassword);
      if (supabaseId) {
        const user = await prisma.user.upsert({
          where: { email: pu.email },
          update: { supabaseUserId: supabaseId },
          create: {
            email: pu.email,
            name: pu.name,
            role: 'partner',
            partnerId: partner.id,
            supabaseUserId: supabaseId,
          },
        });
        createdUsers.push({ id: user.id, email: user.email, role: user.role, partnerId: partner.id });
        console.log(`✅ Partner user created: ${pu.email}`);
      }
    }
  }

  // 5. 商材の作成
  console.log('\nCreating products...');
  const productData = [
    { code: 'SOLAR-400W', name: '高効率太陽光パネル 400W', partnerCode: 'P001', categoryCode: 'CAT001', unit: '枚', productType: 'TYPE_B', description: '高効率単結晶シリコン太陽光パネル' },
    { code: 'SOLAR-350W', name: '標準太陽光パネル 350W', partnerCode: 'P001', categoryCode: 'CAT001', unit: '枚', productType: 'TYPE_B', description: '標準多結晶シリコン太陽光パネル' },
    { code: 'POWCON-5K', name: 'パワーコンディショナー 5kW', partnerCode: 'P001', categoryCode: 'CAT001', unit: '台', productType: 'TYPE_B', description: '住宅用パワーコンディショナー' },
    { code: 'INSUL-50', name: '高性能断熱パネル 50mm', partnerCode: 'P002', categoryCode: 'CAT002', unit: '㎡', unitPrice: 3500, productType: 'TYPE_A', description: '高性能グラスウール断熱パネル' },
    { code: 'INSUL-100', name: '高性能断熱パネル 100mm', partnerCode: 'P002', categoryCode: 'CAT002', unit: '㎡', unitPrice: 5800, productType: 'TYPE_A', description: '高性能グラスウール断熱パネル' },
    { code: 'SIDE-WH01', name: '外壁サイディング ホワイト', partnerCode: 'P003', categoryCode: 'CAT003', unit: '㎡', unitPrice: 4200, productType: 'TYPE_A', description: '窯業系サイディング ホワイト' },
    { code: 'SIDE-GR01', name: '外壁サイディング グレー', partnerCode: 'P003', categoryCode: 'CAT003', unit: '㎡', unitPrice: 4200, productType: 'TYPE_A', description: '窯業系サイディング グレー' },
    { code: 'WIN-PG01', name: 'ペアガラス窓 標準', partnerCode: 'P004', categoryCode: 'CAT006', unit: '窓', productType: 'TYPE_B', description: 'アルミ樹脂複合ペアガラス窓' },
    { code: 'WIN-TG01', name: 'トリプルガラス窓 高断熱', partnerCode: 'P004', categoryCode: 'CAT006', unit: '窓', productType: 'TYPE_B', description: '樹脂トリプルガラス窓' },
  ];

  const products: { id: string; code: string; partnerId: string }[] = [];
  for (const pd of productData) {
    const partner = partners.find((p) => p.code === pd.partnerCode);
    const category = categories.find((c) => c.code === pd.categoryCode);
    if (partner && category) {
      const product = await prisma.product.upsert({
        where: { code: pd.code },
        update: {},
        create: {
          code: pd.code,
          name: pd.name,
          partnerId: partner.id,
          categoryId: category.id,
          unit: pd.unit,
          unitPrice: pd.unitPrice,
          productType: pd.productType,
          description: pd.description,
        },
      });
      products.push({ id: product.id, code: product.code, partnerId: partner.id });
    }
  }
  console.log('✅ Products created\n');

  // 6. 見積の作成
  console.log('Creating quotes...');
  const memberUser1 = createdUsers.find((u) => u.email === 'member@example.com');
  const memberUser2 = createdUsers.find((u) => u.email === 'tanaka@test-kensetsu.com');
  const memberUser3 = createdUsers.find((u) => u.email === 'suzuki@kanto-home.com');
  const solarCategory = categories.find((c) => c.code === 'CAT001');
  const windowCategory = categories.find((c) => c.code === 'CAT006');
  const partner1 = partners.find((p) => p.code === 'P001');
  const partner4 = partners.find((p) => p.code === 'P004');
  const member1 = members.find((m) => m.code === 'M001');
  const member2 = members.find((m) => m.code === 'M002');
  const member3 = members.find((m) => m.code === 'M003');

  const quotesData = [
    { quoteNumber: 'Q20250110-0001', title: '田中邸 太陽光設置工事', status: 'approved', memberId: member1?.id, userId: memberUser1?.id, categoryId: solarCategory?.id, totalAmount: 1850000, partnerId: partner1?.id },
    { quoteNumber: 'Q20250112-0001', title: '鈴木邸 太陽光設置工事', status: 'responded', memberId: member2?.id, userId: memberUser2?.id, categoryId: solarCategory?.id, totalAmount: 2200000, partnerId: partner1?.id },
    { quoteNumber: 'Q20250115-0001', title: '佐藤邸 窓リフォーム', status: 'requested', memberId: member1?.id, userId: memberUser1?.id, categoryId: windowCategory?.id, totalAmount: null, partnerId: partner4?.id },
    { quoteNumber: 'Q20250116-0001', title: '山本邸 太陽光+蓄電池', status: 'draft', memberId: member3?.id, userId: memberUser3?.id, categoryId: solarCategory?.id, totalAmount: null, partnerId: partner1?.id },
    { quoteNumber: 'Q20250117-0001', title: '高橋邸 窓交換工事', status: 'requested', memberId: member2?.id, userId: memberUser2?.id, categoryId: windowCategory?.id, totalAmount: null, partnerId: partner4?.id },
  ];

  const quotes: { id: string; quoteNumber: string; memberId: string; partnerId: string }[] = [];
  for (const q of quotesData) {
    if (q.memberId && q.userId && q.categoryId && q.partnerId) {
      const quote = await prisma.quote.upsert({
        where: { quoteNumber: q.quoteNumber },
        update: {},
        create: {
          quoteNumber: q.quoteNumber,
          title: q.title,
          status: q.status,
          memberId: q.memberId,
          userId: q.userId,
          categoryId: q.categoryId,
          totalAmount: q.totalAmount,
          deliveryAddress: '現場住所',
          desiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // 見積明細
      await prisma.quoteItem.upsert({
        where: { id: `${quote.id}-item1` },
        update: {},
        create: {
          id: `${quote.id}-item1`,
          quoteId: quote.id,
          partnerId: q.partnerId,
          itemName: q.title.includes('太陽光') ? '太陽光パネル一式' : '窓サッシ一式',
          specification: '詳細仕様は別紙参照',
          quantity: q.title.includes('太陽光') ? 20 : 8,
          unit: q.title.includes('太陽光') ? '枚' : '窓',
          unitPrice: q.totalAmount ? q.totalAmount / (q.title.includes('太陽光') ? 20 : 8) : null,
          subtotal: q.totalAmount,
          status: q.status === 'approved' || q.status === 'responded' ? 'quoted' : 'pending',
        },
      });

      quotes.push({ id: quote.id, quoteNumber: quote.quoteNumber, memberId: q.memberId, partnerId: q.partnerId });
    }
  }
  console.log('✅ Quotes created\n');

  // 7. 発注の作成
  console.log('Creating orders...');
  const ordersData = [
    { orderNumber: 'O20250111-0001', status: 'completed', memberId: member1?.id, userId: memberUser1?.id, totalAmount: 175000, quoteId: null },
    { orderNumber: 'O20250113-0001', status: 'invoiced', memberId: member2?.id, userId: memberUser2?.id, totalAmount: 348000, quoteId: null },
    { orderNumber: 'O20250114-0001', status: 'shipped', memberId: member1?.id, userId: memberUser1?.id, totalAmount: 210000, quoteId: null },
    { orderNumber: 'O20250115-0001', status: 'confirmed', memberId: member3?.id, userId: memberUser3?.id, totalAmount: 580000, quoteId: null },
    { orderNumber: 'O20250116-0001', status: 'ordered', memberId: member1?.id, userId: memberUser1?.id, totalAmount: 126000, quoteId: null },
  ];

  const orders: { id: string; orderNumber: string; memberId: string; totalAmount: number }[] = [];
  const partner2 = partners.find((p) => p.code === 'P002');
  const partner3 = partners.find((p) => p.code === 'P003');

  for (const o of ordersData) {
    if (o.memberId && o.userId) {
      const order = await prisma.order.upsert({
        where: { orderNumber: o.orderNumber },
        update: {},
        create: {
          orderNumber: o.orderNumber,
          status: o.status,
          memberId: o.memberId,
          userId: o.userId,
          quoteId: o.quoteId,
          totalAmount: o.totalAmount,
          deliveryAddress: '現場住所',
          desiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          orderedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      });

      // 発注明細
      const orderPartner = o.orderNumber.includes('0001') ? partner2 : partner3;
      if (orderPartner) {
        await prisma.orderItem.upsert({
          where: { id: `${order.id}-item1` },
          update: {},
          create: {
            id: `${order.id}-item1`,
            orderId: order.id,
            partnerId: orderPartner.id,
            itemName: orderPartner.code === 'P002' ? '断熱パネル 50mm' : '外壁サイディング',
            specification: '標準仕様',
            quantity: 50,
            unit: '㎡',
            unitPrice: o.totalAmount / 50,
            subtotal: o.totalAmount,
            status: o.status === 'completed' ? 'delivered' : 'pending',
          },
        });
      }

      orders.push({ id: order.id, orderNumber: order.orderNumber, memberId: o.memberId, totalAmount: o.totalAmount });
    }
  }
  console.log('✅ Orders created\n');

  // 8. 請求書の作成
  console.log('Creating invoices...');
  for (const order of orders) {
    const orderData = ordersData.find((o) => o.orderNumber === order.orderNumber);
    if (orderData && (orderData.status === 'invoiced' || orderData.status === 'completed')) {
      const orderPartner = order.orderNumber.includes('0001') ? partner2 : partner3;
      if (orderPartner) {
        const taxAmount = Math.floor(order.totalAmount * 0.1);
        await prisma.invoice.upsert({
          where: { invoiceNumber: `INV${order.orderNumber.replace('O', '')}` },
          update: {},
          create: {
            invoiceNumber: `INV${order.orderNumber.replace('O', '')}`,
            orderId: order.id,
            partnerId: orderPartner.id,
            memberId: order.memberId,
            amount: order.totalAmount,
            taxAmount: taxAmount,
            totalAmount: order.totalAmount + taxAmount,
            status: orderData.status === 'completed' ? 'paid' : 'issued',
            issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
            paidAt: orderData.status === 'completed' ? new Date() : null,
          },
        });
      }
    }
  }
  console.log('✅ Invoices created\n');

  // 9. システム設定の作成
  console.log('Creating system settings...');
  const settingsData = [
    { key: 'company_name', value: 'セリビオ株式会社', description: '会社名' },
    { key: 'company_address', value: '東京都千代田区丸の内1-1-1', description: '住所' },
    { key: 'company_phone', value: '03-1234-5678', description: '電話番号' },
    { key: 'company_email', value: 'info@celibio.com', description: 'メールアドレス' },
    { key: 'tax_rate', value: '10', description: '消費税率' },
    { key: 'payment_due_days', value: '30', description: '支払期限日数' },
    { key: 'payment_tolerance', value: '100', description: '入金差異許容額' },
    { key: 'notify_quote_request', value: 'true', description: '見積依頼通知' },
    { key: 'notify_order', value: 'true', description: '発注通知' },
    { key: 'notify_invoice', value: 'true', description: '請求書通知' },
    { key: 'notify_payment', value: 'false', description: '入金通知' },
  ];

  for (const setting of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }
  console.log('✅ System settings created\n');

  // 10. 監査ログの作成（サンプル）
  console.log('Creating audit logs...');
  const adminUser = createdUsers.find((u) => u.role === 'admin');
  if (adminUser) {
    const logData = [
      { action: 'create', entityType: 'member', entityId: member1?.id || '', newValue: { name: '株式会社サンプル工務店' } },
      { action: 'create', entityType: 'partner', entityId: partner1?.id || '', newValue: { name: 'ソーラーテック株式会社' } },
      { action: 'update', entityType: 'system_setting', entityId: 'tax_rate', oldValue: { value: '8' }, newValue: { value: '10' } },
      { action: 'approve', entityType: 'quote', entityId: quotes[0]?.id || '', newValue: { status: 'approved' } },
      { action: 'create', entityType: 'order', entityId: orders[0]?.id || '', newValue: { orderNumber: orders[0]?.orderNumber } },
    ];

    for (const log of logData) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValue: log.oldValue ?? Prisma.DbNull,
          newValue: log.newValue,
        },
      });
    }
  }
  console.log('✅ Audit logs created\n');

  console.log('🎉 Seeding completed!\n');
  console.log('========================================');
  console.log('Test accounts (password: Test1234!):');
  console.log('========================================');
  console.log('Admin:');
  console.log('  - admin@celibio.com');
  console.log('\nMember (加盟店):');
  console.log('  - member@example.com (サンプル工務店)');
  console.log('  - yamamoto@sample-koumuten.com (サンプル工務店)');
  console.log('  - tanaka@test-kensetsu.com (テスト建設)');
  console.log('  - suzuki@kanto-home.com (関東ホーム)');
  console.log('  - takahashi@kyushu-kensetsu.com (九州建設)');
  console.log('\nPartner (メーカー):');
  console.log('  - partner@example.com (ソーラーテック)');
  console.log('  - kimura@solartech.com (ソーラーテック)');
  console.log('  - ito@insulation.com (断熱マテリアル)');
  console.log('  - watanabe@gaiso.com (外装建材工業)');
  console.log('  - nakamura@window-sys.com (ウィンドウシステム)');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
