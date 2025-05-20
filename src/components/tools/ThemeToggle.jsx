import React, { useEffect } from 'react';

const ThemeToggle = ({ inNavbar = false }) => {
  // Efecto para inicializar el tema al montar el componente
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <button
      className={`${inNavbar
        ? "p-2 rounded-md text-text-main-light dark:text-text-main-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark transition-all duration-500 ease-in-out group"
        : "p-2 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-sm text-text-main-light dark:text-text-main-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark transition-all duration-500 ease-in-out group"
      }`}
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      {/* Ícono de luna: visible en modo claro */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all duration-500 ease-in-out dark:hidden group-hover:scale-110">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
      {/* Ícono de sol: visible en modo oscuro */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all duration-500 ease-in-out hidden dark:block group-hover:scale-110">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    </button>
  );
};

export default ThemeToggle; 