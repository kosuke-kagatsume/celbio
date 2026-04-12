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

  // ============================================
  // 1. カテゴリの作成
  // ============================================
  console.log('Creating categories...');
  const categoryData = [
    { code: 'CAT001', name: '太陽光関連', flowType: 'B', description: '太陽光パネル、パワコン等', sortOrder: 1 },
    { code: 'CAT002', name: '断熱材', flowType: 'A', description: '断熱パネル、断熱材', sortOrder: 2 },
    { code: 'CAT003', name: '外壁材', flowType: 'A', description: '外壁パネル、サイディング', sortOrder: 3 },
    { code: 'CAT004', name: '屋根材', flowType: 'A', description: '屋根材、防水シート', sortOrder: 4 },
    { code: 'CAT005', name: '住宅設備', flowType: 'B', description: 'キッチン、バス等', sortOrder: 5 },
    { code: 'CAT006', name: '窓・サッシ', flowType: 'B', description: '窓、サッシ、ガラス', sortOrder: 6 },
    { code: 'CAT007', name: '電気工事', flowType: 'B', description: '電気工事（人工）', sortOrder: 7 },
    { code: 'CAT008', name: '電気工事部材', flowType: 'A', description: '電気工事用部材', sortOrder: 8 },
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

  // ============================================
  // 2. メーカー・電気工事屋の作成
  // ============================================
  console.log('Creating partners...');
  const partnerData = [
    // メーカー
    {
      code: 'P001', name: 'ソーラーテック株式会社', nameKana: 'ソーラーテックカブシキガイシャ',
      partnerType: 'manufacturer',
      email: 'info@solartech.example.com', phone: '03-1111-2222', address: '東京都港区芝1-1-1',
      bankName: '三菱UFJ銀行', bankBranch: '新橋支店', bankAccountType: '普通',
      bankAccountNumber: '1234567', bankAccountName: 'ソーラーテック（カ',
    },
    {
      code: 'P002', name: '断熱マテリアル株式会社', nameKana: 'ダンネツマテリアルカブシキガイシャ',
      partnerType: 'manufacturer',
      email: 'info@insulation.example.com', phone: '03-3333-4444', address: '東京都中央区日本橋2-2-2',
      bankName: 'みずほ銀行', bankBranch: '日本橋支店', bankAccountType: '普通',
      bankAccountNumber: '2345678', bankAccountName: 'ダンネツマテリアル（カ',
    },
    {
      code: 'P003', name: '外装建材工業株式会社', nameKana: 'ガイソウケンザイコウギョウ',
      partnerType: 'manufacturer',
      email: 'info@gaiso.example.com', phone: '06-5555-6666', address: '大阪府大阪市中央区本町3-3-3',
      bankName: '三井住友銀行', bankBranch: '本町支店', bankAccountType: '普通',
      bankAccountNumber: '3456789', bankAccountName: 'ガイソウケンザイコウギョウ（カ',
    },
    {
      code: 'P004', name: 'ウィンドウシステム株式会社', nameKana: 'ウィンドウシステム',
      partnerType: 'manufacturer',
      email: 'info@window-sys.example.com', phone: '052-7777-8888', address: '愛知県名古屋市中区錦4-4-4',
      bankName: 'りそな銀行', bankBranch: '名古屋支店', bankAccountType: '普通',
      bankAccountNumber: '4567890', bankAccountName: 'ウィンドウシステム（カ',
    },
    // 電気工事屋
    {
      code: 'E001', name: '関東電設株式会社', nameKana: 'カントウデンセツカブシキガイシャ',
      partnerType: 'electrician',
      email: 'info@kanto-densetsu.example.com', phone: '03-2222-3333', address: '東京都板橋区板橋1-1-1',
      bankName: '三菱UFJ銀行', bankBranch: '板橋支店', bankAccountType: '普通',
      bankAccountNumber: '5678901', bankAccountName: 'カントウデンセツ（カ',
    },
    {
      code: 'E002', name: '関西電工株式会社', nameKana: 'カンサイデンコウカブシキガイシャ',
      partnerType: 'electrician',
      email: 'info@kansai-denko.example.com', phone: '06-4444-5555', address: '大阪府大阪市西区西本町2-2-2',
      bankName: 'みずほ銀行', bankBranch: '西本町支店', bankAccountType: '普通',
      bankAccountNumber: '6789012', bankAccountName: 'カンサイデンコウ（カ',
    },
    {
      code: 'E003', name: '九州電気工事株式会社', nameKana: 'キュウシュウデンキコウジ',
      partnerType: 'electrician',
      email: 'info@kyushu-denki.example.com', phone: '092-6666-7777', address: '福岡県福岡市中央区天神3-3-3',
      bankName: '西日本シティ銀行', bankBranch: '天神支店', bankAccountType: '普通',
      bankAccountNumber: '7890123', bankAccountName: 'キュウシュウデンキコウジ（カ',
    },
  ];

  const partners: { id: string; code: string; name: string; partnerType: string }[] = [];
  for (const p of partnerData) {
    const partner = await prisma.partner.upsert({
      where: { code: p.code },
      update: { partnerType: p.partnerType },
      create: p,
    });
    partners.push({ id: partner.id, code: partner.code, name: partner.name, partnerType: p.partnerType });
  }
  console.log('✅ Partners created (4 manufacturers + 3 electricians)\n');

  // ============================================
  // 3. 加盟店の作成
  // ============================================
  console.log('Creating members...');
  const memberData = [
    { code: 'M001', name: '株式会社サンプル工務店', nameKana: 'カ）サンプルコウムテン', email: 'info@sample-koumuten.example.com', phone: '06-1111-2222', address: '大阪府大阪市北区梅田1-1-1', payerName: 'サンプルコウムテン' },
    { code: 'M002', name: '有限会社テスト建設', nameKana: 'ユ）テストケンセツ', email: 'info@test-kensetsu.example.com', phone: '052-3333-4444', address: '愛知県名古屋市中区栄2-2-2', payerName: 'テストケンセツ' },
    { code: 'M003', name: '株式会社関東ホーム', nameKana: 'カ）カントウホーム', email: 'info@kanto-home.example.com', phone: '03-5555-6666', address: '東京都世田谷区用賀3-3-3', payerName: 'カントウホーム' },
    { code: 'M004', name: '九州建設株式会社', nameKana: 'キュウシュウケンセツ', email: 'info@kyushu-kensetsu.example.com', phone: '092-7777-8888', address: '福岡県福岡市博多区博多駅前4-4-4', payerName: 'キュウシュウケンセツ' },
    { code: 'M005', name: '北海道ハウジング株式会社', nameKana: 'ホッカイドウハウジング', email: 'info@hokkaido-housing.example.com', phone: '011-9999-0000', address: '北海道札幌市中央区大通5-5-5', payerName: 'ホッカイドウハウジング' },
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

  // ============================================
  // 4. ユーザーの作成（Supabase Auth + DB）
  // ============================================
  console.log('Creating users...');
  const testPassword = 'Test1234!';
  const createdUsers: { id: string; email: string; role: string; memberId?: string; partnerId?: string }[] = [];

  // 管理者
  const adminSupabaseId = await createSupabaseUser('admin@celibio.com', testPassword);
  if (adminSupabaseId) {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@celibio.com' },
      update: { supabaseUserId: adminSupabaseId },
      create: { email: 'admin@celibio.com', name: 'セリビオ管理者', role: 'admin', supabaseUserId: adminSupabaseId },
    });
    createdUsers.push({ id: admin.id, email: admin.email, role: admin.role });
    console.log('✅ Admin: admin@celibio.com');
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
          create: { email: mu.email, name: mu.name, role: 'member', memberId: member.id, supabaseUserId: supabaseId },
        });
        createdUsers.push({ id: user.id, email: user.email, role: user.role, memberId: member.id });
        console.log(`✅ Member: ${mu.email}`);
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
          create: { email: pu.email, name: pu.name, role: 'partner', partnerId: partner.id, supabaseUserId: supabaseId },
        });
        createdUsers.push({ id: user.id, email: user.email, role: user.role, partnerId: partner.id });
        console.log(`✅ Partner: ${pu.email}`);
      }
    }
  }

  // 電気工事屋ユーザー
  const electricianUsers = [
    { email: 'sato@kanto-densetsu.com', name: '佐藤太一', partnerCode: 'E001' },
    { email: 'honda@kansai-denko.com', name: '本田次郎', partnerCode: 'E002' },
    { email: 'morita@kyushu-denki.com', name: '森田三郎', partnerCode: 'E003' },
  ];

  for (const eu of electricianUsers) {
    const partner = partners.find((p) => p.code === eu.partnerCode);
    if (partner) {
      const supabaseId = await createSupabaseUser(eu.email, testPassword);
      if (supabaseId) {
        const user = await prisma.user.upsert({
          where: { email: eu.email },
          update: { supabaseUserId: supabaseId },
          create: { email: eu.email, name: eu.name, role: 'electrician', partnerId: partner.id, supabaseUserId: supabaseId },
        });
        createdUsers.push({ id: user.id, email: user.email, role: user.role, partnerId: partner.id });
        console.log(`✅ Electrician: ${eu.email}`);
      }
    }
  }
  console.log('');

  // ============================================
  // 5. 商材の作成
  // ============================================
  console.log('Creating products...');
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
          code: pd.code, name: pd.name, partnerId: partner.id, categoryId: category.id,
          unit: pd.unit, unitPrice: pd.unitPrice, productType: pd.productType, description: pd.description,
        },
      });
      products.push({ id: product.id, code: product.code, partnerId: partner.id });
    }
  }
  console.log('✅ Products created\n');

  // ============================================
  // 6. マージン係数の作成
  // ============================================
  console.log('Creating margin rates...');
  // 既存データ削除（nullを含むuniqueのupsertが困難なため）
  await prisma.marginRate.deleteMany();

  const partner1 = partners.find((p) => p.code === 'P001')!;
  const partner2 = partners.find((p) => p.code === 'P002')!;
  const partner3 = partners.find((p) => p.code === 'P003')!;
  const partner4 = partners.find((p) => p.code === 'P004')!;
  const solarCat = categories.find((c) => c.code === 'CAT001')!;
  const insulCat = categories.find((c) => c.code === 'CAT002')!;
  const exteriorCat = categories.find((c) => c.code === 'CAT003')!;
  const windowCat = categories.find((c) => c.code === 'CAT006')!;
  const elecCat = categories.find((c) => c.code === 'CAT007')!;
  const elecPartsCat = categories.find((c) => c.code === 'CAT008')!;

  // 品目の参照
  const solarPanel400 = products.find((p) => p.code === 'SOLAR-400W')!;
  const solarPanel350 = products.find((p) => p.code === 'SOLAR-350W')!;
  const powerCon = products.find((p) => p.code === 'POWCON-5K')!;

  // 計算式: ROUNDUP(原価 / costRatio, roundingUnit) + fixedAddition
  const marginData: Prisma.MarginRateCreateInput[] = [
    // === デフォルト（フォールバック用） ===
    { itemType: 'material', costRatio: 0.7000, fixedAddition: 0, roundingUnit: -3, description: 'デフォルト物品マージン（原価率70%≒30%マージン）' },
    { itemType: 'labor', costRatio: 0.8500, fixedAddition: 0, roundingUnit: -3, description: 'デフォルト人工マージン（原価率85%≒15%マージン）' },

    // === 品目単位のマージン（実際のExcel計算式に基づく） ===
    // ソーラーパネル: 原価/0.70 + 5,000
    { product: { connect: { id: solarPanel400.id } }, partner: { connect: { id: partner1.id } }, category: { connect: { id: solarCat.id } }, itemType: 'material', costRatio: 0.7000, fixedAddition: 5000, roundingUnit: -3, description: 'ソーラーパネル400W: 原価率70%+5,000円' },
    { product: { connect: { id: solarPanel350.id } }, partner: { connect: { id: partner1.id } }, category: { connect: { id: solarCat.id } }, itemType: 'material', costRatio: 0.7000, fixedAddition: 5000, roundingUnit: -3, description: 'ソーラーパネル350W: 原価率70%+5,000円' },
    // パワコン: 原価/0.85 + 17,000
    { product: { connect: { id: powerCon.id } }, partner: { connect: { id: partner1.id } }, category: { connect: { id: solarCat.id } }, itemType: 'material', costRatio: 0.8500, fixedAddition: 17000, roundingUnit: -3, description: 'パワコン: 原価率85%+17,000円' },

    // === カテゴリ単位のマージン ===
    // 断熱材
    { partner: { connect: { id: partner2.id } }, category: { connect: { id: insulCat.id } }, itemType: 'material', costRatio: 0.8200, fixedAddition: 0, roundingUnit: -3, description: '断熱マテリアル断熱材: 原価率82%≒18%マージン' },
    // 外壁材
    { partner: { connect: { id: partner3.id } }, category: { connect: { id: exteriorCat.id } }, itemType: 'material', costRatio: 0.8000, fixedAddition: 0, roundingUnit: -3, description: '外装建材外壁材: 原価率80%≒20%マージン' },
    // 窓
    { partner: { connect: { id: partner4.id } }, category: { connect: { id: windowCat.id } }, itemType: 'material', costRatio: 0.7800, fixedAddition: 0, roundingUnit: -3, description: 'ウィンドウ窓: 原価率78%≒22%マージン' },

    // === 電気工事系（固定単価のため参考値） ===
    { category: { connect: { id: elecCat.id } }, itemType: 'labor', costRatio: 0.8500, fixedAddition: 0, roundingUnit: -3, description: '電気工事人工: 原価率85%（取り決め書ベース）' },
    { category: { connect: { id: elecPartsCat.id } }, itemType: 'material', costRatio: 0.8000, fixedAddition: 0, roundingUnit: -3, description: '電気工事部材: 原価率80%' },
  ];

  for (const mr of marginData) {
    await prisma.marginRate.create({ data: mr });
  }
  console.log('✅ Margin rates created\n');

  // ============================================
  // 7. エリアマッピングの作成
  // ============================================
  console.log('Creating area mappings...');
  const elec1 = partners.find((p) => p.code === 'E001')!;
  const elec2 = partners.find((p) => p.code === 'E002')!;
  const elec3 = partners.find((p) => p.code === 'E003')!;

  const areaMappingData = [
    // 関東電設: 関東エリア
    { partnerId: elec1.id, prefecture: '東京都', city: null, priority: 0 },
    { partnerId: elec1.id, prefecture: '神奈川県', city: null, priority: 0 },
    { partnerId: elec1.id, prefecture: '埼玉県', city: null, priority: 0 },
    { partnerId: elec1.id, prefecture: '千葉県', city: null, priority: 0 },
    // 関西電工: 関西エリア
    { partnerId: elec2.id, prefecture: '大阪府', city: null, priority: 0 },
    { partnerId: elec2.id, prefecture: '京都府', city: null, priority: 0 },
    { partnerId: elec2.id, prefecture: '兵庫県', city: null, priority: 0 },
    { partnerId: elec2.id, prefecture: '奈良県', city: null, priority: 0 },
    { partnerId: elec2.id, prefecture: '愛知県', city: null, priority: 0 },
    // 九州電気工事: 九州+北海道エリア
    { partnerId: elec3.id, prefecture: '福岡県', city: null, priority: 0 },
    { partnerId: elec3.id, prefecture: '熊本県', city: null, priority: 0 },
    { partnerId: elec3.id, prefecture: '北海道', city: null, priority: 0 },
  ];

  for (const am of areaMappingData) {
    await prisma.areaMapping.upsert({
      where: {
        partnerId_prefecture_city: {
          partnerId: am.partnerId,
          prefecture: am.prefecture,
          city: am.city ?? '',
        },
      },
      update: {},
      create: {
        partnerId: am.partnerId,
        prefecture: am.prefecture,
        city: am.city,
        priority: am.priority,
      },
    });
  }
  console.log('✅ Area mappings created\n');

  // ============================================
  // 8. 案件の作成
  // ============================================
  console.log('Creating projects...');
  const member1 = members.find((m) => m.code === 'M001')!;
  const member2 = members.find((m) => m.code === 'M002')!;
  const member3 = members.find((m) => m.code === 'M003')!;
  const memberUser1 = createdUsers.find((u) => u.email === 'member@example.com')!;
  const memberUser2 = createdUsers.find((u) => u.email === 'tanaka@test-kensetsu.com')!;
  const memberUser3 = createdUsers.find((u) => u.email === 'suzuki@kanto-home.com')!;

  const projectData = [
    {
      projectNumber: 'PJ-2026-0001', memberId: member1.id, createdByUserId: memberUser1.id,
      clientName: '田中一郎', clientNameKana: 'タナカイチロウ',
      postalCode: '530-0001', address: '大阪府大阪市北区梅田2-5-10', addressDetail: 'グリーンタウン梅田 3号地',
      latitude: 34.7024, longitude: 135.4959, buildingType: '戸建', roofType: '切妻',
      status: 'ordered', approvedAt: new Date('2026-03-20'), paymentConfirmedAt: new Date('2026-03-22'),
    },
    {
      projectNumber: 'PJ-2026-0002', memberId: member2.id, createdByUserId: memberUser2.id,
      clientName: '鈴木健太', clientNameKana: 'スズキケンタ',
      postalCode: '460-0008', address: '愛知県名古屋市中区栄3-15-20',
      latitude: 35.1681, longitude: 136.9066, buildingType: '戸建', roofType: '寄棟',
      status: 'quoted',
    },
    {
      projectNumber: 'PJ-2026-0003', memberId: member3.id, createdByUserId: memberUser3.id,
      clientName: '佐藤美咲', clientNameKana: 'サトウミサキ',
      postalCode: '158-0097', address: '東京都世田谷区用賀4-10-1', addressDetail: 'ニュータウン用賀 6号地',
      latitude: 35.6295, longitude: 139.6347, buildingType: '戸建', roofType: '片流れ',
      status: 'quoting',
    },
    {
      projectNumber: 'PJ-2026-0004', memberId: member1.id, createdByUserId: memberUser1.id,
      clientName: '高橋大輔', clientNameKana: 'タカハシダイスケ',
      postalCode: '530-0047', address: '大阪府大阪市北区西天満5-8-3',
      latitude: 34.6977, longitude: 135.5068, buildingType: '戸建', roofType: '切妻',
      status: 'registered',
    },
    {
      projectNumber: 'PJ-2026-0005', memberId: member3.id, createdByUserId: memberUser3.id,
      clientName: '渡辺裕子', clientNameKana: 'ワタナベユウコ',
      postalCode: '154-0024', address: '東京都世田谷区三軒茶屋2-14-8',
      latitude: 35.6437, longitude: 139.6714, buildingType: '戸建', roofType: '陸屋根',
      status: 'completed', approvedAt: new Date('2026-02-10'), paymentConfirmedAt: new Date('2026-02-12'), completedAt: new Date('2026-03-30'),
    },
  ];

  const projects: { id: string; projectNumber: string; memberId: string }[] = [];
  for (const pj of projectData) {
    const project = await prisma.project.upsert({
      where: { projectNumber: pj.projectNumber },
      update: {},
      create: pj,
    });
    projects.push({ id: project.id, projectNumber: project.projectNumber, memberId: pj.memberId });
  }
  console.log('✅ Projects created\n');

  // ============================================
  // 9. 見積の作成（案件に紐づく）
  // ============================================
  console.log('Creating quotes...');
  const quotesData = [
    { quoteNumber: 'Q20260320-0001', title: '田中邸 太陽光設置', status: 'approved', memberId: member1.id, userId: memberUser1.id, categoryId: solarCat.id, projectId: projects[0].id, totalAmount: 1850000, partnerId: partner1.id },
    { quoteNumber: 'Q20260320-0002', title: '田中邸 電気工事', status: 'approved', memberId: member1.id, userId: memberUser1.id, categoryId: elecCat.id, projectId: projects[0].id, totalAmount: 280000, partnerId: elec2.id },
    { quoteNumber: 'Q20260325-0001', title: '鈴木邸 太陽光設置', status: 'responded', memberId: member2.id, userId: memberUser2.id, categoryId: solarCat.id, projectId: projects[1].id, totalAmount: 2200000, partnerId: partner1.id },
    { quoteNumber: 'Q20260401-0001', title: '佐藤邸 太陽光設置', status: 'requested', memberId: member3.id, userId: memberUser3.id, categoryId: solarCat.id, projectId: projects[2].id, totalAmount: null, partnerId: partner1.id },
    { quoteNumber: 'Q20260401-0002', title: '佐藤邸 電気工事', status: 'requested', memberId: member3.id, userId: memberUser3.id, categoryId: elecCat.id, projectId: projects[2].id, totalAmount: null, partnerId: elec1.id },
    { quoteNumber: 'Q20260210-0001', title: '渡辺邸 太陽光設置', status: 'approved', memberId: member3.id, userId: memberUser3.id, categoryId: solarCat.id, projectId: projects[4].id, totalAmount: 1650000, partnerId: partner1.id },
  ];

  const quotes: { id: string; quoteNumber: string; memberId: string; partnerId: string }[] = [];
  for (const q of quotesData) {
    const quote = await prisma.quote.upsert({
      where: { quoteNumber: q.quoteNumber },
      update: {},
      create: {
        quoteNumber: q.quoteNumber, title: q.title, status: q.status,
        memberId: q.memberId, userId: q.userId, categoryId: q.categoryId,
        projectId: q.projectId, totalAmount: q.totalAmount,
        deliveryAddress: '現場住所', desiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const itemType = q.categoryId === elecCat.id ? 'labor' : 'material';
    const itemName = itemType === 'labor' ? '電気工事一式' : '太陽光パネル一式';
    const qty = itemType === 'labor' ? 5 : 20;
    const unit = itemType === 'labor' ? '人工' : '枚';

    await prisma.quoteItem.upsert({
      where: { id: `${quote.id}-item1` },
      update: {},
      create: {
        id: `${quote.id}-item1`, quoteId: quote.id, partnerId: q.partnerId,
        itemType, itemName, specification: '詳細仕様は別紙参照',
        quantity: qty, unit,
        unitPrice: q.totalAmount ? q.totalAmount / qty : null,
        subtotal: q.totalAmount,
        status: q.status === 'approved' || q.status === 'responded' ? 'quoted' : 'pending',
      },
    });

    quotes.push({ id: quote.id, quoteNumber: quote.quoteNumber, memberId: q.memberId, partnerId: q.partnerId });
  }
  console.log('✅ Quotes created\n');

  // ============================================
  // 10. 発注の作成（案件に紐づく）
  // ============================================
  console.log('Creating orders...');
  const ordersData = [
    { orderNumber: 'O20260322-0001', status: 'shipped', memberId: member1.id, userId: memberUser1.id, projectId: projects[0].id, totalAmount: 1850000, partnerId: partner1.id, quoteId: quotes[0].id },
    { orderNumber: 'O20260322-0002', status: 'confirmed', memberId: member1.id, userId: memberUser1.id, projectId: projects[0].id, totalAmount: 280000, partnerId: elec2.id, quoteId: quotes[1].id },
    { orderNumber: 'O20260212-0001', status: 'completed', memberId: member3.id, userId: memberUser3.id, projectId: projects[4].id, totalAmount: 1650000, partnerId: partner1.id, quoteId: quotes[5].id },
  ];

  const orders: { id: string; orderNumber: string; memberId: string; totalAmount: number }[] = [];
  for (const o of ordersData) {
    const order = await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: {},
      create: {
        orderNumber: o.orderNumber, status: o.status,
        memberId: o.memberId, userId: o.userId, projectId: o.projectId,
        quoteId: o.quoteId, totalAmount: o.totalAmount,
        deliveryAddress: '現場住所', desiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        orderedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    });

    const itemType = o.partnerId === elec2.id ? 'labor' : 'material';
    await prisma.orderItem.upsert({
      where: { id: `${order.id}-item1` },
      update: {},
      create: {
        id: `${order.id}-item1`, orderId: order.id, partnerId: o.partnerId,
        itemType, itemName: itemType === 'labor' ? '電気工事一式' : '太陽光パネル一式',
        specification: '標準仕様', quantity: itemType === 'labor' ? 5 : 20,
        unit: itemType === 'labor' ? '人工' : '枚',
        unitPrice: itemType === 'labor' ? o.totalAmount / 5 : o.totalAmount / 20,
        subtotal: o.totalAmount,
        status: o.status === 'completed' ? 'delivered' : 'pending',
      },
    });

    orders.push({ id: order.id, orderNumber: order.orderNumber, memberId: o.memberId, totalAmount: o.totalAmount });
  }
  console.log('✅ Orders created\n');

  // ============================================
  // 11. 請求書の作成
  // ============================================
  console.log('Creating invoices...');
  const completedOrder = orders.find((o) => o.orderNumber === 'O20260212-0001');
  if (completedOrder) {
    const taxAmount = Math.floor(completedOrder.totalAmount * 0.1);
    await prisma.invoice.upsert({
      where: { invoiceNumber: 'INV20260301-0001' },
      update: {},
      create: {
        invoiceNumber: 'INV20260301-0001', orderId: completedOrder.id, partnerId: partner1.id,
        memberId: completedOrder.memberId, amount: completedOrder.totalAmount,
        taxAmount, totalAmount: completedOrder.totalAmount + taxAmount,
        status: 'paid', issuedAt: new Date('2026-03-01'),
        dueDate: new Date('2026-03-31'), paidAt: new Date('2026-03-15'),
      },
    });
  }
  console.log('✅ Invoices created\n');

  // ============================================
  // 12. 工務店入金（前金）の作成
  // ============================================
  console.log('Creating member payments...');
  // 田中邸（PJ-2026-0001）の前入金
  await prisma.memberPayment.create({
    data: {
      projectId: projects[0].id, memberId: member1.id,
      amount: 2130000, // 太陽光 + 電気工事のマージン込み金額
      status: 'confirmed', paymentType: 'prepayment',
      confirmedAt: new Date('2026-03-22'),
      confirmedBy: createdUsers.find((u) => u.role === 'admin')?.id,
    },
  });
  // 渡辺邸（PJ-2026-0005）の前入金
  await prisma.memberPayment.create({
    data: {
      projectId: projects[4].id, memberId: member3.id,
      amount: 1815000,
      status: 'confirmed', paymentType: 'prepayment',
      confirmedAt: new Date('2026-02-12'),
      confirmedBy: createdUsers.find((u) => u.role === 'admin')?.id,
    },
  });
  console.log('✅ Member payments created\n');

  // ============================================
  // 13. システム設定
  // ============================================
  console.log('Creating system settings...');
  const settingsData = [
    { key: 'company_name', value: 'セリビオ株式会社', description: '会社名' },
    { key: 'company_address', value: '東京都千代田区丸の内1-1-1', description: '住所' },
    { key: 'company_phone', value: '03-1234-5678', description: '電話番号' },
    { key: 'company_email', value: 'info@celibio.com', description: 'メールアドレス' },
    { key: 'tax_rate', value: '10', description: '消費税率' },
    { key: 'payment_due_days', value: '30', description: '支払期限日数' },
    { key: 'payment_tolerance', value: '100', description: '入金差異許容額' },
    { key: 'approval_required', value: 'true', description: 'セリビオ承認を挟むかどうか' },
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

  // ============================================
  // 14. 監査ログ
  // ============================================
  console.log('Creating audit logs...');
  const adminUser = createdUsers.find((u) => u.role === 'admin');
  if (adminUser) {
    const logData = [
      { action: 'create', entityType: 'project', entityId: projects[0].id, newValue: { projectNumber: 'PJ-2026-0001' } },
      { action: 'create', entityType: 'member', entityId: member1.id, newValue: { name: '株式会社サンプル工務店' } },
      { action: 'create', entityType: 'partner', entityId: partner1.id, newValue: { name: 'ソーラーテック株式会社' } },
      { action: 'approve', entityType: 'quote', entityId: quotes[0]?.id || '', newValue: { status: 'approved' } },
      { action: 'confirm_payment', entityType: 'project', entityId: projects[0].id, newValue: { status: 'payment_confirmed' } },
    ];

    for (const log of logData) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id, action: log.action,
          entityType: log.entityType, entityId: log.entityId,
          oldValue: Prisma.DbNull, newValue: log.newValue,
        },
      });
    }
  }
  console.log('✅ Audit logs created\n');

  // ============================================
  // 完了
  // ============================================
  console.log('🎉 Seeding completed!\n');
  console.log('========================================');
  console.log('Test accounts (password: Test1234!):');
  console.log('========================================');
  console.log('Admin:');
  console.log('  - admin@celibio.com');
  console.log('\nMember (工務店):');
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
  console.log('\nElectrician (電気工事屋):');
  console.log('  - sato@kanto-densetsu.com (関東電設)');
  console.log('  - honda@kansai-denko.com (関西電工)');
  console.log('  - morita@kyushu-denki.com (九州電気工事)');
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
