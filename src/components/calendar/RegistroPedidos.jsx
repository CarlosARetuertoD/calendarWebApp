import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormPedido from '../formularios/FormPedido';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TablaRegistroPedidos from '../tablas/TablaRegistroPedidos';

const RegistroPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  
  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 10; // Valor fijo
  const [totalPedidos, setTotalPedidos] = useState(0);
  
  // Estado para ordenamiento
  const [ordenColumna, setOrdenColumna] = useState('fecha_pedido');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');
  
  // Estados para rangos de filtro
  const [filtros, setFiltros] = useState({
    proveedor: '',
    estado: '',
    fecha: '',
    tipo: ''
  });

  useEffect(() => {
    console.log('Efecto ejecutado con:', { paginaActual, pedidosPorPagina, ordenColumna, ordenDireccion }); // Debug
    cargarDatos();
  }, [paginaActual, ordenColumna, ordenDireccion, filtros]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // Construir parámetros de paginación y ordenamiento
      const params = new URLSearchParams();
      params.append('page', paginaActual);
      params.append('page_size', pedidosPorPagina);
      
      // Aplicación del ordenamiento
      let campoOrden = ordenColumna;
      
      // Para el campo "tipo" usar es_contado en el backend
      if (campoOrden === 'tipo') {
        campoOrden = 'es_contado';
      }
      
      // Aplicar ordenamiento de manera segura verificando campo
      params.append('ordering', ordenDireccion === 'asc' ? campoOrden : `-${campoOrden}`);
      
      // Aplicar filtros activos
      if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.tipo) params.append('es_contado', filtros.tipo === 'contado' ? 'true' : 'false');
      
      console.log('Parámetros de búsqueda:', params.toString()); // Debug

      // Cargar pedidos y proveedores en paralelo
      const [pedidosResponse, proveedoresResponse] = await Promise.all([
        axios.get(`/api/pedidos/?${params.toString()}`),
        axios.get('/api/proveedores/')
      ]);

      console.log('Respuesta del backend:', pedidosResponse.data); // Debug

      // Manejar la respuesta paginada
      if (pedidosResponse.data.results) {
        // Es una respuesta paginada
        setPedidos(pedidosResponse.data.results);
        setTotalPedidos(pedidosResponse.data.count);
        console.log('Total de pedidos:', pedidosResponse.data.count); // Debug
        console.log('Pedidos en esta página:', pedidosResponse.data.results.length); // Debug
      } else {
        // Es un array simple
        setPedidos(pedidosResponse.data);
        setTotalPedidos(pedidosResponse.data.length);
      }
      
      setProveedores(proveedoresResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de pedidos');
      if (error.response && error.response.status === 401) {
        window.location.href = '/';
      }
      // En caso de error, asegurarse que pedidos sea al menos un array vacío
      setPedidos([]);
      setTotalPedidos(0);
    } finally {
      setIsLoading(false);
    }
  };

  const cambiarOrden = (columna) => {
    if (ordenColumna === columna) {
      // Si ya está ordenando por esta columna, cambiar dirección
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna, establecer dirección por defecto
      setOrdenColumna(columna);
      setOrdenDireccion('asc');
    }
    // Volver a la primera página al cambiar orden
    setPaginaActual(1);
  };

  const aplicarFiltros = async () => {
    setPaginaActual(1); // Reiniciar a primera página
    cargarDatos();
  };

  const resetFiltros = () => {
    setFiltros({
      proveedor: '',
      estado: '',
      fecha: '',
      tipo: ''
    });
    setPaginaActual(1);
    cargarDatos();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirFormulario = async (pedido = null) => {
    if (pedido) {
      try {
        // Si es una edición, obtener datos completos del pedido
        const response = await axios.get(`/api/pedidos/${pedido.id}/`);
        setCurrentPedido(response.data);
      } catch (error) {
        console.error('Error al obtener datos del pedido:', error);
        toast.error('Error al cargar datos del pedido');
        setCurrentPedido(pedido); // Usar los datos que tenemos como respaldo
      }
    } else {
      setCurrentPedido(null);
    }
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setCurrentPedido(null);
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await axios.delete(`/api/pedidos/${id}/`);
      // Recargar datos para actualizar la lista
      cargarDatos();
      toast.success('Pedido eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      toast.error('Error al eliminar el pedido. Puede que tenga distribuciones o letras asociadas.');
    }
  };

  const handleFormSuccess = (pedidoNuevo) => {
    cargarDatos(); // Recargar todos los datos para reflejar cambios
    cerrarFormulario();
  };
  
  // Navegación de paginación
  const irAPagina = (numPagina) => {
    console.log('Cambiando a página:', numPagina); // Debug
    if (numPagina > 0 && numPagina <= Math.ceil(totalPedidos / pedidosPorPagina)) {
      setPaginaActual(numPagina);
    }
  };

  const irADistribucion = (pedido) => {
    // Obtener información contextual del pedido
    if (!pedido) {
      toast.error('No se encontró información del pedido seleccionado');
      return;
    }
    
    // Calcular información adicional del pedido para el contexto
    const montoDistribuido = pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;
    
    const montoDisponible = parseFloat(pedido.monto_total_pedido) - montoDistribuido;
    
    // Navegar a la página de distribuciones con el ID del pedido y datos adicionales
    navigate('/distribuciones', { 
      state: { 
        pedidoId: pedido.id,
        pedidoInfo: {
          proveedor: pedido.proveedor_nombre || (pedido.proveedor ? pedido.proveedor.nombre : ''),
          fecha: format(new Date(pedido.fecha_pedido), 'dd/MM/yyyy'),
          montoTotal: parseFloat(pedido.monto_total_pedido),
          montoDisponible: montoDisponible,
          esContado: pedido.es_contado
        }
      } 
    });
  };

  const completarPedido = async (id) => {
    if (!window.confirm('¿Estás seguro de marcar este pedido como asignado? Esta acción registrará la distribución del pedido.')) {
      return;
    }

    try {
      setIsLoading(true);
      // Obtener el pedido actual primero
      const pedidoActual = pedidos.find(p => p.id === id);
      if (!pedidoActual) return;

      // Calcular el monto final basado en las distribuciones
      const montoDistribuido = pedidoActual.distribuciones_finales?.reduce(
        (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
        0
      ) || 0;

      // Actualizar el pedido con los nuevos valores
      const response = await axios.put(`/api/pedidos/${id}/`, {
        ...pedidoActual,
        estado: 'asignado',
        monto_final_pedido: montoDistribuido
      });

      // Recargar datos para mostrar el cambio
      cargarDatos();
      toast.success('Pedido marcado como asignado correctamente');
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 bg-bg-main-light dark:bg-bg-main-dark">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-4 md:mb-0">
          Registro de Pedidos
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <button
            onClick={() => abrirFormulario()}
            className="w-full md:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            + Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Filtros - Versión compacta */}
      <div className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow p-3 mb-4 sm:mb-6 border border-border-light dark:border-border-dark">
        <div className="flex flex-wrap gap-2">
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="proveedor"
              value={filtros.proveedor}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por proveedor"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="asignado">Asignado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <select
              name="tipo"
              value={filtros.tipo}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos los tipos</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex-1 min-w-[120px]">
            <input
              type="date"
              name="fecha"
              value={filtros.fecha}
              onChange={handleFilterChange}
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1.5 px-2 text-sm bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary"
              aria-label="Filtrar por fecha"
            />
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

      {/* Tabla de Pedidos */}
      <TablaRegistroPedidos
        pedidos={pedidos}
        isLoading={isLoading}
        paginaActual={paginaActual}
        totalPedidos={totalPedidos}
        pedidosPorPagina={pedidosPorPagina}
        ordenColumna={ordenColumna}
        ordenDireccion={ordenDireccion}
        onCambiarOrden={cambiarOrden}
        onCambiarPagina={irAPagina}
        onEditarPedido={abrirFormulario}
        onEliminarPedido={eliminarPedido}
        onDistribuirPedido={irADistribucion}
        onCompletarPedido={completarPedido}
      />

      {/* Modal de Formulario - Mejorado para móvil */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-16 sm:pt-24 mt-4 sm:mt-10 overflow-y-auto">
          <div className="bg-bg-form-light dark:bg-bg-form-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto border border-border-light dark:border-border-dark">
            <div className="p-3 sm:p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg-form-light dark:bg-bg-form-dark py-2 z-10">
                <h2 className="text-lg sm:text-xl font-bold text-text-main-light dark:text-text-main-dark">
                  {currentPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
                </h2>
                <button
                  onClick={cerrarFormulario}
                  className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark focus:outline-none text-xl sm:text-2xl"
                >
                  &times;
                </button>
              </div>
              <FormPedido
                handleClose={cerrarFormulario}
                pedidoActual={currentPedido}
                onSubmitSuccess={handleFormSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroPedidos; 