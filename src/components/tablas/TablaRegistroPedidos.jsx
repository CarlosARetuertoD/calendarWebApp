/**
 * Componente TablaRegistroPedidos
 * 
 * Requisitos para usar este componente:
 * - pedidos: Array de objetos con la estructura:
 *   {
 *     id: number,
 *     proveedor: { nombre: string } | null,
 *     proveedor_nombre: string,
 *     numero_pedido: string,
 *     fecha_pedido: string,
 *     monto_total_pedido: number,
 *     distribuciones_finales: Array<{ monto_final: number }>,
 *     es_contado: boolean,
 *     estado: 'pendiente' | 'asignado' | 'completado' | 'cancelado'
 *   }
 * - isLoading: boolean - Estado de carga
 * - paginaActual: number - Página actual
 * - totalPedidos: number - Total de pedidos
 * - pedidosPorPagina: number - Elementos por página (fijo en 10)
 * - ordenColumna: string - Columna por la que se ordena
 * - ordenDireccion: 'asc' | 'desc' - Dirección del ordenamiento
 * - onCambiarOrden: function(columna: string) - Manejador para cambiar orden
 * - onCambiarPagina: function(pagina: number) - Manejador para cambiar página
 * - onEditarPedido: function(pedido: object) - Manejador para editar pedido
 * - onEliminarPedido: function(id: number) - Manejador para eliminar pedido
 * - onDistribuirPedido: function(pedido: object) - Manejador para distribuir pedido
 * - onCompletarPedido: function(id: number) - Manejador para completar pedido
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import ModalDetallesPedido from '../modales/ModalDetallesPedido';

const TablaRegistroPedidos = ({
  pedidos = [],
  isLoading,
  paginaActual,
  totalPedidos,
  pedidosPorPagina,
  ordenColumna,
  ordenDireccion,
  onCambiarOrden,
  onCambiarPagina,
  onEditarPedido,
  onEliminarPedido,
  onDistribuirPedido,
  onCompletarPedido
}) => {
  // Estado para el modal de detalles
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetallesModal, setShowDetallesModal] = useState(false);

  // Calcular el número total de páginas
  const totalPaginas = Math.ceil(totalPedidos / pedidosPorPagina);
  
  // Calcular el rango de elementos mostrados
  const inicio = totalPedidos === 0 ? 0 : (paginaActual - 1) * pedidosPorPagina + 1;
  const fin = Math.min(paginaActual * pedidosPorPagina, totalPedidos);

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning/90';
      case 'asignado':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90';
      case 'completado':
        return 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90';
      case 'cancelado':
        return 'bg-error/10 text-error dark:bg-error/20 dark:text-error/90';
      default:
        return 'bg-text-secondary-light/10 text-text-secondary-light dark:bg-text-secondary-dark/20 dark:text-text-secondary-dark/90';
    }
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  const handleRowClick = (pedido) => {
    setSelectedPedido(pedido);
    setShowDetallesModal(true);
  };

  const closeDetallesModal = () => {
    setShowDetallesModal(false);
    setSelectedPedido(null);
  };

  const calcularMontoDistribuido = (pedido) => {
    return pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;
  };

  const calcularMontoDisponible = (pedido) => {
    const montoDistribuido = calcularMontoDistribuido(pedido);
    return parseFloat(pedido.monto_total_pedido) - montoDistribuido;
  };

  return (
    <div className="bg-bg-table-light dark:bg-bg-table-dark shadow rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
      {isLoading ? (
        <div className="p-4 sm:p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="p-4 sm:p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay pedidos registrados.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            {/* Vista de tarjetas para móviles - Solo visible en pantallas pequeñas */}
            <div className="md:hidden">
              {pedidos.map(pedido => {
                const montoDistribuido = calcularMontoDistribuido(pedido);
                const porcentajeDistribuido = pedido.monto_total_pedido > 0 
                  ? (montoDistribuido / parseFloat(pedido.monto_total_pedido)) * 100 
                  : 0;
              
                return (
                  <div 
                    key={pedido.id} 
                    className="m-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleRowClick(pedido)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {pedido.proveedor?.nombre || pedido.proveedor_nombre || '-'}
                      </h3>
                      <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-md ${getEstadoClass(pedido.estado)}`}>
                        {pedido.estado ? pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1) : '-'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-300 mb-3">
                      <div>
                        <span className="font-medium">Nº Pedido:</span> {pedido.numero_pedido || 'Pendiente'}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {formatFecha(pedido.fecha_pedido)}
                      </div>
                      <div>
                        <span className="font-medium">Monto:</span> S/ {parseFloat(pedido.monto_total_pedido).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {pedido.es_contado ? 'Contado' : 'Crédito'}
                      </div>
                    </div>
                    
                    {/* Barra de progreso para distribución */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Distribución</span>
                        <span>{porcentajeDistribuido.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            porcentajeDistribuido >= 100 
                              ? 'bg-green-600 dark:bg-green-500' 
                              : porcentajeDistribuido > 50 
                                ? 'bg-blue-600 dark:bg-blue-500' 
                                : 'bg-yellow-600 dark:bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(100, porcentajeDistribuido)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-end gap-2 mt-3 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarPedido(pedido);
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        Editar
                      </button>
                      
                      {(pedido.estado === 'pendiente' || pedido.estado === 'asignado') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDistribuirPedido(pedido);
                          }}
                          className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                        >
                          Distribuir
                        </button>
                      )}
                      
                      {!pedido.completado && porcentajeDistribuido >= 100 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompletarPedido(pedido.id);
                          }}
                          className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                        >
                          Asignar
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminarPedido(pedido.id);
                        }}
                        className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista de tabla para pantallas medianas y grandes */}
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark hidden md:table">
              <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                <tr>
                  <th 
                    onClick={() => onCambiarOrden('proveedor__nombre')}
                    className="group px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-light/80 dark:hover:bg-bg-row-dark/80"
                  >
                    <div className="flex items-center">
                      Proveedor
                      <span className="ml-1 text-text-secondary-light dark:text-text-secondary-dark">
                        {ordenColumna === 'proveedor__nombre' && (
                          ordenDireccion === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Nº Pedido
                  </th>
                  <th 
                    onClick={() => onCambiarOrden('fecha_pedido')}
                    className="group px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-light/80 dark:hover:bg-bg-row-dark/80"
                  >
                    <div className="flex items-center">
                      Fecha
                      <span className="ml-1 text-text-secondary-light dark:text-text-secondary-dark">
                        {ordenColumna === 'fecha_pedido' && (
                          ordenDireccion === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    onClick={() => onCambiarOrden('monto_total_pedido')}
                    className="group px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-light/80 dark:hover:bg-bg-row-dark/80"
                  >
                    <div className="flex items-center">
                      Monto (S/)
                      <span className="ml-1 text-text-secondary-light dark:text-text-secondary-dark">
                        {ordenColumna === 'monto_total_pedido' && (
                          ordenDireccion === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    <div className="flex items-center">
                      Distribuido
                    </div>
                  </th>
                  <th 
                    onClick={() => onCambiarOrden('es_contado')}
                    className="group px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-light/80 dark:hover:bg-bg-row-dark/80"
                  >
                    <div className="flex items-center">
                      Tipo
                      <span className="ml-1 text-text-secondary-light dark:text-text-secondary-dark">
                        {ordenColumna === 'es_contado' && (
                          ordenDireccion === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    onClick={() => onCambiarOrden('estado')}
                    className="group px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-light/80 dark:hover:bg-bg-row-dark/80"
                  >
                    <div className="flex items-center">
                      Estado
                      <span className="ml-1 text-text-secondary-light dark:text-text-secondary-dark">
                        {ordenColumna === 'estado' && (
                          ordenDireccion === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                {pedidos.map(pedido => {
                  const montoDistribuido = calcularMontoDistribuido(pedido);
                  const porcentajeDistribuido = pedido.monto_total_pedido > 0 
                    ? (montoDistribuido / parseFloat(pedido.monto_total_pedido)) * 100 
                    : 0;
                  
                  return (
                    <tr 
                      key={pedido.id} 
                      className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark cursor-pointer"
                      onClick={() => handleRowClick(pedido)}
                    >
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-text-main-light dark:text-text-main-dark">
                        {pedido.proveedor?.nombre || pedido.proveedor_nombre || '-'}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {pedido.numero_pedido || <span className="text-text-secondary-light/60 dark:text-text-secondary-dark/60 italic">Pendiente</span>}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {formatFecha(pedido.fecha_pedido)}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {parseFloat(pedido.monto_total_pedido).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <div className="flex items-center">
                          <div className="w-full bg-bg-form-light dark:bg-bg-form-dark rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                porcentajeDistribuido >= 100 
                                  ? 'bg-success' 
                                  : porcentajeDistribuido > 50 
                                    ? 'bg-primary' 
                                    : 'bg-warning'
                              }`}
                              style={{ width: `${porcentajeDistribuido}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 font-medium">{porcentajeDistribuido.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pedido.es_contado 
                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90' 
                            : 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90'
                        }`}>
                          {pedido.es_contado ? 'Contado' : 'Crédito'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(pedido.estado)}`}>
                          {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        {pedido.estado === 'pendiente' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDistribuirPedido(pedido);
                            }}
                            className="text-success hover:text-success/90 dark:text-success/90 dark:hover:text-success mr-4"
                          >
                            Distribuir
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarPedido(pedido);
                          }}
                          className="text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEliminarPedido(pedido.id);
                          }}
                          className="text-error hover:text-error/90 dark:text-error/90 dark:hover:text-error"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {totalPedidos > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{inicio}</span> a <span className="font-medium">{fin}</span> de <span className="font-medium">{totalPedidos}</span> resultados
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onCambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className={`px-3 py-1 border rounded-md ${
                      paginaActual === 1 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' 
                        : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 self-center">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => onCambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className={`px-3 py-1 border rounded-md ${
                      paginaActual === totalPaginas 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' 
                        : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalles */}
          {showDetallesModal && selectedPedido && (
            <ModalDetallesPedido
              pedido={selectedPedido}
              onClose={closeDetallesModal}
              onEditar={onEditarPedido}
              onDistribuir={onDistribuirPedido}
              onEliminar={onEliminarPedido}
              getEstadoClass={getEstadoClass}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TablaRegistroPedidos; 