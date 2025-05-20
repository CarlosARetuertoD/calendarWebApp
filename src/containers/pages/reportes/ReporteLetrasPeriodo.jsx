import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';
import { useNavigate } from 'react-router-dom';

const ReporteLetrasPeriodo = () => {
  const [letras, setLetras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const navigate = useNavigate();
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
    if (!authenticated) {
      navigate('/');
      return;
    }

    cargarDatos();

    const handleFocus = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      if (!isAuth) {
        navigate('/');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate, authenticated]);

  if (!authenticated) {
    return null;
  }

  const cargarDatos = async () => {
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

  const handleBuscar = () => {
    aplicarFiltros();
  };

  return (
    <Layout>
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-8">
          Reporte de Letras por Período
        </h1>

        {/* Filtros */}
        <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-text-main-light dark:text-text-main-dark mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="anio" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                Año
              </label>
              <select
                id="anio"
                name="anio"
                value={filtros.anio}
                onChange={handleFilterChange}
                className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                {aniosDisponibles().map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mes" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                Mes
              </label>
              <select
                id="mes"
                name="mes"
                value={filtros.mes}
                onChange={handleFilterChange}
                className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                {meses.map(mes => (
                  <option key={mes.value} value={mes.value}>{mes.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleBuscar}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Buscar
              </button>
              <button
                onClick={resetFiltros}
                className="inline-flex items-center px-4 py-2 border border-border-light dark:border-border-dark text-sm font-medium rounded-md shadow-sm text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Letras */}
        <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow overflow-hidden">
          {/* ... contenido de la tabla ... */}
        </div>
      </div>
    </Layout>
  );
};

export default ReporteLetrasPeriodo; 