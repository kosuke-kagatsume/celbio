import { getSignedUrls } from '@/lib/storage'

interface FileWithPath {
  filePath: string
  [key: string]: unknown
}

/**
 * filePath を持つファイルレコード配列に signedUrl を付与
 * Server Component から呼ぶ前提（service_role key 使用）
 */
export async function attachSignedUrls<T extends FileWithPath>(
  files: T[],
  expiresIn = 3600,
): Promise<Array<T & { url: string }>> {
  if (files.length === 0) return []

  const paths = files.map((f) => f.filePath)
  const urlMap = await getSignedUrls(paths, expiresIn)

  return files.map((f) => ({
    ...f,
    url: urlMap.get(f.filePath) ?? '',
  }))
}
