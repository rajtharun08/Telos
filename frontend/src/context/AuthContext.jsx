import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../api/mockData';
import { setAuthToken, removeAuthToken } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedId = localStorage.getItem('telos_user_id');
    if (!savedId) return null; // Unauthenticated guest by default
    return DEMO_USERS.find((u) => u.id === savedId) || null;
  });

  const isAuthenticated = !!user;

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

  // Firebase Auth Integration Seam
  const loginWithFirebase = async (email, password) => {
    // In production with Firebase SDK initialized:
    // const cred = await signInWithEmailAndPassword(auth, email, password);
    // const idToken = await cred.user.getIdToken();
    // setAuthToken(idToken);
    return login(email, password);
  };

  const loginWithGoogle = async () => {
    // In production with Firebase SDK:
    // const provider = new GoogleAuthProvider();
    // const res = await signInWithPopup(auth, provider);
    // setAuthToken(await res.user.getIdToken());
    return login('aliya.rahman@telos.app', 'demo1234');
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem('telos_user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        switchUser,
        login,
        loginWithFirebase,
        loginWithGoogle,
        logout,
        demoUsers: DEMO_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
