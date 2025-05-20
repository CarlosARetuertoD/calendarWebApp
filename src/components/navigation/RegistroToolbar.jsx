import React from 'react';

const RegistroToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar px-3 py-3 border-b border-gray-700 w-full">
      {/* Contenedor principal con dirección de columna en móviles y fila en pantallas más grandes */}
      <div className="flex flex-col md:flex-row w-full gap-3 items-center">
        {/* Título del mes - centrado en todas las pantallas */}
        <div className="w-full md:flex-1 flex justify-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-wide uppercase text-white text-center truncate">
            📅 {label}
          </h2>
        </div>

        {/* Botones de navegación - centrados en móviles, a la derecha en escritorio */}
        <div className="w-full md:w-auto flex justify-center md:justify-end">
          <div className="flex space-x-2">
            {/* Reemplazamos los botones por divs con apariencia de botón */}
            <div
              onClick={() => onNavigate('PREV')}
              className="bg-gray-700 hover:bg-gray-600 active:bg-gray-800 px-3 py-1 rounded text-sm text-white select-none cursor-pointer flex items-center justify-center min-w-[32px]"
              role="button"
              aria-label="Mes anterior"
            >
              ‹
            </div>
            <div
              onClick={() => onNavigate('TODAY')}
              className="bg-gray-700 hover:bg-gray-600 active:bg-gray-800 px-3 sm:px-4 py-1 rounded text-sm text-white whitespace-nowrap select-none cursor-pointer flex items-center justify-center"
              role="button"
              aria-label="Mes actual"
            >
              Mes Actual
            </div>
            <div
              onClick={() => onNavigate('NEXT')}
              className="bg-gray-700 hover:bg-gray-600 active:bg-gray-800 px-3 py-1 rounded text-sm text-white select-none cursor-pointer flex items-center justify-center min-w-[32px]"
              role="button"
              aria-label="Mes siguiente"
            >
              ›
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroToolbar;
