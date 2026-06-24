import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import Login from './page/auth/Login';
import Chat from './page/Chat';

const ProtectedRoute = ({ children }) => {
  const tokenKey = import.meta.env.VITE_USER_TOKEN || 'user';
  const token = localStorage.getItem(tokenKey);
  return token ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const tokenKey = import.meta.env.VITE_USER_TOKEN || 'user';
  const token = localStorage.getItem(tokenKey);
  return token ? <Navigate to="/chat" replace /> : children;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.classList.remove("light-theme");
    if (savedTheme === "light") document.body.classList.add("light-theme");
  }, []);

  return (
    <Routes>
      <Route path='/' element={<PublicRoute><Login /></PublicRoute>} />
      <Route path='/chat' element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
