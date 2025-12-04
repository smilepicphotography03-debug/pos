"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  Percent,
  CheckCircle,
  X,
  Send,
  Printer,
} from 'lucide-react';
import { Product, CartItem, PaymentMode, Unit, Invoice } from '@/lib/types';
import { ProductStore, InvoiceStore, SettingsStore } from '@/lib/store';
import { getAvailableUnits, convertUnit, toBaseUnit, formatQuantity } from '@/lib/units';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import QRCode from 'qrcode';

const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Other'];

export function POSBilling() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit>('Kg');
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    loadProducts();
    generateUPIQRCode();
  }, []);

  const loadProducts = () => {
    setProducts(ProductStore.getAll());
  };

  const generateUPIQRCode = async () => {
    try {
      const upiId = '9489657260@upi';
      const settings = SettingsStore.get();
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(settings.shopName)}`;
      const dataUrl = await QRCode.toDataURL(upiUrl, {
        width: 300,
        margin: 2,
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const filteredProducts = searchQuery
    ? ProductStore.search(searchQuery)
    : products.slice(0, 10);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedUnit(product.baseUnit);
    setQuantity('');
  };

  // Calculate price based on current quantity and unit
  const calculatePrice = () => {
    if (!selectedProduct || !quantity) return 0;
    
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 0;
    
    const baseQuantity = toBaseUnit(qty, selectedUnit);
    return baseQuantity * selectedProduct.price;
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Convert to base unit
    const baseQuantity = toBaseUnit(qty, selectedUnit);

    // Check stock
    if (baseQuantity > selectedProduct.stock) {
      toast.error('Insufficient stock available');
      return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.product.id === selectedProduct.id);

    if (existingIndex >= 0) {
      // Update existing item
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + baseQuantity,
        displayQuantity: qty,
        unit: selectedUnit,
        subtotal: (newCart[existingIndex].quantity + baseQuantity) * selectedProduct.price,
      };
      setCart(newCart);
    } else {
      // Add new item
      const cartItem: CartItem = {
        product: selectedProduct,
        quantity: baseQuantity,
        unit: selectedUnit,
        displayQuantity: qty,
        discount: 0,
        subtotal: baseQuantity * selectedProduct.price,
      };
      setCart([...cart, cartItem]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity('');
    setSearchQuery('');
    toast.success('Added to cart');
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.success('Removed from cart');
  };

  const handleUpdateQuantity = (index: number, change: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
      handleRemoveFromCart(index);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error('Insufficient stock');
      return;
    }

    newCart[index] = {
      ...item,
      quantity: newQuantity,
      subtotal: newQuantity * item.product.price,
    };
    setCart(newCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const discountValue = parseFloat(discount) || 0;

    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleCompletePayment = () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const invoice = InvoiceStore.create({
        items: cart,
        subtotal: calculateSubtotal(),
        discount: parseFloat(discount) || 0,
        discountType,
        total: calculateTotal(),
        paymentMode,
        cashierId: user.id,
        cashierName: user.name,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      });

      setCompletedInvoice(invoice);
      setShowPaymentDialog(false);
      setShowSuccessDialog(true);
      
      // Reset form
      setCart([]);
      setDiscount('0');
      setCustomerName('');
      setCustomerPhone('');
      loadProducts();
      
      toast.success(`Invoice ${invoice.invoiceNumber} created successfully!`);
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const formatWhatsAppMessage = (invoice: Invoice) => {
    const settings = SettingsStore.get();
    
    let message = `*${settings.shopName}*\n`;
    message += `${settings.address}\n`;
    message += `Phone: ${settings.phone}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*INVOICE: ${invoice.invoiceNumber}*\n`;
    message += `Date: ${new Date(invoice.createdAt).toLocaleString('en-IN')}\n\n`;
    
    if (invoice.customerName) {
      message += `Customer: ${invoice.customerName}\n`;
    }
    if (invoice.customerPhone) {
      message += `Phone: ${invoice.customerPhone}\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*ITEMS:*\n\n`;
    
    invoice.items.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   Price: ₹${item.product.price.toFixed(2)} / ${item.product.baseUnit}\n`;
      message += `   Qty: ${item.displayQuantity} ${item.unit}`;
      
      if (item.unit !== item.product.baseUnit) {
        message += ` (${formatQuantity(item.quantity, item.product.baseUnit)})`;
      }
      message += `\n`;
      message += `   Total: ₹${item.subtotal.toFixed(2)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Subtotal: ₹${invoice.subtotal.toFixed(2)}\n`;
    
    if (invoice.discount > 0) {
      message += `Discount: -₹${invoice.discount.toFixed(2)}\n`;
    }
    
    message += `*Grand Total: ₹${invoice.total.toFixed(2)}*\n\n`;
    message += `Payment Mode: ${invoice.paymentMode}\n`;
    message += `UPI ID: 9489657260@upi\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Thank you for shopping with us! 🙏`;
    
    return message;
  };

  const handleShareWhatsApp = () => {
    if (!completedInvoice) return;
    
    const phone = completedInvoice.customerPhone;
    if (!phone) {
      toast.error('Customer phone number is required for WhatsApp sharing');
      return;
    }
    
    // Format phone number - ensure it has country code
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    const message = formatWhatsAppMessage(completedInvoice);
    const encodedMessage = encodeURIComponent(message);
    
    // Check if mobile or desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile
      ? `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`
      : `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const handlePrint = () => {
    toast.info('Print functionality will be implemented');
  };

  const handleNewBill = () => {
    setShowSuccessDialog(false);
    setCompletedInvoice(null);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 md:p-6">
      {/* Left Panel - Product Search */}
      <div className="flex-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by name, category, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer hover:bg-muted transition-colors ${
                    selectedProduct?.id === product.id ? 'border-primary bg-muted' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Stock: {formatQuantity(product.stock, product.baseUnit)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{product.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">per {product.baseUnit}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add to Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selected Product</Label>
                <div className="font-medium text-lg">{selectedProduct.name}</div>
                <div className="text-sm text-muted-foreground">
                  ₹{selectedProduct.price.toFixed(2)} per {selectedProduct.baseUnit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={selectedUnit} onValueChange={(value) => setSelectedUnit(value as Unit)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableUnits(selectedProduct.baseUnit).map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Real-time Price Calculation Display */}
              {quantity && parseFloat(quantity) > 0 && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{quantity} {selectedUnit}</span>
                  </div>
                  {selectedUnit !== selectedProduct.baseUnit && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Converts to:</span>
                      <span className="font-medium">
                        {formatQuantity(toBaseUnit(parseFloat(quantity), selectedUnit), selectedProduct.baseUnit)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Price:</span>
                    <span className="text-lg font-bold text-primary">
                      ₹{calculatePrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button onClick={handleAddToCart} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full md:w-96 space-y-4">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Cart is empty
                </div>
              ) : (
                cart.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatQuantity(item.quantity, item.product.baseUnit)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(index, -item.product.baseUnit === 'Kg' || item.product.baseUnit === 'Litre' ? -0.1 : -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(index, item.product.baseUnit === 'Kg' || item.product.baseUnit === 'Litre' ? 0.1 : 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="font-semibold">
                          ₹{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">₹</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Discount"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span className="text-destructive">-₹{calculateDiscount().toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full"
                size="lg"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PaymentMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Customer Phone (for WhatsApp)</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter 10-digit phone number"
              />
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount:</span>
                <span>-₹{calculateDiscount().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCompletePayment} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with QR Code */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                Payment Successful!
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {completedInvoice && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="text-2xl font-bold">{completedInvoice.invoiceNumber}</p>
                <p className="text-lg font-semibold">₹{completedInvoice.total.toFixed(2)}</p>
              </div>
            )}

            <Separator />

            {/* UPI QR Code */}
            <div className="flex flex-col items-center gap-3 p-4 bg-muted rounded-lg">
              <p className="font-semibold text-center">Scan to Pay via UPI</p>
              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 border-4 border-white rounded-lg shadow-md" 
                />
              )}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">UPI ID</p>
                <p className="font-mono font-semibold text-lg">9489657260@upi</p>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              {completedInvoice?.customerPhone && (
                <Button 
                  onClick={handleShareWhatsApp} 
                  className="w-full"
                  variant="default"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share Invoice on WhatsApp
                </Button>
              )}
              
              <Button 
                onClick={handlePrint} 
                className="w-full"
                variant="outline"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>

              <Button 
                onClick={handleNewBill} 
                className="w-full"
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}