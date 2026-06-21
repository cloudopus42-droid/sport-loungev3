import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import api from '@/lib/api';
import type { FeatureStatusMap } from '@/types';

interface FeatureContextType {
  features: FeatureStatusMap;
  loading: boolean;
  isFeatureEnabled: (featureKey: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType>({
  features: {},
  loading: true,
  isFeatureEnabled: () => false,
  refreshFeatures: async () => {},
});

interface FeatureProviderProps {
  children: ReactNode;
}

export function FeatureProvider({ children }: FeatureProviderProps) {
  const [features, setFeatures] = useState<FeatureStatusMap>({});
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    try {
      const { data } = await api.get<FeatureStatusMap>('/api/smart-features/status');
      setFeatures(data);
    } catch {
      setFeatures({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const isFeatureEnabled = useCallback(
    (featureKey: string): boolean => {
      if (loading) return false;
      return features[featureKey]?.enabled ?? false;
    },
    [features, loading]
  );

  return (
    <FeatureContext.Provider
      value={{
        features,
        loading,
        isFeatureEnabled,
        refreshFeatures: fetchFeatures,
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const ctx = useContext(FeatureContext);
  if (!ctx) throw new Error('useFeature must be used within FeatureProvider');
  return ctx;
}
