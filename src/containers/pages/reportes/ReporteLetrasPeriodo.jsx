import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';

const ReporteLetrasPeriodo = () => {
  const [letras, setLetras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    estado: ''
  });
  const [resumenPorPeriodo, setResumenPorPeriodo] = useState([]);
  const [totales, setTotales] = useState({
    total: 0,
    pendientes: 0,
    pagadas: 0,
    atrasadas: 0
  });

  const meses = [
    { value: 1, nombre: 'Enero' },
    { value: 2, nombre: 'Febrero' },
    { value: 3, nombre: 'Marzo' },
    { value: 4, nombre: 'Abril' },
    { value: 5, nombre: 'Mayo' },
    { value: 6, nombre: 'Junio' },
    { value: 7, nombre: 'Julio' },
    { value: 8, nombre: 'Agosto' },
    { value: 9, nombre: 'Septiembre' },
    { value: 10, nombre: 'Octubre' },
    { value: 11, nombre: 'Noviembre' },
    { value: 12, nombre: 'Diciembre' }
  ];

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
      const response = await axios.get('/api/letras/');
      
      const letrasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setLetras(letrasData);
      calcularResumenPorPeriodo(letrasData);
      aplicarFiltrosPeriodo(letrasData);
    } catch (error) {
      console.error('Error al cargar letras:', error);
      toast.error('Error al cargar los datos de letras');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumenPorPeriodo = (letrasData) => {
    // Crear un mapa para agrupar por año y mes
    const periodoMap = new Map();
    
    // Procesar cada letra para agruparlas por año y mes
    letrasData.forEach(letra => {
      if (!letra.fecha_pago) return;
      
      const fechaPago = new Date(letra.fecha_pago);
      const anio = fechaPago.getFullYear();
      const mes = fechaPago.getMonth() + 1;
      const key = `${anio}-${mes}`;
      
      if (!periodoMap.has(key)) {
        periodoMap.set(key, {
          anio,
          mes,
          nombre_mes: meses.find(m => m.value === mes)?.nombre || 'Desconocido',
          letras: 0,
          pendientes: 0,
          pagadas: 0,
          atrasadas: 0,
          monto_total: 0,
          monto_pendiente: 0,
          monto_pagado: 0,
          monto_atrasado: 0
        });
      }
      
      const periodo = periodoMap.get(key);
      const monto = parseFloat(letra.monto || 0);
      
      periodo.letras++;
      periodo.monto_total += monto;
      
      switch (letra.estado) {
        case 'pendiente':
          periodo.pendientes++;
          periodo.monto_pendiente += monto;
          break;
        case 'pagado':
          periodo.pagadas++;
          periodo.monto_pagado += monto;
          break;
        case 'atrasado':
          periodo.atrasadas++;
          periodo.monto_atrasado += monto;
          break;
        default:
          break;
      }
    });
    
    // Convertir el mapa a un array y ordenar por año y mes (descendente)
    const resumen = Array.from(periodoMap.values())
      .sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes));
    
    setResumenPorPeriodo(resumen);
    
    // Calcular totales
    const totales = {
      total: letrasData.length,
      pendientes: letrasData.filter(l => l.estado === 'pendiente').length,
      pagadas: letrasData.filter(l => l.estado === 'pagado').length,
      atrasadas: letrasData.filter(l => l.estado === 'atrasado').length
    };
    
    setTotales(totales);
  };

  const aplicarFiltrosPeriodo = (letrasData = letras) => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    
    try {
      // Filtrar localmente por año y mes
      let letrasFiltradas = [...letrasData];
      
      if (filtros.anio && filtros.mes) {
        letrasFiltradas = letrasFiltradas.filter(letra => {
          if (!letra.fecha_pago) return false;
          
          const fechaPago = new Date(letra.fecha_pago);
          return (
            fechaPago.getFullYear() === parseInt(filtros.anio) && 
            fechaPago.getMonth() + 1 === parseInt(filtros.mes)
          );
        });
      }
      
      // Filtrar por estado si está seleccionado
      if (filtros.estado) {
        letrasFiltradas = letrasFiltradas.filter(letra => 
          letra.estado === filtros.estado
        );
      }
      
      setLetras(letrasFiltradas);
    } catch (error) {
      console.error('Error al filtrar letras por periodo:', error);
      toast.error('Error al filtrar letras por periodo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const aplicarFiltros = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      // Primero obtener todas las letras
      const response = await axios.get('/api/letras/');
      
      const letrasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      // Luego aplicar filtros localmente
      aplicarFiltrosPeriodo(letrasData);
    } catch (error) {
      console.error('Error al obtener letras:', error);
      toast.error('Error al obtener datos');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      estado: ''
    });
    cargarDatos();
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
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-[#3a3a2a] dark:text-yellow-300';
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-[#2a3a2a] dark:text-green-300';
      case 'atrasado':
        return 'bg-red-100 text-red-800 dark:bg-[#3a2a2a] dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-[#333238] dark:text-gray-300';
    }
  };

  const seleccionarPeriodo = (anio, mes) => {
    setFiltros(prev => ({
      ...prev,
      anio,
      mes
    }));
    
    // Aplicar filtros después de cambiar el estado
    setTimeout(() => {
      aplicarFiltros();
    }, 0);
  };

  // Generar un array de años para el selector (desde 2020 hasta el año actual)
  const aniosDisponibles = () => {
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = 2020; i <= anioActual + 1; i++) {
      anios.push(i);
    }
    return anios;
  };

  return (
    <Layout>
      <div className="p-0 md:p-3">
        <Navbar />
      </div>
      <div className="py-6 px-4 md:py-10 md:px-16 bg-[#f5f5f5] dark:bg-[#232227] min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Reporte de Letras por Periodo
          </h1>

          {/* Filtros */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="mes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mes
                </label>
                <select
                  id="mes"
                  name="mes"
                  value={filtros.mes}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  {meses.map(mes => (
                    <option key={mes.value} value={mes.value}>{mes.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="anio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Año
                </label>
                <select
                  id="anio"
                  name="anio"
                  value={filtros.anio}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  {aniosDisponibles().map(anio => (
                    <option key={anio} value={anio}>{anio}</option>
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

          {/* Resumen por Periodos */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumen por Periodos</h2>
            
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Periodo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Letras</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto Total</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pendientes</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pagadas</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Atrasadas</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {resumenPorPeriodo.length > 0 ? (
                      resumenPorPeriodo.map((periodo, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {periodo.nombre_mes} {periodo.anio}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {periodo.letras}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(periodo.monto_total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {periodo.pendientes} (S/ {formatMonto(periodo.monto_pendiente)})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {periodo.pagadas} (S/ {formatMonto(periodo.monto_pagado)})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {periodo.atrasadas} (S/ {formatMonto(periodo.monto_atrasado)})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => seleccionarPeriodo(periodo.anio, periodo.mes)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron periodos con letras
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Letras del Periodo Seleccionado */}
          <div className="bg-white dark:bg-[#2d2c33] p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Letras de {meses.find(m => m.value === parseInt(filtros.mes))?.nombre} {filtros.anio}
            </h2>
            
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Emisión</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Vencimiento</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#2d2c33] divide-y divide-gray-200 dark:divide-gray-700">
                    {letras.length > 0 ? (
                      letras.map(letra => (
                        <tr key={letra.id} className="hover:bg-gray-50 dark:hover:bg-[#34333a]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {letra.numero}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {letra.proveedor_nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            S/ {formatMonto(letra.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatFecha(letra.fecha_emision)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {formatFecha(letra.fecha_vencimiento)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(letra.estado)}`}>
                              {letra.estado === 'pendiente' ? 'Pendiente' : 
                               letra.estado === 'pagado' ? 'Pagada' : 'Atrasada'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron letras para el periodo seleccionado
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

export default ReporteLetrasPeriodo; 