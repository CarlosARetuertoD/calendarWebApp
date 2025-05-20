import React, { useState } from 'react';

const TablaPedidosPendientes = ({
  pedidos = [],
  onSeleccionarPedido,
  calcularMontoDisponible
}) => {
  const [ordenamiento, setOrdenamiento] = useState({
    columna: null,
    direccion: 'asc'
  });

  const handleOrdenar = (columna) => {
    setOrdenamiento(prev => ({
      columna,
      direccion: prev.columna === columna && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  };

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    if (!ordenamiento.columna) return 0;

    const direccion = ordenamiento.direccion === 'asc' ? 1 : -1;

    switch (ordenamiento.columna) {
      case 'proveedor':
        const nombreA = (a.proveedor?.nombre || a.proveedor_nombre || '').toLowerCase();
        const nombreB = (b.proveedor?.nombre || b.proveedor_nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB) * direccion;

      case 'fecha':
        return (new Date(a.fecha_pedido) - new Date(b.fecha_pedido)) * direccion;

      case 'monto_total':
        return (parseFloat(a.monto_total_pedido) - parseFloat(b.monto_total_pedido)) * direccion;

      case 'monto_disponible':
        const disponibleA = calcularMontoDisponible(a);
        const disponibleB = calcularMontoDisponible(b);
        return (disponibleA - disponibleB) * direccion;

      case 'tipo':
        if (a.es_contado === b.es_contado) return 0;
        return (a.es_contado ? -1 : 1) * direccion;

      default:
        return 0;
    }
  });

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

  const getIconoOrdenamiento = (columna) => {
    if (ordenamiento.columna !== columna) return '↕';
    return ordenamiento.direccion === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
        <thead className="bg-bg-row-light dark:bg-bg-row-dark">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-hover-light dark:hover:bg-bg-row-hover-dark"
              onClick={() => handleOrdenar('proveedor')}
            >
              <div className="flex items-center space-x-1">
                <span>Proveedor</span>
                <span className="text-xs">{getIconoOrdenamiento('proveedor')}</span>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-hover-light dark:hover:bg-bg-row-hover-dark"
              onClick={() => handleOrdenar('fecha')}
            >
              <div className="flex items-center space-x-1">
                <span>Fecha</span>
                <span className="text-xs">{getIconoOrdenamiento('fecha')}</span>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-hover-light dark:hover:bg-bg-row-hover-dark"
              onClick={() => handleOrdenar('monto_total')}
            >
              <div className="flex items-center space-x-1">
                <span>Monto Total</span>
                <span className="text-xs">{getIconoOrdenamiento('monto_total')}</span>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-hover-light dark:hover:bg-bg-row-hover-dark"
              onClick={() => handleOrdenar('monto_disponible')}
            >
              <div className="flex items-center space-x-1">
                <span>Monto Disponible</span>
                <span className="text-xs">{getIconoOrdenamiento('monto_disponible')}</span>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider cursor-pointer hover:bg-bg-row-hover-light dark:hover:bg-bg-row-hover-dark"
              onClick={() => handleOrdenar('tipo')}
            >
              <div className="flex items-center space-x-1">
                <span>Tipo</span>
                <span className="text-xs">{getIconoOrdenamiento('tipo')}</span>
              </div>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
          {pedidosOrdenados.map(pedido => {
            const montoDisponible = calcularMontoDisponible(pedido);
            
            return (
              <tr key={pedido.id} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main-light dark:text-text-main-dark">
                  {pedido.proveedor?.nombre || pedido.proveedor_nombre || 'Sin proveedor'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {formatFecha(pedido.fecha_pedido)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  S/ {formatMonto(pedido.monto_total_pedido)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  S/ {formatMonto(montoDisponible)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pedido.es_contado
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {pedido.es_contado ? 'Contado' : 'Crédito'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onSeleccionarPedido(pedido.id)}
                    className="text-primary hover:text-primary-hover dark:text-primary/90 dark:hover:text-primary"
                  >
                    Seleccionar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TablaPedidosPendientes; 