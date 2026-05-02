import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStoredAuth(); }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;

        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        const hydratedUser = {
          id: res.data._id || res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          phone: res.data.phone || '',
        };

        await AsyncStorage.setItem('token', storedToken);
        await AsyncStorage.setItem('user', JSON.stringify(hydratedUser));

        setToken(storedToken);
        setUser(hydratedUser);
      } else {
        delete api.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.log('Auth load error:', e);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete api.defaults.headers.common.Authorization;
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (input) => {
    const payload =
      input && typeof input === 'object'
        ? {
            name: input.name || input.fullName || '',
            email: input.email || '',
            password: input.password || '',
            phone: input.phone || '',
            role: 'guest',
          }
        : {
            name: '',
            email: '',
            password: '',
            phone: '',
            role: 'guest',
          };

    const res = await api.post('/auth/register', payload);
    const { token: t, user: u } = res.data;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    setToken(t);
    setUser(u);
    return u;
  };

  const checkEmailAvailability = async (email) => {
    const res = await api.get('/auth/check-email', { params: { email } });
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, checkEmailAvailability }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
