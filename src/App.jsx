import React, { useEffect, useState } from 'react';
import { Routes, Route } from "react-router-dom";
import './App.css';
import Login from './page/auth/Login';
import Chat from './page/Chat';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    // Always sync — remove light-theme first, then re-add only if needed
    document.body.classList.remove("light-theme");
    if (savedTheme === "light") document.body.classList.add("light-theme");
  }, []);

  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/chat' element={<Chat />} />
    </Routes>
  );
}

export default App;
