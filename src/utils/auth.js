import axios from 'axios';

// Configurar la URL base para todas las peticiones
axios.defaults.baseURL = 'http://localhost:8000';

// Configurar headers por defecto
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Variable para indicar si la redirección por 401 está activada
let enableRedirectOn401 = false;

// Configurar axios para incluir el token en todas las peticiones
export const setupAxiosInterceptors = () => {
  // Remover interceptores existentes para evitar duplicados
  axios.interceptors.request.eject(0);
  axios.interceptors.response.eject(0);
  
  // Configurar nuevo interceptor de solicitud
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    console.log('Configuración de la petición:', config);
    return config;
  }, error => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  });

  // Interceptor para redirigir al login en caso de error 401
  axios.interceptors.response.use(
    response => {
      console.log('Respuesta recibida:', response);
      return response;
    },
    error => {
      console.error('Error en la respuesta:', error);
      if (error.response && error.response.status === 401 && enableRedirectOn401) {
        // Solo redirigir si está habilitado
        console.log("Error 401 detectado, redirigiendo al login");
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/'; // Redirigir a la página de login
      }
      return Promise.reject(error);
    }
  );
};

// Iniciar sesión
export const login = async (username, password) => {
  try {
    const response = await axios.post('/api/auth/login/', { username, password });
    
    // Guardar token y datos de usuario
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data.user));
    
    // Configurar axios con el token
    setupAxiosInterceptors();
    
    // Habilitar redirección al login por 401
    enableRedirectOn401 = true;
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error de login:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Error al iniciar sesión'
    };
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await axios.post('/api/auth/logout/');
    
    // Limpiar datos de autenticación
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Aún así, limpiamos los datos locales
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    return { success: false, error: 'Error al cerrar sesión' };
  }
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

// Obtener información del usuario actual
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Verificar si el usuario tiene un rol específico
export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  
  if (!user || !user.perfil) return false;
  
  const userRole = user.perfil.rol;
  
  if (userRole === 'superadmin') return true;
  if (userRole === 'admin' && requiredRole !== 'superadmin') return true;
  if (userRole === 'lectura' && requiredRole === 'lectura') return true;
  
  return false;
};

// Inicializar la configuración de autenticación
export const initAuth = async () => {
  console.log("Iniciando configuración de autenticación");
  setupAxiosInterceptors();
  
  // Verificar si hay un token almacenado
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.log("No hay token almacenado");
    return false;
  }
  
  console.log("Token encontrado, verificando validez");
  
  try {
    // Verificar si el token es válido
    const response = await axios.get('/api/auth/usuarios/me/');
    localStorage.setItem('userData', JSON.stringify(response.data));
    console.log("Token válido, usuario autenticado");
    
    // Habilitar redirección al login por 401 solo después de verificar que el token es válido
    enableRedirectOn401 = true;
    
    return true;
  } catch (error) {
    console.error("Error al verificar token:", error);
    // Si hay error, limpiar datos de autenticación pero no redirigir
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    return false;
  }
}; 