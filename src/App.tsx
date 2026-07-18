import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './app/AppShell'
import { TemplateListPage } from '@/pages/TemplateListPage'
import { TemplateEditorPage } from '@/pages/TemplateEditorPage'
import { BrandingPage } from '@/pages/BrandingPage'
import { PdfLabPage } from '@/pages/PdfLabPage'
import { ToastProvider } from '@/shared/ui/Toast'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppShell />
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
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
