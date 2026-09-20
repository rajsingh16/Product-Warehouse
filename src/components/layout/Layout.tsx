import { useState, type ReactNode } from 'react';
import type { BreadcrumbItem } from './Breadcrumbs';
import { Breadcrumbs } from './Breadcrumbs';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  children: ReactNode;
}

export function Layout({ breadcrumbs = [], title, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = title ?? breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Dashboard Overview';

  return (
    <div className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-slate-50">
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Header title={pageTitle} onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-3 pb-6 sm:p-4 lg:p-6">
            <div className="shrink-0">
              <Breadcrumbs items={breadcrumbs} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
