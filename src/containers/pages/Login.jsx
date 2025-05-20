import Layout from "hocs/layouts/Layout-Login"
import Navbar from "components/navigation/NavbarLogin"
import LoginSection from "components/login/Login"
import background from '../../assets/img/login-bg01.jpg';

function Login(){
  return (
    <Layout>
      <div className="relative min-h-screen">
        {/* 1) Capa de fondo con filtros */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm brightness-75"
          style={{ backgroundImage: `url(${background})` }}
        />

        {/* 2) Capa de overlay para oscurecer más */}
        <div className="absolute inset-0 bg-login-overlay/40 pointer-events-none" />

        {/* 3) Contenido encima */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="p-6">
            <Navbar/>
          </div>
          <div className="p-6 pt-10 flex-1 flex items-center justify-center">
            <LoginSection/>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Login
