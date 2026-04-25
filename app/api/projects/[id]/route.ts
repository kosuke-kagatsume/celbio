import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isValidStatusTransition, type ProjectStatus } from '@/lib/projects'
import { getProjectForUser } from '@/lib/projects/get-project'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** GET /api/projects/[id] — 案件詳細 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await getProjectForUser(id, user)
    if (result === null) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (result === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PUT /api/projects/[id] — 案件更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 工務店は自社のみ、管理者は全案件
    if (user.role === 'member' && existing.memberId !== user.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role !== 'member' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ステータス変更の場合はバリデーション
    const updateData: Record<string, unknown> = {}

    if (body.status && body.status !== existing.status) {
      if (!isValidStatusTransition(existing.status as ProjectStatus, body.status)) {
        return NextResponse.json(
          { error: `ステータスを${existing.status}から${body.status}に変更できません` },
          { status: 400 }
        )
      }
      updateData.status = body.status

      if (body.status === 'payment_confirmed') {
        updateData.paymentConfirmedAt = new Date()
      }
      if (body.status === 'completed') {
        updateData.completedAt = new Date()
      }
      if (body.status === 'approved') {
        updateData.approvedAt = new Date()
      }
    }

    // 基本情報の更新
    const fields = [
      'clientName', 'clientNameKana', 'postalCode', 'address', 'addressDetail',
      'latitude', 'longitude', 'buildingType', 'roofType', 'notes',
    ] as const
    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        member: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/projects/[id] — 案件削除（registeredのみ） */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (user.role === 'member' && existing.memberId !== user.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role !== 'member' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 依頼登録ステータスのみ削除可能
    if (existing.status !== 'registered') {
      return NextResponse.json(
        { error: '依頼登録ステータスの案件のみ削除できます' },
        { status: 400 }
      )
    }

    await prisma.project.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
