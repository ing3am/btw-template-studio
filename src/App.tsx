import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './app/AppShell'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { TemplateListPage } from '@/pages/TemplateListPage'
import { TemplateEditorPage } from '@/pages/TemplateEditorPage'
import { BrandingPage } from '@/pages/BrandingPage'
import { PdfLabPage } from '@/pages/PdfLabPage'
import { LoginPage } from '@/pages/LoginPage'
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
      { path: 'branding', element: <BrandingPage /> },
      { path: 'lab', element: <PdfLabPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
