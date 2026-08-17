/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';

export type FeatureKey = 'ai_chatbot' | 'sos_emergency_alerts' | 'gamification_badges' | 'news_content_portal';

type FeatureStates = Record<FeatureKey, boolean>;

const DEFAULT_STATES: FeatureStates = {
  ai_chatbot: true,
  sos_emergency_alerts: true,
  gamification_badges: true,
  news_content_portal: true,
};

interface FeatureFlagsContextValue {
  features: FeatureStates;
  loading: boolean;
  isEnabled: (key: FeatureKey) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  features: DEFAULT_STATES,
  loading: true,
  isEnabled: () => true,
  refresh: async () => undefined,
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureStates>(DEFAULT_STATES);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/feature-status');
      setFeatures((current) => ({ ...current, ...(response.data?.features || {}) }));
    } catch {
      // Keep optimistic defaults. Protected APIs remain the source of truth.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: FeatureKey; isEnabled?: boolean }>).detail;
      if (detail?.key && typeof detail.isEnabled === 'boolean') {
        setFeatures((current) => ({ ...current, [detail.key!]: detail.isEnabled! }));
      } else {
        void refresh();
      }
    };
    window.addEventListener('feature-flags-updated', handleUpdate);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener('feature-flags-updated', handleUpdate);
    };
  }, [refresh]);

  return (
    <FeatureFlagsContext.Provider value={{ features, loading, isEnabled: (key) => features[key], refresh }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagsContext);
