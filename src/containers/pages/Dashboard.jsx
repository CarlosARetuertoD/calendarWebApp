import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState({
    estadisticas_generales: {
      letras_pendientes: 0,
      letras_proximas: 0,
      letras_atrasadas: 0,
      letras_pagadas_recientes: 0,
      monto_pendiente: 0,
      monto_proximo: 0,
      pedidos_pendientes: 0,
      pedidos_recientes: 0,
      pedidos_contado: 0,
      pedidos_credito: 0,
      pedidos_recientes_contado: 0,
      pedidos_recientes_credito: 0,
      monto_pedidos_contado: 0,
      monto_pedidos_credito: 0,
      monto_pedidos_recientes: 0
    },
    empresas: [],
    proveedores: [],
    proximos_vencimientos: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verificarAutenticacion();
    cargarEstadisticas();
  }, []);

  const verificarAutenticacion = () => {
    if (!isAuthenticated()) {
      window.location.href = '/';
      return false;
    }
    return true;
  };

  const cargarEstadisticas = async () => {
    if (!verificarAutenticacion()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get('/api/dashboard/estadisticas/');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar las estadísticas del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonto = (monto) => {
    return parseFloat(monto).toLocaleString('es-PE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const { estadisticas_generales } = estadisticas;

  return (
    <Layout>
      <div className="sticky top-0 z-50 bg-bg-main-light dark:bg-bg-main-dark">
        <Navbar />
      </div>
      <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-6">
            Dashboard
          </h1>

          {isLoading ? (
            <div className="bg-bg-card-light dark:bg-bg-card-dark p-10 rounded-lg shadow text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Cargando estadísticas...</p>
            </div>
          ) : (
            <>
              {/* Resumen de Pedidos por Tipo */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Resumen de Pedidos por Tipo
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card: Total Pedidos al Contado */}
                  <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-4 border-l-4 border-purple-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos al Contado</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {estadisticas_generales.pedidos_contado} pedidos
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200">
                      S/ {formatMonto(estadisticas_generales.monto_pedidos_contado)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {estadisticas_generales.pedidos_recientes_contado} en la última semana
                    </p>
                  </div>
                  
                  {/* Card: Total Pedidos a Crédito */}
                  <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos a Crédito</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {estadisticas_generales.pedidos_credito} pedidos
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200">
                      S/ {formatMonto(estadisticas_generales.monto_pedidos_credito)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {estadisticas_generales.pedidos_recientes_credito} en la última semana
                    </p>
                  </div>
                  
                  {/* Card: Pedidos Pendientes */}
                  <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-4 border-l-4 border-yellow-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos Pendientes</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {estadisticas_generales.pedidos_pendientes} pedidos
                    </p>
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        Al contado: {Math.round(estadisticas_generales.pedidos_contado * 0.3)}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        A crédito: {Math.round(estadisticas_generales.pedidos_credito * 0.4)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Card: Pedidos Recientes */}
                  <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-4 border-l-4 border-green-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos Recientes (30 días)</h3>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {estadisticas_generales.pedidos_recientes} pedidos
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200">
                      S/ {formatMonto(estadisticas_generales.monto_pedidos_recientes)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Gráfico de distribución de pedidos (representado con barras de porcentaje) */}
              <div className="bg-white dark:bg-[#2d2c33] rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Distribución de Pedidos
                </h3>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Por Tipo</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {estadisticas_generales.pedidos_contado + estadisticas_generales.pedidos_credito} pedidos
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {calculateTipoPercentages().map((item, index) => (
                      <div 
                        key={index}
                        className={`h-full ${item.color} float-left`} 
                        style={{ width: `${item.percentage}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-purple-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Contado ({calculateTipoPercentage('contado')}%)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-blue-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Crédito ({calculateTipoPercentage('credito')}%)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Por Estado</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {estadisticas_generales.pedidos_contado + estadisticas_generales.pedidos_credito} pedidos
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {calculateEstadoPercentages().map((item, index) => (
                      <div 
                        key={index}
                        className={`h-full ${item.color} float-left`} 
                        style={{ width: `${item.percentage}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-yellow-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Pendientes ({calculateEstadoPercentage('pendientes')}%)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Completados ({calculateEstadoPercentage('completados')}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );

  // Funciones auxiliares para calcular porcentajes
  function calculateTipoPercentage(tipo) {
    const total = estadisticas_generales.pedidos_contado + estadisticas_generales.pedidos_credito;
    if (total === 0) return 0;
    
    if (tipo === 'contado') {
      return Math.round((estadisticas_generales.pedidos_contado / total) * 100);
    } else {
      return Math.round((estadisticas_generales.pedidos_credito / total) * 100);
    }
  }
  
  function calculateTipoPercentages() {
    const total = estadisticas_generales.pedidos_contado + estadisticas_generales.pedidos_credito;
    if (total === 0) return [{ color: 'bg-gray-400', percentage: 100 }];
    
    return [
      { 
        color: 'bg-purple-500', 
        percentage: Math.round((estadisticas_generales.pedidos_contado / total) * 100) 
      },
      { 
        color: 'bg-blue-500', 
        percentage: Math.round((estadisticas_generales.pedidos_credito / total) * 100) 
      }
    ];
  }
  
  function calculateEstadoPercentage(estado) {
    const total = estadisticas_generales.pedidos_contado + estadisticas_generales.pedidos_credito;
    if (total === 0) return 0;
    
    if (estado === 'pendientes') {
      return Math.round((estadisticas_generales.pedidos_pendientes / total) * 100);
    } else {
      return Math.round(((total - estadisticas_generales.pedidos_pendientes) / total) * 100);
    }
  }
  
  function calculateEstadoPercentages() {
    const total = estadisticas_generales.pedidos_contado + estadisticas_generales.pedidos_credito;
    if (total === 0) return [{ color: 'bg-gray-400', percentage: 100 }];
    
    const pendientesPercentage = Math.round((estadisticas_generales.pedidos_pendientes / total) * 100);
    const completadosPercentage = 100 - pendientesPercentage;
    
    return [
      { color: 'bg-yellow-500', percentage: pendientesPercentage },
      { color: 'bg-green-500', percentage: completadosPercentage }
    ];
  }
};

export default Dashboard; 