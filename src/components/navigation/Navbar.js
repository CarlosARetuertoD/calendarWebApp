import {connect} from 'react-redux'
import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Typewriter } from 'react-simple-typewriter'
import { isAuthenticated, logout, getCurrentUser, hasRole } from '../../utils/auth'
import ThemeToggle from '../tools/ThemeToggle'
import { SunIcon, MoonIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

function Navbar(){
  const navigate = useNavigate();
  const location = useLocation(); // Para obtener la ruta actual
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Estados para los menús desplegables
  const [openOperaciones, setOpenOperaciones] = useState(false);
  const [openReportes, setOpenReportes] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [openInventario, setOpenInventario] = useState(false);
  
  // Función para verificar si un enlace está activo basado en la ruta actual
  const isLinkActive = (path) => {
    if (path === '/calendar' && location.pathname === '/calendar') {
      return true;
    }
    
    // Para enlaces de menú principal (operaciones, reportes, admin)
    if (path === 'operaciones' && (
      location.pathname.includes('/registro-pedidos') || 
      location.pathname.includes('/registro-distribuciones') || 
      location.pathname.includes('/registro-letras') ||
      location.pathname.includes('/registro-documentos') ||
      location.pathname.includes('/registros')
    )) {
      return true;
    }
    
    if (path === 'reportes' && location.pathname.includes('/reportes')) {
      return true;
    }
    
    if (path === 'admin' && (
      location.pathname.includes('/admin') ||
      location.pathname.includes('/administracion')
    )) {
      return true;
    }
    
    if (path === 'inventario' && location.pathname.includes('/inventario')) {
      return true;
    }
    
    // Para enlaces específicos
    return location.pathname === path;
  };
  
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      
      if (isAuth) {
        try {
          const user = getCurrentUser();
          if (user) {
            setUserData(user);
            setIsAdmin(hasRole('admin'));
            // Verificar explícitamente si el usuario es superadmin
            const userRole = user.perfil?.rol;
            setIsSuperAdmin(userRole === 'superadmin');
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        }
      }
    };
    
    checkAuth();
    
    // Comprobar si el usuario está autenticado cada vez que la ventana obtiene el foco
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Función para cerrar todos los menús desplegables
  const closeAllMenus = () => {
    setOpenOperaciones(false);
    setOpenReportes(false);
    setOpenAdmin(false);
    setOpenInventario(false);
  };
  
  // Función para abrir un menú y cerrar los demás
  const toggleMenu = (menu) => {
    closeAllMenus();
    switch(menu) {
      case 'operaciones':
        setOpenOperaciones(!openOperaciones);
        break;
      case 'reportes':
        setOpenReportes(!openReportes);
        break;
      case 'admin':
        setOpenAdmin(!openAdmin);
        break;
      case 'inventario':
        setOpenInventario(!openInventario);
        break;
      default:
        break;
    }
  };
  
  window.onscroll = function() {scrollFunction()}

  function scrollFunction() {
    if(document.getElementById('navbar')){
      if (document.body.scrollTop > 10 || document.documentElement.scrollTop > 10) {
        document.getElementById('navbar').classList.add('shadow-navbar');
        document.getElementById('navbar').classList.add('bg-bg-main-light');
        document.getElementById('navbar').classList.add('dark:bg-bg-main-dark');
      } else {
        document.getElementById('navbar').classList.remove('shadow-navbar');
        // No eliminar las clases de fondo, solo la sombra
        // document.getElementById('navbar').classList.remove('bg-bg-main-light');
        // document.getElementById('navbar').classList.remove('dark:bg-bg-main-dark');
      }
    }
  }
  
  // Calcular la altura del navbar y aplicar un margen superior al contenido principal
  useEffect(() => {
    function setContentMargin() {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        // Eliminar el padding-top que se estaba aplicando al body
        document.body.style.paddingTop = '0px';
        
        // Asegurar alturas mínimas para el calendario en móviles
        const calendar = document.querySelector('.react-calendar');
        if (calendar && window.innerWidth < 768) {
          calendar.style.minHeight = '400px';
        }
      }
    }
    
    // Ejecutar al cargar y al cambiar el tamaño de la ventana
    setContentMargin();
    window.addEventListener('resize', setContentMargin);
    
    return () => {
      window.removeEventListener('resize', setContentMargin);
    };
  }, []);
    
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setAuthenticated(false);
      setUserData(null);
      navigate('/');
    }
  };
  
  return(
    <nav data-scroll data-scroll-id="hey" id='navbar' className='w-full pt-4 pb-0 md:pt-5 md:pb-0 top-0 fixed transition duration-300 ease-in-out z-[9999] min-h-[42px] md:min-h-[50px] bg-bg-main-light dark:bg-bg-main-dark border-b border-nav-border-light dark:border-nav-border-dark'>
      <div className="px-4 sm:px-8 pb-0">
        {/* Primera fila: Logo, Saludo y Botón Cerrar Sesión */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          {/* Logo REDEL con Typewriter - siempre visible */}
          <div className="flex-shrink-0">
            <div className="text-2xl md:text-4xl font-bold tracking-tight sm:text-center">
              <h1 className="text-2xl sm:text-2xl md:text-4xl font-bold tracking-tight text-nav-text-light dark:text-nav-text-dark">
                <Typewriter
                  words={['REDEL']}
                  loop={0}
                  cursor
                  cursorStyle='•'
                  typeSpeed={200}
                  deleteSpeed={200}
                  delaySpeed={3000}
                />
              </h1>
            </div>
          </div>
          
          {/* Área del navbar para móviles */}
          {authenticated && (
            <div className="md:hidden w-screen">
              {/* Botones de la primera fila: tema y cerrar sesión */}
              <div className="flex items-center justify-end px-4">
                {userData && (
                  <span className="text-sm font-medium text-nav-text-light dark:text-nav-text-dark mr-3">
                    Hola, {userData.first_name ? 
                      userData.first_name.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ') : 
                      userData.username.charAt(0).toUpperCase() + userData.username.slice(1)
                    }
                  </span>
                )}
                <div className="flex items-center space-x-3">
                  <ThemeToggle inNavbar={true} />
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-md border border-transparent bg-logout-button-light dark:bg-logout-button-dark px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-logout-hover-light dark:hover:bg-logout-hover-dark transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    title="Cerrar Sesión"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 stroke-2" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Saludo al usuario y botón cerrar sesión - visible solo en tablet/desktop */}
          {authenticated && (
            <div className="hidden md:flex items-center space-x-3 pr-2 md:pr-6">
              {userData && (
                <span className="text-base sm:text-lg md:text-xl font-medium text-nav-text-light dark:text-nav-text-dark">
                  Hola, {userData.first_name ? 
                    userData.first_name.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ') : 
                    userData.username.charAt(0).toUpperCase() + userData.username.slice(1)
                  }
                </span>
              )}
              
              {/* Toggle de tema oscuro */}
              <ThemeToggle inNavbar={true} />
              
              {/* Botón cerrar sesión - Texto en tablet/desktop */}
              <button 
                onClick={handleLogout}
                className="inline-flex items-center rounded-md border border-transparent bg-logout-button-light dark:bg-logout-button-dark px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-logout-hover-light dark:hover:bg-logout-hover-dark transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Cerrar Sesión"
              >
                <span className="text-white">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Menú móvil - segunda fila - solo visible en móviles */}
        {authenticated && (
          <div className="md:hidden flex items-center justify-end pt-1 px-4 mb-2">
            {/* Menú Operaciones - Solo visible para admin y superadmin */}
            {(isAdmin || isSuperAdmin) && (
              <div className="inline-block relative mr-5">
                <button 
                  className={`text-sm font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 ${isLinkActive('operaciones') ? 'active-nav-link' : 'border-white dark:border-bg-main-dark hover:border-nav-button-light dark:hover:border-nav-button-dark'} flex items-center`}
                  onClick={() => toggleMenu('operaciones')}
                >
                  Operaciones
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {openOperaciones && (
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-lg z-10 max-h-[calc(100vh-200px)] overflow-y-auto border border-nav-border-light dark:border-nav-border-dark">
                    <NavLink 
                      to='/registro-pedidos' 
                      className={({isActive}) => 
                        `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                      }
                      onClick={() => closeAllMenus()}
                    >
                      Registrar Pedido
                    </NavLink>
                    <NavLink 
                      to='/registro-distribuciones' 
                      className={({isActive}) => 
                        `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                      }
                      onClick={() => closeAllMenus()}
                    >
                      Registro Distribuciones
                    </NavLink>
                    <NavLink 
                      to='/registro-letras' 
                      className={({isActive}) => 
                        `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                      }
                      onClick={() => closeAllMenus()}
                    >
                      Registro Letras
                    </NavLink>
                    <NavLink 
                      to='/registros' 
                      className={({isActive}) => 
                        `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                      }
                      onClick={() => closeAllMenus()}
                    >
                      Registros Entidades
                    </NavLink>
                    <NavLink 
                      to='/registro-documentos' 
                      className={({isActive}) => 
                        `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                      }
                      onClick={() => closeAllMenus()}
                    >
                      Documentos
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Menú Reportes - mostrar para todos */}
            <div className="inline-block relative">
              <button 
                className={`text-sm font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 ${isLinkActive('reportes') ? 'active-nav-link' : 'border-white dark:border-bg-main-dark hover:border-nav-button-light dark:hover:border-nav-button-dark'} flex items-center`}
                onClick={() => toggleMenu('reportes')}
              >
                Reportes
                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {openReportes && (
                <div className="absolute right-0 mt-2 py-2 w-56 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-lg z-10 max-h-[calc(100vh-200px)] overflow-y-auto border border-nav-border-light dark:border-nav-border-dark">
                  <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold">Letras</div>
                  <NavLink 
                    to='/reportes/letras/estado' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Por Estado
                  </NavLink>
                  <NavLink 
                    to='/reportes/letras/proveedor' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Por Proveedor
                  </NavLink>
                  <NavLink 
                    to='/reportes/letras/periodo' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Por Mes/Periodo
                  </NavLink>
                  
                  <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold border-t border-bg-row-light dark:border-bg-row-dark mt-1">Pedidos</div>
                  <NavLink 
                    to='/reportes/pedidos/proveedor' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Por Proveedor
                  </NavLink>
                  <NavLink 
                    to='/reportes/pedidos/empresa' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Por Empresa
                  </NavLink>
                  
                  <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold border-t border-bg-row-light dark:border-bg-row-dark mt-1">Contabilidad</div>
                  <NavLink 
                    to='/reportes/facturas' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Facturas y Guías
                  </NavLink>
                  <NavLink 
                    to='/reportes/balance' 
                    className={({isActive}) => 
                      `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                    }
                    onClick={() => closeAllMenus()}
                  >
                    Balance de Pagos
                  </NavLink>
                </div>
              )}
            </div>
            
            {/* Botón programación de letras - SOLO ICONO */}
            <Link to="/calendar"
              className="inline-flex items-center rounded-md border border-transparent bg-nav-button-light dark:bg-nav-button-dark px-3 py-1.5 text-sm font-medium text-white dark:text-nav-text-light shadow-sm transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 hover:bg-nav-button-hover-light dark:hover:bg-nav-button-hover-dark ml-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
           </Link>
          </div>
        )}
        
        {/* Segunda fila: Menú de navegación - solo visible en tablet y desktop */}
        {authenticated && (
          <div className="hidden md:flex flex-wrap items-center justify-end pr-4 md:pr-6">
            {/* Navegación y botón de programación - alineados a la derecha */}
            <div className="flex items-center space-x-4">
              {/* Menú de navegación */}
              <div className="flex items-center space-x-5 mr-4">
                {/* Menú Inventario */}
                <div className="inline-block relative">
                  <button 
                    className={`text-sm md:text-base lg:text-lg font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 ${isLinkActive('inventario') ? 'active-nav-link' : 'border-white dark:border-bg-main-dark hover:border-nav-button-light dark:hover:border-nav-button-dark'} flex items-center`}
                    onClick={() => toggleMenu('inventario')}
                  >
                    Inventario
                    <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {openInventario && (
                    <div className="absolute right-0 mt-2 py-2 w-56 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-lg z-10 max-h-[calc(100vh-200px)] overflow-y-auto border border-nav-border-light dark:border-nav-border-dark">
                      {/* Secciones solo para admin y superadmin */}
                      {(isAdmin || isSuperAdmin) && (
                        <>
                          <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold">Gestión de Inventario</div>
                          <NavLink 
                            to='/inventario/productos' 
                            className={({isActive}) => 
                              `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                            }
                            onClick={() => closeAllMenus()}
                          >
                            Productos
                          </NavLink>
                          <NavLink 
                            to='/inventario/categorias' 
                            className={({isActive}) => 
                              `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                            }
                            onClick={() => closeAllMenus()}
                          >
                            Categorías
                          </NavLink>
                          <NavLink 
                            to='/inventario/movimientos' 
                            className={({isActive}) => 
                              `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                            }
                            onClick={() => closeAllMenus()}
                          >
                            Movimientos
                          </NavLink>
                        </>
                      )}
                      
                      {/* Reportes de inventario - visible para todos */}
                      <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold border-t border-bg-row-light dark:border-bg-row-dark mt-1">Reportes</div>
                      <NavLink 
                        to='/inventario/stock' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Stock Actual
                      </NavLink>
                      <NavLink 
                        to='/inventario/valorizado' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Valorizado
                      </NavLink>
                    </div>
                  )}
                </div>
                
                {/* Menú Operaciones - Solo visible para admin y superadmin */}
                {(isAdmin || isSuperAdmin) && (
                  <div className="inline-block relative">
                    <button 
                      className={`text-sm md:text-base lg:text-lg font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 ${isLinkActive('operaciones') ? 'active-nav-link' : 'border-white dark:border-bg-main-dark hover:border-nav-button-light dark:hover:border-nav-button-dark'} flex items-center`}
                      onClick={() => toggleMenu('operaciones')}
                    >
                      Operaciones
                      <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    {openOperaciones && (
                      <div className="absolute right-0 mt-2 py-2 w-48 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-lg z-10 max-h-[calc(100vh-200px)] overflow-y-auto border border-nav-border-light dark:border-nav-border-dark">
                        <NavLink 
                          to='/registro-pedidos' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Registrar Pedido
                        </NavLink>
                        <NavLink 
                          to='/registro-distribuciones' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Registro Distribuciones
                        </NavLink>
                        <NavLink 
                          to='/registro-letras' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Registro Letras
                        </NavLink>
                        <NavLink 
                          to='/registros' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Registros Entidades
                        </NavLink>
                        <NavLink 
                          to='/registro-documentos' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Documentos
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Menú Reportes - visible para todos */}
                <div className="inline-block relative">
                  <button 
                    className={`text-sm md:text-base lg:text-lg font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 ${isLinkActive('reportes') ? 'active-nav-link' : 'border-white dark:border-bg-main-dark hover:border-nav-button-light dark:hover:border-nav-button-dark'} flex items-center`}
                    onClick={() => toggleMenu('reportes')}
                  >
                    Reportes
                    <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {openReportes && (
                    <div className="absolute right-0 mt-2 py-2 w-56 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-lg z-10 max-h-[calc(100vh-200px)] overflow-y-auto border border-nav-border-light dark:border-nav-border-dark">
                      <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold">Letras</div>
                      <NavLink 
                        to='/reportes/letras/estado' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Por Estado
                      </NavLink>
                      <NavLink 
                        to='/reportes/letras/proveedor' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Por Proveedor
                      </NavLink>
                      <NavLink 
                        to='/reportes/letras/periodo' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Por Mes/Periodo
                      </NavLink>
                      
                      <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold border-t border-bg-row-light dark:border-bg-row-dark mt-1">Pedidos</div>
                      <NavLink 
                        to='/reportes/pedidos/proveedor' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Por Proveedor
                      </NavLink>
                      <NavLink 
                        to='/reportes/pedidos/empresa' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Por Empresa
                      </NavLink>
                      
                      <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold border-t border-bg-row-light dark:border-bg-row-dark mt-1">Contabilidad</div>
                      <NavLink 
                        to='/reportes/facturas' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Facturas y Guías
                      </NavLink>
                      <NavLink 
                        to='/reportes/balance' 
                        className={({isActive}) => 
                          `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                        }
                        onClick={() => closeAllMenus()}
                      >
                        Balance de Pagos
                      </NavLink>
                    </div>
                  )}
                </div>
                
                {/* Menú Administración - solo para superadmin */}
                {isSuperAdmin && (
                  <div className="inline-block relative">
                    <button 
                      className={`text-sm md:text-base lg:text-lg font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 ${isLinkActive('admin') ? 'active-nav-link' : 'border-white dark:border-bg-main-dark hover:border-nav-button-light dark:hover:border-nav-button-dark'} flex items-center`}
                      onClick={() => toggleMenu('admin')}
                    >
                      Administración
                      <svg className="ml-1 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    {openAdmin && (
                      <div className="absolute right-0 mt-2 py-2 w-56 bg-bg-card-light dark:bg-bg-card-dark rounded-md shadow-lg z-10 max-h-[calc(100vh-200px)] overflow-y-auto border border-nav-border-light dark:border-nav-border-dark">
                        {/* Panel de Administración Django */}
                        <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold">Panel de Control</div>
                        <NavLink 
                          to='/administracion' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light hover:text-text-main-light dark:hover:bg-bg-main-dark dark:hover:text-text-main-dark ${isActive ? 'bg-bg-main-light text-text-main-light dark:bg-bg-main-dark dark:text-text-main-dark' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Panel de Administración
                        </NavLink>
                        <a 
                          href="http://localhost:8000/admin/" 
                          target="_blank"
                          className="block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light dark:hover:bg-bg-main-dark"
                          onClick={() => closeAllMenus()}
                        >
                          Acceso al Admin Django
                        </a>
                        
                        {/* Monitoreo */}
                        <div className="px-4 py-1 text-xs text-nav-text-light dark:text-nav-text-dark font-semibold border-t border-bg-row-light dark:border-bg-row-dark mt-1">Monitoreo</div>
                        <NavLink 
                          to='/admin/logs' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light dark:hover:bg-bg-main-dark dark:hover:text-white ${isActive ? 'bg-bg-main-light dark:bg-bg-main-dark dark:text-white' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Logs de Actividad
                        </NavLink>
                        <NavLink 
                          to='/admin/backup' 
                          className={({isActive}) => 
                            `block px-4 py-2 text-xs sm:text-sm text-nav-text-light dark:text-nav-text-dark hover:bg-bg-main-light dark:hover:bg-bg-main-dark dark:hover:text-white ${isActive ? 'bg-bg-main-light dark:bg-bg-main-dark dark:text-white' : ''}`
                          }
                          onClick={() => closeAllMenus()}
                        >
                          Respaldo del Sistema
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Botón programación de letras */}
              <Link 
                to="/calendar"
                className="inline-flex items-center rounded-md border border-transparent bg-nav-button-light dark:bg-nav-button-dark px-4 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-sm md:text-base font-medium text-white dark:text-nav-text-light shadow-sm transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 hover:bg-nav-button-hover-light dark:hover:bg-nav-button-hover-dark ml-4 mb-2"
              >
                <div className="mr-3 hidden lg:block">Programación de Letras</div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
            </div>
          </div>
        )}
        
        {/* Si no está autenticado, mostrar solo el enlace de login */}
        {!authenticated && (
          <div className="flex justify-center">
            <NavLink to='/' className="text-lg inline-flex font-medium leading-6 text-nav-text-light dark:text-nav-text-dark border-b-2 border-white hover:border-nav-button-light dark:hover:border-nav-button-dark">
              Login
            </NavLink>
          </div>
        )}
      </div>
      
      {/* Cerrar menús al hacer clic fuera de ellos */}
      {(openOperaciones || openReportes || openAdmin || openInventario) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={closeAllMenus}
        ></div>
      )}
    </nav>
  )
}

const mapStateToProps=state=>({

})

export default connect(mapStateToProps, {

})(Navbar)