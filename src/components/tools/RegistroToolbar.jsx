import React from 'react';

const RegistroToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar px-4 py-3 border-b border-gray-700 flex w-full">
      {/* Título del mes completamente a la izquierda */}
      <div className="flex items-center">
        <h2 className="text-xl font-semibold tracking-wide uppercase text-white">
          📅 {label}
        </h2>
      </div>

      {/* Botones de navegación completamente a la derecha */}
      <div className="ml-auto flex space-x-2 items-center">
        <button
          onClick={() => onNavigate('PREV')}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white"
        >
          ‹
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="bg-blue-600 hover:bg-green-500 px-4 py-1 rounded text-sm text-white"
        >
          Mes Actual
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default RegistroToolbar;
