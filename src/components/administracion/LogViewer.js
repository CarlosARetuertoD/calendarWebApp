import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Estados para filtrado y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [showFilterHelp, setShowFilterHelp] = useState(false);
  const logsPerPage = 15;
  
  // Lista de acciones comunes para filtrar
  const commonActions = [
    { value: '', label: 'Todas las acciones' },
    { value: 'login', label: 'Inicios de sesión' },
    { value: 'logout', label: 'Cierres de sesión' },
    { value: 'create', label: 'Creaciones' },
    { value: 'update', label: 'Actualizaciones' },
    { value: 'delete', label: 'Eliminaciones' },
    { value: 'view', label: 'Visualizaciones' },
    { value: 'permission_change', label: 'Cambios de permisos' }
  ];
  
  // Cargar registros de actividad
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/logs/', {
          params: {
            limit: 100 // Limitar la cantidad de registros para mejor rendimiento
          }
        });
        
        // Verificar si la respuesta es un array
        if (Array.isArray(response.data)) {
          setLogs(response.data);
        } else if (typeof response.data === 'object' && Array.isArray(response.data.results)) {
          // Si la respuesta está dentro de un objeto con la propiedad 'results'
          setLogs(response.data.results);
        } else {
          // Si no es un formato reconocido, inicializar como array vacío
          console.warn('Formato de respuesta no reconocido:', response.data);
          setLogs([]);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error al cargar registros de actividad:', error);
        setError('No se pudieron cargar los registros de actividad');
        if (retryCount < 3) {
          // Intentar de nuevo después de 2 segundos
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          toast.error('Error al cargar los registros de actividad: ' + (error.response?.data?.detail || error.message));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [retryCount]);
  
  // Formatear fecha y hora
  const formatDateTime = (dateTimeStr) => {
    try {
      if (!dateTimeStr) return 'Fecha no disponible';
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
      return 'Formato de fecha inválido';
    }
  };
  
  // Renderizado seguro de valores
  const safeRender = (value, defaultValue = 'N/A') => {
    return value !== undefined && value !== null ? value : defaultValue;
  };
  
  // Obtener el nombre de la acción para mostrar
  const getActionDisplay = (log) => {
    if (!log || !log.action_type) return 'Desconocido';
    
    switch(log.action_type) {
      case 'view': return 'Visualización';
      case 'create': return 'Creación';
      case 'update': return 'Actualización';
      case 'delete': return 'Eliminación';
      case 'login': return 'Inicio de sesión';
      case 'logout': return 'Cierre de sesión';
      case 'permission_change': return 'Cambio de permisos';
      case 'error': return 'Error';
      case 'other': return 'Otra acción';
      default: return log.action_type;
    }
  };
  
  // Obtener el color de la etiqueta según el tipo de acción
  const getActionColor = (actionType) => {
    if (!actionType) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    switch(actionType) {
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'update':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'login':
      case 'logout':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'permission_change':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Filtrar logs por término de búsqueda y filtros adicionales
  const filteredLogs = logs.filter(log => {
    // Verificar si log o sus propiedades son undefined
    if (!log) return false;
    
    const searchStr = searchTerm.toLowerCase();
    const usernameField = log.username || log.user || log.usuario || "";
    const actionTypeField = log.action_type || log.accion || "";
    const entityTypeField = log.entity_type || log.entidad || "";
    const descriptionField = log.description || log.detalles || "";
    const timestampField = log.timestamp || log.fecha_hora || "";
    
    const userMatch = userFilter 
      ? usernameField.toLowerCase().includes(userFilter.toLowerCase())
      : true;
    
    const actionMatch = actionFilter 
      ? actionTypeField.toLowerCase().includes(actionFilter.toLowerCase())
      : true;
    
    const dateMatch = dateFilter 
      ? (timestampField ? new Date(timestampField).toISOString().split('T')[0] === dateFilter : false)
      : true;
    
    return (
      userMatch && actionMatch && dateMatch &&
      (
        usernameField.toLowerCase().includes(searchStr) ||
        actionTypeField.toLowerCase().includes(searchStr) ||
        entityTypeField.toLowerCase().includes(searchStr) ||
        descriptionField.toLowerCase().includes(searchStr)
      )
    );
  });
  
  // Ordenar logs por fecha (más recientes primero)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.fecha_hora || 0);
    const dateB = new Date(b.timestamp || b.fecha_hora || 0);
    return dateB - dateA;
  });
  
  // Paginación
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  
  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Manejar actualización de filtros
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1); // Reset a la primera página al cambiar filtros
  };
  
  // Recargar los logs
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
  };
  
  return (
    <div className="container mx-auto px-2 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Registro de Actividad</h2>
          
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
            El sistema registra automáticamente todas las acciones importantes realizadas por los usuarios.
          </p>
          <button
            onClick={() => setShowFilterHelp(!showFilterHelp)}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center sm:ml-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showFilterHelp ? 'Ocultar ayuda' : 'Mostrar ayuda'}
          </button>
        </div>
        
        {showFilterHelp && (
          <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-3 rounded-md mb-4 text-sm">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Tipos de acciones registradas:</h3>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
              <li><span className="font-medium">login/logout</span>: Accesos y salidas del sistema</li>
              <li><span className="font-medium">create</span>: Creación de registros (usuarios, letras, empresas, etc.)</li>
              <li><span className="font-medium">update</span>: Modificaciones de datos existentes</li>
              <li><span className="font-medium">delete</span>: Eliminación de registros</li>
              <li><span className="font-medium">permission_change</span>: Cambios en permisos de usuario</li>
              <li><span className="font-medium">view</span>: Visualización de datos importantes</li>
              <li><span className="font-medium">error</span>: Errores en operaciones críticas</li>
            </ul>
            <p className="mt-2 text-blue-800 dark:text-blue-300">
              Nota: Los filtros funcionan en tiempo real sobre los datos ya cargados. Para ver los cambios más recientes, use el botón "Actualizar".
            </p>
          </div>
        )}
        
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar en todos los campos
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Buscar..."
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usuario
            </label>
            <input
              type="text"
              id="userFilter"
              placeholder="Filtrar por usuario..."
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={userFilter}
              onChange={(e) => handleFilterChange(setUserFilter, e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="actionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de acción
            </label>
            <select
              id="actionFilter"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={actionFilter}
              onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
            >
              {commonActions.map(action => (
                <option key={action.value} value={action.value}>{action.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="dateFilter"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Tabla de logs - versión responsiva */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Resumen de resultados */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {currentLogs.length} de {filteredLogs.length} registros {logs.length > filteredLogs.length ? `(filtrados de ${logs.length} total)` : ''}
          </span>
          
          {loading && (
            <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Actualizando datos
            </span>
          )}
        </div>
        
        {/* Versión móvil: tarjetas */}
        <div className="md:hidden">
          {error ? (
            <div className="p-4 text-center">
              <div className="text-red-500 mb-2">{error}</div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron registros con los filtros aplicados
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentLogs.map((log, index) => (
                <div key={log.id || index} className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                      {getActionDisplay(log)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(log.timestamp || log.fecha_hora)}
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {safeRender(log.username || log.user || log.usuario)}
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {safeRender(log.entity_type || log.entidad)} {log.entity_id ? `#${log.entity_id}` : ''}
                  </div>
                  
                  <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {safeRender(log.description || log.detalles)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Versión escritorio: tabla */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Fecha y Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Acción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Entidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {error ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="text-red-500 mb-2">{error}</div>
                      <button
                        onClick={handleRefresh}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        Intentar de nuevo
                      </button>
                    </td>
                  </tr>
                ) : currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron registros con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(log.timestamp || log.fecha_hora)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {safeRender(log.username || log.user || log.usuario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                          {getActionDisplay(log)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {safeRender(log.entity_type || log.entidad)} {log.entity_id ? `#${log.entity_id}` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-md truncate">
                        {safeRender(log.description || log.detalles)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 overflow-x-auto">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Botón Anterior */}
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                currentPage === 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800`}
            >
              <span className="sr-only">Anterior</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Paginación móvil: solo página actual y total */}
            <div className="sm:hidden relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </div>
            
            {/* Paginación escritorio: números de página */}
            <div className="hidden sm:flex">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === index + 1
                      ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-200'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } border-gray-300 dark:border-gray-600`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Botón Siguiente */}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                currentPage === totalPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800`}
            >
              <span className="sr-only">Siguiente</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default LogViewer; 