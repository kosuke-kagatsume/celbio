import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 設定一覧取得
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    // 設定をオブジェクト形式に変換
    const settingsMap: Record<string, string | null> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 設定更新
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: '設定データが不正です' },
        { status: 400 }
      );
    }

    // 各設定を更新
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const existing = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (existing) {
        return prisma.systemSetting.update({
          where: { key },
          data: {
            value: value as string | null,
            updatedBy: user.id,
          },
        });
      } else {
        return prisma.systemSetting.create({
          data: {
            key,
            value: value as string | null,
            updatedBy: user.id,
          },
        });
      }
    });

    await Promise.all(updates);

    // 監査ログ
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'update',
        entityType: 'system_setting',
        entityId: 'bulk',
        newValue: settings,
      },
    });

    // 更新後の設定を返す
    const updatedSettings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const settingsMap: Record<string, string | null> = {};
    updatedSettings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
