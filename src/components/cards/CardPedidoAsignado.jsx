import React from 'react';

const CardPedidoAsignado = ({ pedido, distribuciones, onClick }) => {
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

  const calcularMontoDistribuido = () => {
    return distribuciones.reduce((sum, dist) => sum + parseFloat(dist.monto_final || 0), 0);
  };

  return (
    <div 
      className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow hover:shadow-md transition-all duration-200 cursor-pointer border border-border-light dark:border-border-dark"
      onClick={onClick}
    >
      {/* Header con información principal */}
      <div className="p-3 border-b border-border-light dark:border-border-dark">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-text-main-light dark:text-text-main-dark truncate">
                {pedido.proveedor?.nombre || pedido.proveedor_nombre || 'Sin proveedor'}
              </h3>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
                - S/ {formatMonto(pedido.monto_total_pedido)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {formatFecha(pedido.fecha_pedido)}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                pedido.es_contado 
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90' 
                  : 'bg-success/10 text-success dark:bg-success/20 dark:text-success/90'
              }`}>
                {pedido.es_contado ? 'Contado' : 'Crédito'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Monto Final
            </p>
            <p className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
              S/ {formatMonto(pedido.monto_final_pedido || calcularMontoDistribuido())}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Distribuciones
            </p>
            <p className="text-base font-semibold text-text-main-light dark:text-text-main-dark">
              {distribuciones.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPedidoAsignado; 