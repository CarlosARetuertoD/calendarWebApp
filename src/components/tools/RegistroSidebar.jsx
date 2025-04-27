import React from 'react';

const RegistroSidebar = ({
  nuevoLimite,
  setNuevoLimite,
  actualizarLimite,
  modoMultiple,
  setModoMultiple,
  fechasSeleccionadas,
  setMostrarFormulario
}) => {
  return (
    <div className="w-full h-full text-white space-y-6 px-4 py-4" style={{ backgroundColor: '#232227' }}>
      {/* Límite diario */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Límite diario</label>
        <input
          type="number"
          value={nuevoLimite}
          onChange={(e) => setNuevoLimite(e.target.value)}
          placeholder="S/ máximo por día"
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
        />
        <button
          onClick={actualizarLimite}
          className="bg-emerald-600 hover:bg-emerald-500 w-full py-1 px-2 rounded text-sm"
        >
          Actualizar
        </button>
      </div>

      {/* Tipo de registro */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de registro</label>
        <div className="flex flex-col space-y-1">
          <label className="text-sm">
            <input
              type="radio"
              name="modo"
              value="individual"
              checked={!modoMultiple}
              onChange={() => setModoMultiple(false)}
              className="mr-2"
            />
            Individual
          </label>
          <label className="text-sm">
            <input
              type="radio"
              name="modo"
              value="multiple"
              checked={modoMultiple}
              onChange={() => setModoMultiple(true)}
              className="mr-2"
            />
            Múltiple
          </label>
        </div>
      </div>

      {/* Botón registrar en modo múltiple */}
      {modoMultiple && (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="w-full bg-green-600 hover:bg-green-500 py-2 rounded text-sm font-semibold"
        >
          ➕ Registrar {fechasSeleccionadas.length} letra{fechasSeleccionadas.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

export default RegistroSidebar;
