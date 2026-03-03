import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useUIStore } from '@/store/uiStore'
import { classNames } from '@/utils/format'

export function AppLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className={classNames(
          'transition-all duration-300 min-h-screen',
          collapsed ? 'ml-[72px]' : 'ml-64',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}
