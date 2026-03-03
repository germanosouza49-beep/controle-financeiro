import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Loader2 } from 'lucide-react'

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Auth/Login'))
const Register = lazy(() => import('@/pages/Auth/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Transactions = lazy(() => import('@/pages/Transactions'))
const Accounts = lazy(() => import('@/pages/Accounts'))
const Cards = lazy(() => import('@/pages/Cards'))
const ImportPage = lazy(() => import('@/pages/Import'))
const Budget = lazy(() => import('@/pages/Budget'))
const Goals = lazy(() => import('@/pages/Goals'))
const Cashflow = lazy(() => import('@/pages/Cashflow'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Rules = lazy(() => import('@/pages/Rules'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const AIChat = lazy(() => import('@/pages/AIChat'))
const Settings = lazy(() => import('@/pages/Settings'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) return <Loading />
  if (!session) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) return <Loading />
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  // Initialize auth listener
  useAuth()

  // Initialize dark mode on mount
  useEffect(() => {
    const dark = useUIStore.getState().darkMode
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/auth/login"
          element={
            <GuestGuard>
              <Login />
            </GuestGuard>
          }
        />
        <Route
          path="/auth/register"
          element={
            <GuestGuard>
              <Register />
            </GuestGuard>
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/transacoes" element={<Transactions />} />
          <Route path="/contas" element={<Accounts />} />
          <Route path="/cartoes" element={<Cards />} />
          <Route path="/importar" element={<ImportPage />} />
          <Route path="/orcamentos" element={<Budget />} />
          <Route path="/metas" element={<Goals />} />
          <Route path="/fluxo-de-caixa" element={<Cashflow />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/regras" element={<Rules />} />
          <Route path="/notificacoes" element={<Notifications />} />
          <Route path="/assistente" element={<AIChat />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
