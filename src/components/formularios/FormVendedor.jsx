import React from 'react';

const FormVendedor = ({ nuevoVendedor, setNuevoVendedor, onSubmit, modoEdicion, cancelarEdicion }) => {
  const cancelar = () => {
    setNuevoVendedor({ nombre: '', telefono: '', contacto_opcional: '', email: '', notas: '', activo: true, id: null });
    cancelarEdicion();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark flex items-center">
        <span className="mr-2">👤</span> {modoEdicion ? 'Editar Vendedor' : 'Nuevo Vendedor'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Nombre <span className="text-error">*</span>
        </label>
        <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Nombre del vendedor"
          value={nuevoVendedor.nombre}
          onChange={e => setNuevoVendedor({ ...nuevoVendedor, nombre: e.target.value })}
          required
        />
      </div>

      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Teléfono <span className="text-error">*</span>
        </label>
        <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Teléfono de contacto"
          value={nuevoVendedor.telefono}
          onChange={e => setNuevoVendedor({ ...nuevoVendedor, telefono: e.target.value })}
          required
        />
      </div>

      <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
          Contacto opcional
        </label>
        <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Contacto adicional"
          value={nuevoVendedor.contacto_opcional}
          onChange={e => setNuevoVendedor({ ...nuevoVendedor, contacto_opcional: e.target.value })}
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
          value={nuevoVendedor.email || ''}
          onChange={e => setNuevoVendedor({ ...nuevoVendedor, email: e.target.value })}
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
          value={nuevoVendedor.notas || ''}
          onChange={e => setNuevoVendedor({ ...nuevoVendedor, notas: e.target.value })}
        ></textarea>
      </div>

        <div className="md:col-span-2 flex items-center">
        <input
          type="checkbox"
          id="activo"
            className="w-4 h-4 text-primary border-border-light dark:border-border-dark rounded focus:ring-primary"
          checked={nuevoVendedor.activo === undefined ? true : nuevoVendedor.activo}
          onChange={e => setNuevoVendedor({ ...nuevoVendedor, activo: e.target.checked })}
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
          {modoEdicion ? 'Actualizar Vendedor' : 'Registrar Vendedor'}
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

export default FormVendedor;
