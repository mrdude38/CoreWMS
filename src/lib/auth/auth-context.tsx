"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { UserProfile } from "@/lib/types"
import { defineAbilityFor } from "@/lib/casl/factory"
import { AbilityContext } from "@/lib/casl/ability-context"
import type { AppAbility } from "@/lib/casl/subjects"
import { api } from "@/lib/api"
import { getAccessToken, clearAccessToken } from "@/lib/auth/token-cookie"

/** Minimal user from backend (no Supabase) */
export interface AuthUser {
  id: string
  email: string
}

interface CurrentUserResponse {
  user: AuthUser
  profile: UserProfile
}

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [ability, setAbility] = useState<AppAbility>(() => defineAbilityFor(null))

  const loadProfile = async () => {
    try {
      const response = await api.get<CurrentUserResponse>("/me")
      if (response.error || !response.data) {
        setUser(null)
        setProfile(null)
        setAbility(defineAbilityFor(null))
        clearAccessToken()
        return
      }
      const { user: u, profile: p } = response.data
      setUser(u)
      setProfile(p)
      setAbility(defineAbilityFor(p))
    } catch (error) {
      console.error("Error loading profile:", error)
      setUser(null)
      setProfile(null)
      setAbility(defineAbilityFor(null))
      clearAccessToken()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const refreshProfile = async () => {
    if (getAccessToken()) await loadProfile()
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    setAbility(defineAbilityFor(null))
    clearAccessToken()
    try {
      await api.post("/auth/signout")
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
