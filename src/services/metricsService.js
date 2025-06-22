import { dbAPI } from './axiosConfig';

// Services de métriques
export const getUserMetrics = (userId) => 
  dbAPI.get(`/metrics/user/${userId}`);

export const getSystemMetrics = () => 
  dbAPI.get('/metrics/system');

export const trackEvent = (eventData) => 
  dbAPI.post('/metrics/events', eventData);

export const getDashboardData = (userId) => 
  dbAPI.get(`/metrics/dashboard/${userId}`);

export const getAnalytics = (params) => 
  dbAPI.get('/metrics/analytics', { params });

export const getUserActivity = (userId, period) => 
  dbAPI.get(`/metrics/activity/${userId}`, { params: { period } });

export const getUsageStatistics = (userId) => 
  dbAPI.get(`/metrics/usage/${userId}`); 