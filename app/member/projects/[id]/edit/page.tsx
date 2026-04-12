'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProject(data))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!project) {
    return <p className="text-center py-12 text-gray-500">案件が見つかりません</p>
  }

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
            clientName: project.clientName as string,
            clientNameKana: (project.clientNameKana as string) ?? '',
            postalCode: (project.postalCode as string) ?? '',
            address: (project.address as string) ?? '',
            addressDetail: (project.addressDetail as string) ?? '',
            buildingType: (project.buildingType as string) ?? '',
            roofType: (project.roofType as string) ?? '',
            notes: (project.notes as string) ?? '',
            latitude: project.latitude as number | null,
            longitude: project.longitude as number | null,
          }}
          initialFiles={(project.files as Array<{ id: string; fileName: string; fileSize: number | null; fileUrl: string; fileType: string }>) ?? []}
        />
      </div>
    </div>
  )
}
