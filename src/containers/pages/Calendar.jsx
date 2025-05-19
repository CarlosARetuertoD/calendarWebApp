import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "components/navigation/Navbar";
import Layout from "hocs/layouts/Layout";
import BigCalendar from "components/calendar/BigCalendar";
import { isAuthenticated } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

function Calendar() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // Estado para la altura del calendario
  const [calendarHeight, setCalendarHeight] = useState(0);

  // Función para calcular la altura disponible
  const calculateHeight = () => {
    if (!containerRef.current) return;
    
    // Espacio total de la ventana - posición del contenedor - margen inferior
    const windowHeight = window.innerHeight;
    const containerTop = containerRef.current.getBoundingClientRect().top;
    const bottomMargin = 20; // margen inferior para evitar scroll
    
    // Establecer alturas mínimas según el tamaño de pantalla
    let minHeight = 400; // valor base para móviles pequeños
    
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      // Para tablets
      minHeight = 550;
    } else if (window.innerWidth >= 1024) {
      // Para desktop
      minHeight = 650;
    }
    
    const availableHeight = windowHeight - containerTop - bottomMargin;
    setCalendarHeight(Math.max(minHeight, availableHeight));
  };

  useEffect(() => {
    // Calcular altura inicial después de que el componente se monte
    calculateHeight();
    
    // Recalcular cuando cambie el tamaño de la ventana
    const handleResize = () => {
      calculateHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Solo cargar datos si el usuario está autenticado
    if (!authenticated) {
      navigate('/');
      return;
    }

    const cargarEventos = async () => {
      try {
        // Usar URL relativa para que funcione con la configuración de axios
        const res = await axios.get("/api/letras/");
        
        const letras = res.data.map((letra, index) => {
          const fecha = new Date(`${letra.fecha_pago}T12:00:00`);
          return {
            title: `${index + 1} - S/ ${letra.monto} (${letra.empresa})`,
            start: fecha,
            end: fecha,
            allDay: true,
            resource: {
              estado: letra.estado,
              empresa: letra.empresa,
              color: letra.color
            }
          };
        });

        setEventos(letras);
        setLoading(false);
        
        // Recalcular altura después de cargar datos
        setTimeout(calculateHeight, 100);
      } catch (error) {
        console.error("❌ Error al cargar letras:", error);
        setError("Error al cargar los datos. Inicia sesión nuevamente o contacta al administrador.");
        setLoading(false);
        
        // Si es error de autenticación, esperar un momento y luego redireccionar al login
        if (error.response && error.response.status === 401) {
          setTimeout(() => navigate('/'), 2000);
        }
      }
    };

    cargarEventos();

    // Comprobar autenticación cuando la ventana obtiene el foco
    const handleFocus = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      if (!isAuth) {
        navigate('/');
      } else {
        // Recalcular altura al volver a la pestaña
        setTimeout(calculateHeight, 100);
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
          {loading ? (
            <p className="text-center py-2 md:py-6">Cargando letras...</p>
          ) : error ? (
            <div className="text-red-600 text-center p-2 md:p-6 bg-red-100 rounded-lg my-1 md:my-4">
              {error}
            </div>
          ) : (
            <BigCalendar eventos={eventos} altura={calendarHeight} />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Calendar;
