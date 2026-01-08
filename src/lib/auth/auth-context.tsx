"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/lib/types"
import { defineAbilityFor } from "@/lib/casl/factory"
import { AbilityContext } from "@/lib/casl/ability-context"
import type { AppAbility } from "@/lib/casl/subjects"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [ability, setAbility] = useState<AppAbility>(() => defineAbilityFor(null))

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setAbility(defineAbilityFor(null))
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      const userProfile = data as UserProfile
      setProfile(userProfile)
      setAbility(defineAbilityFor(userProfile))
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
      setAbility(defineAbilityFor(null))
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const supabase = createClient()

      // Clear local state first for immediate UI update
      setUser(null)
      setProfile(null)
      setAbility(defineAbilityFor(null))

      // Sign out from Supabase (this clears the auth cookies)
      await supabase.auth.signOut({ scope: 'local' })

      // Small delay to ensure cookies are cleared before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error during sign out:', error)
      // Even if signOut fails, clear local state
      setUser(null)
      setProfile(null)
      setAbility(defineAbilityFor(null))
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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
