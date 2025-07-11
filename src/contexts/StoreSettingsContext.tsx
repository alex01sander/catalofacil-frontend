import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StoreSettings, StoreSettingsContextType } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { fetchStoreSettings, updateStoreSettings } from '@/hooks/useStoreSettingsLogic';

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

interface StoreSettingsProviderProps {
  children: ReactNode;
}

export const StoreSettingsProvider = ({ children }: StoreSettingsProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setError(null);
      setLoading(true);
      const fetchedSettings = await fetchStoreSettings(user);
      setSettings(fetchedSettings);
    } catch (error) {
      console.error('Error loading store settings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      setError(null);
      await updateStoreSettings(user, newSettings);
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating store settings:', error);
      throw error;
    }
  };

  const refetch = async () => {
    await loadSettings();
  };

  useEffect(() => {
    // Only load settings after auth is loaded
    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading, user]);

  return (
    <StoreSettingsContext.Provider value={{
      settings,
      loading,
      error,
      updateSettings,
      refetch
    }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};