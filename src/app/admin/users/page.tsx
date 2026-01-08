import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import type { UserProfile } from "@/lib/types"
import { requireAdmin } from "@/lib/casl/server-guards"

async function getUserProfiles() {
  // Use CASL guard instead of manual check
  await requireAdmin()

  const supabase = await createClient()

  // Get all user profiles with client relation
  const { data } = await supabase
    .from('user_profiles')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  return (data || []) as UserProfile[]
}

async function UsersContent() {
  const users = await getUserProfiles()

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'manager': return 'default'
      case 'operator': return 'secondary'
      case 'viewer': return 'outline'
      case 'client': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button asChild>
          <Link href="/auth/signup">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                    <div className="flex gap-2 items-center">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="outline" className="text-red-600">Inactive</Badge>
                      )}
                    </div>
                    {user.clients && (
                      <p className="text-sm text-muted-foreground">
                        Client: {(user.clients as any).name}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                    <p>Updated: {new Date(user.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-muted-foreground">Loading users...</div>
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  )
}
