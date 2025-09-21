import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

type AuthContextType = {
  authorized: boolean;
  isLoading: boolean;
  userRole: string | null;
  toggleAuthorized: (param: boolean) => void;
  checkAuthorization: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Читаем роль из localStorage при инициализации
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem('Role'));
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Функция загрузки роли пользователя с API
  const fetchUserRole = useCallback(async (token: string) => {
    try {
      const response = await fetch("http://1180973-cr87650.tw1.ru/user", {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role || null);
        localStorage.setItem('Role', userData.role?.toString() || '');
      } else {
        console.warn('Failed to fetch user data');
        setUserRole(null);
        localStorage.removeItem('Role');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setUserRole(null);
      localStorage.removeItem('Role');
    }
  }, []);

  // Проверка токена и состояния авторизации (без запроса на сервер)
  const checkAuthorization = useCallback(() => {
    const token = Cookies.get('token');

    if (!token) {
      setAuthorized(false);
      setUserRole(null);
      localStorage.removeItem('Role');
      setIsLoading(false);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp && decoded.exp > currentTime) {
        setAuthorized(true);
      } else {
        Cookies.remove('token');
        setAuthorized(false);
        setUserRole(null);
        localStorage.removeItem('Role');
      }
    } catch (error) {
      console.error('Invalid token', error);
      Cookies.remove('token');
      setAuthorized(false);
      setUserRole(null);
      localStorage.removeItem('Role');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // При монтировании и изменении authorized грузим роль, если её нет и токен есть
  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  useEffect(() => {
    const token = Cookies.get('token');

    // Если авторизован, есть токен и роли нет в state — загружаем её
    if (authorized && token && !userRole) {
      fetchUserRole(token);
    }
  }, [authorized, userRole, fetchUserRole]);

  // toggleAuthorized можно оставить, если нужна ручная смена состояния авторизации
  const toggleAuthorized = (param: boolean) => {
    setAuthorized(param);
  };

  const contextValue = useMemo(() => ({
    authorized,
    isLoading,
    userRole,
    toggleAuthorized,
    checkAuthorization,
  }), [authorized, isLoading, userRole, toggleAuthorized, checkAuthorization]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
