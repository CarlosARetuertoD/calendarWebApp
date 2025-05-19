import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import format from 'date-fns/format';

const FormPedido = ({ handleClose, pedidoActual = null, onSubmitSuccess }) => {
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    proveedor: '',
    monto_total_pedido: '',
    descripcion: '',
    estado: 'pendiente',
    fecha_pedido: format(new Date(), 'yyyy-MM-dd'),
    plazo_dias: '90',
    es_contado: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Cargar proveedores
    const fetchProveedores = async () => {
      try {
        const response = await axios.get('/api/proveedores/');
        setProveedores(response.data);
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
        toast.error("No se pudieron cargar los proveedores");
      }
    };

    fetchProveedores();

    // Si hay un pedido actual, cargar sus datos
    if (pedidoActual) {
      // Determinar el ID del proveedor correctamente
      let proveedorId = '';
      
      if (pedidoActual && pedidoActual.proveedor) {
        if (typeof pedidoActual.proveedor === 'object') {
          proveedorId = pedidoActual.proveedor.id;
        } else {
          proveedorId = pedidoActual.proveedor;
        }
      }
      
      setFormData({
        proveedor: proveedorId,
        monto_total_pedido: pedidoActual.monto_total_pedido || '',
        descripcion: pedidoActual.descripcion || '',
        fecha_pedido: pedidoActual.fecha_pedido || format(new Date(), 'yyyy-MM-dd'),
        plazo_dias: pedidoActual.plazo_dias || '90',
        es_contado: pedidoActual.es_contado || false,
        estado: pedidoActual.estado || 'pendiente',
        numero_pedido: pedidoActual.numero_pedido || '',
        completado: pedidoActual.completado || false
      });
    }
  }, [pedidoActual]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para checkbox, usar el valor de checked
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
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
    
    if (!formData.proveedor) newErrors.proveedor = "El proveedor es obligatorio";
    if (!formData.monto_total_pedido) newErrors.monto_total_pedido = "El monto total es obligatorio";
    if (formData.monto_total_pedido && isNaN(formData.monto_total_pedido)) newErrors.monto_total_pedido = "El monto debe ser un número";
    if (!formData.fecha_pedido) newErrors.fecha_pedido = "La fecha del pedido es obligatoria";
    
    // Solo validar plazo_dias si no es al contado
    if (!formData.es_contado) {
      if (!formData.plazo_dias) newErrors.plazo_dias = "El plazo en días es obligatorio";
      if (formData.plazo_dias && isNaN(formData.plazo_dias)) newErrors.plazo_dias = "El plazo debe ser un número";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Asegurarnos de que los datos tienen el formato correcto
      const submitData = {
        ...formData,
        monto_total_pedido: parseFloat(formData.monto_total_pedido),
        plazo_dias: formData.es_contado ? 0 : parseInt(formData.plazo_dias), // Si es al contado, plazo_dias es 0
        proveedor: formData.proveedor // Asegurarnos de que se incluye el ID del proveedor
      };
      
      let response;
      
      if (pedidoActual) {
        // Conservar todos los campos del pedido original que no se están editando
        const pedidoActualizado = {
          ...pedidoActual,
          ...submitData,
          // Asegurarnos de que el ID se mantiene
          id: pedidoActual.id
        };
        
        // Si el proveedor es un objeto, reemplazarlo con su ID
        if (typeof pedidoActualizado.proveedor === 'object' && pedidoActualizado.proveedor !== null) {
          pedidoActualizado.proveedor = pedidoActualizado.proveedor.id || submitData.proveedor;
        }
        
        // Eliminar propiedades que no deben enviarse al servidor o que son de solo lectura
        delete pedidoActualizado.proveedor_nombre;
        delete pedidoActualizado.created_at;
        delete pedidoActualizado.updated_at;
        delete pedidoActualizado.distribuciones_finales;
        delete pedidoActualizado.guias_remision;
        delete pedidoActualizado.letras;
        
        // Actualizar pedido existente
        response = await axios.put(`/api/pedidos/${pedidoActual.id}/`, pedidoActualizado);
        toast.success("Pedido actualizado correctamente");
      } else {
        // Crear nuevo pedido
        response = await axios.post('/api/pedidos/', submitData);
        toast.success("Pedido creado correctamente");
      }
      
      if (onSubmitSuccess) onSubmitSuccess(response.data);
      handleClose();
    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      
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
        toast.error("Error al guardar el pedido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-bg-form-light dark:bg-bg-form-dark p-5 rounded-lg">
      <div className="mb-3 pb-2 border-b border-border-light dark:border-border-dark">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Complete los campos marcados con <span className="text-error">*</span>
        </p>
      </div>
      
      {/* Primera fila - Proveedor */}
      <div>
        <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
          Proveedor <span className="text-error">*</span>
        </label>
        <select
          name="proveedor"
          className={`block w-full border ${errors.proveedor ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
          value={formData.proveedor}
          onChange={handleChange}
        >
          <option value="">Seleccionar proveedor</option>
          {proveedores.map(proveedor => (
            <option key={proveedor.id} value={String(proveedor.id)}>
              {proveedor.nombre}
            </option>
          ))}
        </select>
        {errors.proveedor && <p className="mt-1 text-sm text-error">{errors.proveedor}</p>}
      </div>

      {/* Segunda fila - Monto y Fecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Monto Total (S/) <span className="text-error">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">
              S/
            </span>
            <input
              type="number"
              name="monto_total_pedido"
              step="0.01"
              min="0"
              className={`block w-full border ${errors.monto_total_pedido ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 pl-8 pr-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              value={formData.monto_total_pedido}
              onChange={handleChange}
            />
          </div>
          {errors.monto_total_pedido && <p className="mt-1 text-sm text-error">{errors.monto_total_pedido}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Fecha de Pedido <span className="text-error">*</span>
          </label>
          <input
            type="date"
            name="fecha_pedido"
            className={`block w-full border ${errors.fecha_pedido ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            value={formData.fecha_pedido}
            onChange={handleChange}
          />
          {errors.fecha_pedido && <p className="mt-1 text-sm text-error">{errors.fecha_pedido}</p>}
        </div>
      </div>

      {/* Tercera fila - Tipo de Pedido y Número o Plazo*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Tipo de Pedido
          </label>
          <div className="mt-1">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="es_contado"
                id="es_contado"
                checked={formData.es_contado}
                onChange={handleChange}
                className="sr-only"
              />
              <span className={`relative inline-block w-10 h-5 rounded-full transition-colors ${formData.es_contado ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${formData.es_contado ? 'transform translate-x-5' : ''}`}></span>
              </span>
              <span className="ml-2 text-sm text-text-main-light dark:text-text-main-dark">
                {formData.es_contado ? 'Al contado' : 'A crédito'}
              </span>
            </label>
            <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formData.es_contado 
                ? "Se completará automáticamente al asignar distribuciones."
                : "Requiere especificar plazo en días."}
            </p>
          </div>
        </div>
        
        {pedidoActual ? (
          <div>
            <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
              Número de Pedido
            </label>
            <input
              type="text"
              name="numero_pedido"
              className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none sm:text-sm"
              value={formData.numero_pedido || '(Se generará automáticamente)'}
              readOnly
            />
            <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Generado automáticamente
            </p>
          </div>
        ) : (
          !formData.es_contado && (
            <div>
              <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                Plazo (días) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="plazo_dias"
                min="1"
                className={`block w-full border ${errors.plazo_dias ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                value={formData.plazo_dias}
                onChange={handleChange}
              />
              {errors.plazo_dias && <p className="mt-1 text-sm text-error">{errors.plazo_dias}</p>}
            </div>
          )
        )}
        
        {/* Si está editando y no es al contado, mostrar el campo de plazo */}
        {pedidoActual && !formData.es_contado && (
          <div>
            <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
              Plazo (días) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="plazo_dias"
              min="1"
              className={`block w-full border ${errors.plazo_dias ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              value={formData.plazo_dias}
              onChange={handleChange}
            />
            {errors.plazo_dias && <p className="mt-1 text-sm text-error">{errors.plazo_dias}</p>}
          </div>
        )}
      </div>

      {/* Campo para cambiar el estado - Solo visible al editar */}
      {pedidoActual && (
        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Estado
          </label>
          <select
            name="estado"
            className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            value={formData.estado}
            onChange={handleChange}
          >
            <option value="pendiente">Pendiente</option>
            <option value="asignado">Asignado</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Cambiar el estado manualmente. Utilice con precaución.
          </p>
        </div>
      )}

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
          Descripción
        </label>
        <textarea
          name="descripcion"
          rows="3"
          placeholder="Detalles del pedido (opcional)"
          className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          value={formData.descripcion}
          onChange={handleChange}
        ></textarea>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-border-light dark:border-border-dark">
        <button
          type="button"
          className="px-4 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm text-sm font-medium text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : pedidoActual ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default FormPedido; 