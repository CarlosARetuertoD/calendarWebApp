import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FormEmpresa from '../formularios/FormEmpresa';
import FormVendedor from '../formularios/FormVendedor';
import FormProveedor from '../formularios/FormProveedor';

const RegistroEntidad = () => {
  const [empresas, setEmpresas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [nuevaEmpresa, setNuevaEmpresa] = useState({ nombre: '', ruc: '', id: null });
  const [nuevoVendedor, setNuevoVendedor] = useState({ nombre: '', telefono: '', contacto_opcional: '', id: null });
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', vendedor: '', color: '#1976d2', id: null });

  const [formActivo, setFormActivo] = useState('empresa');
  const [modoEdicion, setModoEdicion] = useState(false);

  const [mensaje, setMensaje] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState('success');

  useEffect(() => {
    // Cargar empresas
    axios.get('/api/empresas/')
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Error al cargar empresas:", err);
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });

    // Cargar vendedores
    axios.get('/api/vendedores/')
      .then(res => setVendedores(res.data))
      .catch(err => {
        console.error("Error al cargar vendedores:", err);
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });

    // Cargar proveedores
    axios.get('/api/proveedores/')
      .then(res => setProveedores(res.data))
      .catch(err => {
        console.error("Error al cargar proveedores:", err);
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });
  }, []);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(null), 4000);
  };

  const validarEmpresa = () => {
    if (!nuevaEmpresa.nombre.trim()) return mostrarMensaje("El nombre de la empresa es obligatorio", 'error');
    if (!nuevaEmpresa.ruc.trim()) return mostrarMensaje("El RUC es obligatorio", 'error');
    if (!/^[0-9]{11}$/.test(nuevaEmpresa.ruc)) return mostrarMensaje("El RUC debe tener 11 dígitos numéricos", 'error');
    return true;
  };

  const validarVendedor = () => {
    if (!nuevoVendedor.nombre.trim()) return mostrarMensaje("El nombre del vendedor es obligatorio", 'error');
    if (!nuevoVendedor.telefono.trim()) return mostrarMensaje("El teléfono es obligatorio", 'error');
    return true;
  };

  const validarProveedor = () => {
    if (!nuevoProveedor.nombre.trim()) return mostrarMensaje("El nombre del proveedor es obligatorio", 'error');
    if (!/^#[0-9A-Fa-f]{6}$/.test(nuevoProveedor.color)) return mostrarMensaje("Color inválido. Usa código HEX", 'error');
    return true;
  };

  const registrarEmpresa = () => {
    if (!validarEmpresa()) return;
    const { id, ...data } = nuevaEmpresa;
    const url = id ? `/api/empresas/${id}/` : '/api/empresas/';
    const method = id ? axios.put : axios.post;

    method(url, data)
      .then(() => {
        axios.get('/api/empresas/').then(res => setEmpresas(res.data));
        setNuevaEmpresa({ nombre: '', ruc: '', id: null });
        setModoEdicion(false);
        mostrarMensaje("Empresa registrada correctamente");
      })
      .catch((err) => {
        mostrarMensaje("Error al registrar empresa", 'error');
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });
  };

  const registrarVendedor = () => {
    if (!validarVendedor()) return;
    const { id, ...data } = nuevoVendedor;
    const url = id ? `/api/vendedores/${id}/` : '/api/vendedores/';
    const method = id ? axios.put : axios.post;

    method(url, data)
      .then(() => {
        axios.get('/api/vendedores/').then(res => setVendedores(res.data));
        setNuevoVendedor({ nombre: '', telefono: '', contacto_opcional: '', id: null });
        setModoEdicion(false);
        mostrarMensaje("Vendedor registrado correctamente");
      })
      .catch((err) => {
        mostrarMensaje("Error al registrar vendedor", 'error');
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });
  };

  const registrarProveedor = () => {
    if (!validarProveedor()) return;
    const { id, ...data } = nuevoProveedor;
    const url = id ? `/api/proveedores/${id}/` : '/api/proveedores/';
    const method = id ? axios.put : axios.post;

    method(url, data)
      .then(() => {
        axios.get('/api/proveedores/').then(res => setProveedores(res.data));
        setNuevoProveedor({ nombre: '', vendedor: '', color: '#1976d2', id: null });
        setModoEdicion(false);
        mostrarMensaje("Proveedor registrado correctamente");
      })
      .catch((err) => {
        mostrarMensaje("Error al registrar proveedor", 'error');
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });
  };

  const editarEmpresa = (empresa) => {
    setNuevaEmpresa(empresa);
    setFormActivo('empresa');
    setModoEdicion(true);
  };

  const editarVendedor = (vendedor) => {
    setNuevoVendedor(vendedor);
    setFormActivo('vendedor');
    setModoEdicion(true);
  };

  const editarProveedor = (proveedor) => {
    setNuevoProveedor(proveedor);
    setFormActivo('proveedor');
    setModoEdicion(true);
  };

  const eliminarEmpresa = (id) => {
    if (window.confirm("¿Eliminar esta empresa?")) {
      axios.delete(`/api/empresas/${id}/`)
        .then(() => setEmpresas(empresas.filter(e => e.id !== id)))
        .catch((err) => {
          mostrarMensaje("Error al eliminar empresa", 'error');
          if (err.response && err.response.status === 401) {
            window.location.href = '/';
          }
        });
    }
  };

  const eliminarVendedor = (id) => {
    if (window.confirm("¿Eliminar este vendedor?")) {
      axios.delete(`/api/vendedores/${id}/`)
        .then(() => setVendedores(vendedores.filter(v => v.id !== id)))
        .catch((err) => {
          mostrarMensaje("Error al eliminar vendedor", 'error');
          if (err.response && err.response.status === 401) {
            window.location.href = '/';
          }
        });
    }
  };

  const eliminarProveedor = (id) => {
    if (window.confirm("¿Eliminar este proveedor?")) {
      axios.delete(`/api/proveedores/${id}/`)
        .then(() => setProveedores(proveedores.filter(p => p.id !== id)))
        .catch((err) => {
          mostrarMensaje("Error al eliminar proveedor", 'error');
          if (err.response && err.response.status === 401) {
            window.location.href = '/';
          }
        });
    }
  };

  const renderListado = () => {
    if (formActivo === 'empresa') {
      return (
        <div>
          <h3 className="font-semibold mb-3 text-text-main-light dark:text-text-main-dark flex items-center">
            <span className="mr-2">🏢</span> Empresas Registradas
          </h3>
          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {empresas.map(e => (
              <div key={e.id} className="bg-white dark:bg-[#2d2c33] rounded-lg border border-border-light dark:border-border-dark hover:border-primary/50 transition-all duration-200 shadow-sm">
                <div className="p-3 sm:p-4">
                  {/* Header con nombre y estado */}
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100">
                        {e.nombre}
                      </span>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${e.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                        <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">RUC:</span>
                        <span className="text-gray-700 dark:text-gray-300">{e.ruc}</span>
                      </div>
                      {e.direccion && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Dirección:</span>
                          <span className="text-gray-700 dark:text-gray-300">{e.direccion}</span>
                        </div>
                      )}
                      {e.telefono && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Teléfono:</span>
                          <span className="text-gray-700 dark:text-gray-300">{e.telefono}</span>
                        </div>
                      )}
                      {e.email_contacto && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Email:</span>
                          <span className="text-gray-700 dark:text-gray-300">{e.email_contacto}</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
                      <button 
                        onClick={() => editarEmpresa(e)} 
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-primary hover:bg-primary/10 rounded-md transition-colors duration-200"
                        title="Editar empresa"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => eliminarEmpresa(e.id)} 
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-error hover:bg-error/10 rounded-md transition-colors duration-200"
                        title="Eliminar empresa"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (formActivo === 'vendedor') {
      return (
        <div>
          <h3 className="font-semibold mb-3 text-text-main-light dark:text-text-main-dark flex items-center">
            <span className="mr-2">👤</span> Vendedores Registrados
          </h3>
          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {vendedores.map(v => (
              <div key={v.id} className="bg-white dark:bg-[#2d2c33] rounded-lg border border-border-light dark:border-border-dark hover:border-primary/50 transition-all duration-200 shadow-sm">
                <div className="p-3 sm:p-4">
                  {/* Header con nombre y estado */}
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100">
                        {v.nombre}
                      </span>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${v.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                        <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Contacto:</span>
                        <span className="text-gray-700 dark:text-gray-300">{v.telefono}</span>
                      </div>
                      {v.contacto_opcional && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Contacto Opc:</span>
                          <span className="text-gray-700 dark:text-gray-300">{v.contacto_opcional}</span>
                        </div>
                      )}
                      {v.email && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Email:</span>
                          <span className="text-gray-700 dark:text-gray-300">{v.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
                      <button 
                        onClick={() => editarVendedor(v)} 
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-primary hover:bg-primary/10 rounded-md transition-colors duration-200"
                        title="Editar vendedor"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => eliminarVendedor(v.id)} 
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-error hover:bg-error/10 rounded-md transition-colors duration-200"
                        title="Eliminar vendedor"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (formActivo === 'proveedor') {
      return (
        <div>
          <h3 className="font-semibold mb-3 text-text-main-light dark:text-text-main-dark flex items-center">
            <span className="mr-2">🔧</span> Proveedores Registrados
          </h3>
          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {proveedores.map(p => (
              <div key={p.id} className="bg-white dark:bg-[#2d2c33] rounded-lg border border-border-light dark:border-border-dark hover:border-primary/50 transition-all duration-200 shadow-sm">
                <div className="p-3 sm:p-4">
                  {/* Header con nombre, identificador y color */}
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100">
                        {p.nombre}
                      </span>
                      <div className="flex items-center gap-1">
                        {p.identificador && (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                            {p.identificador}
                          </span>
                        )}
                        <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                      </div>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${p.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">RUC:</span>
                          <span className="text-gray-700 dark:text-gray-300">{p.ruc || 'No especificado'}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Vendedor:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {vendedores.find(v => v.id === p.vendedor)?.nombre || 'Sin asignar'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {p.telefono && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Teléfono:</span>
                            <span className="text-gray-700 dark:text-gray-300">{p.telefono}</span>
                          </div>
                        )}
                        {p.email && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Email:</span>
                            <span className="text-gray-700 dark:text-gray-300">{p.email}</span>
                          </div>
                        )}
                      </div>
                      {p.direccion && (
                        <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] sm:min-w-[80px]">Dirección:</span>
                          <span className="text-gray-700 dark:text-gray-300">{p.direccion}</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
                      <button 
                        onClick={() => editarProveedor(p)} 
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-primary hover:bg-primary/10 rounded-md transition-colors duration-200"
                        title="Editar proveedor"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => eliminarProveedor(p.id)} 
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-error hover:bg-error/10 rounded-md transition-colors duration-200"
                        title="Eliminar proveedor"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 px-1 sm:px-2 md:px-4 lg:px-8 pt-2 pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
          Registro de Entidades
        </h1>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-main-light dark:bg-bg-main-dark">
        <div className="bg-main-light dark:bg-table-dark flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-4 ">
          <button
            onClick={() => setFormActivo('proveedor')}
            className={`px-4 sm:px-6 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              formActivo === 'proveedor'
                ? 'bg-primary text-white'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark'
            }`}
          >
            Proveedores
          </button>
          <button
            onClick={() => setFormActivo('empresa')}
            className={`px-4 sm:px-6 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              formActivo === 'empresa'
                ? 'bg-primary text-white'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark'
            }`}
          >
            Empresas
          </button>
          <button
            onClick={() => setFormActivo('vendedor')}
            className={`px-4 sm:px-6 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              formActivo === 'vendedor'
                ? 'bg-primary text-white'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-bg-row-light dark:hover:bg-bg-row-dark'
            }`}
          >
            Vendedores
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-4 lg:p-6">
          {/* Formulario */}
          <div className="bg-white dark:bg-[#2d2c33] rounded-lg p-2 sm:p-4 border border-border-light dark:border-border-dark shadow-sm">
            {formActivo === 'empresa' && (
              <FormEmpresa
                nuevaEmpresa={nuevaEmpresa}
                setNuevaEmpresa={setNuevaEmpresa}
                onSubmit={registrarEmpresa}
                modoEdicion={modoEdicion}
                cancelarEdicion={() => setModoEdicion(false)}
              />
            )}
            {formActivo === 'vendedor' && (
              <FormVendedor
                nuevoVendedor={nuevoVendedor}
                setNuevoVendedor={setNuevoVendedor}
                onSubmit={registrarVendedor}
                modoEdicion={modoEdicion}
                cancelarEdicion={() => setModoEdicion(false)}
              />
            )}
            {formActivo === 'proveedor' && (
              <FormProveedor
                nuevoProveedor={nuevoProveedor}
                setNuevoProveedor={setNuevoProveedor}
                onSubmit={registrarProveedor}
                modoEdicion={modoEdicion}
                cancelarEdicion={() => setModoEdicion(false)}
                vendedores={vendedores}
              />
            )}
          </div>

          {/* Listado */}
          <div className="bg-white dark:bg-[#2d2c33] rounded-lg p-2 sm:p-4 border border-border-light dark:border-border-dark shadow-sm">
            {formActivo === 'empresa' && renderListado()}
            {formActivo === 'vendedor' && renderListado()}
            {formActivo === 'proveedor' && renderListado()}
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          tipoMensaje === 'success' 
            ? 'bg-success text-white' 
            : 'bg-error text-white'
        }`}>
          {mensaje}
        </div>
      )}
    </div>
  );
};

export default RegistroEntidad;
