'use client'

import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member/projects">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">新規案件登録</h1>
      </div>

      <div className="max-w-2xl">
        <ProjectForm mode="create" />
      </div>
    </div>
  )
}
