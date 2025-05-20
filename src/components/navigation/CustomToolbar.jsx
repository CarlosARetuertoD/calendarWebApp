import React from 'react';

const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar bg-neutral-900 text-white px-3 py-3 border-b border-gray-700 w-full">
      {/* Contenedor principal con dirección de columna en móviles y fila en pantallas más grandes */}
      <div className="flex flex-col md:flex-row w-full gap-3 md:items-center">
        {/* Título del mes - arriba en móviles, centrado en escritorio */}
        <div className="w-full md:w-2/4 flex justify-center order-1 md:order-2">
          <h2 className="text-lg sm:text-xl font-semibold tracking-wide uppercase text-white text-center truncate">
            📅 {label}
          </h2>
        </div>
        
        {/* Botones de navegación - abajo en móviles, a la izquierda en escritorio */}
        <div className="w-full md:w-1/4 flex justify-center md:justify-start order-2 md:order-1">
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
        
        {/* Espacio vacío para balancear el layout */}
        <div className="hidden md:block md:w-1/4 order-3 md:order-3"></div>
      </div>
    </div>
  );
};

export default CustomToolbar;

