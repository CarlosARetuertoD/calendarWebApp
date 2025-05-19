import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';

const ReportePedidosProveedor = () => {
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    proveedor: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  });
  const [resumenProveedores, setResumenProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  useEffect(() => {
    verificarAutenticacion();
    cargarDatos();
  }, []);

  const verificarAutenticacion = () => {
    if (!isAuthenticated()) {
      window.location.href = '/';
      return false;
    }
    return true;
  };

  const cargarDatos = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      // Cargar pedidos y proveedores en paralelo
      const [pedidosResponse, proveedoresResponse] = await Promise.all([
        axios.get('/api/pedidos/'),
        axios.get('/api/proveedores/')
      ]);
      
      const pedidosData = Array.isArray(pedidosResponse.data) 
        ? pedidosResponse.data 
        : (pedidosResponse.data.results || []);

      const proveedoresData = Array.isArray(proveedoresResponse.data)
        ? proveedoresResponse.data
        : (proveedoresResponse.data.results || []);
      
      setPedidos(pedidosData);
      setProveedores(proveedoresData);
      calcularResumenProveedores(pedidosData, proveedoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumenProveedores = (pedidosData, proveedoresData) => {
    // Crear un mapa para asociar cada proveedor con sus pedidos
    const proveedorMap = new Map();
    
    // Inicializar el mapa con todos los proveedores
    proveedoresData.forEach(proveedor => {
      proveedorMap.set(proveedor.id, {
        id: proveedor.id,
        nombre: proveedor.nombre,
        pedidos_totales: 0,
        pedidos_completos: 0,
        pedidos_pendientes: 0,
        pedidos_contado: 0,
        pedidos_credito: 0,
        monto_total: 0,
        monto_contado: 0,
        monto_credito: 0
      });
    });
    
    // Procesar los pedidos para actualizar las estadísticas de cada proveedor
    pedidosData.forEach(pedido => {
      if (!pedido.proveedor) return;
      
      const proveedorId = pedido.proveedor;
      const proveedorInfo = proveedorMap.get(parseInt(proveedorId));
      
      if (!proveedorInfo) return;
      
      const monto = parseFloat(pedido.monto_total || pedido.total || 0);
      
      proveedorInfo.pedidos_totales++;
      proveedorInfo.monto_total += monto;
      
      // Actualizar contadores por tipo de pedido (contado/crédito)
      if (pedido.es_contado) {
        proveedorInfo.pedidos_contado++;
        proveedorInfo.monto_contado += monto;
      } else {
        proveedorInfo.pedidos_credito++;
        proveedorInfo.monto_credito += monto;
      }
      
      if (pedido.estado === 'Completado' || pedido.estado === 'completado') {
        proveedorInfo.pedidos_completos++;
      } else {
        proveedorInfo.pedidos_pendientes++;
      }
    });
    
    // Convertir el mapa a un array y ordenar por monto total
    const resumen = Array.from(proveedorMap.values())
      .filter(p => p.pedidos_totales > 0) // Solo incluir proveedores con pedidos
      .sort((a, b) => b.monto_total - a.monto_total);
    
    setResumenProveedores(resumen);
  };

  const aplicarFiltros = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await axios.get(`/api/pedidos/?${params.toString()}`);
      
      const pedidosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setPedidos(pedidosData);
      
      if (filtros.proveedor) {
        setSelectedProveedor(filtros.proveedor);
      } else {
        setSelectedProveedor(null);
        calcularResumenProveedores(pedidosData, proveedores);
      }
    } catch (error) {
      console.error('Error al filtrar pedidos:', error);
      toast.error('Error al filtrar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
      proveedor: '',
      fechaDesde: '',
      fechaHasta: '',
      estado: ''
    });
    setSelectedProveedor(null);
    cargarDatos();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES');
  };

  const formatMonto = (monto) => {
    return parseFloat(monto || 0).toLocaleString('es-PE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Completado':
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Cancelado':
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filtrarPedidosPorProveedor = (proveedorId) => {
    setFiltros(prev => ({
      ...prev,
      proveedor: proveedorId
    }));
    setSelectedProveedor(proveedorId);
    
    const params = new URLSearchParams();
    params.append('proveedor', proveedorId);
    if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
    if (filtros.estado) params.append('estado', filtros.estado);
    
    setIsLoading(true);
    axios.get(`/api/pedidos/?${params.toString()}`)
      .then(response => {
        const pedidosData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        
        setPedidos(pedidosData);
      })
      .catch(error => {
        console.error('Error al filtrar pedidos por proveedor:', error);
        toast.error('Error al filtrar pedidos por proveedor');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Layout>
      <div className="p-0 md:p-3">
        <Navbar />
      </div>
      <div className="py-6 px-4 md:py-10 md:px-16 bg-gray-50 dark:bg-[#232227] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reporte de Pedidos por Proveedor
          </h1>

          {/* Filtros */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proveedor
                </label>
                <select
                  id="proveedor"
                  name="proveedor"
                  value={filtros.proveedor}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  id="fechaDesde"
                  name="fechaDesde"
                  value={filtros.fechaDesde}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  id="fechaHasta"
                  name="fechaHasta"
                  value={filtros.fechaHasta}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={filtros.estado}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={aplicarFiltros}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#38373f] dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-gray-500"
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={resetFiltros}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#38373f] hover:bg-gray-50 dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Resumen por Proveedor */}
          {!selectedProveedor && (
            <div className="bg-white dark:bg-[#38373f] p-4 rounded-lg mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumen por Proveedor</h2>
              
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando datos...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-[#38373f]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Pedidos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Crédito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pendientes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Monto Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                      {resumenProveedores.length > 0 ? (
                        resumenProveedores.map(proveedor => (
                          <tr key={proveedor.id} className="hover:bg-gray-50 dark:hover:bg-[#34333a] cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {proveedor.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {proveedor.pedidos_totales}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center">
                                <span className="px-2 mr-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  {proveedor.pedidos_contado}
                                </span>
                                S/ {formatMonto(proveedor.monto_contado)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center">
                                <span className="px-2 mr-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {proveedor.pedidos_credito}
                                </span>
                                S/ {formatMonto(proveedor.monto_credito)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {proveedor.pedidos_completos}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {proveedor.pedidos_pendientes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              S/ {formatMonto(proveedor.monto_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => filtrarPedidosPorProveedor(proveedor.id)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No hay datos disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Detalle de Pedidos */}
          <div className="bg-white dark:bg-[#38373f] p-4 rounded-lg mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {selectedProveedor ? 
                `Pedidos de ${proveedores.find(p => p.id === parseInt(selectedProveedor))?.nombre || 'Proveedor'}` : 
                'Todos los Pedidos'}
            </h2>
            
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando datos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-[#38373f]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {pedidos.length > 0 ? (
                      pedidos.map(pedido => (
                        <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-[#34333a] cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {pedido.numero_pedido || pedido.codigo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatFecha(pedido.fecha_pedido || pedido.fecha)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {pedido.proveedor_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pedido.es_contado ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                              {pedido.es_contado ? 'Contado' : 'Crédito'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(pedido.monto_total || pedido.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(pedido.estado)}`}>
                              {pedido.estado ? (typeof pedido.estado === 'string' ? pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1) : pedido.estado) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron pedidos con los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportePedidosProveedor; 