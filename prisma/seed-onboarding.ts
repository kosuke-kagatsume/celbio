import { config } from 'dotenv';
config(); // .envファイルを読み込み

import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import ws from 'ws';

// Supabase Supavisor用の設定
neonConfig.pipelineConnect = false;

// Node.js環境でWebSocketを有効化
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Prismaクライアント初期化
function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL must be set');
  }

  // Transaction pooler をSession pooler に変換
  connectionString = connectionString
    .replace(':6543/', ':5432/')
    .replace('?pgbouncer=true', '');

  const adapter = new PrismaNeon({
    connectionString,
    max: 1,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}

const prisma = createPrismaClient();

// 型定義
interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  building?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

interface SocialInsurance {
  hasInsurance: boolean;
  previousEmployer?: string;
  pensionNumber?: string;
}

interface Spouse {
  name: string;
  birthDate: string;
  isDependent: boolean;
}

interface FamilyMember {
  relationship: string;
  name: string;
  birthDate: string;
  isDependent: boolean;
}

interface PublicTransitRoute {
  line: string;
  from: string;
  to: string;
  fare: number;
}

interface PublicTransit {
  routes: PublicTransitRoute[];
  totalFare: number;
}

interface PrivateCar {
  vehicleType?: string;
  fuelType?: string;
  distance?: number;
}

interface BasicInfoData {
  lastNameKanji?: string;
  firstNameKanji?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  gender?: string;
  birthDate?: Date;
  phoneNumber?: string;
  personalEmail?: string;
  currentAddress?: Address;
  emergencyContact?: EmergencyContact;
  socialInsurance?: SocialInsurance;
  status: string;
  submittedAt?: Date;
  returnedAt?: Date;
  approvedAt?: Date;
  reviewComment?: string;
}

interface FamilyInfoData {
  hasSpouse: boolean;
  spouse?: Spouse;
  familyMembers?: FamilyMember[];
  status: string;
  submittedAt?: Date;
  approvedAt?: Date;
}

interface BankAccountData {
  applicationType?: string;
  consent: boolean;
  bankName?: string;
  bankCode?: string;
  branchName?: string;
  branchCode?: string;
  accountNumber?: string;
  accountHolderKana?: string;
  status: string;
  submittedAt?: Date;
  approvedAt?: Date;
}

interface CommuteRouteData {
  commuteStatus?: string;
  commuteMethod?: string;
  distance?: number;
  publicTransit?: PublicTransit;
  privateCar?: PrivateCar;
  status: string;
  submittedAt?: Date;
  approvedAt?: Date;
}

interface ApplicantData {
  applicantEmail: string;
  applicantName: string;
  hireDate: Date;
  deadline: Date;
  department: string;
  position: string;
  status: string;
  employeeId?: string;
  basicInfo: BasicInfoData;
  familyInfo: FamilyInfoData;
  bankAccount: BankAccountData;
  commuteRoute: CommuteRouteData;
}

// JSON値をPrisma互換の形式に変換するヘルパー
function toJsonValue<T>(value: T | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

// アクセストークン生成（48文字のURLセーフ文字列）
function generateAccessToken(): string {
  return randomBytes(36).toString('base64url');
}

// 日付ヘルパー
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  console.log('🌱 Seeding onboarding data...');

  const tenantId = 'default';

  // 既存データを削除
  await prisma.onboardingCommuteRoute.deleteMany({ where: { tenantId } });
  await prisma.onboardingBankAccount.deleteMany({ where: { tenantId } });
  await prisma.onboardingFamilyInfo.deleteMany({ where: { tenantId } });
  await prisma.onboardingBasicInfo.deleteMany({ where: { tenantId } });
  await prisma.onboardingApplication.deleteMany({ where: { tenantId } });

  console.log('📦 Cleared existing onboarding data');

  // 申請者データ
  const applicants: ApplicantData[] = [
    {
      applicantEmail: 'taro.shinnyu@example.com',
      applicantName: '新入 太郎',
      hireDate: daysFromNow(30),
      deadline: daysFromNow(14),
      department: '開発部',
      position: 'エンジニア',
      status: 'draft',
      basicInfo: {
        lastNameKanji: '新入',
        firstNameKanji: '太郎',
        lastNameKana: 'シンニュウ',
        firstNameKana: 'タロウ',
        gender: 'male',
        birthDate: new Date('1995-04-15'),
        phoneNumber: '090-1234-5678',
        personalEmail: 'taro.personal@example.com',
        currentAddress: {
          postalCode: '150-0001',
          prefecture: '東京都',
          city: '渋谷区',
          address: '神宮前1-2-3',
          building: 'サンプルマンション101',
        },
        status: 'draft',
      },
      familyInfo: {
        hasSpouse: false,
        familyMembers: [],
        status: 'draft',
      },
      bankAccount: {
        applicationType: 'new',
        consent: false,
        status: 'draft',
      },
      commuteRoute: {
        commuteStatus: 'commute',
        commuteMethod: 'public_transit',
        status: 'draft',
      },
    },
    {
      applicantEmail: 'hanako.yamada@example.com',
      applicantName: '山田 花子',
      hireDate: daysFromNow(14),
      deadline: daysFromNow(7),
      department: '営業部',
      position: '営業',
      status: 'submitted',
      basicInfo: {
        lastNameKanji: '山田',
        firstNameKanji: '花子',
        lastNameKana: 'ヤマダ',
        firstNameKana: 'ハナコ',
        gender: 'female',
        birthDate: new Date('1998-08-20'),
        phoneNumber: '090-2345-6789',
        personalEmail: 'hanako.yamada@example.com',
        currentAddress: {
          postalCode: '160-0022',
          prefecture: '東京都',
          city: '新宿区',
          address: '新宿3-4-5',
          building: 'シティタワー502',
        },
        emergencyContact: {
          name: '山田 一郎',
          relationship: '父',
          phoneNumber: '090-8765-4321',
        },
        status: 'submitted',
        submittedAt: daysAgo(2),
      },
      familyInfo: {
        hasSpouse: false,
        familyMembers: [
          {
            relationship: '父',
            name: '山田 一郎',
            birthDate: '1965-03-10',
            isDependent: false,
          },
        ],
        status: 'submitted',
        submittedAt: daysAgo(2),
      },
      bankAccount: {
        applicationType: 'new',
        consent: true,
        bankName: 'みずほ銀行',
        bankCode: '0001',
        branchName: '新宿支店',
        branchCode: '123',
        accountNumber: '1234567',
        accountHolderKana: 'ヤマダ ハナコ',
        status: 'submitted',
        submittedAt: daysAgo(2),
      },
      commuteRoute: {
        commuteStatus: 'commute',
        commuteMethod: 'public_transit',
        publicTransit: {
          routes: [
            {
              line: 'JR山手線',
              from: '新宿駅',
              to: '渋谷駅',
              fare: 170,
            },
          ],
          totalFare: 170,
        },
        status: 'submitted',
        submittedAt: daysAgo(2),
      },
    },
    {
      applicantEmail: 'jiro.suzuki@example.com',
      applicantName: '鈴木 次郎',
      hireDate: daysFromNow(21),
      deadline: daysFromNow(10),
      department: '人事部',
      position: '人事担当',
      status: 'returned',
      basicInfo: {
        lastNameKanji: '鈴木',
        firstNameKanji: '次郎',
        lastNameKana: 'スズキ',
        firstNameKana: 'ジロウ',
        gender: 'male',
        birthDate: new Date('1992-12-05'),
        phoneNumber: '090-3456-7890',
        personalEmail: 'jiro.suzuki@example.com',
        currentAddress: {
          postalCode: '106-0032',
          prefecture: '東京都',
          city: '港区',
          address: '六本木5-6-7',
        },
        status: 'returned',
        submittedAt: daysAgo(5),
        returnedAt: daysAgo(3),
        reviewComment: '緊急連絡先の入力が必要です。',
      },
      familyInfo: {
        hasSpouse: true,
        spouse: {
          name: '鈴木 美咲',
          birthDate: '1994-06-15',
          isDependent: true,
        },
        familyMembers: [],
        status: 'submitted',
        submittedAt: daysAgo(5),
      },
      bankAccount: {
        applicationType: 'new',
        consent: true,
        bankName: '三菱UFJ銀行',
        bankCode: '0005',
        branchName: '六本木支店',
        branchCode: '456',
        accountNumber: '7654321',
        accountHolderKana: 'スズキ ジロウ',
        status: 'submitted',
        submittedAt: daysAgo(5),
      },
      commuteRoute: {
        commuteStatus: 'commute',
        commuteMethod: 'walk',
        distance: 1.2,
        status: 'submitted',
        submittedAt: daysAgo(5),
      },
    },
    {
      applicantEmail: 'yuki.tanaka@example.com',
      applicantName: '田中 雪',
      hireDate: daysFromNow(7),
      deadline: daysAgo(3),
      department: '経理部',
      position: '経理担当',
      status: 'approved',
      employeeId: 'EMP-2024-0042',
      basicInfo: {
        lastNameKanji: '田中',
        firstNameKanji: '雪',
        lastNameKana: 'タナカ',
        firstNameKana: 'ユキ',
        gender: 'female',
        birthDate: new Date('1990-02-28'),
        phoneNumber: '090-4567-8901',
        personalEmail: 'yuki.tanaka@example.com',
        currentAddress: {
          postalCode: '104-0061',
          prefecture: '東京都',
          city: '中央区',
          address: '銀座8-9-10',
          building: 'グランドタワー2001',
        },
        emergencyContact: {
          name: '田中 健一',
          relationship: '夫',
          phoneNumber: '090-1111-2222',
        },
        socialInsurance: {
          hasInsurance: true,
          previousEmployer: '株式会社前職',
          pensionNumber: '1234-567890',
        },
        status: 'approved',
        submittedAt: daysAgo(10),
        approvedAt: daysAgo(7),
      },
      familyInfo: {
        hasSpouse: true,
        spouse: {
          name: '田中 健一',
          birthDate: '1988-11-20',
          isDependent: false,
        },
        familyMembers: [
          {
            relationship: '長女',
            name: '田中 さくら',
            birthDate: '2020-04-01',
            isDependent: true,
          },
        ],
        status: 'approved',
        submittedAt: daysAgo(10),
        approvedAt: daysAgo(7),
      },
      bankAccount: {
        applicationType: 'new',
        consent: true,
        bankName: '三井住友銀行',
        bankCode: '0009',
        branchName: '銀座支店',
        branchCode: '789',
        accountNumber: '9876543',
        accountHolderKana: 'タナカ ユキ',
        status: 'approved',
        submittedAt: daysAgo(10),
        approvedAt: daysAgo(7),
      },
      commuteRoute: {
        commuteStatus: 'commute',
        commuteMethod: 'public_transit',
        publicTransit: {
          routes: [
            {
              line: '東京メトロ銀座線',
              from: '銀座駅',
              to: '渋谷駅',
              fare: 200,
            },
          ],
          totalFare: 200,
        },
        status: 'approved',
        submittedAt: daysAgo(10),
        approvedAt: daysAgo(7),
      },
    },
    {
      applicantEmail: 'akira.sato@example.com',
      applicantName: '佐藤 明',
      hireDate: daysFromNow(45),
      deadline: daysFromNow(30),
      department: 'マーケティング部',
      position: 'マーケター',
      status: 'draft',
      basicInfo: {
        lastNameKanji: '佐藤',
        firstNameKanji: '明',
        lastNameKana: 'サトウ',
        firstNameKana: 'アキラ',
        gender: 'male',
        status: 'draft',
      },
      familyInfo: {
        hasSpouse: false,
        status: 'draft',
      },
      bankAccount: {
        applicationType: 'new',
        consent: false,
        status: 'draft',
      },
      commuteRoute: {
        commuteStatus: 'full_remote',
        status: 'draft',
      },
    },
  ];

  for (const applicant of applicants) {
    const {
      basicInfo,
      familyInfo,
      bankAccount,
      commuteRoute,
      ...applicationData
    } = applicant;

    // 申請を作成
    const application = await prisma.onboardingApplication.create({
      data: {
        ...applicationData,
        tenantId,
        accessToken: generateAccessToken(),
        submittedAt: applicationData.status === 'submitted' || applicationData.status === 'approved'
          ? daysAgo(10)
          : null,
        approvedAt: applicationData.status === 'approved' ? daysAgo(7) : null,
      },
    });

    // 基本情報を作成
    await prisma.onboardingBasicInfo.create({
      data: {
        applicationId: application.id,
        tenantId,
        email: applicant.applicantEmail,
        hireDate: applicant.hireDate,
        lastNameKanji: basicInfo.lastNameKanji,
        firstNameKanji: basicInfo.firstNameKanji,
        lastNameKana: basicInfo.lastNameKana,
        firstNameKana: basicInfo.firstNameKana,
        gender: basicInfo.gender,
        phoneNumber: basicInfo.phoneNumber,
        personalEmail: basicInfo.personalEmail,
        status: basicInfo.status,
        submittedAt: basicInfo.submittedAt,
        returnedAt: basicInfo.returnedAt,
        approvedAt: basicInfo.approvedAt,
        reviewComment: basicInfo.reviewComment,
        birthDate: basicInfo.birthDate,
        currentAddress: toJsonValue(basicInfo.currentAddress),
        emergencyContact: toJsonValue(basicInfo.emergencyContact),
        socialInsurance: toJsonValue(basicInfo.socialInsurance),
        savedAt: new Date(),
      },
    });

    // 家族情報を作成
    await prisma.onboardingFamilyInfo.create({
      data: {
        applicationId: application.id,
        tenantId,
        email: applicant.applicantEmail,
        lastNameKanji: basicInfo.lastNameKanji,
        firstNameKanji: basicInfo.firstNameKanji,
        hasSpouse: familyInfo.hasSpouse,
        status: familyInfo.status,
        submittedAt: familyInfo.submittedAt,
        approvedAt: familyInfo.approvedAt,
        spouse: toJsonValue(familyInfo.spouse),
        familyMembers: toJsonValue(familyInfo.familyMembers),
        savedAt: new Date(),
      },
    });

    // 銀行口座情報を作成
    await prisma.onboardingBankAccount.create({
      data: {
        applicationId: application.id,
        tenantId,
        email: applicant.applicantEmail,
        fullName: applicant.applicantName,
        applicationType: bankAccount.applicationType,
        consent: bankAccount.consent,
        bankName: bankAccount.bankName,
        bankCode: bankAccount.bankCode,
        branchName: bankAccount.branchName,
        branchCode: bankAccount.branchCode,
        accountNumber: bankAccount.accountNumber,
        accountHolderKana: bankAccount.accountHolderKana,
        status: bankAccount.status,
        submittedAt: bankAccount.submittedAt,
        approvedAt: bankAccount.approvedAt,
        savedAt: new Date(),
      },
    });

    // 通勤経路情報を作成
    await prisma.onboardingCommuteRoute.create({
      data: {
        applicationId: application.id,
        tenantId,
        name: applicant.applicantName,
        commuteStatus: commuteRoute.commuteStatus,
        commuteMethod: commuteRoute.commuteMethod,
        distance: commuteRoute.distance,
        status: commuteRoute.status,
        submittedAt: commuteRoute.submittedAt,
        approvedAt: commuteRoute.approvedAt,
        publicTransit: toJsonValue(commuteRoute.publicTransit),
        privateCar: toJsonValue(commuteRoute.privateCar),
        savedAt: new Date(),
      },
    });

    console.log(`✅ Created application for ${applicant.applicantName} (${applicant.status})`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
