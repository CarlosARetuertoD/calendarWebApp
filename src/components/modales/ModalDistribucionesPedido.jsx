import React from 'react';
import TablaRegistroDistribuciones from '../tablas/TablaRegistroDistribuciones';

const ModalDistribucionesPedido = ({ pedido, distribuciones, empresas, onClose }) => {
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
      <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto border border-border-light dark:border-border-dark">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg-card-light dark:bg-bg-card-dark py-3 z-10 border-b border-border-light dark:border-border-dark">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-text-main-light dark:text-text-main-dark">
                Distribuciones del Pedido
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {pedido.proveedor?.nombre || pedido.proveedor_nombre} - {formatFecha(pedido.fecha_pedido)}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark focus:outline-none text-xl sm:text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg-form-light dark:bg-bg-form-dark p-4 rounded-lg">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Monto Total</p>
                <p className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">
                  S/ {formatMonto(pedido.monto_total_pedido)}
                </p>
              </div>
              <div className="bg-bg-form-light dark:bg-bg-form-dark p-4 rounded-lg">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Tipo</p>
                <p className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">
                  {pedido.es_contado ? 'Contado' : 'Crédito'}
                </p>
              </div>
            </div>
          </div>

          <TablaRegistroDistribuciones
            distribuciones={distribuciones}
            pedidos={[pedido]}
            empresas={empresas}
            isLoading={false}
            onEliminarDistribucion={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ModalDistribucionesPedido; 