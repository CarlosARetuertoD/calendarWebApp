import React from 'react';

const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar relative bg-neutral-900 text-white px-4 py-3 border-b border-gray-700">
      
      {/* Botones alineados a la izquierda */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex space-x-2">
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

      {/* Título del mes centrado */}
      <h2 className="text-xl font-semibold tracking-wide text-center uppercase">
        📅 {label}
      </h2>
    </div>
  );
};

export default CustomToolbar;

