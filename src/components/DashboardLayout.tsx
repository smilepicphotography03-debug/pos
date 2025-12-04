"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

type Page = 'dashboard' | 'pos' | 'products' | 'invoices' | 'settings';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const navigation = [
  { id: 'dashboard' as Page, name: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos' as Page, name: 'POS Billing', icon: ShoppingCart },
  { id: 'products' as Page, name: 'Products', icon: Package },
  { id: 'invoices' as Page, name: 'Invoices', icon: FileText },
  { id: 'settings' as Page, name: 'Settings', icon: Settings },
];

export function DashboardLayout({ children, currentPage, onPageChange }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Kumar Pooja Store</h1>
        <p className="text-sm text-muted-foreground mt-1">POS System</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary text-primary-foreground'
                )}
                onClick={() => {
                  onPageChange(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden border-b bg-card p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Kumar Pooja Store</h1>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
