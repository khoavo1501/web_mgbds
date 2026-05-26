import api from './api';

export const getMyReputationScore = async () => {
  const response = await api.get('/reputation/my-score');
  return response.data;
};

export const getReputationHistory = async () => {
  const response = await api.get('/reputation/history');
  return response.data;
};

export const getRecentHistory = async () => {
  const response = await api.get('/reputation/recent-history');
  return response.data;
};
