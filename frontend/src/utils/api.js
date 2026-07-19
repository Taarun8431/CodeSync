import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // Crucial for HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// We can add request interceptors here later to inject the Access Token if we decide not to use cookies for it
// Currently, backend expects accessToken via header or just handles logic. 
// If we stored accessToken in memory/localStorage, we inject it here.

export default api;
