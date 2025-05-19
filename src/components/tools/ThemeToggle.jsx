import React, { useState, useEffect } from 'react';

const ThemeToggle = ({ inNavbar = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar preferencia inicial del sistema y configuración guardada
  useEffect(() => {
    // Comprobar si hay una preferencia guardada
    const savedTheme = localStorage.getItem('theme');
    
    // Si hay una preferencia guardada, úsala. De lo contrario, usa la preferencia del sistema
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Si no hay preferencia guardada, usar la preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Cambiar entre tema oscuro y claro
  const toggleTheme = () => {
    if (isDarkMode) {
      // Cambiar a tema claro
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      // Cambiar a tema oscuro
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <button 
      className={`${inNavbar 
        ? "p-2 rounded-md text-text-main-light dark:text-text-main-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark transition-colors"
        : "p-2 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-sm text-text-main-light dark:text-text-main-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark"
      }`}
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDarkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {isDarkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle; 