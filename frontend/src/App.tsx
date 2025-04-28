import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Dashboard } from "@/components/dashboard/Dashboard"
import { UsersTable } from "@/components/dashboard/UsersTable"
import { Routes, Route, Navigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { LoginPage } from "@/components/pages/LoginPage"
import { RegisterPage } from "@/components/pages/RegisterPage"
import { ReportingPage } from "@/components/pages/ReportingPage"
import { PrintPage } from "@/components/pages/PrintPage"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AuthProvider } from "@/lib/AuthContext"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute adminOnly={true}>
            <DashboardLayout><Dashboard /></DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Reports Route - accessible by "user" and "Administrator" roles */}
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={["user", "Administrator"]}>
            <DashboardLayout><ReportingPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Print Route - accessible by "user" and "Administrator" roles */}
        <Route path="/print" element={
          <ProtectedRoute allowedRoles={["user", "Administrator"]}>
            <DashboardLayout><PrintPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Admin-only routes */}
        <Route path="/users" element={
          <ProtectedRoute adminOnly={true}>
            <DashboardLayout>
              <div className="space-y-6">
                {/* Page title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">System Users</h1>
                  <Button size="sm" className="sm:self-end rounded-xl h-10 px-4 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">Add User</span>
                  </Button>
                </div>
                
                {/* Users table */}
                <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-5">
                    <CardTitle className="text-lg font-medium">All Users</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pb-6">
                    <UsersTable showRefresh={true} />
                  </CardContent>
                </Card>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute adminOnly={true}>
            <DashboardLayout>
              <div className="space-y-6">
                <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
                <Card className="rounded-2xl shadow-sm border-border/40 p-6">
                  <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
                </Card>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute adminOnly={true}>
            <DashboardLayout>
              <div className="space-y-6">
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <Card className="rounded-2xl shadow-sm border-border/40 p-6">
                  <p className="text-muted-foreground">Settings dashboard coming soon.</p>
                </Card>
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Redirect ward leader detail page to reports since we deleted that component */}
        <Route path="/reports/ward-leaders/:leaderId" element={<Navigate to="/reports" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
