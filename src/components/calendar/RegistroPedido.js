// src/components/pedidos/RegistroPedido.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormPedido from '../formularios/FormPedido';

const RegistroPedido = () => {
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [filtros, setFiltros] = useState({
    proveedor: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Cargar pedidos y proveedores en paralelo
      const [pedidosResponse, proveedoresResponse] = await Promise.all([
        axios.get('/api/pedidos/'),
        axios.get('/api/proveedores/')
      ]);

      // Asegurarse que pedidos sea un array
      const pedidosData = Array.isArray(pedidosResponse.data) 
        ? pedidosResponse.data 
        : (pedidosResponse.data.results || []);

      setPedidos(pedidosData);
      setProveedores(proveedoresResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de pedidos');
      if (error.response && error.response.status === 401) {
        window.location.href = '/';
      }
      // En caso de error, asegurarse que pedidos sea al menos un array vacío
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    setIsLoading(true);
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);

      const response = await axios.get(`/api/pedidos/?${params.toString()}`);
      
      // Asegurarse que los pedidos filtrados sean un array
      const pedidosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Error al filtrar pedidos:', error);
      toast.error('Error al filtrar pedidos');
      // En caso de error, mantener un array vacío
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
      proveedor: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: ''
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

  const abrirFormulario = (pedido = null) => {
    setCurrentPedido(pedido);
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
      setPedidos(pedidos.filter(p => p.id !== id));
      toast.success('Pedido eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el pedido:', error);
      toast.error('Error al eliminar el pedido. Puede que tenga distribuciones o letras asociadas.');
    }
  };

  const handleFormSuccess = (pedidoNuevo) => {
    if (currentPedido) {
      // Actualización
      setPedidos(pedidos.map(p => p.id === pedidoNuevo.id ? pedidoNuevo : p));
    } else {
      // Creación
      setPedidos([pedidoNuevo, ...pedidos]);
    }
    cerrarFormulario();
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

  const getNombreProveedor = (proveedorId) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    return proveedor ? proveedor.nombre : '-';
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-[#3a3a2a] dark:text-yellow-300';
      case 'asignado':
        return 'bg-gray-100 text-gray-800 dark:bg-[#34333a] dark:text-gray-300';
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-[#2a3a2a] dark:text-green-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-[#3a2a2a] dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-[#34333a] dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          Registro de Pedidos
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => abrirFormulario()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-[#38373f] dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            + Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor
            </label>
            <select
              name="proveedor"
              value={filtros.proveedor}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="asignado">Asignado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            />
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

      {/* Tabla de Pedidos */}
      <div className="bg-white dark:bg-[#2d2c33] shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No hay pedidos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    Número de Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                {pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {getNombreProveedor(pedido.proveedor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFecha(pedido.fecha_pedido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      S/ {formatMonto(pedido.monto_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pedido.numero_pedido || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(pedido.estado)}`}>
                        {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => abrirFormulario(pedido)}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Editar
                      </button>
                      <span className="mx-2 text-gray-400 dark:text-gray-600">|</span>
                      <button
                        onClick={() => eliminarPedido(pedido.id)}
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

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
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
            <FormPedido 
              handleClose={cerrarFormulario}
              pedidoActual={currentPedido}
              onSubmitSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroPedido;
