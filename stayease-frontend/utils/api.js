import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SERVER_URL = API_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // fail fast — don't hang forever
});

// Attach token on every request without each screen touching AsyncStorage
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
