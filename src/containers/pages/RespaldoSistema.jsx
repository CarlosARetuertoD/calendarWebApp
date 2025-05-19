import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "components/navigation/Navbar";
import Layout from "hocs/layouts/Layout";
import SystemBackups from "components/administracion/SystemBackups";
import { isAuthenticated, hasRole } from "../../utils/auth";
import { toast } from "react-toastify";

function RespaldoSistema() {
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
      toast.error('No tiene permisos para acceder a los respaldos del sistema', {
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
      <Navbar />
      <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
        <div className="max-w-7xl mx-auto">
          <div className="p-1 md:p-6 bg-gray-100 dark:bg-[#232227]">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Respaldo del Sistema</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Gestión de copias de seguridad de la base de datos</p>
            </div>

            {/* Contenido */}
            <div>
              <SystemBackups />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default RespaldoSistema; 