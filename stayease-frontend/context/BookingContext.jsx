import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

  // CREATE booking
  const createBooking = async (bookingData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Creating booking with data:', bookingData);
      console.log('API URL:', API_URL);
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await axios.post(`${API_URL}/bookings`, bookingData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Booking created successfully:', response.data);
      setBookings([...bookings, response.data]);
      return response.data;
    } catch (err) {
      console.log('=== BOOKING ERROR ===');
      console.log('Error response:', err.response?.data);
      console.log('Error status:', err.response?.status);
      console.log('Error message:', err.message);
      console.log('Full error:', err);

      const message = err.response?.data?.message || err.message || 'Failed to create booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // GET my bookings
  const getMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching my bookings...');
      const response = await axios.get(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data.bookings);
      return response.data;
    } catch (err) {
  console.log('Error details:', err);
  const message = err?.response?.data?.message || err?.message || 'Failed to create booking';
  setError(message);
  throw err;
    } finally {
      setLoading(false);
    }
  };

  // GET single booking
  const getBookingById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.booking;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // CANCEL booking
  const cancelBooking = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_URL}/bookings/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(bookings.map(b => b._id === id ? response.data : b));
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ADMIN: GET all bookings
  const getAllBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data.bookings);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch bookings';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ADMIN: Update booking status
  const updateBookingStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(
        `${API_URL}/bookings/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(bookings.map(b => b._id === id ? response.data : b));
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      loading,
      error,
      getMyBookings,
      getBookingById,
      createBooking,
      cancelBooking,
      getAllBookings,
      updateBookingStatus,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
