import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormDistribucion = ({ handleClose, distribucionActual = null, pedidoId = null, onSubmitSuccess, montoDisponibleInicial = null }) => {
  const [empresas, setEmpresas] = useState([]);
  const [pedidoInfo, setPedidoInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    empresa: '',
    monto_final: ''
  });
  const [errors, setErrors] = useState({});
  const [distribucionesParciales, setDistribucionesParciales] = useState([]);
  const [empresasDisponibles, setEmpresasDisponibles] = useState([]);

  useEffect(() => {
    // Cargar empresas
    const fetchEmpresas = async () => {
      try {
        const response = await axios.get('/api/empresas/');
        setEmpresas(response.data);
        setEmpresasDisponibles(response.data);
      } catch (error) {
        console.error("Error al cargar empresas:", error);
        toast.error("No se pudieron cargar las empresas");
      }
    };

    // Cargar información del pedido si tenemos un pedidoId
    const fetchPedidoInfo = async () => {
      if (pedidoId) {
        try {
          const response = await axios.get(`/api/pedidos/${pedidoId}/`);
          setPedidoInfo(response.data);
        } catch (error) {
          console.error("Error al cargar información del pedido:", error);
          toast.error("No se pudo cargar la información del pedido");
        }
      }
    };

    fetchEmpresas();
    fetchPedidoInfo();

    // Si hay una distribución actual, cargar sus datos
    if (distribucionActual) {
      setFormData({
        empresa: distribucionActual.empresa?.id || '',
        monto_final: distribucionActual.monto_final || ''
      });

      // Si la distribución tiene un pedido, cargar su información
      if (distribucionActual.pedido) {
        fetchPedidoInfo();
      }
    }
  }, [distribucionActual, pedidoId]);

  // Sugerir monto disponible como valor predeterminado
  useEffect(() => {
    if (montoDisponibleInicial !== null && !distribucionActual && !formData.monto_final) {
      setFormData(prev => ({
        ...prev,
        monto_final: montoDisponibleInicial.toString()
      }));
    }
  }, [montoDisponibleInicial, distribucionActual]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Limpiar error al cambiar el valor
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.empresa) newErrors.empresa = "La empresa es obligatoria";
    if (!formData.monto_final) newErrors.monto_final = "El monto de distribución es obligatorio";
    if (formData.monto_final && isNaN(formData.monto_final)) newErrors.monto_final = "El monto debe ser un número";
    
    // Verificar que el monto no exceda el disponible en el pedido
    if (formData.monto_final && pedidoInfo) {
      const montoTotalDistribuido = distribucionesParciales.reduce((sum, dist) => sum + parseFloat(dist.monto_final), 0);
      const montoDisponible = parseFloat(pedidoInfo.monto_total_pedido) - montoTotalDistribuido;
      
      if (parseFloat(formData.monto_final) > montoDisponible) {
        newErrors.monto_final = `El monto excede el disponible (S/ ${montoDisponible.toFixed(2)})`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const seleccionarEmpresa = (empresa) => {
    setFormData(prev => ({
      ...prev,
      empresa: empresa.id.toString()
    }));
  };

  const agregarDistribucionParcial = () => {
    if (!validateForm()) return;

    const empresaSeleccionada = empresas.find(e => e.id === parseInt(formData.empresa));
    const nuevaDistribucion = {
      empresa: empresaSeleccionada,
      monto_final: parseFloat(formData.monto_final)
    };

    setDistribucionesParciales([...distribucionesParciales, nuevaDistribucion]);
    
    // Actualizar empresas disponibles
    setEmpresasDisponibles(empresasDisponibles.filter(e => e.id !== empresaSeleccionada.id));
    
    // Limpiar el formulario
    setFormData({
      empresa: '',
      monto_final: ''
    });
    setErrors({});
  };

  const eliminarDistribucionParcial = (index) => {
    const distribucionAEliminar = distribucionesParciales[index];
    setDistribucionesParciales(distribucionesParciales.filter((_, i) => i !== index));
    
    // Devolver la empresa a las disponibles
    setEmpresasDisponibles([...empresasDisponibles, distribucionAEliminar.empresa]);
  };

  const calcularMontoDistribuido = (pedido) => {
    // Sumar el monto de las distribuciones existentes del pedido
    const montoDistribucionesExistentes = pedido.distribuciones_finales?.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
      0
    ) || 0;

    // Sumar el monto de las distribuciones parciales
    const montoDistribucionesParciales = distribucionesParciales.reduce(
      (sum, dist) => sum + parseFloat(dist.monto_final || 0),
      0
    );

    return montoDistribucionesExistentes + montoDistribucionesParciales;
  };

  const calcularMontoDisponible = (pedido) => {
    const montoDistribuido = calcularMontoDistribuido(pedido);
    return parseFloat(pedido.monto_total_pedido) - montoDistribuido;
  };

  const montoDisponible = pedidoInfo ? calcularMontoDisponible(pedidoInfo) : 0;

  const completarDistribucion = async () => {
    if (distribucionesParciales.length === 0) {
      toast.error("Debe agregar al menos una distribución");
      return;
    }

    setIsLoading(true);
    
    try {
      // Crear todas las distribuciones
      const distribucionesCreadas = await Promise.all(
        distribucionesParciales.map(dist => 
          axios.post('/api/distribuciones/', {
            pedido: pedidoId,
            empresa: dist.empresa.id,
            monto_final: dist.monto_final,
            completado: false // Siempre pendiente por defecto
          })
        )
      );

      // Calcular el monto total distribuido
      const montoTotalDistribuido = distribucionesParciales.reduce(
        (sum, dist) => sum + parseFloat(dist.monto_final), 
        0
      );

      // Actualizar el estado del pedido a asignado y el monto final
      await axios.patch(`/api/pedidos/${pedidoId}/`, {
        estado: 'asignado',
        monto_final_pedido: montoTotalDistribuido
      });

      toast.success("Distribuciones creadas y pedido marcado como asignado");
      handleClose();
      if (onSubmitSuccess) onSubmitSuccess(distribucionesCreadas.map(r => r.data));
    } catch (error) {
      console.error("Error al completar la distribución:", error);
      toast.error("Error al completar la distribución");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para asignar un color fijo basado en el índice
  const getEmpresaColor = (index) => {
    const colors = [
      'bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30 dark:border-yellow-500/40 text-yellow-700 dark:text-yellow-300',
      'bg-green-500/10 dark:bg-green-500/20 border-green-500/30 dark:border-green-500/40 text-green-700 dark:text-green-300',
      'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30 dark:border-purple-500/40 text-purple-700 dark:text-purple-300',
      'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30 dark:border-orange-500/40 text-orange-700 dark:text-orange-300',
      'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/30 dark:border-teal-500/40 text-teal-700 dark:text-teal-300',
    ];
    return colors[index % 5];
  };

  return (
    <div className="space-y-6">
      {pedidoInfo && (
        <div className="p-4 bg-bg-form-light dark:bg-bg-form-dark rounded-md mb-4 border border-border-light dark:border-border-dark">
          <h3 className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
            Pedido: {pedidoInfo.proveedor?.nombre || pedidoInfo.proveedor_nombre || 'Sin proveedor'} - S/ {parseFloat(pedidoInfo.monto_total_pedido).toFixed(2)} - {pedidoInfo.es_contado ? 'Contado' : 'Crédito'}
          </h3>
          <div className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span className="font-medium">Monto distribuido:</span> S/ {calcularMontoDistribuido(pedidoInfo).toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span className="font-medium">Monto disponible:</span> S/ {montoDisponible.toFixed(2)}
          </div>
        </div>
      )}

      {/* Tabla de distribuciones parciales */}
      {distribucionesParciales.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-text-main-light dark:text-text-main-dark mb-4">Distribuciones Parciales</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
              <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                {distribucionesParciales.map((dist, index) => (
                  <tr key={index} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main-light dark:text-text-main-dark">
                      {dist.empresa.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      S/ {parseFloat(dist.monto_final).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => eliminarDistribucionParcial(index)}
                        className="text-error hover:text-error/90 dark:text-error/90 dark:hover:text-error"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {empresasDisponibles.length > 0 && montoDisponible > 0 ? (
        <div className="space-y-4">
          {/* Grid de empresas disponibles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {empresasDisponibles.map((empresa, index) => {
              const empresaColor = getEmpresaColor(index);
              return (
                <div
                  key={empresa.id}
                  onClick={() => seleccionarEmpresa(empresa)}
                  className={`group relative p-2 rounded-md border cursor-pointer transition-all duration-200 ${
                    formData.empresa === empresa.id.toString()
                      ? 'scale-105 shadow-lg ring-2 ring-primary/50'
                      : 'hover:scale-105 hover:shadow-md'
                  } ${empresaColor}`}
                >
                  <div className="flex flex-col">
                    <h4 className={`font-medium text-sm ${
                      formData.empresa === empresa.id.toString() 
                        ? 'text-primary dark:text-primary/90' 
                        : ''
                    }`}>
                      {empresa.nombre}
                    </h4>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs font-medium opacity-75">RUC:</span>
                      <span className="ml-1 text-xs">
                        {empresa.ruc}
                      </span>
                    </div>
                  </div>
                  <div className={`absolute inset-0 rounded-md transition-opacity duration-200 ${
                    formData.empresa === empresa.id.toString()
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'opacity-0 group-hover:opacity-100 bg-white/5 dark:bg-white/10'
                  }`} />
                </div>
              );
            })}
          </div>

          {formData.empresa && (
            <div className="mt-2 p-2 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20">
              <p className="text-sm text-text-main-light dark:text-text-main-dark">
                Empresa seleccionada: <span className="font-medium">{empresas.find(e => e.id.toString() === formData.empresa)?.nombre}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Monto de Distribución (S/) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="monto_final"
              step="0.01"
              min="0"
              max={montoDisponible}
              className={`block w-full border ${errors.monto_final ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              value={formData.monto_final}
              onChange={handleChange}
            />
            {errors.monto_final && <p className="mt-1 text-sm text-error">{errors.monto_final}</p>}
          </div>

          <button
            type="button"
            onClick={agregarDistribucionParcial}
            disabled={!formData.empresa || !formData.monto_final}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar Distribución
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {montoDisponible <= 0 
              ? 'No hay monto disponible para distribuir'
              : 'No hay empresas disponibles para distribuir'}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-border-light dark:border-border-dark">
        <button
          type="button"
          className="px-4 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm text-sm font-medium text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-success hover:bg-success-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={completarDistribucion}
          disabled={isLoading || distribucionesParciales.length === 0}
        >
          {isLoading ? 'Procesando...' : 'Completar Distribución'}
        </button>
      </div>
    </div>
  );
};

export default FormDistribucion; 