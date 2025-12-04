"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  DollarSign,
  FileText,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { InvoiceStore, ProductStore } from '@/lib/store';
import { Invoice, Product } from '@/lib/types';
import { formatQuantity } from '@/lib/units';
import { format, startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';

export function Dashboard() {
  const [todaySales, setTodaySales] = useState(0);
  const [todayInvoices, setTodayInvoices] = useState(0);
  const [weekSales, setWeekSales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [yesterdaySales, setYesterdaySales] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const allInvoices = InvoiceStore.getAll();
    
    // Today's data
    const today = startOfDay(new Date());
    const todayInvoicesList = allInvoices.filter(inv => 
      new Date(inv.createdAt) >= today
    );
    setTodayInvoices(todayInvoicesList.length);
    setTodaySales(InvoiceStore.getTotalSales(todayInvoicesList));

    // Yesterday's sales for comparison
    const yesterday = startOfDay(subDays(new Date(), 1));
    const yesterdayInvoicesList = allInvoices.filter(inv => {
      const invDate = new Date(inv.createdAt);
      return invDate >= yesterday && invDate < today;
    });
    setYesterdaySales(InvoiceStore.getTotalSales(yesterdayInvoicesList));

    // Week's data
    const weekStart = startOfWeek(new Date());
    const weekInvoices = allInvoices.filter(inv => 
      new Date(inv.createdAt) >= weekStart
    );
    setWeekSales(InvoiceStore.getTotalSales(weekInvoices));

    // Month's data
    const monthStart = startOfMonth(new Date());
    const monthInvoices = allInvoices.filter(inv => 
      new Date(inv.createdAt) >= monthStart
    );
    setMonthSales(InvoiceStore.getTotalSales(monthInvoices));

    // Low stock products
    setLowStockProducts(ProductStore.getLowStock());

    // Recent invoices
    setRecentInvoices(allInvoices.slice(0, 5));
  };

  const getSalesChange = () => {
    if (yesterdaySales === 0) return 0;
    return ((todaySales - yesterdaySales) / yesterdaySales) * 100;
  };

  const salesChange = getSalesChange();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your business overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todaySales.toFixed(2)}</div>
            {salesChange !== 0 && (
              <div className="flex items-center gap-1 text-xs mt-1">
                {salesChange > 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{salesChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{salesChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-muted-foreground">from yesterday</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayInvoices > 0 
                ? `Avg: ₹${(todaySales / todayInvoices).toFixed(2)}/invoice`
                : 'No invoices yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{weekSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total sales this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{monthSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total sales this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <Card key={product.id} className="border-destructive/50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-destructive font-semibold">
                            {formatQuantity(product.stock, product.baseUnit)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Min: {formatQuantity(product.minStock || 0, product.baseUnit)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.customerName || 'Walk-in Customer'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{invoice.total.toFixed(2)}</div>
                          <Badge variant="outline" className="mt-1">
                            {invoice.paymentMode}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Mode Breakdown (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['Cash', 'UPI', 'Card', 'Other'].map((mode) => {
                const modeInvoices = recentInvoices.filter(inv => inv.paymentMode === mode);
                const total = InvoiceStore.getTotalSales(modeInvoices);
                
                if (modeInvoices.length === 0) return null;
                
                return (
                  <TableRow key={mode}>
                    <TableCell className="font-medium">{mode}</TableCell>
                    <TableCell className="text-right">{modeInvoices.length}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
