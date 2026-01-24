"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAbility } from "@/lib/casl/ability-context"
import { api } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Client, UserProfile } from "@/lib/types"

interface UserWithEmail extends UserProfile {
  email?: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const ability = useAbility()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [user, setUser] = useState<UserWithEmail | null>(null)
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<string>("viewer")
  const [isActive, setIsActive] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")

  // Check admin permission
  useEffect(() => {
    if (!ability.can('manage', 'all')) {
      router.push('/')
    }
  }, [ability, router])

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    const [userRes, clientsRes] = await Promise.all([
      api.get<UserWithEmail>(`/admin/users/${userId}`),
      api.get<Client[]>('/catalogs/clients', { active: true }),
    ])

    if (userRes.data) {
      const userData = userRes.data
      setUser(userData)
      setFullName(userData.full_name)
      setRole(userData.role)
      setIsActive(userData.is_active)
      setSelectedClient(userData.client_id || "")
    }

    if (clientsRes.data) {
      setClients(clientsRes.data)
    }

    setLoadingData(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (role === 'client' && !selectedClient) {
      setError("Please select a client for client users")
      setLoading(false)
      return
    }

    try {
      const response = await api.patch(`/admin/users/${userId}`, {
        full_name: fullName,
        role,
        is_active: isActive,
        client_id: role === 'client' ? selectedClient : null,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/users')
      }, 1500)
    } catch (err) {
      console.error('Update user error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)

    try {
      const response = await api.delete(`/admin/users/${userId}`)

      if (response.error) {
        throw new Error(response.error)
      }

      router.push('/admin/users')
    } catch (err) {
      console.error('Delete user error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      setDeleting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading user...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">User not found</div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Updated!</CardTitle>
            <CardDescription>Redirecting to users list...</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                User updated successfully!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
          <CardDescription>Update user information and permissions</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>User ID</Label>
              <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
            </div>

            {user.email && (
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="client">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive users cannot log in
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading || deleting}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/users')}
                disabled={loading || deleting}
              >
                Cancel
              </Button>
            </div>

            <div className="border-t pt-4 mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading || deleting}
                    className="w-full"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this user? This action cannot be undone.
                      The user will no longer be able to access the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
