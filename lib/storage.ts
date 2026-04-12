import { createServiceClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'project-files'

interface UploadResult {
  path: string
  url: string
}

/**
 * ファイルをSupabase Storageにアップロード
 */
export async function uploadFile(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const supabase = createServiceClient()

  // ユニークなファイルパスを生成
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

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return {
    path,
    url: urlData.publicUrl,
  }
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
