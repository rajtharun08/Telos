import React, { createContext, useContext, useState } from 'react';
import { DEMO_USERS } from '../api/mockData';
import { setAuthToken, removeAuthToken } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedId = localStorage.getItem('telos_user_id') || 'u-001';
    return DEMO_USERS.find((u) => u.id === savedId) || DEMO_USERS[0];
  });

  const switchUser = (userId) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem('telos_user_id', found.id);
      setAuthToken(`dev-jwt-token-${found.id}`);
    }
  };

  const login = (email, password) => {
    const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const target = found || DEMO_USERS[0];
    setUser(target);
    localStorage.setItem('telos_user_id', target.id);
    setAuthToken(`dev-jwt-token-${target.id}`);
    return target;
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem('telos_user_id');
    setUser(DEMO_USERS[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        switchUser,
        login,
        logout,
        demoUsers: DEMO_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
