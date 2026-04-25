import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { getProjectForUser } from '@/lib/projects/get-project'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['member'])
  const { id } = await params
  const result = await getProjectForUser(id, user)

  if (result === null) notFound()
  if (result === 'forbidden') redirect('/member/projects')

  const project = result

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/member/projects/${id}`}>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">案件編集</h1>
      </div>

      <div className="max-w-2xl">
        <ProjectForm
          mode="edit"
          projectId={id}
          initialData={{
            clientName: project.clientName,
            clientNameKana: project.clientNameKana ?? '',
            postalCode: project.postalCode ?? '',
            address: project.address ?? '',
            addressDetail: project.addressDetail ?? '',
            buildingType: project.buildingType ?? '',
            roofType: project.roofType ?? '',
            notes: project.notes ?? '',
            latitude: project.latitude,
            longitude: project.longitude,
          }}
          initialFiles={project.files.map((f) => ({
            id: f.id,
            fileName: f.fileName,
            fileSize: f.fileSize,
            url: f.url,
            fileType: f.fileType,
          }))}
        />
      </div>
    </div>
  )
}
