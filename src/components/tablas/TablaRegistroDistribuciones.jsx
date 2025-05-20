import React, { useState } from 'react';
import ModalDetallesDistribucion from '../modales/ModalDetallesDistribucion';

const TablaRegistroDistribuciones = ({
  distribuciones = [],
  pedidos = [],
  empresas = [],
  isLoading,
  onEliminarDistribucion
}) => {
  const [selectedDistribucion, setSelectedDistribucion] = useState(null);
  const [showDetallesModal, setShowDetallesModal] = useState(false);

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

  const getNombrePedido = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return '-';
    
    const proveedorNombre = pedido.proveedor?.nombre || pedido.proveedor_nombre || 'Sin proveedor';
    const tipoPedido = pedido.es_contado ? 'Contado' : 'Crédito';
    
    return `${proveedorNombre} - ${formatFecha(pedido.fecha_pedido)} - S/ ${parseFloat(pedido.monto_total_pedido).toFixed(2)} (${tipoPedido})`;
  };

  const getNombreEmpresa = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa ? empresa.nombre : '-';
  };

  const handleRowClick = (distribucion) => {
    setSelectedDistribucion(distribucion);
    setShowDetallesModal(true);
  };

  const closeDetallesModal = () => {
    setShowDetallesModal(false);
    setSelectedDistribucion(null);
  };

  return (
    <div className="bg-bg-table-light dark:bg-bg-table-dark shadow rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
      {isLoading ? (
        <div className="p-4 sm:p-6 text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">Cargando distribuciones...</p>
        </div>
      ) : distribuciones.length === 0 ? (
        <div className="p-4 sm:p-6 text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">No hay distribuciones registradas.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
              <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Monto Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Monto en Letras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                {distribuciones.map(distribucion => (
                  <tr 
                    key={distribucion.id}
                    className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark cursor-pointer"
                    onClick={() => handleRowClick(distribucion)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main-light dark:text-text-main-dark">
                      {getNombrePedido(distribucion.pedido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {getNombreEmpresa(distribucion.empresa)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      S/ {formatMonto(distribucion.monto_final)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      S/ {formatMonto(distribucion.monto_en_letras || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        distribucion.pedido_info?.es_contado || distribucion.pedido?.es_contado
                          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90' 
                          : 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90'
                      }`}>
                        {distribucion.pedido_info?.es_contado || distribucion.pedido?.es_contado ? 'Contado' : 'Crédito'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        distribucion.completado
                          ? 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90'
                          : 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning/90'
                      }`}>
                        {distribucion.completado ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatFecha(distribucion.fecha_creacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminarDistribucion(distribucion.id);
                        }}
                        className="text-error hover:text-error/90 dark:text-error/90 dark:hover:text-error"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showDetallesModal && selectedDistribucion && (
        <ModalDetallesDistribucion
          distribucion={selectedDistribucion}
          onClose={closeDetallesModal}
        />
      )}
    </div>
  );
};

export default TablaRegistroDistribuciones; 