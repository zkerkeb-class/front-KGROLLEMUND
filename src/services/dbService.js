import { dbAPI } from './axiosConfig';

// Services de base de données
export const getUsers = () => 
  dbAPI.get('/users');

export const getUserById = (userId) => 
  dbAPI.get(`/users/${userId}`);

export const updateUser = (userId, userData) => 
  dbAPI.put(`/users/${userId}`, userData);

export const deleteUser = (userId) => 
  dbAPI.delete(`/users/${userId}`);

export const updateSubscription = (userId, isSubscribed) => 
  dbAPI.put(`/users/${userId}/subscription`, { isSubscribed });

export const searchUsers = (query) => 
  dbAPI.get('/users/search', { params: { q: query } }); 