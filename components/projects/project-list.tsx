'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ProjectStatusBadge } from './project-status-badge'
import { MapPin, FileText, ShoppingCart, Calendar } from 'lucide-react'

interface ProjectItem {
  id: string
  projectNumber: string
  clientName: string
  address: string | null
  status: string
  createdAt: string
  member: { id: string; name: string }
  _count: { quotes: number; orders: number; files: number }
}

interface ProjectListProps {
  projects: ProjectItem[]
  basePath: string // '/member/projects' or '/admin/projects'
  showMember?: boolean
}

export function ProjectList({ projects, basePath, showMember }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>案件がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Link key={project.id} href={`${basePath}/${project.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">{project.projectNumber}</span>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <h3 className="font-semibold mt-1 truncate">{project.clientName} 様</h3>
                  {project.address && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </p>
                  )}
                  {showMember && (
                    <p className="text-sm text-gray-400 mt-1">{project.member.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <span>見積 {project._count.quotes}</span>
                <span>発注 {project._count.orders}</span>
                <span>ファイル {project._count.files}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
