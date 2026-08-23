import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      // Fetch user profile to verify token
      api.get('/users/profile')
        .then(res => {
          setUser(res.data.data.user);
        })
        .catch(() => {
          // Interceptor handles refresh/logout
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  // Handle direct GitHub OAuth callback token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      
      // Clean up the URL so the token isn't visible in the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleAuthRefresh = (e) => {
      setToken(e.detail);
    };

    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:refresh', handleAuthRefresh);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:refresh', handleAuthRefresh);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = res.data.data;
    setToken(accessToken);
    setUser(userData);
  };

  const register = async (email, username, password) => {
    await api.post('/auth/register', { email, username, password });
    await login(email, password); // Auto login after register
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(err) {
      // ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
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
