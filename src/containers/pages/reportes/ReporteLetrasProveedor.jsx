import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';

const ReporteLetrasProveedor = () => {
  const [letras, setLetras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    proveedor: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
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
      // Cargar letras y proveedores en paralelo
      const [letrasResponse, proveedoresResponse] = await Promise.all([
        axios.get('/api/letras/'),
        axios.get('/api/proveedores/')
      ]);
      
      const letrasData = Array.isArray(letrasResponse.data) 
        ? letrasResponse.data 
        : (letrasResponse.data.results || []);

      const proveedoresData = Array.isArray(proveedoresResponse.data)
        ? proveedoresResponse.data
        : (proveedoresResponse.data.results || []);
      
      setLetras(letrasData);
      setProveedores(proveedoresData);
      calcularResumenProveedores(letrasData, proveedoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumenProveedores = (letrasData, proveedoresData) => {
    // Crear un mapa para asociar cada proveedor con sus letras
    const proveedorMap = new Map();
    
    // Inicializar el mapa con todos los proveedores
    proveedoresData.forEach(proveedor => {
      proveedorMap.set(proveedor.id, {
        id: proveedor.id,
        nombre: proveedor.nombre,
        letras: 0,
        letras_pendientes: 0,
        letras_pagadas: 0,
        monto_total: 0,
        monto_pendiente: 0,
        monto_pagado: 0
      });
    });
    
    // Procesar las letras para actualizar las estadísticas de cada proveedor
    letrasData.forEach(letra => {
      if (!letra.pedido || !letra.pedido.proveedor) return;
      
      const proveedorId = letra.pedido.proveedor;
      const proveedorInfo = proveedorMap.get(parseInt(proveedorId));
      
      if (!proveedorInfo) return;
      
      const monto = parseFloat(letra.monto || 0);
      
      proveedorInfo.letras++;
      proveedorInfo.monto_total += monto;
      
      if (letra.estado === 'pendiente' || letra.estado === 'atrasado') {
        proveedorInfo.letras_pendientes++;
        proveedorInfo.monto_pendiente += monto;
      } else if (letra.estado === 'pagado') {
        proveedorInfo.letras_pagadas++;
        proveedorInfo.monto_pagado += monto;
      }
    });
    
    // Convertir el mapa a un array y ordenar por monto pendiente
    const resumen = Array.from(proveedorMap.values())
      .filter(p => p.letras > 0) // Solo incluir proveedores con letras
      .sort((a, b) => b.monto_pendiente - a.monto_pendiente);
    
    setResumenProveedores(resumen);
  };

  const aplicarFiltros = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);

      const response = await axios.get(`/api/letras/?${params.toString()}`);
      
      const letrasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setLetras(letrasData);
      
      if (filtros.proveedor) {
        setSelectedProveedor(filtros.proveedor);
      } else {
        setSelectedProveedor(null);
        calcularResumenProveedores(letrasData, proveedores);
      }
    } catch (error) {
      console.error('Error al filtrar letras:', error);
      toast.error('Error al filtrar letras');
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
    return parseFloat(monto).toLocaleString('es-PE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'atrasado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filtrarLetrasPorProveedor = (proveedorId) => {
    setFiltros(prev => ({
      ...prev,
      proveedor: proveedorId
    }));
    setSelectedProveedor(proveedorId);
    
    const params = new URLSearchParams();
    params.append('proveedor', proveedorId);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
    
    setIsLoading(true);
    axios.get(`/api/letras/?${params.toString()}`)
      .then(response => {
        const letrasData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        
        setLetras(letrasData);
      })
      .catch(error => {
        console.error('Error al filtrar letras por proveedor:', error);
        toast.error('Error al filtrar letras por proveedor');
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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Reporte de Letras por Proveedor
          </h1>

          {/* Filtros */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="atrasado">Atrasado</option>
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

          {/* Resumen por Proveedor - Mostrar solo cuando no hay proveedor seleccionado */}
          {!selectedProveedor && (
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
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
                          Total Letras
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pendientes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pagadas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Monto Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Monto Pendiente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                      {resumenProveedores.length > 0 ? (
                        resumenProveedores.map(proveedor => (
                          <tr 
                            key={proveedor.id} 
                            className="hover:bg-gray-50 dark:hover:bg-[#34333a] cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {proveedor.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {proveedor.letras}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {proveedor.letras_pendientes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {proveedor.letras_pagadas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              S/ {formatMonto(proveedor.monto_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              S/ {formatMonto(proveedor.monto_pendiente)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => filtrarLetrasPorProveedor(proveedor.id)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
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

          {/* Detalle de Letras */}
          <div className="bg-white dark:bg-[#2d2c33] shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedProveedor ? 
                  `Letras de ${proveedores.find(p => p.id === parseInt(selectedProveedor))?.nombre || 'Proveedor'}` : 
                  'Todas las Letras'}
              </h3>
            </div>
            
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
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {letras.length > 0 ? (
                      letras.map(letra => (
                        <tr key={letra.id} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {letra.pedido?.proveedor_nombre || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {letra.empresa?.nombre || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatFecha(letra.fecha_pago)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(letra.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(letra.estado)}`}>
                              {letra.estado ? letra.estado.charAt(0).toUpperCase() + letra.estado.slice(1) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron letras con los filtros seleccionados
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

export default ReporteLetrasProveedor; 