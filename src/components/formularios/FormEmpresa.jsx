import React from 'react';

const FormEmpresa = ({ nuevaEmpresa, setNuevaEmpresa, onSubmit, modoEdicion, cancelarEdicion }) => {
  const cancelar = () => {
    setNuevaEmpresa({ 
      nombre: '', 
      ruc: '', 
      direccion: '',
      telefono: '',
      email: '',
      notas: '',
      activo: true,
      id: null 
    });
    cancelarEdicion();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark flex items-center">
        <span className="mr-2">🏢</span> {modoEdicion ? 'Editar Empresa' : 'Nueva Empresa'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Nombre <span className="text-error">*</span>
        </label>
        <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Nombre de la empresa"
          value={nuevaEmpresa.nombre}
          onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, nombre: e.target.value })}
          required
        />
      </div>

      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            RUC <span className="text-error">*</span>
        </label>
        <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="RUC de la empresa"
          value={nuevaEmpresa.ruc}
          onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, ruc: e.target.value })}
          maxLength={11}
          required
        />
      </div>

      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
          Teléfono
        </label>
        <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Teléfono de contacto"
          value={nuevaEmpresa.telefono || ''}
          onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, telefono: e.target.value })}
        />
      </div>

      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
          Email
        </label>
        <input
          type="email"
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Correo electrónico"
          value={nuevaEmpresa.email || ''}
          onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, email: e.target.value })}
        />
      </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Dirección
          </label>
          <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Dirección de la empresa"
            value={nuevaEmpresa.direccion || ''}
            onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, direccion: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
          Notas
        </label>
        <textarea
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Información adicional"
            rows="2"
          value={nuevaEmpresa.notas || ''}
          onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, notas: e.target.value })}
        ></textarea>
      </div>

        <div className="md:col-span-2 flex items-center">
        <input
          type="checkbox"
          id="activo"
            className="w-4 h-4 text-primary border-border-light dark:border-border-dark rounded focus:ring-primary"
          checked={nuevaEmpresa.activo === undefined ? true : nuevaEmpresa.activo}
          onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, activo: e.target.checked })}
        />
          <label htmlFor="activo" className="ml-2 text-sm text-text-main-light dark:text-text-main-dark">
          Activo
        </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button 
          className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors duration-200"
          onClick={onSubmit}
        >
          {modoEdicion ? 'Actualizar Empresa' : 'Registrar Empresa'}
        </button>
        {modoEdicion && (
          <button 
            className="flex-1 bg-bg-row-light dark:bg-bg-row-dark text-text-main-light dark:text-text-main-dark px-4 py-2 rounded-md hover:bg-bg-row-hover-light dark:hover:bg-bg-row-hover-dark transition-colors duration-200"
            onClick={cancelar}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default FormEmpresa;
