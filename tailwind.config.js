/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors:{
        // Colores principales para modo claro
        'bg-main-light': '#f8f5f0',         // Color crema suave para fondo general
        'bg-table-light': '#FFFFFF',        // Blanco para tablas
        'bg-card-light': '#FFFFFF',         // Blanco para tarjetas
        'bg-form-light': '#FFFFFF',         // Blanco para formularios
        'bg-row-light': '#f4f1eb',          // Crema más claro para filas alternas
        'border-light': '#e9e5dc',          // Borde tono crema
        'text-main-light': '#111827',       // Texto casi negro para mejor contraste
        'text-secondary-light': '#4B5563',  // Texto gris oscuro para etiquetas
        
        // Colores principales para modo oscuro
        'bg-main-dark': '#19191a',          // Negro para fondo
        'bg-table-dark': '#2D2C33',         // Gris oscuro para tablas
        'bg-card-dark': '#2D2C33',          // Gris oscuro para tarjetas
        'bg-form-dark': '#2D2C33',          // Gris oscuro para formularios
        'bg-row-dark': '#1A1C1E',           // Gris casi negro para filas alternas
        'border-dark': '#374151',           // Borde visible pero no llamativo
        'text-main-dark': '#F9FAFB',        // Texto casi blanco para mejor contraste
        'text-secondary-dark': '#9CA3AF',   // Texto gris claro para etiquetas
        
        // Colores de acento y acciones
        'primary': '#3B82F6',               // Azul principal
        'primary-hover': '#2563EB',         // Azul más oscuro para hover
        'success': '#10B981',               // Verde para éxito
        'error': '#EF4444',                 // Rojo para errores
        'warning': '#F59E0B',               // Amarillo para advertencias

        // Colores del Navbar
        'nav-button-light': '#171717',      // Negro para botones en modo claro
        'nav-button-dark': '#FFFFFF',       // Blanco para botones en modo oscuro
        'nav-button-hover-light': '#1F2937', // Negro más oscuro para hover en modo claro
        'nav-button-hover-dark': '#F3F4F6',  // Gris claro para hover en modo oscuro
        'nav-text-light': '#111827',        // Negro para texto en modo claro
        'nav-text-dark': '#F9FAFB',         // Blanco para texto en modo oscuro
        'nav-border-light': '#E5E7EB',      // Borde gris claro para modo claro
        'nav-border-dark': '#374151',       // Borde gris oscuro para modo oscuro
        'logout-button-light': '#DC2626',   // Rojo para el botón de cerrar sesión en modo claro
        'logout-button-dark': '#EF4444',    // Rojo más claro para el botón de cerrar sesión en modo oscuro
        'logout-hover-light': '#B91C1C',    // Rojo más oscuro para hover en modo claro
        'logout-hover-dark': '#DC2626',     // Rojo más oscuro para hover en modo oscuro

        // Colores del Login
        'login-bg': '#000000',              // Negro para el fondo
        'login-overlay': '#000000',         // Negro para el overlay
        'login-text': '#FFFFFF',            // Texto blanco para el login
        'login-input-bg': '#FFFFFF',        // Fondo blanco para inputs
        'login-input-border': '#E5E7EB',    // Borde gris para inputs
        'login-button': '#FFFFFF',          // Botón blanco por defecto
        'login-button-hover': '#000000',    // Botón negro en hover
        'login-button-text': '#000000',     // Texto negro para el botón
        'login-button-hover-text': '#FFFFFF', // Texto blanco para hover del botón
        'login-focus-ring': '#FFFFFF',      // Anillo de focus negro
      },
      
      animation: {
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
      },
      keyframes: {
        'star-movement-bottom': {
          '70%': { transform: 'translate(0%, 0%)', opacity: '2' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        'star-movement-top': {
          '70%': { transform: 'translate(0%, 0%)', opacity: '2' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/aspect-ratio"),
  ],
}

