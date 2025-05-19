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

