/**
 * Constructs the full Vercel Blob URL from a blob path.
 *
 * The VERCEL_BLOB_STORE_URL environment variable should be set to your
 * Vercel Blob store base URL (e.g., https://xxxx.public.blob.vercel-storage.com)
 */
export function getBlobUrl(blobPath: string): string {
  const storeUrl = process.env.VERCEL_BLOB_STORE_URL

  if (!storeUrl) {
    throw new Error('VERCEL_BLOB_STORE_URL environment variable is not set')
  }

  // Remove trailing slash from store URL and leading slash from path
  const baseUrl = storeUrl.replace(/\/$/, '')
  const path = blobPath.replace(/^\//, '')

  return `${baseUrl}/${path}`
}
