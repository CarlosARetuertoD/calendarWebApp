import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormDocumentos = ({ distribucion, onCancel, onSubmitSuccess }) => {
  const [guias, setGuias] = useState([]);
  const [nuevaGuia, setNuevaGuia] = useState({
    numero: '',
    fecha: '',
    facturas: []
  });
  const [nuevaFactura, setNuevaFactura] = useState({
    numero: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    monto: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingGuiaIndex, setEditingGuiaIndex] = useState(null);
  const [montoTotal, setMontoTotal] = useState(0);
  const [montoRestante, setMontoRestante] = useState(0);

  useEffect(() => {
    // Cargar guías existentes si las hay
    if (distribucion && distribucion.guias) {
      setGuias(distribucion.guias);
      
      // Calcular monto total de facturas existentes
      const montoEnFacturas = distribucion.guias.reduce((total, guia) => {
        return total + guia.facturas.reduce((subTotal, factura) => subTotal + parseFloat(factura.monto || 0), 0);
      }, 0);
      
      setMontoTotal(montoEnFacturas);
      setMontoRestante(parseFloat(distribucion.monto_final || 0) - montoEnFacturas);
    } else {
      setMontoRestante(parseFloat(distribucion.monto_final || 0));
    }
  }, [distribucion]);

  const validarGuia = () => {
    const errors = {};
    
    if (!nuevaGuia.numero.trim()) {
      errors.numero = 'El número de guía es requerido';
    }
    
    if (!nuevaGuia.fecha) {
      errors.fecha = 'La fecha de la guía es requerida';
    }
    
    if (nuevaGuia.facturas.length === 0) {
      errors.facturas = 'Debe agregar al menos una factura';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validarFactura = () => {
    const errors = {};
    
    if (!nuevaFactura.numero.trim()) {
      errors.numero = 'El número de factura es requerido';
    }
    
    if (!nuevaFactura.fecha_emision) {
      errors.fecha_emision = 'La fecha de emisión es requerida';
    }
    
    if (!nuevaFactura.fecha_vencimiento) {
      errors.fecha_vencimiento = 'La fecha de vencimiento es requerida';
    }
    
    if (!nuevaFactura.monto || isNaN(parseFloat(nuevaFactura.monto)) || parseFloat(nuevaFactura.monto) <= 0) {
      errors.monto = 'El monto debe ser un número positivo';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const agregarFactura = () => {
    if (!validarFactura()) return;
    
    const montoFactura = parseFloat(nuevaFactura.monto);
    
    // Verificar si excede el monto restante
    if (montoFactura > montoRestante && editingGuiaIndex === null) {
      setErrors({
        ...errors,
        monto: `El monto excede el disponible (S/ ${montoRestante.toFixed(2)})`
      });
      return;
    }
    
    const facturaToAdd = {
      ...nuevaFactura,
      monto: montoFactura
    };
    
    setNuevaGuia(prev => ({
      ...prev,
      facturas: [...prev.facturas, facturaToAdd]
    }));
    
    setNuevaFactura({
      numero: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      monto: ''
    });
    
    setErrors({});
  };

  const editarFactura = (index) => {
    const factura = nuevaGuia.facturas[index];
    setNuevaFactura(factura);
    
    // Eliminar la factura de la lista
    setNuevaGuia(prev => ({
      ...prev,
      facturas: prev.facturas.filter((_, i) => i !== index)
    }));
  };

  const eliminarFactura = (index) => {
    setNuevaGuia(prev => ({
      ...prev,
      facturas: prev.facturas.filter((_, i) => i !== index)
    }));
  };

  const agregarGuia = () => {
    if (!validarGuia()) return;
    
    // Calcular el monto total de la guía
    const montoGuia = nuevaGuia.facturas.reduce((sum, factura) => sum + factura.monto, 0);
    
    if (editingGuiaIndex !== null) {
      // Actualizar guía existente
      setGuias(prev => {
        const newGuias = [...prev];
        newGuias[editingGuiaIndex] = {
          ...nuevaGuia,
          monto_total: montoGuia
        };
        return newGuias;
      });
      setEditingGuiaIndex(null);
    } else {
      // Agregar nueva guía
      setGuias(prev => [
        ...prev,
        {
          ...nuevaGuia,
          monto_total: montoGuia
        }
      ]);
    }
    
    // Recalcular montos
    const nuevoMontoTotal = guias.reduce((total, guia) => 
      total + guia.facturas.reduce((sum, factura) => sum + factura.monto, 0), 0) + montoGuia;
    
    setMontoTotal(nuevoMontoTotal);
    setMontoRestante(parseFloat(distribucion.monto_final || 0) - nuevoMontoTotal);
    
    // Limpiar formulario
    setNuevaGuia({
      numero: '',
      fecha: '',
      facturas: []
    });
  };

  const editarGuia = (index) => {
    setEditingGuiaIndex(index);
    setNuevaGuia(guias[index]);
  };

  const eliminarGuia = (index) => {
    // Calcular monto de la guía a eliminar
    const montoGuia = guias[index].facturas.reduce((sum, factura) => sum + factura.monto, 0);
    
    setGuias(prev => prev.filter((_, i) => i !== index));
    
    // Recalcular montos
    setMontoTotal(prev => prev - montoGuia);
    setMontoRestante(prev => prev + montoGuia);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('guia.')) {
      const field = name.split('.')[1];
      setNuevaGuia(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setNuevaFactura(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (guias.length === 0) {
      setErrors({ general: 'Debe agregar al menos una guía con facturas' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const montoTotalFacturas = guias.reduce((total, guia) => 
        total + guia.facturas.reduce((sum, factura) => sum + factura.monto, 0), 0);
      
      // Preparar datos para enviar al backend
      const submitData = {
        distribucion_id: distribucion.id,
        guias: guias.map(guia => ({
          numero: guia.numero,
          fecha: guia.fecha,
          facturas: guia.facturas.map(factura => ({
            numero: factura.numero,
            fecha_emision: factura.fecha_emision,
            fecha_vencimiento: factura.fecha_vencimiento,
            monto: factura.monto
          }))
        })),
        monto_total: montoTotalFacturas
      };
      
      // Enviar al backend
      await axios.post('/api/documentos/', submitData);
      
      toast.success('Documentos registrados correctamente');
      if (onSubmitSuccess) onSubmitSuccess();
      
    } catch (error) {
      console.error('Error al guardar documentos:', error);
      
      if (error.response && error.response.data) {
        const backendErrors = error.response.data;
        setErrors(backendErrors);
      } else {
        toast.error('Error al guardar documentos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonto = (monto) => {
    return parseFloat(monto || 0).toLocaleString('es-PE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="bg-bg-card-light dark:bg-bg-card-dark p-4 rounded-lg shadow">
      <div className="border-b border-border-light dark:border-border-dark pb-4 mb-4">
        <h2 className="text-lg font-medium text-text-main-light dark:text-text-main-dark mb-2">
          Registrar Documentos
        </h2>
        
        {/* Información de la distribución */}
        <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-md">
          <h3 className="text-sm font-medium text-primary dark:text-primary/90">
            Distribución: {distribucion.pedido_numero} - {distribucion.proveedor_nombre}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="text-sm text-text-main-light dark:text-text-main-dark">
              <span className="font-medium">Empresa:</span> {distribucion.empresa_nombre}
            </div>
            <div className="text-sm text-text-main-light dark:text-text-main-dark">
              <span className="font-medium">Monto Total:</span> S/ {formatMonto(distribucion.monto_final)}
            </div>
            <div className="text-sm text-text-main-light dark:text-text-main-dark">
              <span className="font-medium">Monto Restante:</span> S/ {formatMonto(montoRestante)}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario para nueva guía */}
      <div className="border-b border-border-light dark:border-border-dark pb-4 mb-4">
        <h3 className="text-md font-medium text-text-main-light dark:text-text-main-dark mb-3">
          {editingGuiaIndex !== null ? 'Editar Guía' : 'Nueva Guía'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Guía <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="guia.numero"
              value={nuevaGuia.numero}
              onChange={handleChange}
              className={`block w-full border ${errors.numero ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            />
            {errors.numero && <p className="mt-1 text-sm text-red-500">{errors.numero}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="guia.fecha"
              value={nuevaGuia.fecha}
              onChange={handleChange}
              className={`block w-full border ${errors.fecha ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-2 px-3 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
            />
            {errors.fecha && <p className="mt-1 text-sm text-red-500">{errors.fecha}</p>}
          </div>
        </div>
        
        {/* Formulario para facturas */}
        <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Facturas asociadas a esta guía
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="numero"
                value={nuevaFactura.numero}
                onChange={handleChange}
                className={`block w-full border ${errors.numero ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-1.5 px-2 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fecha Emisión <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha_emision"
                value={nuevaFactura.fecha_emision}
                onChange={handleChange}
                className={`block w-full border ${errors.fecha_emision ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-1.5 px-2 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fecha Vencimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha_vencimiento"
                value={nuevaFactura.fecha_vencimiento}
                onChange={handleChange}
                className={`block w-full border ${errors.fecha_vencimiento ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-1.5 px-2 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Monto <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="monto"
                value={nuevaFactura.monto}
                onChange={handleChange}
                className={`block w-full border ${errors.monto ? 'border-error' : 'border-border-light dark:border-border-dark'} rounded-md shadow-sm py-1.5 px-2 bg-bg-form-light dark:bg-bg-form-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={agregarFactura}
                className="w-full inline-flex justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Agregar Factura
              </button>
            </div>
          </div>
          
          {/* Lista de facturas agregadas */}
          {nuevaGuia.facturas.length > 0 && (
            <div className="border rounded-md overflow-hidden mb-3">
              <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Número</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">F. Emisión</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">F. Vencimiento</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Monto</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                  {nuevaGuia.facturas.map((factura, index) => (
                    <tr key={index} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">{factura.numero}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">{factura.fecha_emision}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">{factura.fecha_vencimiento}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">S/ {formatMonto(factura.monto)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => editarFactura(index)}
                          className="text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary mr-3"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarFactura(index)}
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
          )}
          
          {errors.facturas && (
            <p className="text-sm text-red-500 mb-2">{errors.facturas}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={agregarGuia}
            className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {editingGuiaIndex !== null ? 'Actualizar Guía' : 'Agregar Guía'}
          </button>
        </div>
      </div>

      {/* Lista de guías agregadas */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Guías Registradas
        </h3>
        
        {guias.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
              <thead className="bg-bg-row-light dark:bg-bg-row-dark">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Facturas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Monto Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-bg-card-light dark:bg-bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                {guias.map((guia, index) => (
                  <tr key={index} className="hover:bg-bg-row-light dark:hover:bg-bg-row-dark">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">{guia.numero}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">{guia.fecha}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {guia.facturas.map((factura, i) => (
                        <div key={i} className="mb-1">
                          {factura.numero} - S/ {formatMonto(factura.monto)}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      S/ {formatMonto(guia.facturas.reduce((sum, factura) => sum + factura.monto, 0))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => editarGuia(index)}
                        className="text-primary hover:text-primary/90 dark:text-primary/90 dark:hover:text-primary mr-3"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarGuia(index)}
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
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay guías registradas.</p>
        )}
      </div>

      {/* Resumen y botones de acción */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Total en documentos:</span> S/ {formatMonto(montoTotal)}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Monto restante:</span> S/ {formatMonto(montoRestante)}
          </p>
          {errors.general && (
            <p className="text-sm text-red-500 mt-2">{errors.general}</p>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center px-4 py-2 border border-border-light dark:border-border-dark text-sm font-medium rounded-md shadow-sm text-text-main-light dark:text-text-main-dark bg-bg-form-light dark:bg-bg-form-dark hover:bg-bg-form-light/90 dark:hover:bg-bg-form-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-success hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : 'Guardar Documentos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormDocumentos; 