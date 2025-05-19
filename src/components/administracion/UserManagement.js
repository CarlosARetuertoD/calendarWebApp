import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { hasRole } from '../../utils/auth';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formMode, setFormMode] = useState('create'); // 'create' o 'edit'
  
  // Estados para filtrado y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Estado para formulario
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    is_active: true,
    perfil: {
      rol: 'lectura',
      telefono: '',
      notas: ''
    }
  });
  
  // Cargar usuarios al iniciar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/usuarios/');
        setUsers(response.data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar la lista de usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRoles = async () => {
      try {
        const response = await axios.get('/api/admin/roles/');
        setRoles(response.data);
      } catch (error) {
        console.error('Error al cargar roles:', error);
      }
    };
    
    fetchUsers();
    fetchRoles();
  }, []);
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Campo anidado (para perfil)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Abrir modal para crear nuevo usuario
  const handleCreateUser = () => {
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      is_active: true,
      perfil: {
        rol: 'lectura',
        telefono: '',
        notas: ''
      }
    });
    setFormMode('create');
    setShowUserModal(true);
  };
  
  // Abrir modal para editar usuario
  const handleEditUser = (user) => {
    setSelectedUser(user);
    
    // Cargar datos completos del usuario
    axios.get(`/api/admin/usuarios/${user.id}/`)
      .then(response => {
        const userData = response.data;
        setFormData({
          username: userData.username,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          password: '',
          confirm_password: '',
          is_active: userData.is_active,
          perfil: {
            rol: userData.perfil?.rol || 'lectura',
            telefono: userData.perfil?.telefono || '',
            notas: userData.perfil?.notas || ''
          }
        });
        setFormMode('edit');
        setShowUserModal(true);
      })
      .catch(error => {
        console.error('Error al cargar datos de usuario:', error);
        toast.error('Error al cargar datos del usuario');
      });
  };
  
  // Abrir modal para ver detalles del usuario
  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    
    // Cargar datos completos del usuario
    axios.get(`/api/admin/usuarios/${user.id}/`)
      .then(response => {
        const userData = response.data;
        setFormData({
          username: userData.username,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          is_active: userData.is_active,
          perfil: {
            rol: userData.perfil?.rol || 'lectura',
            telefono: userData.perfil?.telefono || '',
            notas: userData.perfil?.notas || ''
          }
        });
        setShowUserDetailsModal(true);
      })
      .catch(error => {
        console.error('Error al cargar datos de usuario:', error);
        toast.error('Error al cargar datos del usuario');
      });
  };
  
  // Confirmar eliminación de usuario
  const handleConfirmDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (formData.password !== formData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    // Preparar datos
    const userData = { ...formData };
    delete userData.confirm_password;
    
    try {
      if (formMode === 'create') {
        // Para nuevos usuarios, siempre establecer rol como 'lectura'
        if (userData.perfil) {
          userData.perfil.rol = 'lectura';
        } else {
          userData.perfil = { rol: 'lectura' };
        }
        
        // Crear nuevo usuario
        await axios.post('/api/admin/usuarios/', userData);
        toast.success('Usuario creado exitosamente');
      } else {
        // Actualizar usuario existente
        const updateData = { ...userData };
        
        // Garantizar que el perfil está presente y contiene todos los campos necesarios
        if (!updateData.perfil || Object.keys(updateData.perfil).length === 0) {
          // Si el perfil está vacío, asignar valores predeterminados pero MANTENER el rol existente
          const existingUser = await axios.get(`/api/admin/usuarios/${selectedUser.id}/`);
          updateData.perfil = {
            rol: existingUser.data.perfil?.rol || 'lectura',
            telefono: '',
            notas: ''
          };
        } else {
          // Asegurarse de mantener el rol existente, no permitir cambios desde el frontend
          const existingUser = await axios.get(`/api/admin/usuarios/${selectedUser.id}/`);
          updateData.perfil = {
            ...updateData.perfil,
            rol: existingUser.data.perfil?.rol || 'lectura'
          };
        }
        
        // Si la contraseña está vacía, eliminarla para no enviarla
        if (!updateData.password) {
          delete updateData.password;
        }
        
        console.log('Datos de actualización:', updateData);
        await axios.put(`/api/admin/usuarios/${selectedUser.id}/`, updateData);
        toast.success('Usuario actualizado exitosamente');
      }
      
      // Cerrar modal y recargar lista
      setShowUserModal(false);
      
      // Recargar lista de usuarios
      const response = await axios.get('/api/admin/usuarios/');
      setUsers(response.data);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar la solicitud');
    }
  };
  
  // Eliminar usuario
  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/admin/usuarios/${selectedUser.id}/`);
      toast.success('Usuario eliminado exitosamente');
      
      // Actualizar lista de usuarios
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar el usuario');
    }
  };
  
  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(user => {
    const searchString = searchTerm.toLowerCase();
    return user.username.toLowerCase().includes(searchString) ||
           user.first_name?.toLowerCase().includes(searchString) ||
           user.last_name?.toLowerCase().includes(searchString) ||
           user.email?.toLowerCase().includes(searchString);
  });
  
  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  return (
    <div className="container mx-auto p-4">
      {/* Encabezado y barra de búsqueda */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-0 text-gray-900 dark:text-gray-100">Gestión de Usuarios</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              className="w-full border dark:border-gray-700 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-300 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={handleCreateUser}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Usuario
          </button>
        </div>
      </div>
      
      {/* Tabla de usuarios - versión responsiva */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Versión para móviles: tarjetas en vez de tabla */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-300">
              Cargando usuarios...
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-300">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentUsers.map(user => (
                <div key={user.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {user.first_name && user.last_name 
                      ? <span>{`${user.first_name} ${user.last_name}`}</span>
                      : <span className="italic">Sin nombre</span>
                    }
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {user.email || <span className="italic">Sin email</span>}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.rol === 'Super Administrador' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                        user.rol === 'Administrador' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                    >
                      {user.rol || 'Usuario (Lectura)'}
                    </span>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewUserDetails(user)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Ver detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
                        disabled={user.username === 'admin'} // No permitir eliminar al usuario admin
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${user.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Versión de escritorio: tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nombre Completo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                currentUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.first_name && user.last_name 
                        ? <span className="text-gray-900 dark:text-gray-100">{`${user.first_name} ${user.last_name}`}</span>
                        : <span className="text-gray-400 dark:text-gray-500">No especificado</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email 
                        ? <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
                        : <span className="text-gray-400 dark:text-gray-500">No especificado</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.rol === 'Super Administrador' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                          user.rol === 'Administrador' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                      >
                        {user.rol || 'Usuario (Lectura)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                      >
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewUserDetails(user)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Ver detalles"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(user)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                          disabled={user.username === 'admin'} // No permitir eliminar al usuario admin
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${user.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 overflow-x-auto">
          <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
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
      
      {/* Modal para crear/editar usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          <div className="bg-white dark:bg-[#2A2A30] rounded-lg shadow-xl w-full max-w-xl mx-auto mb-8 max-h-[75vh] flex flex-col border dark:border-gray-700">
            <div className="border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-[#222228] rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {formMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                onClick={() => setShowUserModal(false)}
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de Usuario</label>
                  <input
                    type="text"
                    name="username"
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    readOnly={formMode === 'edit'} // No permitir cambiar username en edición
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                    <input
                      type="text"
                      name="first_name"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.first_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                    <input
                      type="text"
                      name="last_name"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    name="perfil.telefono"
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.perfil.telefono}
                    onChange={handleInputChange}
                  />
                </div>
                
                {formMode === 'create' && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md mb-2 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Nota:</span> Por defecto, todos los usuarios nuevos tienen rol "Usuario (Solo Lectura)". 
                      Para cambiar el rol, contacte a un administrador que use el panel de Django.
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                  <textarea
                    name="perfil.notas"
                    rows="2"
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.perfil.notas}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={formMode === 'create'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña</label>
                    <input
                      type="password"
                      name="confirm_password"
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      required={formMode === 'create'}
                    />
                  </div>
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                    Usuario Activo
                  </label>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#1E1E24] px-6 py-4 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t dark:border-gray-700 rounded-b-lg">
                <button
                  type="button"
                  className="w-full sm:w-auto bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {formMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          <div className="bg-white dark:bg-[#2A2A30] rounded-lg shadow-xl w-full max-w-md mx-auto mb-8 border dark:border-gray-700">
            <div className="px-6 py-5">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">¿Eliminar usuario?</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  ¿Estás seguro de que quieres eliminar al usuario <span className="font-semibold">{selectedUser?.username}</span>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-[#1E1E24] px-6 py-4 flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-3 border-t dark:border-gray-700 rounded-b-lg">
              <button
                type="button"
                className="w-full sm:w-auto bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="w-full sm:w-auto bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleDeleteUser}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para ver detalles del usuario */}
      {showUserDetailsModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          <div className="bg-white dark:bg-[#2A2A30] rounded-lg shadow-xl w-full max-w-xl mx-auto mb-8 max-h-[75vh] flex flex-col border dark:border-gray-700">
            <div className="border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-[#222228] rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Detalles del Usuario
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                onClick={() => setShowUserDetailsModal(false)}
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de Usuario</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                  {formData.username}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                    {formData.first_name || 'No especificado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                    {formData.last_name || 'No especificado'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                  {formData.email || 'No especificado'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                  {formData.perfil?.telefono || 'No especificado'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600 flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mr-2
                    ${formData.perfil?.rol === 'superadmin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                     formData.perfil?.rol === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                  >
                    {formData.perfil?.rol === 'superadmin' ? 'Super Administrador' : 
                     formData.perfil?.rol === 'admin' ? 'Administrador' : 'Usuario (Lectura)'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Para cambiar el rol de un usuario, un administrador debe hacerlo desde el panel de administración de Django.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600 min-h-[4rem] whitespace-pre-wrap">
                  {formData.perfil?.notas || 'No hay notas'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${formData.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                  >
                    {formData.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-[#1E1E24] px-6 py-4 flex flex-col sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-3 border-t dark:border-gray-700 rounded-b-lg">
              <button
                type="button"
                className="w-full sm:w-auto bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setShowUserDetailsModal(false);
                  handleEditUser(selectedUser);
                }}
              >
                Editar Usuario
              </button>
              <button
                type="button"
                className="w-full sm:w-auto bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowUserDetailsModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 