import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - CoreWMS",
  description: "Login to CoreWMS",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
              CL
            </div>
          </div>
          <h1 className="text-2xl font-bold">CoreWMS</h1>
          <p className="text-sm text-muted-foreground">Warehouse Management System</p>
        </div>
        {children}
      </div>
    </div>
  )
}
