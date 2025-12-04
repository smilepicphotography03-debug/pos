"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Store, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleLogin = () => {
    if (pin.length < 4) {
      setError('Please enter at least 4 digits');
      return;
    }

    const success = login(pin);
    if (!success) {
      setError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (/^\d$/.test(e.key)) {
      handlePinInput(e.key);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Kumar Pooja Store</CardTitle>
          <CardDescription>POS Billing System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Lock className="w-4 h-4" />
              <span>Enter PIN to continue</span>
            </div>
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyPress}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Default PIN: 1234
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                className="h-14 text-xl font-semibold"
                onClick={() => handlePinInput(digit.toString())}
              >
                {digit}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-14 text-lg"
              onClick={handleBackspace}
            >
              ←
            </Button>
            <Button
              variant="outline"
              className="h-14 text-xl font-semibold"
              onClick={() => handlePinInput('0')}
            >
              0
            </Button>
            <Button
              variant="default"
              className="h-14 text-lg font-semibold"
              onClick={handleLogin}
            >
              OK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
