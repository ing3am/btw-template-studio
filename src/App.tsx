import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './app/AppShell'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { TemplateListPage } from '@/pages/TemplateListPage'
import { TemplateEditorPage } from '@/pages/TemplateEditorPage'
import { BrandingPage } from '@/pages/BrandingPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { LoginPage } from '@/pages/LoginPage'
import { QueryLoadingOverlay } from '@/shared/ui/QueryLoadingOverlay'
import { ToastProvider } from '@/shared/ui/Toast'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <TemplateListPage /> },
      { path: 'templates/:id/edit', element: <TemplateEditorPage /> },
      { path: 'documentos', element: <DocumentsPage /> },
      { path: 'branding', element: <BrandingPage /> },
      { path: 'lab', element: <Navigate to="/documentos" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <QueryLoadingOverlay />
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
