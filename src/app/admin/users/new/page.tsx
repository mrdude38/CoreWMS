"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserPlus, Shield, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAbility } from "@/lib/casl/ability-context"
import type { Client } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api"

interface CreateUserResponse {
  id: string
  email: string
  full_name: string
  role: string
  client_id: string | null
  is_active: boolean
  created_at: string
}

export default function NewUserPage() {
  const router = useRouter()
  const ability = useAbility()

  // Check admin permission
  useEffect(() => {
    if (!ability.can('manage', 'all')) {
      router.push('/')
    }
  }, [ability, router])

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<string>("viewer")
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [skipEmailVerification, setSkipEmailVerification] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadClients = async () => {
      const response = await api.get<Client[]>('/catalogs/clients', { active: true })
      if (response.data) {
        setClients(response.data)
      }
    }
    loadClients()
  }, [])

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let result = ""
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(result)
    setConfirmPassword(result)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    if (role === 'client' && !selectedClient) {
      setError("Please select a client for client users")
      setLoading(false)
      return
    }

    try {
      const response = await api.post<CreateUserResponse>('/admin/users', {
        email,
        password,
        full_name: fullName,
        role,
        client_id: role === 'client' ? selectedClient : null,
        skip_email_verification: skipEmailVerification,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/users')
      }, 2000)
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">User Created Successfully!</CardTitle>
            <CardDescription>Redirecting to user list...</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                The user account has been created. 
                {skipEmailVerification 
                  ? " They can log in immediately with their credentials."
                  : " They will need to verify their email before logging in."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Create New User</CardTitle>
          </div>
          <CardDescription>
            Create a new user account directly. This bypasses the normal signup flow.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Role & Permissions
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={role} onValueChange={setRole} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span>Admin</span>
                          <span className="text-xs text-muted-foreground">Full system access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex flex-col">
                          <span>Manager</span>
                          <span className="text-xs text-muted-foreground">Manage operations & reports</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="operator">
                        <div className="flex flex-col">
                          <span>Operator</span>
                          <span className="text-xs text-muted-foreground">Create & update entries</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex flex-col">
                          <span>Viewer</span>
                          <span className="text-xs text-muted-foreground">Read-only access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="client">
                        <div className="flex flex-col">
                          <span>Client</span>
                          <span className="text-xs text-muted-foreground">View own data only</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === 'client' && (
                  <div className="space-y-2">
                    <Label htmlFor="client">
                      Associated Client *
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
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Password
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  disabled={loading}
                >
                  Generate Password
                </Button>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="text"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Password is shown in plain text for admin convenience. Make sure to share it securely with the user.
              </p>
            </div>

            {/* Email Verification */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Label htmlFor="skipEmail">Skip Email Verification</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When enabled, the user can log in immediately without email verification.
                  </p>
                </div>
                <Switch
                  id="skipEmail"
                  checked={skipEmailVerification}
                  onCheckedChange={setSkipEmailVerification}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild disabled={loading}>
              <Link href="/admin/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
