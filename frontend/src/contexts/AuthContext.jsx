import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

/**
 * AuthContext — Global authentication state
 *
 * Token Security (XSS hardening):
 *   OLD: token stored in localStorage → any injected <script> can steal it
 *   NEW: token stored in React state ONLY (in-memory)
 *        → XSS cannot read it (not in localStorage, not in a cookie JS can read)
 *        → On page refresh: silently calls POST /auth/refresh via httpOnly cookie
 *           If cookie is valid → user stays logged in automatically
 *           If cookie is gone/expired → user sees the login page
 *
 * Why this is safe:
 *   The refresh token lives in an httpOnly cookie (set by the backend).
 *   httpOnly cookies are NEVER readable by JavaScript — only the browser
 *   sends them automatically on requests to the same origin.
 *   So the refresh flow is:
 *     Page load → POST /auth/refresh (browser auto-sends cookie)
 *               → server validates cookie → returns new accessToken in JSON
 *               → we store accessToken ONLY in React state + Axios defaults
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // ── Token lives ONLY in memory (not localStorage) ──────────────────────────
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);   // ← never persisted to localStorage
  const [loading, setLoading] = useState(true);

  // Ref to avoid stale-closure issues in event listeners
  const tokenRef = useRef(null);

  // ── On mount: silently refresh via httpOnly cookie ───────────────────────────
  // This replaces the old localStorage.getItem('token') check.
  // If the user's refresh token cookie is still valid, they stay logged in
  // without ever having to type their password again.
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        const { accessToken, user: userData } = data.data;

        setToken(accessToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        tokenRef.current = accessToken;
      } catch {
        // Cookie is gone or expired — user needs to log in
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    silentRefresh();
  }, []);

  // ── Handle GitHub OAuth callback (Secure one-time code exchange) ───────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tokenFromUrl = params.get('token');

    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      api.post('/auth/oauth/exchange', { code })
        .then(res => {
          const { accessToken, user: authUser } = res.data.data;
          setToken(accessToken);
          tokenRef.current = accessToken;
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          setUser(authUser);
        })
        .catch(err => {
          console.error('OAuth code exchange failed in AuthContext:', err);
        });
    } else if (tokenFromUrl) {
      setToken(tokenFromUrl);
      tokenRef.current = tokenFromUrl;
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;
      window.history.replaceState({}, document.title, window.location.pathname);

      api.get('/users/profile')
        .then(res => setUser(res.data.data.user))
        .catch(() => {});
    }
  }, []);

  // ── Listen for interceptor events ─────────────────────────────────────────
  // api.js dispatches these custom events when refresh succeeds or fails
  useEffect(() => {
    const handleRefresh = (e) => {
      setToken(e.detail);
      tokenRef.current = e.detail;
    };

    const handleLogout = () => logout();

    window.addEventListener('auth:refresh', handleRefresh);
    window.addEventListener('auth:logout',  handleLogout);

    return () => {
      window.removeEventListener('auth:refresh', handleRefresh);
      window.removeEventListener('auth:logout',  handleLogout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = res.data.data;

    setToken(accessToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    tokenRef.current = accessToken;
    // Note: We do NOT write to localStorage — token lives only in memory
  };

  const register = async (email, username, password) => {
    await api.post('/auth/register', { email, username, password });
    await login(email, password); // auto-login after register
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // clears httpOnly cookie on server
    } catch {
      // ignore — even if this fails, clear client state
    }
    setToken(null);
    setUser(null);
    tokenRef.current = null;
    delete api.defaults.headers.common['Authorization'];
    // No localStorage to clear — nothing to do here
  };

  const loginWithGithub = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiUrl}/auth/github`;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithGithub }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
