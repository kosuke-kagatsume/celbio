import { Badge } from '@/components/ui/badge'
import { PROJECT_STATUSES, type ProjectStatus } from '@/lib/projects'

const statusColors: Record<ProjectStatus, string> = {
  registered: 'bg-gray-100 text-gray-800',
  quoting: 'bg-blue-100 text-blue-800',
  quoted: 'bg-indigo-100 text-indigo-800',
  approved: 'bg-purple-100 text-purple-800',
  payment_confirmed: 'bg-green-100 text-green-800',
  ordered: 'bg-orange-100 text-orange-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-emerald-100 text-emerald-800',
}

interface ProjectStatusBadgeProps {
  status: string
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const label = PROJECT_STATUSES[status as ProjectStatus] ?? status
  const color = statusColors[status as ProjectStatus] ?? 'bg-gray-100 text-gray-800'

  return (
    <Badge variant="outline" className={`${color} border-0 font-medium`}>
      {label}
    </Badge>
  )
}
