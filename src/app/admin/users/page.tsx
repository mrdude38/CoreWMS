import { Suspense } from "react"
import Link from "next/link"
import { Plus, Mail, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serverApi } from "@/lib/api/server"
import { requireAdmin } from "@/lib/casl/server-guards"

interface UserWithEmail {
  id: string
  email: string
  email_confirmed: boolean
  full_name: string
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'client'
  client_id: string | null
  client?: {
    id: string
    name: string
  }
  is_active: boolean
  last_sign_in: string | null
  created_at: string
  updated_at: string
}

interface UsersResponse {
  data: UserWithEmail[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

async function getUserProfiles(): Promise<UserWithEmail[]> {
  // Use CASL guard to ensure admin access
  await requireAdmin()

  const response = await serverApi.get<UsersResponse>('/admin/users')
  
  if (response.error) {
    console.error('Failed to fetch users:', response.error)
    return []
  }

  return response.data?.data || []
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                      {user.email_confirmed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" title="Email verified" />
                      ) : (
                        <XCircle className="h-3 w-3 text-amber-500" title="Email not verified" />
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="outline" className="text-red-600">Inactive</Badge>
                      )}
                    </div>
                    {user.client && (
                      <p className="text-sm text-muted-foreground">
                        Client: {user.client.name}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>Created: {formatDate(user.created_at)}</p>
                    <p>Last login: {formatDate(user.last_sign_in)}</p>
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
