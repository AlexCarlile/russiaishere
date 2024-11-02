import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

// Создаем контекст для авторизации
type AuthContextType = {
  authorized: boolean | undefined;
  toggleAuthorized: (param: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Создаем провайдер для контекста
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authorized, setAuthorized] = useState<boolean | undefined>(true);

  useEffect(() => {
    const checkAuthorization = () => {
      const token = Cookies.get('token');
      if (!token) return false;

      try {
        const decodedToken = jwtDecode(token);
        if (!decodedToken.exp) return false;

        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) return false;

        return true;
      } catch (error) {
        console.error("Failed to decode token:", error);
        return false;
      }
    };

    const status = checkAuthorization();
    setAuthorized(status);
  }, []);

  const toggleAuthorized = (param: boolean) => {
    setAuthorized(param);
  };

  const contextValue: AuthContextType = {
    authorized,
    toggleAuthorized
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Хук для использования контекста в компонентах
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
