/**
 * Componente ModalDetallesPedido
 * 
 * Este componente muestra un modal con los detalles de un pedido.
 * 
 * Cómo usar:
 * 1. Importar el componente:
 *    import ModalDetallesPedido from '../modales/ModalDetallesPedido';
 * 
 * 2. Definir los estados necesarios en el componente padre:
 *    const [selectedPedido, setSelectedPedido] = useState(null);
 *    const [showDetallesModal, setShowDetallesModal] = useState(false);
 * 
 * 3. Definir las funciones de manejo:
 *    const handleRowClick = (pedido) => {
 *      setSelectedPedido(pedido);
 *      setShowDetallesModal(true);
 *    };
 * 
 *    const closeDetallesModal = () => {
 *      setShowDetallesModal(false);
 *      setSelectedPedido(null);
 *    };
 * 
 * 4. Renderizar el modal:
 *    {showDetallesModal && selectedPedido && (
 *      <ModalDetallesPedido
 *        pedido={selectedPedido}
 *        onClose={closeDetallesModal}
 *        onEditar={handleEditar}
 *        onDistribuir={handleDistribuir}
 *        onEliminar={handleEliminar}
 *        getEstadoClass={getEstadoClass}
 *      />
 *    )}
 * 
 * Props requeridas:
 * - pedido: Objeto con los datos del pedido
 * - onClose: Función para cerrar el modal
 * - onEditar: Función para editar el pedido
 * - onDistribuir: Función para distribuir el pedido
 * - onEliminar: Función para eliminar el pedido
 * - getEstadoClass: Función que retorna las clases CSS según el estado
 */

import React from 'react';
import { format } from 'date-fns';

const ModalDetallesPedido = ({
  pedido,
  onClose,
  onEditar,
  onDistribuir,
  onEliminar,
  getEstadoClass
}) => {
  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  // Calcular el porcentaje de distribución
  const montoDistribuido = pedido.distribuciones_finales?.reduce(
    (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
    0
  ) || 0;
  const porcentajeDistribuido = pedido.monto_total_pedido > 0 
    ? (montoDistribuido / parseFloat(pedido.monto_total_pedido)) * 100 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow-xl max-w-2xl w-full mx-4 relative border border-border-light dark:border-border-dark">
        {/* Header */}
        <div className="sticky top-0 z-[101] bg-bg-card-light dark:bg-bg-card-dark border-b border-border-light dark:border-border-dark p-3 sm:p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-text-main-light dark:text-text-main-dark">
              Detalles del Pedido
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Información básica */}
          <div className="bg-bg-form-light dark:bg-bg-form-dark p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-medium text-text-main-light dark:text-text-main-dark mb-2">Información Básica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Proveedor</p>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">{pedido.proveedor?.nombre || pedido.proveedor_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Número de Pedido</p>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">{pedido.numero_pedido || 'Pendiente'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Fecha</p>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">{formatFecha(pedido.fecha_pedido)}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Estado</p>
                <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getEstadoClass(pedido.estado)}`}>
                  {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Montos y distribución */}
          <div className="bg-bg-form-light dark:bg-bg-form-dark p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-medium text-text-main-light dark:text-text-main-dark mb-2">Montos y Distribución</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Monto Total</p>
                <p className="text-sm text-text-main-light dark:text-text-main-dark">
                  S/ {parseFloat(pedido.monto_total_pedido).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Tipo</p>
                <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                  pedido.es_contado 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90' 
                    : 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90'
                }`}>
                  {pedido.es_contado ? 'Contado' : 'Crédito'}
                </span>
              </div>
            </div>

            {/* Barra de progreso de distribución */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Distribución</span>
                <span className="text-text-main-light dark:text-text-main-dark">{porcentajeDistribuido.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-bg-form-light dark:bg-bg-form-dark rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    porcentajeDistribuido >= 100 
                      ? 'bg-success' 
                      : porcentajeDistribuido > 50 
                        ? 'bg-primary' 
                        : 'bg-warning'
                  }`}
                  style={{ width: `${Math.min(100, porcentajeDistribuido)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Descripción (si existe) */}
          {pedido.descripcion && (
            <div className="bg-bg-form-light dark:bg-bg-form-dark p-3 rounded-lg">
              <h3 className="text-sm font-medium text-text-main-light dark:text-text-main-dark mb-2">Descripción</h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{pedido.descripcion}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <button
              onClick={() => onEditar(pedido)}
              className="px-3 py-1.5 text-xs bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90 rounded hover:bg-primary/20 dark:hover:bg-primary/30"
            >
              Editar
            </button>
            {pedido.estado === 'pendiente' && (
              <button
                onClick={() => onDistribuir(pedido)}
                className="px-3 py-1.5 text-xs bg-success/10 text-success dark:bg-success/20 dark:text-success/90 rounded hover:bg-success/20 dark:hover:bg-success/30"
              >
                Distribuir
              </button>
            )}
            <button
              onClick={() => onEliminar(pedido.id)}
              className="px-3 py-1.5 text-xs bg-error/10 text-error dark:bg-error/20 dark:text-error/90 rounded hover:bg-error/20 dark:hover:bg-error/30"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetallesPedido; 