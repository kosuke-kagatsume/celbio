import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { uploadFile, deleteFile, getSignedUrl } from '@/lib/storage'
import type { ProjectFileType } from '@/lib/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** POST /api/projects/[id]/files — ファイルアップロード */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (user.role === 'member' && project.memberId !== user.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileType = (formData.get('fileType') as ProjectFileType) ?? 'other'
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
    }

    // 10MB制限
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
    }

    const result = await uploadFile(file, `projects/${id}`)

    const projectFile = await prisma.projectFile.create({
      data: {
        projectId: id,
        fileType,
        fileName: file.name,
        filePath: result.path,
        fileSize: file.size,
        uploadedBy: user.id,
        description,
      },
    })

    const url = await getSignedUrl(projectFile.filePath)
    return NextResponse.json({ ...projectFile, url }, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/projects/[id]/files?fileId=xxx — ファイル削除 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const fileId = request.nextUrl.searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    const projectFile = await prisma.projectFile.findUnique({
      where: { id: fileId },
      include: { project: true },
    })

    if (!projectFile || projectFile.projectId !== id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (user.role === 'member' && projectFile.project.memberId !== user.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Storageから削除
    try {
      await deleteFile(projectFile.filePath)
    } catch {
      // Storage削除失敗してもDB削除は続行
    }

    await prisma.projectFile.delete({ where: { id: fileId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
