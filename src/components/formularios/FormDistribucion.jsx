import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormDistribucion = ({ handleClose, distribucionActual = null, pedidoId = null, onSubmitSuccess, montoDisponible = null }) => {
  const [empresas, setEmpresas] = useState([]);
  const [pedidoInfo, setPedidoInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    empresa: '',
    monto_final: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Cargar empresas
    const fetchEmpresas = async () => {
      try {
        const response = await axios.get('/api/empresas/');
        setEmpresas(response.data);
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
    if (montoDisponible !== null && !distribucionActual && !formData.monto_final) {
      setFormData(prev => ({
        ...prev,
        monto_final: montoDisponible.toString()
      }));
    }
  }, [montoDisponible, distribucionActual]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
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
    if (formData.monto_final && pedidoInfo && !distribucionActual) {
      const montoAsignado = pedidoInfo.distribuciones_finales?.reduce((sum, dist) => sum + parseFloat(dist.monto_final), 0) || 0;
      const montoDisponible = parseFloat(pedidoInfo.monto_total_pedido) - montoAsignado;
      
      if (parseFloat(formData.monto_final) > montoDisponible) {
        newErrors.monto_final = `El monto excede el disponible (S/ ${montoDisponible.toFixed(2)})`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, saveAndAddAnother = false, completarPedido = false) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        monto_final: parseFloat(formData.monto_final),
        pedido: pedidoId || distribucionActual?.pedido
      };
      
      let response;
      
      if (distribucionActual) {
        // Actualizar distribución existente
        response = await axios.put(`/api/distribuciones/${distribucionActual.id}/`, submitData);
        toast.success("Distribución actualizada correctamente");
      } else {
        // Crear nueva distribución
        response = await axios.post('/api/distribuciones/', submitData);
        toast.success("Distribución creada correctamente");
      }
      
      if (onSubmitSuccess) onSubmitSuccess(response.data, false); // No cerrar el modal después de éxito
      
      // Opcionalmente completar el pedido
      if (completarPedido) {
        const pedidoActualId = pedidoId || distribucionActual?.pedido;
        if (pedidoActualId) {
          try {
            await axios.patch(`/api/pedidos/${pedidoActualId}/`, {
              estado: 'completado',
              completado: true
            });
            toast.success("Pedido marcado como completado");
            handleClose(); // Cerramos el modal solo si se completó el pedido
            return;
          } catch (error) {
            console.error("Error al marcar pedido como completado:", error);
            toast.error("Error al marcar el pedido como completado");
          }
        }
      }
      
      // Si estamos editando o agregando otra, o simplemente guardando y quedándonos en el form
      if (distribucionActual || saveAndAddAnother) {
        // Recargar información del pedido para tener datos actualizados
        try {
          const pedidoActualId = pedidoId || distribucionActual?.pedido;
          if (pedidoActualId) {
            const updatedPedidoResponse = await axios.get(`/api/pedidos/${pedidoActualId}/`);
            setPedidoInfo(updatedPedidoResponse.data);
          }
          // Limpiar el formulario para una nueva distribución
          if (!distribucionActual) {
            setFormData({
              empresa: '',
              monto_final: ''
            });
          }
          setErrors({});
        } catch (error) {
          console.error("Error al recargar información del pedido:", error);
        }
      } else {
        handleClose();
      }
    } catch (error) {
      console.error("Error al guardar la distribución:", error);
      
      if (error.response && error.response.data) {
        // Mostrar errores del backend
        const backendErrors = error.response.data;
        const formattedErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(backendErrors[key]) 
            ? backendErrors[key][0] 
            : backendErrors[key];
        });
        
        setErrors(formattedErrors);
      } else {
        toast.error("Error al guardar la distribución");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular montos del pedido para mostrar información
  const montoAsignado = pedidoInfo?.distribuciones_finales?.reduce(
    (sum, dist) => {
      // No contar la distribución actual si estamos editando
      if (distribucionActual && dist.id === distribucionActual.id) return sum;
      return sum + parseFloat(dist.monto_final);
    },
    0
  ) || 0;
  
  // Usar el montoDisponible de prop si está disponible, de lo contrario calcularlo
  const montoDisponibleCalculado = pedidoInfo 
    ? parseFloat(pedidoInfo.monto_total_pedido) - montoAsignado 
    : 0;
    
  // Valor final: priorizar el prop, luego el cálculo interno
  const montoDisponibleFinal = montoDisponible !== null ? montoDisponible : montoDisponibleCalculado;
  
  // Si estamos editando, sumar el monto actual de la distribución al disponible
  const montoDisponibleTotal = distribucionActual 
    ? montoDisponibleFinal + parseFloat(distribucionActual.monto_final || 0) 
    : montoDisponibleFinal;

  return (
    <form onSubmit={(e) => handleSubmit(e, false, false)} className="space-y-6">
      {pedidoInfo && (
        <div className="p-4 bg-gray-50 dark:bg-[#34333a] rounded-md mb-4">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300">
            Pedido: {pedidoInfo.proveedor?.nombre || pedidoInfo.proveedor_nombre || 'Sin proveedor'} - S/ {parseFloat(pedidoInfo.monto_total_pedido).toFixed(2)} - {pedidoInfo.es_contado ? 'Contado' : 'Crédito'}
          </h3>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Monto asignado:</span> S/ {montoAsignado.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Monto disponible:</span> S/ {montoDisponibleTotal.toFixed(2)}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Empresa <span className="text-red-500">*</span>
          </label>
          <select
            name="empresa"
            className={`block w-full border ${errors.empresa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm`}
            value={formData.empresa}
            onChange={handleChange}
          >
            <option value="">Seleccionar empresa</option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-500">{errors.empresa}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto de Distribución (S/) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="monto_final"
            step="0.01"
            min="0"
            className={`block w-full border ${errors.monto_final ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#38373f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm`}
            value={formData.monto_final}
            onChange={handleChange}
          />
          {errors.monto_final && <p className="mt-1 text-sm text-red-500">{errors.monto_final}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#38373f] hover:bg-gray-50 dark:hover:bg-[#44434a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancelar
        </button>
        {!distribucionActual && pedidoId && (
          <>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar y agregar otra'}
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => handleSubmit(e, false, true)}
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : 'Guardar y Completar Pedido'}
            </button>
          </>
        )}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : distribucionActual ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default FormDistribucion; 