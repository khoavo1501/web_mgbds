import { createContext, useContext, useState, useEffect } from 'react';
import { getMyReputationScore } from '../services/reputationService';
import { useAuth } from './AuthContext';

const ReputationContext = createContext();

export function ReputationProvider({ children }) {
  const { user } = useAuth();
  const [reputationScore, setReputationScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReputationScore = async () => {
    if (!user || user.role !== 'customer') {
      setReputationScore(null);
      return;
    }

    try {
      setLoading(true);
      const response = await getMyReputationScore();
      if (response.success) {
        setReputationScore(response.data);
      }
    } catch (error) {
      console.error('Error fetching reputation score:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReputationScore();
  }, [user]);

  const refreshScore = () => {
    fetchReputationScore();
  };

  return (
    <ReputationContext.Provider value={{ reputationScore, loading, refreshScore }}>
      {children}
    </ReputationContext.Provider>
  );
}

export function useReputation() {
  const context = useContext(ReputationContext);
  if (!context) {
    throw new Error('useReputation must be used within ReputationProvider');
  }
  return context;
}
