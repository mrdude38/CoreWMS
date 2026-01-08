"use client"

import { useAuth } from "@/lib/auth/auth-context"

export function DebugAuth() {
  const { user, profile, loading } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Auth Debug:</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Profile: {profile ? JSON.stringify(profile) : 'null'}</div>
    </div>
  )
}
