import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';

const ReporteFacturas = () => {
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    proveedor: '',
    empresa: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  });

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
      // Cargar facturas, proveedores y empresas en paralelo
      const [facturasResponse, proveedoresResponse, empresasResponse] = await Promise.all([
        axios.get('/api/facturas/'),
        axios.get('/api/proveedores/'),
        axios.get('/api/empresas/')
      ]);
      
      const facturasData = Array.isArray(facturasResponse.data) 
        ? facturasResponse.data 
        : (facturasResponse.data.results || []);

      const proveedoresData = Array.isArray(proveedoresResponse.data)
        ? proveedoresResponse.data
        : (proveedoresResponse.data.results || []);

      const empresasData = Array.isArray(empresasResponse.data)
        ? empresasResponse.data
        : (empresasResponse.data.results || []);
      
      setFacturas(facturasData);
      setProveedores(proveedoresData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await axios.get(`/api/facturas/?${params.toString()}`);
      
      const facturasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setFacturas(facturasData);
    } catch (error) {
      console.error('Error al filtrar facturas:', error);
      toast.error('Error al filtrar facturas');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
      proveedor: '',
      empresa: '',
      fechaDesde: '',
      fechaHasta: '',
      estado: ''
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
        return 'bg-yellow-100 text-yellow-800 dark:bg-[#3a3a2a] dark:text-yellow-300';
      case 'Pagada':
        return 'bg-green-100 text-green-800 dark:bg-[#2a3a2a] dark:text-green-300';
      case 'Vencida':
        return 'bg-red-100 text-red-800 dark:bg-[#3a2a2a] dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-[#333238] dark:text-gray-300';
    }
  };

  return (
    <Layout>
      <div className="p-0 md:p-3">
        <Navbar />
      </div>
      <div className="p-4 md:p-8 bg-gray-50 dark:bg-[#232227] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reporte de Facturas
          </h1>

          {/* Filtros */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empresa
                </label>
                <select
                  id="empresa"
                  name="empresa"
                  value={filtros.empresa}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  <option value="">Todas las empresas</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
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
                  <option value="Pagada">Pagada</option>
                  <option value="Vencida">Vencida</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={aplicarFiltros}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={resetFiltros}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-[#38373f] hover:bg-gray-50 dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Facturas */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Facturas</h2>
            
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando datos...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-[#38373f]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Número</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proveedor</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {facturas.length > 0 ? (
                      facturas.map(factura => (
                        <tr key={factura.id} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {factura.numero}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {factura.proveedor_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {factura.empresa_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatFecha(factura.fecha)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(factura.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(factura.estado)}`}>
                              {factura.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron facturas con los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumen Estadístico */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Facturas</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{facturas.length}</p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                S/ {formatMonto(facturas.reduce((acc, f) => acc + parseFloat(f.monto || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow border-l-4 border-green-400">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagadas</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {facturas.filter(f => f.estado === 'Pagada').length}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                S/ {formatMonto(facturas
                  .filter(f => f.estado === 'Pagada')
                  .reduce((acc, f) => acc + parseFloat(f.monto || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow border-l-4 border-yellow-400">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {facturas.filter(f => f.estado === 'Pendiente').length}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                S/ {formatMonto(facturas
                  .filter(f => f.estado === 'Pendiente')
                  .reduce((acc, f) => acc + parseFloat(f.monto || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow border-l-4 border-red-400">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vencidas</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {facturas.filter(f => f.estado === 'Vencida').length}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                S/ {formatMonto(facturas
                  .filter(f => f.estado === 'Vencida')
                  .reduce((acc, f) => acc + parseFloat(f.monto || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReporteFacturas; 