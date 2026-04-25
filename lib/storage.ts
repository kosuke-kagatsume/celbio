import { createServiceClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'project-files'

interface UploadResult {
  path: string
}

/**
 * ファイルをSupabase Storageにアップロード（pathのみ返却。public URLは発行しない）
 */
export async function uploadFile(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const supabase = createServiceClient()

  const ext = file.name.split('.').pop() ?? 'bin'
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${timestamp}_${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`ファイルアップロード失敗: ${error.message}`)
  }

  return { path }
}

/**
 * ファイルを削除
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    throw new Error(`ファイル削除失敗: ${error.message}`)
  }
}

/**
 * 署名付きURLを取得（期限付き）
 */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error || !data) {
    throw new Error(`署名付きURL取得失敗: ${error?.message}`)
  }

  return data.signedUrl
}

/**
 * 複数ファイルの署名付きURLを一括取得（Server Componentで使用）
 */
export async function getSignedUrls(paths: string[], expiresIn = 3600): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrls(paths, expiresIn)

  if (error || !data) {
    throw new Error(`署名付きURL一括取得失敗: ${error?.message}`)
  }

  const map = new Map<string, string>()
  data.forEach((item) => {
    if (item.path && item.signedUrl) {
      map.set(item.path, item.signedUrl)
    }
  })
  return map
}
