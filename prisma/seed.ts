import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
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
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat,
    });
  }
  console.log('✅ Categories created\n');

  // 2. メーカーの作成
  console.log('Creating partners...');
  const partnerData = [
    {
      code: 'P001',
      name: 'ソーラーテック株式会社',
      email: 'partner@solartech.example.com',
      phone: '03-1111-2222',
      address: '東京都港区芝1-1-1',
    },
    {
      code: 'P002',
      name: '断熱マテリアル株式会社',
      email: 'partner@insulation.example.com',
      phone: '03-3333-4444',
      address: '東京都中央区日本橋2-2-2',
    },
  ];

  const partners: { id: string; code: string }[] = [];
  for (const p of partnerData) {
    const partner = await prisma.partner.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
    partners.push({ id: partner.id, code: partner.code });
  }
  console.log('✅ Partners created\n');

  // 3. 加盟店の作成
  console.log('Creating members...');
  const memberData = [
    {
      code: 'M001',
      name: '株式会社サンプル工務店',
      nameKana: 'カ）サンプルコウムテン',
      email: 'member@sample-koumuten.example.com',
      phone: '06-1111-2222',
      address: '大阪府大阪市北区梅田1-1-1',
    },
    {
      code: 'M002',
      name: '有限会社テスト建設',
      nameKana: 'ユ）テストケンセツ',
      email: 'member@test-kensetsu.example.com',
      phone: '052-3333-4444',
      address: '愛知県名古屋市中区栄2-2-2',
    },
  ];

  const members: { id: string; code: string }[] = [];
  for (const m of memberData) {
    const member = await prisma.member.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
    members.push({ id: member.id, code: member.code });
  }
  console.log('✅ Members created\n');

  // 4. Supabase認証ユーザーとDBユーザーの作成
  console.log('Creating users...');

  const testPassword = 'Test1234!';

  // 管理者ユーザー
  const adminSupabaseId = await createSupabaseUser('admin@celibio.com', testPassword);
  if (adminSupabaseId) {
    await prisma.user.upsert({
      where: { email: 'admin@celibio.com' },
      update: { supabaseUserId: adminSupabaseId },
      create: {
        email: 'admin@celibio.com',
        name: 'セリビオ管理者',
        role: 'admin',
        supabaseUserId: adminSupabaseId,
      },
    });
    console.log('✅ Admin user created: admin@celibio.com');
  }

  // 加盟店ユーザー
  const member1 = members.find((m) => m.code === 'M001');
  if (member1) {
    const memberSupabaseId = await createSupabaseUser('member@example.com', testPassword);
    if (memberSupabaseId) {
      await prisma.user.upsert({
        where: { email: 'member@example.com' },
        update: { supabaseUserId: memberSupabaseId },
        create: {
          email: 'member@example.com',
          name: '山田太郎',
          role: 'member',
          memberId: member1.id,
          supabaseUserId: memberSupabaseId,
        },
      });
      console.log('✅ Member user created: member@example.com');
    }
  }

  // メーカーユーザー
  const partner1 = partners.find((p) => p.code === 'P001');
  if (partner1) {
    const partnerSupabaseId = await createSupabaseUser('partner@example.com', testPassword);
    if (partnerSupabaseId) {
      await prisma.user.upsert({
        where: { email: 'partner@example.com' },
        update: { supabaseUserId: partnerSupabaseId },
        create: {
          email: 'partner@example.com',
          name: '佐藤花子',
          role: 'partner',
          partnerId: partner1.id,
          supabaseUserId: partnerSupabaseId,
        },
      });
      console.log('✅ Partner user created: partner@example.com');
    }
  }

  // 5. 商材の作成
  console.log('\nCreating products...');
  const solarCategory = await prisma.category.findFirst({ where: { code: 'CAT001' } });
  const insulationCategory = await prisma.category.findFirst({ where: { code: 'CAT002' } });

  if (solarCategory && partner1) {
    await prisma.product.upsert({
      where: { code: 'SOLAR-400W' },
      update: {},
      create: {
        code: 'SOLAR-400W',
        name: '高効率太陽光パネル 400W',
        partnerId: partner1.id,
        categoryId: solarCategory.id,
        unit: '枚',
        productType: 'TYPE_B',
        description: '高効率単結晶シリコン太陽光パネル',
      },
    });
  }

  const partner2 = partners.find((p) => p.code === 'P002');
  if (insulationCategory && partner2) {
    await prisma.product.upsert({
      where: { code: 'INSUL-50' },
      update: {},
      create: {
        code: 'INSUL-50',
        name: '高性能断熱パネル 50mm',
        partnerId: partner2.id,
        categoryId: insulationCategory.id,
        unit: '㎡',
        unitPrice: 3500,
        productType: 'TYPE_A',
        description: '高性能グラスウール断熱パネル',
      },
    });
  }
  console.log('✅ Products created\n');

  console.log('🎉 Seeding completed!\n');
  console.log('Test accounts (password: Test1234!):');
  console.log('  - Admin: admin@celibio.com');
  console.log('  - Member: member@example.com');
  console.log('  - Partner: partner@example.com');
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
