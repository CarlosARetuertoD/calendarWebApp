import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormDistribucion from '../formularios/FormDistribucion';
import { useLocation } from 'react-router-dom';
import TablaPedidosPendientes from '../tablas/TablaPedidosPendientes';
import TablaRegistroDistribuciones from '../tablas/TablaRegistroDistribuciones';

const RegistroDistribuciones = () => {
  const location = useLocation();
  const [distribuciones, setDistribuciones] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDistribucion, setCurrentDistribucion] = useState(null);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [showPedidoSelector, setShowPedidoSelector] = useState(false);
  const [filtros, setFiltros] = useState({
    pedido: '',
    empresa: '',
    completado: ''
  });
  const [pedidoInfo, setPedidoInfo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Efecto para manejar el pedido seleccionado desde otra página
  useEffect(() => {
    if (location.state?.pedidoId) {
      setIsLoading(true);
      
      // Obtener detalles del pedido 
      const cargarPedidoSeleccionado = async () => {
        try {
          const response = await axios.get(`/api/pedidos/${location.state.pedidoId}/`);
          const pedido = response.data;
          
          // Verificar que el pedido esté pendiente
          if (pedido.estado !== 'pendiente') {
            toast.error('Solo se pueden crear distribuciones para pedidos pendientes');
            return;
          }
          
          // Usar la información del estado si está disponible, o calcularla de la respuesta
          const pedidoInfo = location.state.pedidoInfo || {
            proveedor: pedido.proveedor_nombre || (pedido.proveedor ? pedido.proveedor.nombre : ''),
            fecha: formatFecha(pedido.fecha_pedido),
            montoTotal: parseFloat(pedido.monto_total_pedido),
            montoDisponible: calcularMontoDisponible(pedido),
            esContado: pedido.es_contado
          };
          
          // Mostrar notificación con el nombre del pedido
          toast.info(`Cargando distribución para: ${pedidoInfo.proveedor}`);
          
          setSelectedPedidoId(location.state.pedidoId);
          setPedidoInfo(pedidoInfo);
          setShowForm(true);
          
          // Restablecer los filtros para mantener el contexto limpio
          setFiltros({
            pedido: location.state.pedidoId,
            empresa: '',
            completado: ''
          });
          
          // Aplicar el filtro automáticamente
          aplicarFiltros();
        } catch (error) {
          console.error('Error al cargar datos del pedido:', error);
          toast.error('No se pudo cargar el pedido seleccionado');
        } finally {
          setIsLoading(false);
        }
      };
      
      cargarPedidoSeleccionado();
      
      // Limpiar el estado de ubicación para evitar comportamientos inesperados
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Cargar distribuciones, pedidos y empresas en paralelo
      const [distribucionesResponse, pedidosResponse, empresasResponse] = await Promise.all([
        axios.get('/api/distribuciones/'),
        axios.get('/api/pedidos/'),
        axios.get('/api/empresas/')
      ]);

      // Asegurarse que distribuciones sea un array
      const distribucionesData = Array.isArray(distribucionesResponse.data) 
        ? distribucionesResponse.data 
        : (distribucionesResponse.data.results || []);
        
      setDistribuciones(distribucionesData);
      
      // Procesar y filtrar pedidos disponibles (solo pendientes)
      const pedidosData = Array.isArray(pedidosResponse.data) 
        ? pedidosResponse.data 
        : (pedidosResponse.data.results || []);
      
      setPedidos(pedidosData);
      
      // Filtrar pedidos disponibles (solo pendientes)
      const pedidosDisponiblesData = pedidosData.filter(
        pedido => pedido.estado === 'pendiente'
      );
      
      setPedidosDisponibles(pedidosDisponiblesData);
      setEmpresas(empresasResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de distribuciones');
      if (error.response && error.response.status === 401) {
        window.location.href = '/';
      }
      setDistribuciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.pedido) params.append('pedido', filtros.pedido);
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.completado !== '') params.append('completado', filtros.completado);

      const response = await axios.get(`/api/distribuciones/?${params.toString()}`);
      
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
      pedido: '',
      empresa: '',
      completado: ''
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

  const abrirFormulario = (distribucion = null, pedidoId = null) => {
    if (!distribucion && !pedidoId) {
      setShowPedidoSelector(true);
    } else {
      setCurrentDistribucion(distribucion);
      setSelectedPedidoId(pedidoId);
      setShowForm(true);
      setShowPedidoSelector(false);
    }
  };

  const seleccionarPedido = (pedidoId) => {
    setSelectedPedidoId(pedidoId);
    setShowForm(true);
    setShowPedidoSelector(false);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setShowPedidoSelector(false);
    setCurrentDistribucion(null);
    setSelectedPedidoId(null);
  };

  const eliminarDistribucion = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta distribución? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Obtener la distribución antes de eliminarla
      const distribucionAEliminar = distribuciones.find(d => d.id === id);
      if (!distribucionAEliminar) {
        toast.error('No se encontró la distribución a eliminar');
        return;
      }

      // Eliminar la distribución
      await axios.delete(`/api/distribuciones/${id}/`);
      
      // Calcular el nuevo monto total distribuido para el pedido
      const distribucionesRestantes = distribuciones.filter(d => 
        d.id !== id && d.pedido === distribucionAEliminar.pedido
      );
      
      const nuevoMontoTotal = distribucionesRestantes.reduce(
        (sum, dist) => sum + parseFloat(dist.monto_final || 0),
        0
      );

      // Actualizar el monto final del pedido
      await axios.patch(`/api/pedidos/${distribucionAEliminar.pedido}/`, {
        monto_final_pedido: nuevoMontoTotal
      });

      setDistribuciones(distribuciones.filter(d => d.id !== id));
      toast.success('Distribución eliminada correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar distribución:', error);
      toast.error('Error al eliminar la distribución. Puede que tenga letras asociadas.');
    }
  };

  const handleFormSuccess = (distribucionesCreadas) => {
    setDistribuciones([...distribucionesCreadas, ...distribuciones]);
    cerrarFormulario();
    cargarDatos();
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

  const getNombrePedido = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return '-';
    
    const proveedorNombre = pedido.proveedor?.nombre || pedido.proveedor_nombre || 'Sin proveedor';
    const tipoPedido = pedido.es_contado ? 'Contado' : 'Crédito';
    
    return `${proveedorNombre} - ${formatFecha(pedido.fecha_pedido)} - S/ ${parseFloat(pedido.monto_total_pedido).toFixed(2)} (${tipoPedido})`;
  };

  const getNombreEmpresa = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa ? empresa.nombre : '-';
  };

  const calcularMontoDisponible = (pedido) => {
    const montoDistribuido = pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;
    
    return parseFloat(pedido.monto_total_pedido) - montoDistribuido;
  };

  const calcularMontoDistribuido = (pedido) => {
    return pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 bg-bg-main-light dark:bg-bg-main-dark">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-4 md:mb-0">
          Registro de Distribuciones
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => abrirFormulario()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            + Nueva Distribución
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow p-3 mb-4 sm:mb-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-wrap gap-2">
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="pedido"
              value={filtros.pedido}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por pedido"
            >
              <option value="">Todos los pedidos</option>
              {pedidos.map(pedido => (
                <option key={pedido.id} value={pedido.id}>
                  {pedido.proveedor?.nombre || pedido.proveedor_nombre || '-'} - {formatFecha(pedido.fecha_pedido)} - S/ {parseFloat(pedido.monto_total_pedido).toFixed(2)} - {pedido.es_contado ? 'Contado' : 'Crédito'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="empresa"
              value={filtros.empresa}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por empresa"
            >
              <option value="">Todas las empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="completado"
              value={filtros.completado}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="true">Completado</option>
              <option value="false">Pendiente</option>
            </select>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={resetFiltros}
              className="flex-1 sm:flex-initial px-3 py-1.5 border border-border-light dark:border-border-dark rounded-md shadow-sm text-xs font-medium text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark focus:outline-none"
            >
              Limpiar
            </button>
            <button
              onClick={aplicarFiltros}
              className="flex-1 sm:flex-initial px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Pedidos */}
      {showPedidoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-24 sm:pt-32 mt-8 sm:mt-16 overflow-y-auto">
          <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto border border-border-light dark:border-border-dark">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg-card-light dark:bg-bg-card-dark py-3 z-10 border-b border-border-light dark:border-border-dark">
                <h2 className="text-lg sm:text-xl font-bold text-text-main-light dark:text-text-main-dark">
                  Seleccionar Pedido Pendiente
                </h2>
                <button 
                  onClick={cerrarFormulario}
                  className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark focus:outline-none text-xl sm:text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <TablaPedidosPendientes
                pedidos={pedidosDisponibles}
                onSeleccionarPedido={seleccionarPedido}
                calcularMontoDisponible={calcularMontoDisponible}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-24 sm:pt-32 mt-8 sm:mt-16 overflow-y-auto">
          <div className="bg-bg-form-light dark:bg-bg-form-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto border border-border-light dark:border-border-dark">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg-form-light dark:bg-bg-form-dark py-3 z-10">
                <h2 className="text-lg sm:text-xl font-bold text-text-main-light dark:text-text-main-dark">
                  Nueva Distribución
                </h2>
                <button
                  onClick={cerrarFormulario}
                  className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark focus:outline-none text-xl sm:text-2xl"
                >
                  &times;
                </button>
              </div>
              <FormDistribucion 
                handleClose={cerrarFormulario}
                distribucionActual={currentDistribucion}
                pedidoId={selectedPedidoId}
                onSubmitSuccess={handleFormSuccess}
                montoDisponibleInicial={pedidoInfo?.montoDisponible}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Distribuciones */}
      <TablaRegistroDistribuciones
        distribuciones={distribuciones}
        pedidos={pedidos}
        empresas={empresas}
        isLoading={isLoading}
        onEliminarDistribucion={eliminarDistribucion}
      />
    </div>
  );
};

export default RegistroDistribuciones; 