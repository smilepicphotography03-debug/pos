"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  FileText,
  Search,
  Eye,
  Printer,
  Share2,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { Invoice } from '@/lib/types';
import { InvoiceStore, SettingsStore } from '@/lib/store';
import { formatQuantity } from '@/lib/units';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, startDate, endDate]);

  const loadInvoices = () => {
    const allInvoices = InvoiceStore.getAll();
    setInvoices(allInvoices.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName?.toLowerCase().includes(query) ||
        inv.customerPhone?.includes(query) ||
        inv.cashierName.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(inv => new Date(inv.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.createdAt) <= end);
    }

    setFilteredInvoices(filtered);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // Wait for state to update, then trigger print
    setTimeout(() => {
      const printContent = document.getElementById('invoice-print-content');
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 24px;
                  }
                  .info-section {
                    margin: 20px 0;
                  }
                  .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                  }
                  th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                  }
                  th {
                    background-color: #f2f2f2;
                  }
                  .totals {
                    margin-top: 20px;
                    text-align: right;
                  }
                  .totals div {
                    margin: 5px 0;
                  }
                  .total {
                    font-size: 18px;
                    font-weight: bold;
                  }
                  .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                  }
                  @media print {
                    body {
                      padding: 0;
                    }
                  }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      }
    }, 100);
  };

  const handleWhatsAppShare = (invoice: Invoice) => {
    const settings = SettingsStore.get();
    
    let message = `*${settings.shopName}*\n`;
    message += `Invoice: ${invoice.invoiceNumber}\n`;
    message += `Date: ${format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}\n`;
    
    if (invoice.customerName) {
      message += `Customer: ${invoice.customerName}\n`;
    }
    
    message += `\n*Items:*\n`;
    invoice.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   ${formatQuantity(item.quantity, item.product.baseUnit)} @ ₹${item.product.price.toFixed(2)}\n`;
      message += `   Subtotal: ₹${item.subtotal.toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal:* ₹${invoice.subtotal.toFixed(2)}\n`;
    
    if (invoice.discount > 0) {
      const discountAmount = invoice.discountType === 'percentage' 
        ? (invoice.subtotal * invoice.discount) / 100 
        : invoice.discount;
      message += `*Discount:* -₹${discountAmount.toFixed(2)}\n`;
    }
    
    message += `*Total:* ₹${invoice.total.toFixed(2)}\n`;
    message += `*Payment Mode:* ${invoice.paymentMode}\n`;
    
    message += `\nThank you for your business!\n`;
    if (settings.phone) {
      message += `Contact: ${settings.phone}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = invoice.customerPhone?.replace(/\D/g, '');
    
    if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  const getTotalSales = () => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Invoice History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all invoices
          </p>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Sales</div>
            <div className="text-2xl font-bold">₹{getTotalSales().toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Invoice, customer, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {(searchQuery || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || startDate || endDate
                  ? 'No invoices found matching your filters'
                  : 'No invoices yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(invoice.createdAt), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.customerName ? (
                          <div>
                            <div className="font-medium">{invoice.customerName}</div>
                            {invoice.customerPhone && (
                              <div className="text-xs text-muted-foreground">
                                {invoice.customerPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{invoice.items.length}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.paymentMode}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrint(invoice)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsAppShare(invoice)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Invoice Number</Label>
                  <div className="font-medium">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div>
                  <Label>Date & Time</Label>
                  <div className="font-medium">
                    {format(new Date(selectedInvoice.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </div>
                </div>
                <div>
                  <Label>Customer</Label>
                  <div className="font-medium">
                    {selectedInvoice.customerName || '-'}
                  </div>
                  {selectedInvoice.customerPhone && (
                    <div className="text-xs text-muted-foreground">
                      {selectedInvoice.customerPhone}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Cashier</Label>
                  <div className="font-medium">{selectedInvoice.cashierName}</div>
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Badge variant="outline">{selectedInvoice.paymentMode}</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-lg">Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatQuantity(item.quantity, item.product.baseUnit)} @ ₹
                              {item.product.price.toFixed(2)}/{item.product.baseUnit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{item.subtotal.toFixed(2)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>
                      Discount ({selectedInvoice.discountType === 'percentage' 
                        ? `${selectedInvoice.discount}%` 
                        : 'Fixed'}):
                    </span>
                    <span className="text-destructive">
                      -₹{(selectedInvoice.discountType === 'percentage'
                        ? (selectedInvoice.subtotal * selectedInvoice.discount) / 100
                        : selectedInvoice.discount
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedInvoice)}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleWhatsAppShare(selectedInvoice)}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print content */}
      {selectedInvoice && (
        <div id="invoice-print-content" style={{ display: 'none' }}>
          <InvoicePrintTemplate invoice={selectedInvoice} />
        </div>
      )}
    </div>
  );
}

// Print Template Component
function InvoicePrintTemplate({ invoice }: { invoice: Invoice }) {
  const settings = SettingsStore.get();

  return (
    <div>
      <div className="header">
        <h1>{settings.shopName}</h1>
        {settings.address && <p>{settings.address}</p>}
        {settings.phone && <p>Phone: {settings.phone}</p>}
        {settings.gst && <p>GST: {settings.gst}</p>}
      </div>

      <div className="info-section">
        <div className="info-row">
          <strong>Invoice No:</strong>
          <span>{invoice.invoiceNumber}</span>
        </div>
        <div className="info-row">
          <strong>Date:</strong>
          <span>{format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm:ss')}</span>
        </div>
        {invoice.customerName && (
          <div className="info-row">
            <strong>Customer:</strong>
            <span>{invoice.customerName}</span>
          </div>
        )}
        {invoice.customerPhone && (
          <div className="info-row">
            <strong>Phone:</strong>
            <span>{invoice.customerPhone}</span>
          </div>
        )}
        <div className="info-row">
          <strong>Payment:</strong>
          <span>{invoice.paymentMode}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.product.name}</td>
              <td>{formatQuantity(item.quantity, item.product.baseUnit)}</td>
              <td>₹{item.product.price.toFixed(2)}</td>
              <td>₹{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <div>Subtotal: ₹{invoice.subtotal.toFixed(2)}</div>
        {invoice.discount > 0 && (
          <div>
            Discount: -₹
            {(invoice.discountType === 'percentage'
              ? (invoice.subtotal * invoice.discount) / 100
              : invoice.discount
            ).toFixed(2)}
          </div>
        )}
        <div className="total">Total: ₹{invoice.total.toFixed(2)}</div>
      </div>

      <div className="footer">
        <p>Thank you for your business!</p>
        {settings.email && <p>{settings.email}</p>}
      </div>
    </div>
  );
}
