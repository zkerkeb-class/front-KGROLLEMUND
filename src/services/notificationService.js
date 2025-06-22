import { notificationAPI } from './axiosConfig';

// Services de notification
export const sendEmail = (emailData) => 
  notificationAPI.post('/send-email', emailData);

export const sendSMS = (smsData) => 
  notificationAPI.post('/send-sms', smsData);

export const getUserNotifications = (userId) => 
  notificationAPI.get(`/user/${userId}`);

export const markAsRead = (notificationId) => 
  notificationAPI.put(`/${notificationId}/read`);

export const deleteNotification = (notificationId) => 
  notificationAPI.delete(`/${notificationId}`);

export const updateNotificationPreferences = (userId, preferences) => 
  notificationAPI.put(`/preferences/${userId}`, preferences); 