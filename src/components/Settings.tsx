"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import {
  Settings as SettingsIcon,
  Store,
  FileText,
  Palette,
  Users,
  Save,
  Upload,
  Moon,
  Sun,
} from 'lucide-react';
import { ShopSettings, User, UserRole, PaperSize } from '@/lib/types';
import { SettingsStore, UserStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ShopSettings>(SettingsStore.get());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Cashier' as UserRole,
    pin: '',
  });

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  useEffect(() => {
    if (settings.upiId) {
      generateQRCode(settings.upiId);
    }
  }, [settings.upiId]);

  const loadSettings = () => {
    setSettings(SettingsStore.get());
  };

  const loadUsers = () => {
    setUsers(UserStore.getAll());
  };

  const generateQRCode = async (upiId: string) => {
    try {
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

  const handleSaveShopSettings = () => {
    SettingsStore.update(settings);
    toast.success('Shop settings saved successfully');
  };

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updatedSettings = { ...settings, theme: newTheme };
    setSettings(updatedSettings);
    SettingsStore.update(updatedSettings);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success(`Theme changed to ${newTheme} mode`);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.pin) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }

    UserStore.create(newUser);
    toast.success('User added successfully');
    setNewUser({ name: '', role: 'Cashier', pin: '' });
    setShowAddUser(false);
    loadUsers();
  };

  const handleDeleteUser = (id: string) => {
    if (id === 'admin') {
      toast.error('Cannot delete admin user');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      UserStore.delete(id);
      toast.success('User deleted successfully');
      loadUsers();
    }
  };

  const handleUploadQRCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSettings({ ...settings, qrCodeUrl: dataUrl });
        toast.success('QR code uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = 'upi-qr-code.png';
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  // Apply theme on component mount
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your POS system settings
        </p>
      </div>

      <Tabs defaultValue="shop" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="shop" className="gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Shop</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
        </TabsList>

        {/* Shop Settings */}
        <TabsContent value="shop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>
                Update your shop details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  placeholder="Kumar Pooja Store"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Enter shop address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+91 1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  value={settings.gst}
                  onChange={(e) => setSettings({ ...settings, gst: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="yourname@upi"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your UPI ID to generate payment QR code
                </p>
              </div>

              {qrCodeDataUrl && (
                <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
                  <Label>Generated UPI QR Code</Label>
                  <img src={qrCodeDataUrl} alt="UPI QR Code" className="w-48 h-48" />
                  <Button variant="outline" onClick={downloadQRCode}>
                    <Upload className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="qrUpload">Or Upload Custom QR Code</Label>
                <Input
                  id="qrUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadQRCode}
                  className="cursor-pointer"
                />
              </div>

              <Button onClick={handleSaveShopSettings}>
                <Save className="w-4 h-4 mr-2" />
                Save Shop Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Configuration</CardTitle>
              <CardDescription>
                Customize invoice numbering and print settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="INV"
                  />
                </div>

                <div>
                  <Label htmlFor="invoiceCounter">Next Invoice Number</Label>
                  <Input
                    id="invoiceCounter"
                    type="number"
                    value={settings.invoiceCounter}
                    onChange={(e) => setSettings({ ...settings, invoiceCounter: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select
                  value={settings.paperSize}
                  onValueChange={(value) => setSettings({ ...settings, paperSize: value as PaperSize })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thermal">Thermal (80mm)</SelectItem>
                    <SelectItem value="A4">A4 Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency Symbol</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  placeholder="₹"
                />
              </div>

              <Button onClick={handleSaveShopSettings}>
                <Save className="w-4 h-4 mr-2" />
                Save Invoice Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <Switch
                    checked={settings.theme === 'dark'}
                    onCheckedChange={handleThemeToggle}
                  />
                  <Moon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage users and their access
                  </CardDescription>
                </div>
                {user?.role === 'Admin' && (
                  <Button onClick={() => setShowAddUser(!showAddUser)}>
                    <Users className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddUser && user?.role === 'Admin' && (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label htmlFor="newUserName">Name</Label>
                      <Input
                        id="newUserName"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newUserRole">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Cashier">Cashier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="newUserPin">PIN (4-6 digits)</Label>
                      <Input
                        id="newUserPin"
                        type="password"
                        value={newUser.pin}
                        onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="Enter PIN"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleAddUser} className="flex-1">
                        Add User
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddUser(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {users.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-sm text-muted-foreground">{u.role}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.id === user?.id && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Current User
                            </span>
                          )}
                          {user?.role === 'Admin' && u.id !== 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
