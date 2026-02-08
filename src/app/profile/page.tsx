import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requireUser, getCurrentUserProfile } from "@/lib/auth/server-auth"
import type { UserProfile } from "@/lib/types"
import { User, Mail, Shield, Calendar } from "lucide-react"

async function getUserProfile() {
  // User authentication is verified by middleware
  // requireUser() is safe to use here - it will never throw on protected routes
  const user = await requireUser()
  const profile = await getCurrentUserProfile()

  return { user, profile: profile as UserProfile }
}

async function ProfileContent() {
  const { user, profile } = await getUserProfile()

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' // Changed from destructive to default for better visibility
      case 'manager': return 'secondary'
      case 'operator': return 'outline'
      case 'viewer': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full system access with all permissions'
      case 'manager': return 'Manage warehouse operations and approve exits'
      case 'operator': return 'Create entries and manage assigned orders'
      case 'viewer': return 'Read-only access to system data'
      default: return 'No description available'
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">View your account information and role</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role & Permissions</CardTitle>
            <CardDescription>Your access level in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                  {profile.is_active ? (
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Role Description</p>
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(profile.role)}
              </p>
            </div>

            {profile.role === 'admin' && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary mb-1">Administrator Access</p>
                <p className="text-xs text-muted-foreground">
                  You have full access to all system features including user management.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Current status of your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">User ID</p>
                <p className="text-lg font-mono text-muted-foreground truncate" title={user.id}>{user.id}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="text-lg font-semibold">
                  {new Date(profile.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
