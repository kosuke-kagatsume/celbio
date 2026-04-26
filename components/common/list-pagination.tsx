import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  page: number
  totalPages: number
  basePath: string
  searchParams: Record<string, string | undefined>
}

function buildHref(basePath: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/**
 * URL駆動のページネーション。
 * Server Componentから使用する。
 */
export function ListPagination({ page, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null

  const prevHref = buildHref(basePath, { ...searchParams, page: String(page - 1) })
  const nextHref = buildHref(basePath, { ...searchParams, page: String(page + 1) })

  return (
    <div className="flex justify-center gap-2 mt-6">
      {page > 1 ? (
        <Link href={prevHref}>
          <Button variant="outline" size="sm">前へ</Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>前へ</Button>
      )}
      <span className="flex items-center text-sm text-gray-500">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={nextHref}>
          <Button variant="outline" size="sm">次へ</Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>次へ</Button>
      )}
    </div>
  )
}
