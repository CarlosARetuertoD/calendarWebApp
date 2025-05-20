import React from 'react';

const ModalDetallesDistribucion = ({ distribucion, onClose, onEliminar }) => {
  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  const formatMonto = (monto) => {
    return parseFloat(monto || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-24 sm:pt-32 mt-8 sm:mt-16 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Detalles de la Distribución
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Información del Pedido</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Proveedor</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {distribucion.pedido_info?.proveedor_nombre || 'Sin proveedor'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fecha del Pedido</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatFecha(distribucion.pedido_info?.fecha_pedido)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monto Total del Pedido</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    S/ {formatMonto(distribucion.pedido_info?.monto_total_pedido)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                    distribucion.pedido_info?.es_contado
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {distribucion.pedido_info?.es_contado ? 'Contado' : 'Crédito'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Información de la Distribución</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {distribucion.empresa_nombre || 'Sin empresa'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Distribución</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatFecha(distribucion.fecha_distribucion)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monto Final</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    S/ {formatMonto(distribucion.monto_final)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monto en Letras</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    S/ {formatMonto(distribucion.monto_en_letras || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${distribucion.completado 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                    {distribucion.completado ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => onEliminar(distribucion.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Eliminar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetallesDistribucion; 