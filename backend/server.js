const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const envPath = path.resolve(__dirname, '.env');
const dotenvResult = dotenv.config();

if (dotenvResult.error) {
  console.warn(`dotenv: failed to load .env, trying ${envPath}`);
  dotenv.config({ path: envPath });
}

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./modules/auth/authRoutes'));
app.use('/api/rooms', require('./modules/room/roomRoutes'));
app.use('/api/bookings', require('./modules/booking/bookingRoutes'));
app.use('/api/reviews', require('./modules/review/reviewRoutes'));
app.use('/api/payments', require('./modules/payment/paymentRoutes'));
app.use('/api/staff', require('./modules/staff/staffRoutes'));
app.use('/api/complaints', require('./modules/complaint/complaintRoutes'));

// Base route
app.get('/', (req, res) => {
  res.send('StayEase API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));