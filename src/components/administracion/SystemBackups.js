import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SystemBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupName, setBackupName] = useState('');
  const [description, setDescription] = useState('');
  const [backupFolder, setBackupFolder] = useState('media/respaldos'); // Carpeta predeterminada ahora es media/respaldos
  const [customFolder, setCustomFolder] = useState(false); // Para controlar si se usa carpeta personalizada
  
  // Lista de carpetas predefinidas
  const predefinedFolders = [
    { id: 'media/respaldos', name: 'Carpeta Media (Predeterminada)' },
    { id: 'backups', name: 'Carpeta backups' },
    { id: 'custom', name: 'Carpeta personalizada' },
    { id: 'system', name: 'Seleccionar carpeta del sistema' }
  ];
  
  // Cargar respaldos
  useEffect(() => {
    const fetchBackups = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/backups/');
        
        // Verificar si la respuesta es un array
        if (Array.isArray(response.data)) {
          setBackups(response.data);
        } else if (typeof response.data === 'object' && Array.isArray(response.data.results)) {
          // Si la respuesta está dentro de un objeto con la propiedad 'results'
          setBackups(response.data.results);
        } else {
          // Si no es un formato reconocido, inicializar como array vacío
          console.warn('Formato de respuesta no reconocido:', response.data);
          setBackups([]);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error al cargar respaldos:', error);
        setError('No se pudieron cargar los respaldos del sistema');
        toast.error('Error al cargar los respaldos: ' + (error.response?.data?.detail || error.message));
        setBackups([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBackups();
  }, []);
  
  // Formatear fecha y hora
  const formatDateTime = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Fecha no válida';
    }
  };
  
  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Desconocido';
    if (bytes === 0) return '0 Bytes';
    
    try {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (e) {
      console.error('Error al formatear tamaño:', e);
      return 'Tamaño no válido';
    }
  };
  
  // Mostrar modal para crear respaldo
  const handleCreateBackupModal = () => {
    setBackupName(`backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`);
    setDescription('Respaldo manual del sistema');
    setShowCreateModal(true);
  };
  
  // Crear nuevo respaldo
  const handleCreateBackup = async (e) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      toast.info('Creando respaldo. Este proceso puede tardar unos segundos...');
      
      // Para carpetas del sistema, debemos usar una API especial que permita al usuario elegir carpeta
      if (backupFolder === 'system') {
        // En desarrollo con Electron podríamos usar dialog.showOpenDialog
        // En web necesitamos un enfoque diferente
        
        // Solicitar al backend que maneje la selección de carpeta
        const response = await axios.post('/api/admin/backups/', {
          nombre: backupName,
          descripcion: description,
          carpeta: 'system_folder', // Indicador especial para el backend
          usar_carpeta_sistema: true // Bandera para indicar que use diálogo del sistema
        });
        
        toast.success('Respaldo creado exitosamente');
        setShowCreateModal(false);
      } else {
        // Flujo normal para carpetas dentro del proyecto
        const response = await axios.post('/api/admin/backups/', {
          nombre: backupName,
          descripcion: description,
          carpeta: customFolder ? backupFolder : backupFolder
        });
        
        toast.success('Respaldo creado exitosamente');
        setShowCreateModal(false);
      }
      
      // Actualizar lista de respaldos
      const respuesta = await axios.get('/api/admin/backups/');
      
      // Verificar si la respuesta es un array
      if (Array.isArray(respuesta.data)) {
        setBackups(respuesta.data);
      } else if (typeof respuesta.data === 'object' && Array.isArray(respuesta.data.results)) {
        setBackups(respuesta.data.results);
      } else {
        console.warn('Formato de respuesta no reconocido:', respuesta.data);
        // Recargar la página como último recurso
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      if (error.response && error.response.status === 403) {
        toast.error('No tiene permisos para crear respaldos. Contacte al administrador.');
      } else {
        toast.error('Error al crear el respaldo: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setCreating(false);
    }
  };
  
  // Descargar respaldo
  const handleDownloadBackup = async (backup) => {
    try {
      toast.info('Preparando descarga...');
      
      const response = await axios.get(`/api/admin/backups/${backup.id}/download/`, {
        responseType: 'blob'
      });
      
      // Verificar si la respuesta es un blob
      if (response.data instanceof Blob) {
        // Crear URL para el blob
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${backup.nombre || 'backup'}.sql`);
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          link.parentNode.removeChild(link);
        }, 100);
        
        toast.success('Descarga iniciada');
      } else {
        throw new Error('La respuesta no es un archivo válido');
      }
    } catch (error) {
      console.error('Error al descargar respaldo:', error);
      toast.error('Error al descargar el respaldo: ' + (error.response?.data?.detail || error.message));
    }
  };
  
  // Restaurar respaldo
  const handleRestoreBackup = async (backup) => {
    if (window.confirm(`¿Estás seguro que deseas restaurar el sistema al respaldo "${backup.nombre}"?\n\nEsta acción sobreescribirá todos los datos actuales y no se puede deshacer.`)) {
      try {
        toast.info('Iniciando restauración del sistema. Este proceso puede tardar varios minutos...');
        
        await axios.post(`/api/admin/backups/${backup.id}/restore/`);
        
        toast.success('Sistema restaurado exitosamente. La página se recargará en unos segundos.');
        
        // Esperar y recargar la página
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        if (error.response && error.response.status === 403) {
          toast.error('No tiene permisos para restaurar el sistema. Contacte al administrador.');
        } else {
          toast.error('Error al restaurar el sistema: ' + (error.response?.data?.detail || error.message));
        }
      }
    }
  };
  
  // Confirmar eliminación
  const handleConfirmDelete = (backup) => {
    setSelectedBackup(backup);
    setShowDeleteConfirm(true);
  };
  
  // Eliminar respaldo
  const handleDeleteBackup = async () => {
    try {
      await axios.delete(`/api/admin/backups/${selectedBackup.id}/`);
      
      toast.success('Respaldo eliminado exitosamente');
      setShowDeleteConfirm(false);
      
      // Actualizar lista
      setBackups(backups.filter(b => b.id !== selectedBackup.id));
    } catch (error) {
      console.error('Error al eliminar respaldo:', error);
      if (error.response && error.response.status === 403) {
        toast.error('No tiene permisos para eliminar respaldos. Contacte al administrador.');
        setShowDeleteConfirm(false);
      } else {
        toast.error('Error al eliminar el respaldo: ' + (error.response?.data?.detail || error.message));
      }
    }
  };
  
  // Manejar cambio de carpeta
  const handleFolderChange = (e) => {
    const value = e.target.value;
    setBackupFolder(value);
    setCustomFolder(value === 'custom');
  };

  // Manejar selección de carpeta del sistema
  const handleSystemFolderSelect = async () => {
    try {
      // Verificar si estamos en un entorno que admite FileSystem Access API
      if ('showDirectoryPicker' in window) {
        toast.info('Seleccione una carpeta para guardar el respaldo');
        
        // Abrir el selector de carpetas nativo
        const directoryHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads'
        });
        
        // Obtener la ruta de la carpeta (solo disponible en algunos navegadores)
        let folderPath = directoryHandle.name;
        
        // Guardar referencia a la carpeta
        setBackupFolder(`system:${folderPath}`);
        toast.success(`Carpeta seleccionada: ${folderPath}`);
      } else {
        // Navegador no compatible con la API
        toast.warning('Su navegador no soporta la selección de carpetas del sistema. Use una carpeta predefinida.');
        setBackupFolder('media/respaldos');
      }
    } catch (error) {
      console.error('Error al seleccionar carpeta:', error);
      toast.error('No se pudo seleccionar la carpeta: ' + error.message);
      setBackupFolder('media/respaldos');
    }
  };
  
  // Renderizar valor seguro para las propiedades
  const safeRender = (value, defaultValue = 'N/A') => {
    return value !== undefined && value !== null ? value : defaultValue;
  };
  
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Respaldos del Sistema</h2>
        
        <button
          onClick={handleCreateBackupModal}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Respaldo
        </button>
      </div>
      
      {/* Tabla de respaldos */}
      <div className="overflow-x-auto bg-white dark:bg-[#2A2A30] rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-[#1E1E24]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tamaño</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Creado por</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-900 dark:text-gray-100">Cargando respaldos...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron respaldos disponibles
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {safeRender(backup.nombre)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {safeRender(backup.descripcion, 'Sin descripción')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {backup.fecha_creacion ? formatDateTime(backup.fecha_creacion) : 'Fecha no disponible'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(backup.tamano)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {safeRender(backup.creado_por, 'Automático')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDownloadBackup(backup)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Descargar respaldo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRestoreBackup(backup)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        title="Restaurar sistema desde este respaldo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(backup)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar respaldo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal para crear respaldo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2A2A30] rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Crear Nuevo Respaldo</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateBackup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  className="border dark:border-gray-600 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Solo letras, números y guiones bajos. Sin espacios ni caracteres especiales.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  className="border dark:border-gray-600 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carpeta de destino</label>
                <select
                  className="border dark:border-gray-600 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={backupFolder}
                  onChange={handleFolderChange}
                >
                  {predefinedFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
              
              {customFolder && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruta personalizada</label>
                  <input
                    type="text"
                    className="border dark:border-gray-600 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={backupFolder === 'custom' ? '' : backupFolder}
                    onChange={(e) => setBackupFolder(e.target.value)}
                    placeholder="Ejemplo: media/respaldos/personal"
                    required={customFolder}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La carpeta debe existir y tener permisos de escritura. No incluir barras al inicio o final.
                  </p>
                </div>
              )}
              
              {backupFolder === 'system' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccionar carpeta del sistema</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleSystemFolderSelect}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Explorar carpetas
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Esta función permite seleccionar una carpeta en su computadora. Solo disponible en navegadores modernos.
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 p-2 rounded-md mt-2">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>Nota:</strong> Los respaldos en carpetas del sistema solo funcionan durante la sesión actual y en este dispositivo.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="text-gray-700 dark:text-gray-300 text-sm mb-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 p-3 rounded-md">
                <p>
                  <strong>Nota:</strong> Crear un respaldo puede tomar varios segundos dependiendo del tamaño de la base de datos.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : 'Crear Respaldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2A2A30] rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Confirmar Eliminación</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                onClick={() => setShowDeleteConfirm(false)}
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              ¿Estás seguro que deseas eliminar el respaldo <strong>{selectedBackup.nombre || 'seleccionado'}</strong>?
            </p>
            
            <div className="text-gray-700 dark:text-gray-300 text-sm mb-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 p-3 rounded-md">
              <p>
                <strong>Advertencia:</strong> Esta acción no se puede deshacer. Una vez eliminado, no podrás recuperar este respaldo.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                onClick={handleDeleteBackup}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemBackups; 