import axios from 'axios';

// Root server address — update this if your local IP changes or when deploying to Render
export const SERVER_URL = 'http://192.168.1.3:5000';

// Axios instance pointing to the API — all screens import this for data calls
const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export default api;