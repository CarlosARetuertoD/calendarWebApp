import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormPedido from '../formularios/FormPedido';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const RegistroPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  
  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [pedidosPorPagina, setPedidosPorPagina] = useState(10);
  const [totalPedidos, setTotalPedidos] = useState(0);
  
  // Estado para ordenamiento
  const [ordenColumna, setOrdenColumna] = useState('fecha_pedido');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');
  
  // Estados para rangos de filtro
  const [filtros, setFiltros] = useState({
    proveedor: '',
    estado: '',
    fecha: '',
    tipo: ''
  });

  // Calcular el número total de páginas
  const totalPaginas = Math.ceil(totalPedidos / pedidosPorPagina);
  
  // Calcular el rango de elementos mostrados
  const inicio = totalPedidos === 0 ? 0 : (paginaActual - 1) * pedidosPorPagina + 1;
  const fin = Math.min(paginaActual * pedidosPorPagina, totalPedidos);

  useEffect(() => {
    console.log('Efecto ejecutado con:', { paginaActual, pedidosPorPagina, ordenColumna, ordenDireccion }); // Debug
    cargarDatos();
  }, [paginaActual, pedidosPorPagina, ordenColumna, ordenDireccion, filtros]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Construir parámetros de paginación y ordenamiento
      const params = new URLSearchParams();
      params.append('page', paginaActual);
      params.append('page_size', pedidosPorPagina);
      
      // Aplicación del ordenamiento
      let campoOrden = ordenColumna;
      
      // Para el campo "tipo" usar es_contado en el backend
      if (campoOrden === 'tipo') {
        campoOrden = 'es_contado';
      }
      
      // Aplicar ordenamiento de manera segura verificando campo
      params.append('ordering', ordenDireccion === 'asc' ? campoOrden : `-${campoOrden}`);
      
      // Aplicar filtros activos
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.tipo) params.append('es_contado', filtros.tipo === 'contado' ? 'true' : 'false');
      
      console.log('Parámetros de búsqueda:', params.toString()); // Debug

      // Cargar pedidos y proveedores en paralelo
      const [pedidosResponse, proveedoresResponse] = await Promise.all([
        axios.get(`/api/pedidos/?${params.toString()}`),
        axios.get('/api/proveedores/')
      ]);

      console.log('Respuesta del backend:', pedidosResponse.data); // Debug

      // Manejar la respuesta paginada
      if (pedidosResponse.data.results) {
        // Es una respuesta paginada
        setPedidos(pedidosResponse.data.results);
        setTotalPedidos(pedidosResponse.data.count);
        console.log('Total de pedidos:', pedidosResponse.data.count); // Debug
        console.log('Pedidos en esta página:', pedidosResponse.data.results.length); // Debug
      } else {
        // Es un array simple
        setPedidos(pedidosResponse.data);
        setTotalPedidos(pedidosResponse.data.length);
      }
      
      setProveedores(proveedoresResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de pedidos');
      if (error.response && error.response.status === 401) {
        window.location.href = '/';
      }
      // En caso de error, asegurarse que pedidos sea al menos un array vacío
      setPedidos([]);
      setTotalPedidos(0);
    } finally {
      setIsLoading(false);
    }
  };

  const cambiarOrden = (columna) => {
    if (ordenColumna === columna) {
      // Si ya está ordenando por esta columna, cambiar dirección
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna, establecer dirección por defecto
      setOrdenColumna(columna);
      setOrdenDireccion('asc');
    }
    // Volver a la primera página al cambiar orden
    setPaginaActual(1);
  };

  const aplicarFiltros = async () => {
    setPaginaActual(1); // Reiniciar a primera página
    cargarDatos();
  };

  const resetFiltros = () => {
    setFiltros({
      proveedor: '',
      estado: '',
      fecha: '',
      tipo: ''
    });
    setPaginaActual(1);
    cargarDatos();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirFormulario = async (pedido = null) => {
    if (pedido) {
      try {
        // Si es una edición, obtener datos completos del pedido
        const response = await axios.get(`/api/pedidos/${pedido.id}/`);
        setCurrentPedido(response.data);
      } catch (error) {
        console.error('Error al obtener datos del pedido:', error);
        toast.error('Error al cargar datos del pedido');
        setCurrentPedido(pedido); // Usar los datos que tenemos como respaldo
      }
    } else {
      setCurrentPedido(null);
    }
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setCurrentPedido(null);
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await axios.delete(`/api/pedidos/${id}/`);
      // Recargar datos para actualizar la lista
      cargarDatos();
      toast.success('Pedido eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      toast.error('Error al eliminar el pedido. Puede que tenga distribuciones o letras asociadas.');
    }
  };

  const handleFormSuccess = (pedidoNuevo) => {
    cargarDatos(); // Recargar todos los datos para reflejar cambios
    cerrarFormulario();
  };
  
  // Navegación de paginación
  const irAPagina = (numPagina) => {
    console.log('Cambiando a página:', numPagina); // Debug
    if (numPagina > 0 && numPagina <= totalPaginas) {
      setPaginaActual(numPagina);
    }
  };

  const cambiarPedidosPorPagina = (nuevoValor) => {
    console.log('Cambiando elementos por página a:', nuevoValor); // Debug
    setPedidosPorPagina(nuevoValor);
    setPaginaActual(1); // Volver a la primera página al cambiar el tamaño
  };

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

  const irADistribucion = (pedidoId) => {
    // Obtener información contextual del pedido
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) {
      toast.error('No se encontró información del pedido seleccionado');
      return;
    }
    
    // Calcular información adicional del pedido para el contexto
    const montoDistribuido = pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;
    
    const montoDisponible = parseFloat(pedido.monto_total_pedido) - montoDistribuido;
    
    // Navegar a la página de distribuciones con el ID del pedido y datos adicionales
    navigate('/distribuciones', { 
      state: { 
        pedidoId,
        pedidoInfo: {
          proveedor: pedido.proveedor_nombre || (pedido.proveedor ? pedido.proveedor.nombre : ''),
          fecha: formatFecha(pedido.fecha_pedido),
          montoTotal: parseFloat(pedido.monto_total_pedido),
          montoDisponible: montoDisponible,
          esContado: pedido.es_contado
        }
      } 
    });
  };

  const completarPedido = async (id) => {
    if (!window.confirm('¿Estás seguro de marcar este pedido como asignado? Esta acción registrará la distribución del pedido.')) {
      return;
    }

    try {
      setIsLoading(true);
      // Obtener el pedido actual primero
      const pedidoActual = pedidos.find(p => p.id === id);
      if (!pedidoActual) return;

      // Calcular el monto final basado en las distribuciones
      const montoDistribuido = pedidoActual.distribuciones_finales?.reduce(
        (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
        0
      ) || 0;

      // Actualizar el pedido con los nuevos valores
      const response = await axios.put(`/api/pedidos/${id}/`, {
        ...pedidoActual,
        estado: 'asignado',
        monto_final_pedido: montoDistribuido
      });

      // Recargar datos para mostrar el cambio
      cargarDatos();
      toast.success('Pedido marcado como asignado correctamente');
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 bg-bg-main-light dark:bg-bg-main-dark">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-4 md:mb-0">
          Registro de Pedidos
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <button
            onClick={() => abrirFormulario()}
            className="w-full md:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            + Nuevo Pedido
          </button>
          
          <select 
            value={pedidosPorPagina}
            onChange={(e) => cambiarPedidosPorPagina(Number(e.target.value))}
            className="w-full md:w-auto px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm text-sm text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>

      {/* Filtros - Versión compacta */}
      <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow p-3 mb-4 sm:mb-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-wrap gap-2">
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="proveedor"
              value={filtros.proveedor}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por proveedor"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="asignado">Asignado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="tipo"
              value={filtros.tipo}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos los tipos</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <input
              type="date"
              name="fecha"
              value={filtros.fecha}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por fecha"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={resetFiltros}
              className="flex-1 sm:flex-initial px-3 py-1.5 border border-border-light dark:border-border-dark rounded-md shadow-sm text-xs font-medium text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark focus:outline-none"
            >
              Limpiar
            </button>
            <button
              onClick={aplicarFiltros}
              className="flex-1 sm:flex-initial px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos - Versión Responsiva */}
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
                  // Calcular el monto distribuido para cada pedido
                  const montoDistribuido = pedido.distribuciones_finales?.reduce(
                    (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
                    0
                  ) || 0;
                  const porcentajeDistribuido = pedido.monto_total_pedido > 0 
                    ? (montoDistribuido / parseFloat(pedido.monto_total_pedido)) * 100 
                    : 0;
                
                  return (
                    <div key={pedido.id} className="m-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
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
                          onClick={() => abrirFormulario(pedido)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Editar
                        </button>
                        
                        {(pedido.estado === 'pendiente' || pedido.estado === 'asignado') && (
                          <button
                            onClick={() => irADistribucion(pedido.id)}
                            className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                          >
                            Distribuir
                          </button>
                        )}
                        
                        {!pedido.completado && porcentajeDistribuido >= 100 && (
                          <button
                            onClick={() => completarPedido(pedido.id)}
                            className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                          >
                            Asignar
                          </button>
                        )}
                        
                        <button
                          onClick={() => eliminarPedido(pedido.id)}
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
                      onClick={() => cambiarOrden('proveedor__nombre')}
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
                      onClick={() => cambiarOrden('fecha_pedido')}
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
                      onClick={() => cambiarOrden('monto_total_pedido')}
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
                      onClick={() => cambiarOrden('es_contado')}
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
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                  {pedidos.map(pedido => {
                    // Calcular el monto distribuido para cada pedido
                    const montoDistribuido = pedido.distribuciones_finales?.reduce(
                      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
                      0
                    ) || 0;
                    const porcentajeDistribuido = pedido.monto_total_pedido > 0 
                      ? (montoDistribuido / parseFloat(pedido.monto_total_pedido)) * 100 
                      : 0;
                    
                    return (
                    <tr key={pedido.id} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
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
                            onClick={() => navigate('/distribuciones', {
                              state: {
                                pedidoId: pedido.id,
                                pedidoInfo: {
                                  proveedor: pedido.proveedor?.nombre || pedido.proveedor_nombre || '',
                                  fecha: format(new Date(pedido.fecha_pedido), 'dd/MM/yyyy'),
                                  montoTotal: parseFloat(pedido.monto_total_pedido),
                                  montoDisponible: parseFloat(pedido.monto_total_pedido) - (pedido.distribuciones_finales?.reduce(
                                    (sum, dist) => sum + parseFloat(dist.monto_final || 0),
                                    0
                                  ) || 0),
                                  esContado: pedido.es_contado
                                }
                              }
                            })}
                            className="text-success hover:text-success/90 dark:text-success/90 dark:hover:text-success mr-4"
                          >
                            Distribuir
                          </button>
                        )}
                        <button
                          onClick={() => abrirFormulario(pedido)}
                          className="text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarPedido(pedido.id)}
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
            
            {/* Paginación Simplificada */}
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
                      onClick={() => irAPagina(paginaActual - 1)}
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
                      onClick={() => irAPagina(paginaActual + 1)}
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
          </>
        )}
      </div>

      {/* Modal de Formulario - Mejorado para móvil */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-16 sm:pt-24 mt-4 sm:mt-10 overflow-y-auto">
          <div className="bg-bg-form-light dark:bg-bg-form-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto border border-border-light dark:border-border-dark">
            <div className="p-3 sm:p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg-form-light dark:bg-bg-form-dark py-2 z-10">
                <h2 className="text-lg sm:text-xl font-bold text-text-main-light dark:text-text-main-dark">
                  {currentPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
                </h2>
                <button
                  onClick={cerrarFormulario}
                  className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark focus:outline-none text-xl sm:text-2xl"
                >
                  &times;
                </button>
              </div>
              <FormPedido
                handleClose={cerrarFormulario}
                pedidoActual={currentPedido}
                onSubmitSuccess={handleFormSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroPedidos; 