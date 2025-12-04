"use client";

// Authentication hook and context

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { SessionStore, UserStore, initializeStore } from '../store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize store on mount
    initializeStore();
    
    // Check for existing session
    const currentUser = SessionStore.get();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = (pin: string): boolean => {
    const authenticatedUser = UserStore.authenticate(pin);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      SessionStore.set(authenticatedUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    SessionStore.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
