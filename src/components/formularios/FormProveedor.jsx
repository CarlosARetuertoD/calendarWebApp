import React from 'react';

const FormProveedor = ({ nuevoProveedor, setNuevoProveedor, vendedores, onSubmit, modoEdicion, cancelarEdicion }) => {
  const cancelar = () => {
    setNuevoProveedor({
      nombre: '',
      vendedor: '',
      identificador: '',
      color: '#1976d2',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      plazo_credito_default: 60,
      activo: true,
      notas: '',
      id: null
    });
    cancelarEdicion();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark flex items-center">
        <span className="mr-2">🔧</span> {modoEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Nombre <span className="text-error">*</span>
          </label>
          <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Nombre del proveedor"
            value={nuevoProveedor.nombre}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            RUC
          </label>
          <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="RUC"
            value={nuevoProveedor.ruc || ''}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, ruc: e.target.value })}
            maxLength={11}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Identificador
          </label>
          <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Código corto (ej: PION, RED)"
            value={nuevoProveedor.identificador || ''}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, identificador: e.target.value.toUpperCase() })}
            maxLength={10}
          />
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Este código se usará para generar los números de pedido automáticamente.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Vendedor
          </label>
          <select
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100"
            value={nuevoProveedor.vendedor}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, vendedor: e.target.value })}
          >
            <option value="">— Selecciona Vendedor —</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Color de representación
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              className="w-12 h-8 p-0 rounded-md bg-transparent border border-border-light dark:border-border-dark"
              value={nuevoProveedor.color}
              onChange={e => setNuevoProveedor({ ...nuevoProveedor, color: e.target.value })}
            />
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {nuevoProveedor.color}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Plazo de crédito (días)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="60"
            value={nuevoProveedor.plazo_credito_default || 60}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, plazo_credito_default: parseInt(e.target.value) })}
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Teléfono
          </label>
          <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Teléfono de contacto"
            value={nuevoProveedor.telefono || ''}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
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
            value={nuevoProveedor.email || ''}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, email: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
            Dirección
          </label>
          <input
            className="w-full px-3 py-2 bg-bg-form-light dark:bg-bg-form-dark border border-border-light dark:border-border-dark rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Dirección"
            value={nuevoProveedor.direccion || ''}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, direccion: e.target.value })}
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
            value={nuevoProveedor.notas || ''}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, notas: e.target.value })}
          ></textarea>
        </div>

        <div className="md:col-span-2 flex items-center">
          <input
            type="checkbox"
            id="activo"
            className="w-4 h-4 text-primary border-border-light dark:border-border-dark rounded focus:ring-primary"
            checked={nuevoProveedor.activo === undefined ? true : nuevoProveedor.activo}
            onChange={e => setNuevoProveedor({ ...nuevoProveedor, activo: e.target.checked })}
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
          {modoEdicion ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
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

export default FormProveedor;
