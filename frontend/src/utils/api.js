import axios from 'axios';

/**
 * Axios instance with automatic token refresh
 *
 * Token storage strategy:
 *   - Access token: stored ONLY in Axios defaults (api.defaults.headers.common['Authorization'])
 *                   Set by AuthContext after login/refresh. Never in localStorage.
 *   - Refresh token: httpOnly cookie, set by backend. Browser sends automatically.
 *
 * Concurrent request handling:
 *   Problem: If 5 API calls fire at the same time and all get 401,
 *            naively you'd send 5 refresh requests → race condition.
 *   Solution: isRefreshing flag + failedQueue pattern:
 *     1. First 401 → set isRefreshing=true, call /auth/refresh
 *     2. Other 401s → push to failedQueue (they wait as Promises)
 *     3. When refresh succeeds → processQueue(token) replays all waiting requests
 *     4. If refresh fails → processQueue(error) rejects all + fires auth:logout event
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // CRITICAL: sends httpOnly refresh token cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else       prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that:
    //   - Are not already a retry (prevents infinite loops)
    //   - Are not the refresh endpoint itself (prevents recursive refresh)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Browser auto-sends the httpOnly refresh token cookie here
        const { data } = await api.post('/auth/refresh');
        const { accessToken } = data.data;

        // Update Axios default header — this is the ONLY place token is stored
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization']     = `Bearer ${accessToken}`;

        // Replay all queued requests with the new token
        processQueue(null, accessToken);

        // Notify AuthContext to update its state
        window.dispatchEvent(new CustomEvent('auth:refresh', { detail: accessToken }));

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — session is truly expired, force logout
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
