import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "components/navigation/Navbar";
import Layout from "hocs/layouts/Layout";
import UserManagement from "components/administracion/UserManagement";
import { isAuthenticated, hasRole } from "../../utils/auth";
import { toast } from "react-toastify";

function Administracion() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const navigate = useNavigate();

  useEffect(() => {
    // Solo permitir acceso si el usuario está autenticado
    if (!authenticated) {
      toast.error('Debe iniciar sesión para acceder a esta página', {
        onClose: () => navigate('/')
      });
      return;
    }

    // Verificar si el usuario tiene permisos de administrador
    if (!hasRole('admin') && !hasRole('superadmin')) {
      toast.error('No tiene permisos para acceder al panel de administración', {
        onClose: () => navigate('/calendar')
      });
      return;
    }

    // Comprobar autenticación cuando la ventana obtiene el foco
    const handleFocus = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      if (!isAuth) {
        toast.warning('Su sesión ha terminado', {
          onClose: () => navigate('/')
        });
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate, authenticated]);

  // Si no está autenticado, no renderizar nada (la redirección ocurrirá en el useEffect)
  if (!authenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="sticky top-0 z-50 bg-bg-main-light dark:bg-bg-main-dark">
        <Navbar />
      </div>
      <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
        <div className="max-w-7xl mx-auto">
          <div className="p-0 md:p-3">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Panel de Administración</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Gestión de usuarios del sistema</p>
          </div>

          {/* Contenido */}
          <div>
            <UserManagement />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Administracion; 