"use client";

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth';
import { LoginScreen } from './LoginScreen';
import { DashboardLayout } from './DashboardLayout';
import { Dashboard } from './Dashboard';
import { POSBilling } from './POSBilling';
import { ProductManagement } from './ProductManagement';
import { InvoiceHistory } from './InvoiceHistory';
import { Settings } from './Settings';
import { Toaster } from './ui/sonner';

type Page = 'dashboard' | 'pos' | 'products' | 'invoices' | 'settings';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POSBilling />;
      case 'products':
        return <ProductManagement />;
      case 'invoices':
        return <InvoiceHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

export function MainApp() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
