/**
 * Client-side access token storage via cookie.
 * Used so the frontend uses only the backend for auth (no Supabase).
 */

const COOKIE_NAME = "corewms_access_token"
const COOKIE_MAX_AGE_DAYS = 7

export function setAccessToken(token: string): void {
  if (typeof document === "undefined") return
  const value = encodeURIComponent(token)
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${typeof location !== "undefined" && location?.protocol === "https:" ? "; Secure" : ""}`
}

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

export function clearAccessToken(): void {
  if (typeof document === "undefined") return
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}
