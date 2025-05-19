import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import store from './store';
import { Provider } from 'react-redux';
import { initAuth } from './utils/auth'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Error404 from 'containers/errors/Error404';
import Login from 'containers/pages/Login'
import Calendar from 'containers/pages/Calendar'
import RegistroLetras from 'containers/pages/RegistroLetras'
import PaginaRegistroPedidos from 'containers/pages/RegistroPedidos'
import PaginaRegistroDistribuciones from 'containers/pages/RegistroDistribuciones'
import RegistroDocumentos from 'containers/pages/RegistroDocumentos'
import Registros from 'containers/pages/Registros'
import Administracion from 'containers/pages/Administracion'
import LogsActividad from 'containers/pages/LogsActividad'
import RespaldoSistema from 'containers/pages/RespaldoSistema'
import Dashboard from 'containers/pages/Dashboard'

// Reportes
import ReporteLetrasEstado from 'containers/pages/reportes/ReporteLetrasEstado'
import ReporteLetrasProveedor from 'containers/pages/reportes/ReporteLetrasProveedor'
import ReporteLetrasPeriodo from 'containers/pages/reportes/ReporteLetrasPeriodo'
import ReportePedidosProveedor from 'containers/pages/reportes/ReportePedidosProveedor'
import ReportePedidosEmpresa from 'containers/pages/reportes/ReportePedidosEmpresa'
import ReporteFacturas from 'containers/pages/reportes/ReporteFacturas'
import ReporteBalance from 'containers/pages/reportes/ReporteBalance'

// Configuración global de Axios para CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Configurar interceptor para añadir CSRF a todas las peticiones
axios.interceptors.request.use(function (config) {
  const csrftoken = getCookie('csrftoken');
  if (csrftoken) {
    config.headers['X-CSRFToken'] = csrftoken;
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

function App() {
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Inicializar la configuración de autenticación al cargar la aplicación
    const initializeAuth = async () => {
      try {
        await initAuth();
        console.log("Autenticación inicializada correctamente");
      } catch (error) {
        console.error("Error al inicializar autenticación:", error);
      } finally {
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Esperar a que se inicialice la autenticación antes de renderizar la aplicación
  if (!authInitialized) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path='*' element={<Error404 />} />
          <Route path='/' element={<Login />} />
          <Route path='/calendar' element={<Calendar />} />
          <Route path='/registro-letras' element={<RegistroLetras />} />
          <Route path='/registro-pedidos' element={<PaginaRegistroPedidos />} />
          <Route path='/registro-distribuciones' element={<PaginaRegistroDistribuciones />} />
          <Route path='/registro-documentos' element={<RegistroDocumentos />} />
          <Route path='/registros' element={<Registros />} />
          <Route path='/administracion' element={<Administracion />} />
          <Route path='/admin/logs' element={<LogsActividad />} />
          <Route path='/admin/backup' element={<RespaldoSistema />} />
          <Route path='/dashboard' element={<Dashboard />} />
          
          {/* Rutas de Reportes */}
          <Route path='/reportes/letras/estado' element={<ReporteLetrasEstado />} />
          <Route path='/reportes/letras/proveedor' element={<ReporteLetrasProveedor />} />
          <Route path='/reportes/letras/periodo' element={<ReporteLetrasPeriodo />} />
          <Route path='/reportes/pedidos/proveedor' element={<ReportePedidosProveedor />} />
          <Route path='/reportes/pedidos/empresa' element={<ReportePedidosEmpresa />} />
          <Route path='/reportes/facturas' element={<ReporteFacturas />} />
          <Route path='/reportes/balance' element={<ReporteBalance />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </Provider>
  );
}

export default App;