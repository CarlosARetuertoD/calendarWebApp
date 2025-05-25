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

        // Colores del Calendario
        'calendar': {
          // Toolbar - Barra superior con controles de navegación
          'toolbar-bg-light': '#ffffff',      // Fondo de la barra en modo claro
          'toolbar-bg-dark': '#1f2937',       // Fondo de la barra en modo oscuro
          'toolbar-text-light': '#1f2937',    // Texto de la barra en modo claro
          'toolbar-text-dark': '#f9fafb',     // Texto de la barra en modo oscuro
          'toolbar-border-light': '#e5e7eb',  // Bordes de la barra en modo claro
          'toolbar-border-dark': '#374151',   // Bordes de la barra en modo oscuro
          
          // Headers - Encabezados de los días de la semana
          'header-bg-light': '#f3f4f6',       // Fondo de encabezados en modo claro
          'header-bg-dark': '#374151',        // Fondo de encabezados en modo oscuro
          'header-text-light': '#1f2937',     // Texto de encabezados en modo claro
          'header-text-dark': '#f9fafb',      // Texto de encabezados en modo oscuro
          'header-border-light': '#e5e7eb',   // Bordes de encabezados en modo claro
          'header-border-dark': '#4b5563',    // Bordes de encabezados en modo oscuro
          
          // Month View - Vista mensual del calendario
          'month-bg-light': '#ffffff',        // Fondo del calendario en modo claro
          'month-bg-dark': '#1f2937',         // Fondo del calendario en modo oscuro
          'month-border-light': '#e5e7eb',    // Bordes del calendario en modo claro
          'month-border-dark': '#374151',     // Bordes del calendario en modo oscuro
          
          // Day Cells - Celdas individuales de los días
          'day-bg-light': '#ffffff',          // Fondo de celdas en modo claro
          'day-bg-dark': '#1f2937',           // Fondo de celdas en modo oscuro
          'day-text-light': '#1f2937',        // Texto de celdas en modo claro
          'day-text-dark': '#f9fafb',         // Texto de celdas en modo oscuro
          'day-border-light': '#e5e7eb',      // Bordes de celdas en modo claro
          'day-border-dark': '#374151',       // Bordes de celdas en modo oscuro
          
          // Today - Día actual
          'today-bg-light': '#e0f2fe',        // Fondo del día actual en modo claro
          'today-bg-dark': '#1e3a8a',         // Fondo del día actual en modo oscuro
          'today-text-light': '#0369a1',      // Texto del día actual en modo claro
          'today-text-dark': '#93c5fd',       // Texto del día actual en modo oscuro
          
          // Off Range Days - Días fuera del mes actual
          'offrange-bg-light': '#f9fafb',     // Fondo de días fuera del mes en modo claro
          'offrange-bg-dark': '#111827',      // Fondo de días fuera del mes en modo oscuro
          'offrange-text-light': '#9ca3af',   // Texto de días fuera del mes en modo claro
          'offrange-text-dark': '#6b7280',    // Texto de días fuera del mes en modo oscuro
          
          // Events - Eventos del calendario
          'event-bg-light': '#3b82f6',        // Fondo de eventos en modo claro
          'event-bg-dark': '#2563eb',         // Fondo de eventos en modo oscuro
          'event-text-light': '#ffffff',      // Texto de eventos en modo claro
          'event-text-dark': '#ffffff',       // Texto de eventos en modo oscuro
          
          // Overlays - Popups y ventanas emergentes
          'overlay-bg-light': '#ffffff',      // Fondo de popups en modo claro
          'overlay-bg-dark': '#1f2937',       // Fondo de popups en modo oscuro
          'overlay-text-light': '#1f2937',    // Texto de popups en modo claro
          'overlay-text-dark': '#f9fafb',     // Texto de popups en modo oscuro
          'overlay-border-light': '#e5e7eb',  // Bordes de popups en modo claro
          'overlay-border-dark': '#374151',   // Bordes de popups en modo oscuro
          
          // Time Indicators - Indicadores de hora actual
          'time-indicator-light': '#ef4444',  // Color del indicador en modo claro
          'time-indicator-dark': '#dc2626',   // Color del indicador en modo oscuro
          
          // Selection - Elementos seleccionados
          'selection-bg-light': '#dbeafe',    // Fondo de selección en modo claro
          'selection-bg-dark': '#1e40af',     // Fondo de selección en modo oscuro
          'selection-text-light': '#1e40af',  // Texto de selección en modo claro
          'selection-text-dark': '#93c5fd',   // Texto de selección en modo oscuro
        }
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

