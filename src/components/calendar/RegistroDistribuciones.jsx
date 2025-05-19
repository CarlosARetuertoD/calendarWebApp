import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormDistribucion from '../formularios/FormDistribucion';
import { useLocation } from 'react-router-dom';

const RegistroDistribuciones = () => {
  const location = useLocation();
  const [distribuciones, setDistribuciones] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDistribucion, setCurrentDistribucion] = useState(null);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showPedidoSelector, setShowPedidoSelector] = useState(false);
  const [filtros, setFiltros] = useState({
    pedido: '',
    empresa: '',
    completado: ''
  });
  const [pedidoInfo, setPedidoInfo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Efecto para manejar el pedido seleccionado desde otra página
  useEffect(() => {
    if (location.state?.pedidoId) {
      setIsLoading(true);
      
      // Obtener detalles del pedido 
      const cargarPedidoSeleccionado = async () => {
        try {
          const response = await axios.get(`/api/pedidos/${location.state.pedidoId}/`);
          const pedido = response.data;
          
          // Usar la información del estado si está disponible, o calcularla de la respuesta
          const pedidoInfo = location.state.pedidoInfo || {
            proveedor: pedido.proveedor_nombre || (pedido.proveedor ? pedido.proveedor.nombre : ''),
            fecha: formatFecha(pedido.fecha_pedido),
            montoTotal: parseFloat(pedido.monto_total_pedido),
            montoDisponible: calcularMontoDisponible(pedido),
            esContado: pedido.es_contado
          };
          
          // Mostrar notificación con el nombre del pedido
          toast.info(`Cargando distribución para: ${pedidoInfo.proveedor}`);
          
          setSelectedPedidoId(location.state.pedidoId);
          setPedidoInfo(pedidoInfo);
          setShowForm(true);
          
          // Restablecer los filtros para mantener el contexto limpio
          setFiltros({
            pedido: location.state.pedidoId,
            empresa: '',
            completado: ''
          });
          
          // Aplicar el filtro automáticamente
          aplicarFiltros();
        } catch (error) {
          console.error('Error al cargar datos del pedido:', error);
          toast.error('No se pudo cargar el pedido seleccionado');
        } finally {
          setIsLoading(false);
        }
      };
      
      cargarPedidoSeleccionado();
      
      // Limpiar el estado de ubicación para evitar comportamientos inesperados
      // al recargar la página
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Cargar distribuciones, pedidos y empresas en paralelo
      const [distribucionesResponse, pedidosResponse, empresasResponse] = await Promise.all([
        axios.get('/api/distribuciones/'),
        axios.get('/api/pedidos/'),
        axios.get('/api/empresas/')
      ]);

      // Asegurarse que distribuciones sea un array
      const distribucionesData = Array.isArray(distribucionesResponse.data) 
        ? distribucionesResponse.data 
        : (distribucionesResponse.data.results || []);
        
      setDistribuciones(distribucionesData);
      
      // Procesar y filtrar pedidos disponibles (que no estén completados o cancelados)
      const pedidosData = Array.isArray(pedidosResponse.data) 
        ? pedidosResponse.data 
        : (pedidosResponse.data.results || []);
      
      setPedidos(pedidosData);
      
      // Filtrar pedidos disponibles (que no estén completados o cancelados)
      const pedidosDisponiblesData = pedidosData.filter(
        pedido => pedido.estado !== 'completado' && pedido.estado !== 'cancelado'
      );
      
      setPedidosDisponibles(pedidosDisponiblesData);
      setEmpresas(empresasResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de distribuciones');
      if (error.response && error.response.status === 401) {
        window.location.href = '/';
      }
      // En caso de error, asegurarse que distribuciones sea al menos un array vacío
      setDistribuciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    setIsLoading(true);
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.pedido) params.append('pedido', filtros.pedido);
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.completado !== '') params.append('completado', filtros.completado);

      const response = await axios.get(`/api/distribuciones/?${params.toString()}`);
      
      // Asegurarse que las distribuciones filtradas sean un array
      const distribucionesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setDistribuciones(distribucionesData);
    } catch (error) {
      console.error('Error al filtrar distribuciones:', error);
      toast.error('Error al filtrar distribuciones');
      // En caso de error, mantener un array vacío
      setDistribuciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
      pedido: '',
      empresa: '',
      completado: ''
    });
    cargarDatos();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirFormulario = (distribucion = null, pedidoId = null) => {
    if (!distribucion && !pedidoId) {
      // Si no se proporciona ni distribución ni pedido, mostrar selector de pedidos
      setShowPedidoSelector(true);
    } else {
      setCurrentDistribucion(distribucion);
      setSelectedPedidoId(pedidoId);
      setShowForm(true);
      setShowPedidoSelector(false);
    }
  };

  const seleccionarPedido = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowForm(true);
    setShowPedidoSelector(false);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setShowPedidoSelector(false);
    setCurrentDistribucion(null);
    setSelectedPedidoId(null);
  };

  const eliminarDistribucion = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta distribución? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await axios.delete(`/api/distribuciones/${id}/`);
      setDistribuciones(distribuciones.filter(d => d.id !== id));
      toast.success('Distribución eliminada correctamente');
      
      // Recargar datos para actualizar los pedidos disponibles
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar distribución:', error);
      toast.error('Error al eliminar la distribución. Puede que tenga letras asociadas.');
    }
  };

  const handleFormSuccess = (distribucionNueva, cerrarModal = true) => {
    if (currentDistribucion) {
      // Actualización
      setDistribuciones(distribuciones.map(d => d.id === distribucionNueva.id ? distribucionNueva : d));
    } else {
      // Creación
      setDistribuciones([distribucionNueva, ...distribuciones]);
    }
    
    if (cerrarModal) {
      cerrarFormulario();
    }
    
    // Recargar datos para actualizar los pedidos disponibles
    cargarDatos();
  };

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

  // Función para encontrar el nombre del pedido por su ID
  const getNombrePedido = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return '-';
    
    const proveedorNombre = pedido.proveedor?.nombre || pedido.proveedor_nombre || 'Sin proveedor';
    const tipoPedido = pedido.es_contado ? 'Contado' : 'Crédito';
    
    return `${proveedorNombre} - ${formatFecha(pedido.fecha_pedido)} - S/ ${parseFloat(pedido.monto_total_pedido).toFixed(2)} (${tipoPedido})`;
  };

  // Función para encontrar el nombre de la empresa por su ID
  const getNombreEmpresa = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa ? empresa.nombre : '-';
  };

  // Función para actualizar el monto final real de una distribución
  const actualizarMontoFinalReal = async (distribucion, montoFinalReal) => {
    try {
      const response = await axios.patch(`/api/distribuciones/${distribucion.id}/`, {
        monto_final: parseFloat(montoFinalReal)
      });
      
      setDistribuciones(distribuciones.map(d => 
        d.id === distribucion.id ? response.data : d
      ));
      
      toast.success('Monto actualizado correctamente');
      
      // Recargar datos para actualizar estados
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar monto final:', error);
      toast.error('Error al actualizar el monto final');
    }
  };

  // Función para marcar un pedido como completado
  const marcarPedidoCompletado = async (pedidoId) => {
    try {
      await axios.patch(`/api/pedidos/${pedidoId}/`, {
        estado: 'completado',
        completado: true
      });
      toast.success('Pedido marcado como completado');
      cargarDatos();
    } catch (error) {
      console.error('Error al marcar pedido como completado:', error);
      toast.error('Error al marcar el pedido como completado');
    }
  };

  // Función para calcular el monto disponible de un pedido
  const calcularMontoDisponible = (pedido) => {
    const montoDistribuido = pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;
    
    return parseFloat(pedido.monto_total_pedido) - montoDistribuido;
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          Registro de Distribuciones
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => abrirFormulario()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-[#38373f] dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            + Nueva Distribución
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pedido
            </label>
            <select
              name="pedido"
              value={filtros.pedido}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            >
              <option value="">Todos los pedidos</option>
              {pedidos.map(pedido => (
                <option key={pedido.id} value={pedido.id}>
                  {pedido.proveedor?.nombre || pedido.proveedor_nombre || '-'} - {formatFecha(pedido.fecha_pedido)} - S/ {formatMonto(pedido.monto_total_pedido)} - {pedido.es_contado ? 'Contado' : 'Crédito'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Empresa
            </label>
            <select
              name="empresa"
              value={filtros.empresa}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            >
              <option value="">Todas las empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              name="completado"
              value={filtros.completado}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Completado</option>
              <option value="false">Pendiente</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={resetFiltros}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#38373f] hover:bg-gray-50 dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar
          </button>
          <button
            onClick={aplicarFiltros}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 dark:bg-[#38373f] dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Selector de Pedidos */}
      {showPedidoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Seleccionar Pedido
              </h2>
              <button 
                onClick={cerrarFormulario}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {pedidosDisponibles.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay pedidos disponibles para asignar distribuciones.
              </p>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-[#34333a]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Monto Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Monto Disponible
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {pedidosDisponibles.map(pedido => {
                      // Calcular monto asignado en distribuciones
                      const montoAsignado = pedido.distribuciones_finales?.reduce(
                        (sum, dist) => sum + parseFloat(dist.monto_final), 0
                      ) || 0;
                      
                      const montoDisponible = parseFloat(pedido.monto_total_pedido) - montoAsignado;
                      
                      return (
                        <tr key={pedido.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            {pedido.proveedor?.nombre || pedido.proveedor_nombre || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatFecha(pedido.fecha_pedido)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            S/ {formatMonto(pedido.monto_total_pedido)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            S/ {formatMonto(montoDisponible)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                              pedido.es_contado 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {pedido.es_contado ? 'Contado' : 'Crédito'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-[#3a3a2a] dark:text-yellow-300' : 
                              pedido.estado === 'asignado' ? 'bg-gray-100 text-gray-800 dark:bg-[#34333a] dark:text-gray-300' : 
                              pedido.estado === 'completado' ? 'bg-green-100 text-green-800 dark:bg-[#2a3a2a] dark:text-green-300' : 
                              'bg-red-100 text-red-800 dark:bg-[#3a2a2a] dark:text-red-300'}`}>
                              {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => seleccionarPedido(pedido.id)}
                              disabled={montoDisponible <= 0}
                              className={`text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
                                ${montoDisponible <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            )}
          </div>
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentDistribucion ? 'Editar Distribución' : 'Nueva Distribución'}
              </h2>
              <button 
                onClick={cerrarFormulario}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Resumen de pedido seleccionado */}
            {pedidoInfo && !currentDistribucion && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resumen del Pedido Seleccionado
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Proveedor:</span> {pedidoInfo.proveedor}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {pedidoInfo.fecha}
                  </div>
                  <div>
                    <span className="font-medium">Monto Total:</span> S/ {formatMonto(pedidoInfo.montoTotal)}
                  </div>
                  <div>
                    <span className="font-medium">Monto Disponible:</span> S/ {formatMonto(pedidoInfo.montoDisponible)}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Tipo:</span> {pedidoInfo.esContado ? 'Contado' : 'Crédito'}
                  </div>
                </div>
              </div>
            )}
            
            <FormDistribucion 
              handleClose={cerrarFormulario}
              distribucionActual={currentDistribucion}
              pedidoId={selectedPedidoId}
              onSubmitSuccess={handleFormSuccess}
              montoDisponible={pedidoInfo?.montoDisponible}
            />
          </div>
        </div>
      )}

      {/* Tabla de Distribuciones */}
      <div className="bg-white dark:bg-[#2d2c33] shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando distribuciones...</p>
          </div>
        ) : distribuciones.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No hay distribuciones registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#34333a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto Final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto en Letras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                {distribuciones.map(distribucion => (
                  <tr key={distribucion.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {getNombrePedido(distribucion.pedido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getNombreEmpresa(distribucion.empresa)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-200 mr-2">
                          S/ {formatMonto(distribucion.monto_final)}
                        </span>
                        <button
                          onClick={() => {
                            const nuevoMonto = prompt(
                              `Actualizar monto final para ${getNombreEmpresa(distribucion.empresa)}:`,
                              distribucion.monto_final
                            );
                            if (nuevoMonto && !isNaN(nuevoMonto) && parseFloat(nuevoMonto) > 0) {
                              actualizarMontoFinalReal(distribucion, nuevoMonto);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Editar monto final"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      S/ {formatMonto(distribucion.monto_en_letras || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Tipo de pedido (contado/crédito) */}
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        distribucion.pedido_info?.es_contado || distribucion.pedido?.es_contado
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {distribucion.pedido_info?.es_contado || distribucion.pedido?.es_contado ? 'Contado' : 'Crédito'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${distribucion.completado 
                          ? 'bg-green-100 text-green-800 dark:bg-[#2a3a2a] dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-[#3a3a2a] dark:text-yellow-300'}`}>
                        {distribucion.completado ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFecha(distribucion.fecha_distribucion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => abrirFormulario(distribucion)}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Editar
                      </button>
                      <span className="mx-2 text-gray-400 dark:text-gray-600">|</span>
                      <button
                        onClick={() => eliminarDistribucion(distribucion.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistroDistribuciones; 