import React from 'react';

const RegistroSidebar = ({
  nuevoLimite,
  setNuevoLimite,
  actualizarLimite,
  distribuciones,
  distribucionSeleccionada,
  setDistribucionSeleccionada,
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

      {/* Selección de distribución */}
      {!distribucionSeleccionada ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Distribuciones disponibles</label>
          <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-800 rounded p-2 border border-gray-700">
            {distribuciones.length === 0 ? (
              <p className="text-sm text-gray-400">No hay distribuciones pendientes</p>
            ) : (
              distribuciones.map((dist) => (
                <button
                  key={dist.id}
                  onClick={() => setDistribucionSeleccionada(dist)}
                  className="block w-full text-left text-sm hover:bg-gray-700 p-1 rounded"
                >
                  {dist.pedido_resumen} ({dist.pedido_info?.es_contado ? 'Contado' : 'Crédito'}) - S/ {dist.monto_final}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm bg-gray-800 rounded p-3 border border-gray-700">
          <p><strong>Distribución:</strong> {distribucionSeleccionada.pedido_resumen}</p>
          <p><strong>Tipo:</strong> {distribucionSeleccionada.pedido_info?.es_contado ? 'Contado' : 'Crédito'}</p>
          <p><strong>Monto Total:</strong> S/ {distribucionSeleccionada.monto_final}</p>
          <p><strong>Empresa:</strong> {distribucionSeleccionada.empresa_nombre}</p>
        </div>
      )}

      {/* Botón registrar letras múltiples */}
      {distribucionSeleccionada && (
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
