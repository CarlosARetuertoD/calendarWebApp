import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { isAuthenticated } from '../../utils/auth';
import Navbar from 'components/navigation/Navbar';
import Layout from 'hocs/layouts/Layout';
import DocumentosForm from 'components/formularios/FormDocumentos';

const RegistroDocumentos = () => {
  const [distribuciones, setDistribuciones] = useState([]);
  const [selectedDistribucion, setSelectedDistribucion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtros, setFiltros] = useState({
    proveedor: '',
    empresa: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'incompletas' // por defecto mostrar solo las incompletas
  });
  const [proveedores, setProveedores] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/';
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Cargar distribuciones, proveedores y empresas en paralelo
      const [distribucionesResponse, proveedoresResponse, empresasResponse] = await Promise.all([
        axios.get('/api/distribuciones/?estado=incompletas'),
        axios.get('/api/proveedores/'),
        axios.get('/api/empresas/')
      ]);
      
      // Asegurarse de que distribuciones sea un array
      const distribucionesData = Array.isArray(distribucionesResponse.data) 
        ? distribucionesResponse.data 
        : (distribucionesResponse.data.results || []);
      
      setDistribuciones(distribucionesData);
      
      // Asegurarse de que proveedores y empresas sean arrays
      const proveedoresData = Array.isArray(proveedoresResponse.data) 
        ? proveedoresResponse.data 
        : (proveedoresResponse.data.results || []);
      
      const empresasData = Array.isArray(empresasResponse.data) 
        ? empresasResponse.data 
        : (empresasResponse.data.results || []);
      
      setProveedores(proveedoresData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
      setDistribuciones([]);
      setProveedores([]);
      setEmpresas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await axios.get(`/api/distribuciones/?${params.toString()}`);
      
      // Asegurarse de que distribuciones sea un array
      const distribucionesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setDistribuciones(distribucionesData);
    } catch (error) {
      console.error('Error al filtrar distribuciones:', error);
      toast.error('Error al filtrar distribuciones');
      setDistribuciones([]);
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
      estado: 'incompletas'
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

  const selectDistribucion = async (id) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/distribuciones/${id}/`);
      setSelectedDistribucion(response.data);
      setShowForm(true);
    } catch (error) {
      console.error('Error al cargar detalles de la distribución:', error);
      toast.error('Error al cargar detalles');
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentosSubmitted = () => {
    setShowForm(false);
    setSelectedDistribucion(null);
    cargarDatos();
    toast.success('Documentos registrados correctamente');
  };

  const formatMonto = (monto) => {
    return parseFloat(monto || 0).toLocaleString('es-PE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getEstadoClass = (distribucion) => {
    // Verificamos si tiene todas las guías y facturas completas
    if (distribucion.estado === 'completa') {
      return 'bg-green-100 text-green-800 dark:bg-[#2a3a2a] dark:text-green-300';
    } else {
      return 'bg-yellow-100 text-yellow-800 dark:bg-[#3a3a2a] dark:text-yellow-300';
    }
  };

  return (
    <Layout>
      <Navbar />
      <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                Registro de Documentos
              </h1>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  + Nuevo Documento
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow p-4 border border-border-light dark:border-border-dark">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="proveedor" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                    Proveedor
                  </label>
                  <select
                    id="proveedor"
                    name="proveedor"
                    value={filtros.proveedor}
                    onChange={handleFilterChange}
                    className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="">Todos los proveedores</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                    Empresa
                  </label>
                  <select
                    id="empresa"
                    name="empresa"
                    value={filtros.empresa}
                    onChange={handleFilterChange}
                    className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="">Todas las empresas</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
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
                    <option value="incompletas">Pendientes</option>
                    <option value="completas">Completas</option>
                    <option value="">Todas</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={aplicarFiltros}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Aplicar Filtros
                  </button>
                  <button
                    onClick={resetFiltros}
                    className="inline-flex items-center px-4 py-2 border border-border-light dark:border-border-dark text-sm font-medium rounded-md shadow-sm text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-form-light/90 dark:hover:bg-bg-form-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow overflow-hidden border border-border-light dark:border-border-dark">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                  <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Monto Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Monto en Documentos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                    {distribuciones.map(distribucion => (
                      <tr key={distribucion.id} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main-light dark:text-text-main-dark">
                          {distribucion.pedido_fecha} - #{distribucion.pedido_numero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          {distribucion.proveedor_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          {distribucion.empresa_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          S/ {formatMonto(distribucion.monto_final)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          S/ {formatMonto(distribucion.monto_documentos || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(distribucion)}`}>
                            {distribucion.estado === 'completa' ? 'Completa' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => selectDistribucion(distribucion.id)}
                            className="text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary"
                          >
                            Registrar Documentos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formulario de Documentos */}
            {showForm && selectedDistribucion && (
              <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow">
                <DocumentosForm 
                  distribucionId={selectedDistribucion} 
                  onSubmitSuccess={onDocumentosSubmitted}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegistroDocumentos; 