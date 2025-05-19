import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';

const ReporteBalance = () => {
  const [datos, setDatos] = useState({
    ingresos: [],
    egresos: [],
    saldos: []
  });
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    empresa: '',
    fechaDesde: '',
    fechaHasta: '',
    tipo: 'todos' // todos, ingresos, egresos
  });
  const [resumen, setResumen] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    balance: 0
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
      // Cargar datos financieros y empresas en paralelo
      const [balanceResponse, empresasResponse] = await Promise.all([
        axios.get('/api/balance/'),
        axios.get('/api/empresas/')
      ]);
      
      // Procesar datos del balance
      const balanceData = balanceResponse.data || {};
      
      setDatos({
        ingresos: Array.isArray(balanceData.ingresos) ? balanceData.ingresos : [],
        egresos: Array.isArray(balanceData.egresos) ? balanceData.egresos : [],
        saldos: Array.isArray(balanceData.saldos) ? balanceData.saldos : []
      });

      // Procesar empresas
      const empresasData = Array.isArray(empresasResponse.data)
        ? empresasResponse.data
        : (empresasResponse.data.results || []);
      
      setEmpresas(empresasData);
      
      // Calcular resumen
      calcularResumen(balanceData);
    } catch (error) {
      console.error('Error al cargar datos del balance:', error);
      toast.error('Error al cargar los datos financieros');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumen = (data) => {
    const ingresos = Array.isArray(data.ingresos) ? data.ingresos : [];
    const egresos = Array.isArray(data.egresos) ? data.egresos : [];
    
    const totalIngresos = ingresos.reduce((acc, item) => acc + parseFloat(item.monto || 0), 0);
    const totalEgresos = egresos.reduce((acc, item) => acc + parseFloat(item.monto || 0), 0);
    
    setResumen({
      totalIngresos,
      totalEgresos,
      balance: totalIngresos - totalEgresos
    });
  };

  const aplicarFiltros = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
      if (filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);

      const response = await axios.get(`/api/balance/?${params.toString()}`);
      
      const balanceData = response.data || {};
      
      setDatos({
        ingresos: Array.isArray(balanceData.ingresos) ? balanceData.ingresos : [],
        egresos: Array.isArray(balanceData.egresos) ? balanceData.egresos : [],
        saldos: Array.isArray(balanceData.saldos) ? balanceData.saldos : []
      });
      
      // Recalcular resumen con datos filtrados
      calcularResumen(balanceData);
    } catch (error) {
      console.error('Error al filtrar datos de balance:', error);
      toast.error('Error al filtrar datos financieros');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
      empresa: '',
      fechaDesde: '',
      fechaHasta: '',
      tipo: 'todos'
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

  return (
    <Layout>
      <div className="p-0 md:p-3">
        <Navbar />
      </div>
      <div className="p-4 md:p-8 bg-[#f5f5f5] dark:bg-[#232227] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reporte de Balance Financiero
          </h1>

          {/* Filtros */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
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
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={filtros.tipo}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="ingresos">Solo Ingresos</option>
                  <option value="egresos">Solo Egresos</option>
                </select>
              </div>
              <div className="flex items-end space-x-2 col-span-1 md:col-span-4">
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

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow border-l-4 border-green-400">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Ingresos</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                S/ {formatMonto(resumen.totalIngresos)}
              </p>
            </div>
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow border-l-4 border-red-400">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Egresos</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                S/ {formatMonto(resumen.totalEgresos)}
              </p>
            </div>
            <div className={`bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow border-l-4 ${
              resumen.balance >= 0 ? 'border-green-400' : 'border-red-400'}`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                S/ {formatMonto(resumen.balance)}
              </p>
              <p className={`text-sm ${resumen.balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {resumen.balance >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </div>
          </div>

          {/* Tabla de Ingresos */}
          {(filtros.tipo === 'todos' || filtros.tipo === 'ingresos') && (
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ingresos</h2>
              
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Concepto</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referencia</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                      {datos.ingresos.length > 0 ? (
                        datos.ingresos.map((ingreso, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatFecha(ingreso.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {ingreso.concepto}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {ingreso.empresa}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              S/ {formatMonto(ingreso.monto)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {ingreso.referencia || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron ingresos con los filtros seleccionados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tabla de Egresos */}
          {(filtros.tipo === 'todos' || filtros.tipo === 'egresos') && (
            <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Egresos</h2>
              
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Concepto</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referencia</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                      {datos.egresos.length > 0 ? (
                        datos.egresos.map((egreso, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatFecha(egreso.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {egreso.concepto}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {egreso.empresa}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              S/ {formatMonto(egreso.monto)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {egreso.referencia || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron egresos con los filtros seleccionados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tabla de Saldos por Empresa */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Saldos por Empresa</h2>
            
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Egresos</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {datos.saldos.length > 0 ? (
                      datos.saldos.map((saldo, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {saldo.empresa}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(saldo.ingresos)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(saldo.egresos)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${saldo.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            S/ {formatMonto(saldo.saldo)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No hay datos de saldos disponibles
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

export default ReporteBalance; 