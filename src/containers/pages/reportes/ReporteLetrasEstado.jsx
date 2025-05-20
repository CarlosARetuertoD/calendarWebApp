import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';
import { useNavigate } from 'react-router-dom';

const ReporteLetrasEstado = () => {
  const [letras, setLetras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [resumen, setResumen] = useState({
    total: 0,
    pendientes: 0,
    pagadas: 0,
    atrasadas: 0,
    montoTotal: 0,
    montoPendiente: 0,
    montoPagado: 0,
    montoAtrasado: 0
  });

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
      calcularResumen(letrasData);
    } catch (error) {
      console.error('Error al cargar letras:', error);
      toast.error('Error al cargar los datos de letras');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumen = (data) => {
    const resumen = {
      total: data.length,
      pendientes: 0,
      pagadas: 0,
      atrasadas: 0,
      montoTotal: 0,
      montoPendiente: 0,
      montoPagado: 0,
      montoAtrasado: 0
    };

    data.forEach(letra => {
      const monto = parseFloat(letra.monto);
      resumen.montoTotal += monto;

      switch (letra.estado) {
        case 'pendiente':
          resumen.pendientes++;
          resumen.montoPendiente += monto;
          break;
        case 'pagado':
          resumen.pagadas++;
          resumen.montoPagado += monto;
          break;
        case 'atrasado':
          resumen.atrasadas++;
          resumen.montoAtrasado += monto;
          break;
        default:
          break;
      }
    });

    setResumen(resumen);
  };

  const aplicarFiltros = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);

      const response = await axios.get(`/api/letras/?${params.toString()}`);
      
      const letrasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setLetras(letrasData);
      calcularResumen(letrasData);
    } catch (error) {
      console.error('Error al filtrar letras:', error);
      toast.error('Error al filtrar letras');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFiltros = () => {
    setFiltros({
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
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'pagado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'atrasado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  return (
    <Layout>
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-8">
          Reporte de Letras por Estado
        </h1>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Total Letras</h3>
            <p className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">{resumen.total}</p>
            <p className="text-lg text-text-main-light dark:text-text-main-dark">S/ {formatMonto(resumen.montoTotal)}</p>
          </div>
          <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow border-l-4 border-yellow-400">
            <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Pendientes</h3>
            <p className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">{resumen.pendientes}</p>
            <p className="text-lg text-text-main-light dark:text-text-main-dark">S/ {formatMonto(resumen.montoPendiente)}</p>
          </div>
          <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow border-l-4 border-green-400">
            <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Pagadas</h3>
            <p className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">{resumen.pagadas}</p>
            <p className="text-lg text-text-main-light dark:text-text-main-dark">S/ {formatMonto(resumen.montoPagado)}</p>
          </div>
          <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow border-l-4 border-red-400">
            <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Atrasadas</h3>
            <p className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">{resumen.atrasadas}</p>
            <p className="text-lg text-text-main-light dark:text-text-main-dark">S/ {formatMonto(resumen.montoAtrasado)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-text-main-light dark:text-text-main-dark mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={filtros.estado}
                onChange={handleFilterChange}
                className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
            <div>
              <label htmlFor="fechaDesde" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                id="fechaDesde"
                name="fechaDesde"
                value={filtros.fechaDesde}
                onChange={handleFilterChange}
                className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="fechaHasta" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                id="fechaHasta"
                name="fechaHasta"
                value={filtros.fechaHasta}
                onChange={handleFilterChange}
                className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={aplicarFiltros}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Aplicar Filtros
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
          <h2 className="text-lg font-medium text-text-main-light dark:text-text-main-dark mb-4">Letras</h2>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Cargando datos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Número</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Proveedor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Monto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Fecha Emisión</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Fecha Vencimiento</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-bg-table-light dark:bg-bg-table-dark divide-y divide-border-light dark:divide-border-dark">
                  {letras.length > 0 ? (
                    letras.map(letra => (
                      <tr key={letra.id} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main-light dark:text-text-main-dark">
                          {letra.numero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main-light dark:text-text-main-dark">
                          {letra.proveedor_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main-light dark:text-text-main-dark">
                          S/ {formatMonto(letra.monto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main-light dark:text-text-main-dark">
                          {formatFecha(letra.fecha_emision)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main-light dark:text-text-main-dark">
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
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
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
    </Layout>
  );
};

export default ReporteLetrasEstado; 